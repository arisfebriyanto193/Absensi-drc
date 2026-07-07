const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(username, password)
        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password harus diisi' });
        }

        const [rows] = await pool.query('SELECT id, username, password, nama_lengkap, role FROM users WHERE username = ? OR nim = ?', [username, username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username/NIM atau password salah' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Username/NIM atau password salah' });
        }

        const payload = {
            id: user.id,
            username: user.username,
            nama_lengkap: user.nama_lengkap,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Login berhasil',
            token,
            user: payload
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

exports.me = async (req, res) => {
    // Akan diimplementasikan setelah ada middleware auth
    res.json({ message: 'Not implemented yet' });
};
