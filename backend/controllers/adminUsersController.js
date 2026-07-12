const pool = require('../db');
const bcrypt = require('bcryptjs');

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
