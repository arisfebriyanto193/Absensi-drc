const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer untuk upload bukti keuangan
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/bukti_kegiatan');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bukti-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware untuk mengecek apakah user adalah panitia di kegiatan terkait
const isPanitia = async (req, res, next) => {
    const kegiatan_id = req.params.id;
    const user_id = req.user.id;
    try {
        // Jika admin, bebaskan akses
        if (req.user.role === 'admin') return next();

        const [rows] = await db.query(
            'SELECT * FROM kegiatan_panitia WHERE kegiatan_id = ? AND user_id = ?',
            [kegiatan_id, user_id]
        );
        if (rows.length === 0) {
            // Ijinkan Bendahara Utama (walaupun bukan panitia langsung)
            if (req.user.role === 'bendahara') {
                req.panitia = { peran: 'Bendahara Utama' };
                return next();
            }
            return res.status(403).json({ error: 'Akses ditolak: Anda bukan panitia di kegiatan ini' });
        }
        req.panitia = rows[0]; // simpan info peran
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Kesalahan server saat memverifikasi akses' });
    }
};

// Get kegiatan di mana user saat ini adalah panitia
router.get('/my', verifyToken, async (req, res) => {
    try {
        const query = req.user.role === 'admin' 
            ? 'SELECT * FROM kegiatan ORDER BY created_at DESC'
            : `SELECT k.*, kp.peran FROM kegiatan k 
               JOIN kegiatan_panitia kp ON k.id = kp.kegiatan_id 
               WHERE kp.user_id = ? ORDER BY k.created_at DESC`;
        
        const [rows] = await db.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil daftar kegiatan' });
    }
});

// Get all users for Panitia assignment
router.get('/users', verifyToken, async (req, res) => {
    try {
        const [users] = await db.query(`SELECT id, username, nama_lengkap, role, nim, email FROM users`);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil daftar user' });
    }
});

// Get detail kegiatan (Info + Panitia)
router.get('/:id', verifyToken, isPanitia, async (req, res) => {
    try {
        const [kegiatan] = await db.query('SELECT * FROM kegiatan WHERE id = ?', [req.params.id]);
        if (kegiatan.length === 0) return res.status(404).json({ error: 'Kegiatan tidak ditemukan' });

        const [panitia] = await db.query(`
            SELECT kp.id, kp.user_id, kp.peran, u.nama_lengkap as nama, u.nim 
            FROM kegiatan_panitia kp
            JOIN users u ON kp.user_id = u.id
            WHERE kp.kegiatan_id = ?
        `, [req.params.id]);

        res.json({
            ...kegiatan[0],
            kepanitiaan: panitia,
            my_peran: req.panitia ? req.panitia.peran : 'Admin'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil detail kegiatan' });
    }
});

// Update status (Khusus Ketua Pelaksana atau Admin)
router.put('/:id/status', verifyToken, isPanitia, async (req, res) => {
    if (req.user.role !== 'admin' && req.panitia.peran !== 'Ketua Pelaksana') {
        return res.status(403).json({ error: 'Hanya Ketua Pelaksana yang dapat mengubah status kegiatan' });
    }
    
    try {
        await db.query('UPDATE kegiatan SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ message: 'Status berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengupdate status' });
    }
});

// ================= KEUANGAN KEGIATAN ================= //

// Get keuangan kegiatan
router.get('/:id/keuangan', verifyToken, isPanitia, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT kk.*, u.nama_lengkap as pembuat
            FROM kegiatan_keuangan kk
            LEFT JOIN users u ON kk.created_by = u.id
            WHERE kk.kegiatan_id = ?
            ORDER BY kk.tanggal DESC, kk.created_at DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data keuangan' });
    }
});

// Add keuangan kegiatan (Khusus Bendahara Kegiatan, Ketua Pelaksana, atau Admin)
router.post('/:id/keuangan', verifyToken, isPanitia, upload.single('bukti_file'), async (req, res) => {
    // Cek peran
    if (req.user.role !== 'admin' && req.user.role !== 'bendahara' && req.panitia.peran !== 'Bendahara Kegiatan' && req.panitia.peran !== 'Ketua Pelaksana') {
        return res.status(403).json({ error: 'Hanya Bendahara atau Ketua Pelaksana yang dapat mengelola keuangan' });
    }

    // Cek status kegiatan (tidak boleh Selesai)
    const [kegiatan] = await db.query('SELECT status FROM kegiatan WHERE id = ?', [req.params.id]);
    if (kegiatan[0].status === 'Selesai') {
        return res.status(403).json({ error: 'Kegiatan sudah selesai, data keuangan dikunci.' });
    }

    const { jenis, jumlah, keterangan, tanggal } = req.body;
    const bukti_file = req.file ? req.file.filename : null;

    try {
        await db.query(
            'INSERT INTO kegiatan_keuangan (kegiatan_id, jenis, jumlah, keterangan, tanggal, created_by, bukti_file) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.params.id, jenis, jumlah, keterangan, tanggal, req.user.id, bukti_file]
        );
        res.status(201).json({ message: 'Data keuangan berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal menambahkan data keuangan' });
    }
});

// Update keuangan kegiatan
router.put('/:id/keuangan/:keuangan_id', verifyToken, isPanitia, upload.single('bukti_file'), async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'bendahara' && req.panitia.peran !== 'Bendahara Kegiatan' && req.panitia.peran !== 'Ketua Pelaksana') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }

    const [kegiatan] = await db.query('SELECT status FROM kegiatan WHERE id = ?', [req.params.id]);
    if (kegiatan[0].status === 'Selesai') return res.status(403).json({ error: 'Kegiatan sudah selesai.' });

    const { jenis, jumlah, keterangan, tanggal } = req.body;
    
    try {
        if (req.file) {
            await db.query(
                'UPDATE kegiatan_keuangan SET jenis = ?, jumlah = ?, keterangan = ?, tanggal = ?, bukti_file = ? WHERE id = ?',
                [jenis, jumlah, keterangan, tanggal, req.file.filename, req.params.keuangan_id]
            );
        } else {
            await db.query(
                'UPDATE kegiatan_keuangan SET jenis = ?, jumlah = ?, keterangan = ?, tanggal = ? WHERE id = ?',
                [jenis, jumlah, keterangan, tanggal, req.params.keuangan_id]
            );
        }
        res.json({ message: 'Data keuangan berhasil diupdate' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengupdate data keuangan' });
    }
});

// Delete keuangan kegiatan
router.delete('/:id/keuangan/:keuangan_id', verifyToken, isPanitia, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'bendahara' && req.panitia.peran !== 'Bendahara Kegiatan' && req.panitia.peran !== 'Ketua Pelaksana') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }

    const [kegiatan] = await db.query('SELECT status FROM kegiatan WHERE id = ?', [req.params.id]);
    if (kegiatan[0].status === 'Selesai') return res.status(403).json({ error: 'Kegiatan sudah selesai.' });

    try {
        await db.query('DELETE FROM kegiatan_keuangan WHERE id = ?', [req.params.keuangan_id]);
        res.json({ message: 'Data keuangan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal menghapus data keuangan' });
    }
});

// TAMBAHAN: Ketua Pelaksana bisa mengelola panitia
router.post('/:id/panitia', verifyToken, isPanitia, async (req, res) => {
    if (req.user.role !== 'admin' && req.panitia.peran !== 'Ketua Pelaksana') {
        return res.status(403).json({ error: 'Hanya Ketua Pelaksana yang dapat mengelola panitia' });
    }
    
    const { user_id, peran } = req.body;
    try {
        await db.query(
            'INSERT INTO kegiatan_panitia (kegiatan_id, user_id, peran) VALUES (?, ?, ?)',
            [req.params.id, user_id, peran]
        );
        res.status(201).json({ message: 'Panitia berhasil ditambahkan' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'User sudah terdaftar sebagai panitia' });
        console.error(error);
        res.status(500).json({ error: 'Gagal menambahkan panitia' });
    }
});

router.delete('/:id/panitia/:panitia_id', verifyToken, isPanitia, async (req, res) => {
    if (req.user.role !== 'admin' && req.panitia.peran !== 'Ketua Pelaksana') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }
    
    try {
        // Cek jangan hapus diri sendiri jika bukan admin
        if (req.user.role !== 'admin') {
            const [p] = await db.query('SELECT user_id FROM kegiatan_panitia WHERE id = ?', [req.params.panitia_id]);
            if (p.length > 0 && p[0].user_id === req.user.id) {
                return res.status(400).json({ error: 'Anda tidak dapat menghapus diri sendiri' });
            }
        }
        
        await db.query('DELETE FROM kegiatan_panitia WHERE id = ?', [req.params.panitia_id]);
        res.json({ message: 'Panitia berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal menghapus panitia' });
    }
});

module.exports = router;
