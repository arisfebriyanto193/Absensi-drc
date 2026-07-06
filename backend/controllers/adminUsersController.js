const pool = require('../db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`SELECT id, username, nama_lengkap, role, nim, email FROM users`);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, nama_lengkap, role, nim, email, password } = req.body;
        
        let query = 'UPDATE users SET username = ?, nama_lengkap = ?, role = ?, nim = ?, email = ?';
        let params = [username, nama_lengkap, role, nim, email];

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
        
        const [[{ absensi_count }]] = await pool.query('SELECT COUNT(*) as absensi_count FROM absensi WHERE user_id = ?', [id]);
        if (absensi_count > 0) {
            return res.status(400).json({ message: 'User tidak dapat dihapus karena sudah memiliki data absensi' });
        }

        const [[{ izin_count }]] = await pool.query('SELECT COUNT(*) as izin_count FROM izin WHERE user_id = ?', [id]);
        if (izin_count > 0) {
            return res.status(400).json({ message: 'User tidak dapat dihapus karena sudah memiliki data izin' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
