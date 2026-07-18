const pool = require('../db');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

exports.getUsers = async (req, res) => {
    try {
        let pId = req.headers['x-periode-id'] || req.query.periode_id;
        let isAll = (pId === 'all');
        if (!isAll && !pId) {
            const [active] = await pool.query('SELECT id FROM periodes WHERE is_active = 1 LIMIT 1');
            if (active.length > 0) pId = active[0].id;
        }

        let query = `
            SELECT u.id, u.username, u.nama_lengkap, u.nim, u.email, 
                   COALESCE(up.role, 'user') as role, 
                   up.jabatan,
                   p.nama_periode as periode,
                   up.periode_id
            FROM users u
            INNER JOIN user_periodes up ON u.id = up.user_id
            INNER JOIN periodes p ON up.periode_id = p.id
        `;
        let params = [];
        
        if (!isAll && pId) {
            query += ' WHERE up.periode_id = ?';
            params.push(pId);
        }
        
        // Add ORDER BY so that active/latest is at top, or group by user
        query += ' ORDER BY u.nama_lengkap ASC, p.id DESC';

        const [users] = await pool.query(query, params);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { username, nama_lengkap, role, nim, email, password, jabatan } = req.body;
        
        if (!username || !nama_lengkap) {
            return res.status(400).json({ message: 'Username dan Nama Lengkap wajib diisi' });
        }

        const [existing] = await connection.query('SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email != "" AND email = ?)', [username, email]);
        let userId;

        if (existing.length > 0) {
            userId = existing[0].id;
            if (password && password.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                await connection.query('UPDATE users SET nama_lengkap = ?, password = ? WHERE id = ?', [nama_lengkap, hashedPassword, userId]);
            } else {
                await connection.query('UPDATE users SET nama_lengkap = ? WHERE id = ?', [nama_lengkap, userId]);
            }
        } else {
            if (!password) {
                return res.status(400).json({ message: 'Password wajib diisi untuk user baru' });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const [userRes] = await connection.query(
                'INSERT INTO users (username, password, nama_lengkap, nim, email) VALUES (?, ?, ?, ?, ?)',
                [username, hashedPassword, nama_lengkap, nim || null, email || null]
            );
            userId = userRes.insertId;
        }

        const [active] = await connection.query('SELECT id FROM periodes WHERE is_active = 1 LIMIT 1');
        if (active.length > 0) {
            await connection.query(
                'INSERT INTO user_periodes (user_id, periode_id, role, jabatan) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = ?, jabatan = ?',
                [userId, active[0].id, role || 'user', jabatan || null, role || 'user', jabatan || null]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'User berhasil ditambahkan' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username atau Email sudah digunakan' });
        }
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};

exports.updateUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { username, nama_lengkap, role, nim, email, password, jabatan } = req.body;
        
        await connection.beginTransaction();

        let query = 'UPDATE users SET username = ?, nama_lengkap = ?, nim = ?, email = ?';
        let params = [username, nama_lengkap, nim, email];

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await connection.query(query, params);

        // Update user_periodes (asumsi update pada periode yang sedang aktif, atau periode miliknya)
        const [active] = await connection.query('SELECT id FROM periodes WHERE is_active = 1 LIMIT 1');
        if (active.length > 0) {
            await connection.query(
                'INSERT INTO user_periodes (user_id, periode_id, role, jabatan) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = ?, jabatan = ?',
                [id, active[0].id, role || 'user', jabatan || null, role || 'user', jabatan || null]
            );
        }

        await connection.commit();
        res.json({ message: 'User berhasil diperbarui' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Hapus manual log email karena tidak menggunakan ON DELETE CASCADE
        await pool.query('DELETE FROM email_log WHERE user_id = ?', [id]);

        // Hapus user. Tabel jadwal_piket, absensi, izin, dll akan ikut terhapus
        // secara otomatis berkat constraint ON DELETE CASCADE di database.
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        
        res.json({ message: 'User dan seluruh data terkait (jadwal, riwayat) berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.downloadTemplate = (req, res) => {
    try {
        const worksheetData = [
            ['Nama Lengkap', 'Username', 'NIM', 'Email', 'Periode', 'Jabatan', 'Role'],
            ['Andi Saputra', 'andi.s', 'A11.2023.12345', 'andi@example.com', '2023/2024', 'Anggota', 'user'],
            ['Budi Santoso', 'budi.s', 'A11.2023.12346', 'budi@example.com', '2023/2024', 'Ketua Divisi', 'user']
        ];
        
        const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Format User");
        
        // Atur lebar kolom
        const wscols = [
            {wch: 25}, {wch: 15}, {wch: 20}, {wch: 25}, {wch: 15}, {wch: 20}, {wch: 15}
        ];
        worksheet['!cols'] = wscols;

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="Format_Import_User.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat template Excel' });
    }
};

exports.importExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ message: 'File Excel kosong atau tidak valid' });
        }

        let importedCount = 0;
        let errors = [];

        for (const [index, row] of data.entries()) {
            const namaLengkap = row['Nama Lengkap'] || row['nama_lengkap'];
            const username = row['Username'] || row['username'];
            const nim = row['NIM'] || row['nim'] || null;
            const email = row['Email'] || row['email'] || null;
            const periode = row['Periode'] || row['periode'] || null;
            const jabatan = row['Jabatan'] || row['jabatan'] || null;
            const role = row['Role'] || row['role'] || 'user';

            if (!namaLengkap || !username) {
                errors.push(`Baris ${index + 2}: Nama Lengkap dan Username wajib diisi`);
                continue;
            }

            // Gunakan NIM sebagai password default, atau username jika tidak ada NIM
            const rawPassword = nim ? String(nim) : String(username);
            
            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(rawPassword, salt);

                await pool.query(
                    'INSERT INTO users (username, password, nama_lengkap, role, nim, email, periode, jabatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [username, hashedPassword, namaLengkap, role.toLowerCase(), nim, email, periode, jabatan]
                );
                importedCount++;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    errors.push(`Baris ${index + 2}: Username '${username}' atau Email '${email}' sudah terdaftar`);
                } else {
                    errors.push(`Baris ${index + 2}: Terjadi kesalahan server`);
                }
            }
        }

        res.json({
            message: `Berhasil mengimpor ${importedCount} pengguna.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengimpor file Excel' });
    }
};
