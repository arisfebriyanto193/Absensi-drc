const pool = require('../db');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`SELECT id, username, nama_lengkap, role, nim, email, periode, jabatan FROM users`);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, nama_lengkap, role, nim, email, password, periode, jabatan } = req.body;
        
        let query = 'UPDATE users SET username = ?, nama_lengkap = ?, role = ?, nim = ?, email = ?, periode = ?, jabatan = ?';
        let params = [username, nama_lengkap, role, nim, email, periode, jabatan];

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await pool.query(query, params);
        res.json({ message: 'User berhasil diperbarui' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }
        res.status(500).json({ message: 'Server Error' });
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
