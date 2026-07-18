const { OAuth2Client } = require('google-auth-library');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const GOOGLE_CLIENT_ID = "168227286058-eadtrvmco5m1g10ucdd8q5m6g076r2qu.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);


exports.login = async (req, res) => {
    try {
        const { username, password, loginMethod = 'drc' } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password harus diisi' });
        }

        let user = null;
        let isMatch = false;
        let isSiadinSuccess = false;

        if (loginMethod === 'siadin') {
            // Opsi 1: Login via API SIADIN
            try {
                const siadinResponse = await fetch('https://api.dinus.ac.id/api/v1/siadin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const siadinData = await siadinResponse.json();
                
                if (siadinResponse.ok && siadinData.message === 'Success') {
                    // SIADIN sukses, cek apakah terdaftar di database DRC
                    const [rows] = await pool.query('SELECT id, username, password, nama_lengkap, role, nim, periode, jabatan FROM users WHERE username = ? OR nim = ?', [username, username]);
                    
                    if (rows.length === 0) {
                        return res.status(401).json({ message: 'Bukan anggota DRC' });
                    }
                    
                    user = rows[0];
                    isMatch = true;
                    isSiadinSuccess = true;
                } else {
                    return res.status(401).json({ message: 'Login SIADIN gagal. Pastikan username dan password benar.' });
                }
            } catch (siadinErr) {
                console.error('Error saat menghubungi API SIADIN:', siadinErr.message);
                return res.status(500).json({ message: 'Server SIADIN tidak merespons, silakan coba login dengan akun lokal.' });
            }
        } else {
            // Opsi 2: Login via Akun DRC (Lokal)
            const [rows] = await pool.query('SELECT id, username, password, nama_lengkap, role, nim, periode, jabatan FROM users WHERE username = ? OR nim = ?', [username, username]);

            if (rows.length === 0) {
                return res.status(401).json({ message: 'Bukan anggota DRC' });
            }

            user = rows[0];
            isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.status(401).json({ message: 'Username/NIM atau password salah' });
            }
        }

        let effectiveRole = user.role;
        if (user.jabatan && (user.jabatan.includes('Ketua Umum') || user.jabatan.includes('Ketua Internal'))) {
            effectiveRole = 'admin';
        } else if (user.jabatan && user.jabatan.includes('Bendahara')) {
            effectiveRole = 'bendahara';
        } else if (user.jabatan && user.jabatan.includes('Sekretaris')) {
            effectiveRole = 'sekretaris';
        }

        const payload = {
            id: user.id,
            username: user.username,
            nama_lengkap: user.nama_lengkap,
            role: effectiveRole,
            nim: user.nim,
            periode: user.periode,
            jabatan: user.jabatan
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: isSiadinSuccess ? 'Login berhasil (via SIADIN)' : 'Login berhasil',
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

exports.loginGoogle = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token Google tidak ditemukan' });
        }

        // Verifikasi token Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        // Cari user berdasarkan email
        const [rows] = await pool.query('SELECT id, username, password, nama_lengkap, role, nim, periode, jabatan, email FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email belum terdaftar sebagai anggota DRC. Silakan hubungi admin.' });
        }

        const user = rows[0];

        // Tentukan effective role (sama seperti login biasa)
        let effectiveRole = user.role;
        if (user.jabatan && (user.jabatan.includes('Ketua Umum') || user.jabatan.includes('Ketua Internal'))) {
            effectiveRole = 'admin';
        } else if (user.jabatan && user.jabatan.includes('Bendahara')) {
            effectiveRole = 'bendahara';
        } else if (user.jabatan && user.jabatan.includes('Sekretaris')) {
            effectiveRole = 'sekretaris';
        }

        const jwtPayload = {
            id: user.id,
            username: user.username,
            nama_lengkap: user.nama_lengkap,
            role: effectiveRole,
            nim: user.nim,
            periode: user.periode,
            jabatan: user.jabatan
        };

        const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Login via Google berhasil',
            token: jwtToken,
            user: jwtPayload
        });
    } catch (error) {
        console.error('Login Google error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memverifikasi token Google' });
    }
};
