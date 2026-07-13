const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all kegiatan
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM kegiatan ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil data kegiatan' });
    }
});

// Create kegiatan
router.post('/', verifyToken, isAdmin, async (req, res) => {
    const { nama_kegiatan, deskripsi, tanggal_mulai, tanggal_selesai } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO kegiatan (nama_kegiatan, deskripsi, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?)',
            [nama_kegiatan, deskripsi, tanggal_mulai || null, tanggal_selesai || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Kegiatan berhasil dibuat' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal membuat kegiatan' });
    }
});

// Update kegiatan
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nama_kegiatan, deskripsi, tanggal_mulai, tanggal_selesai, status } = req.body;
    try {
        await db.query(
            'UPDATE kegiatan SET nama_kegiatan = ?, deskripsi = ?, tanggal_mulai = ?, tanggal_selesai = ?, status = ? WHERE id = ?',
            [nama_kegiatan, deskripsi, tanggal_mulai || null, tanggal_selesai || null, status, id]
        );
        res.json({ message: 'Kegiatan berhasil diupdate' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengupdate kegiatan' });
    }
});

// Delete kegiatan
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM kegiatan WHERE id = ?', [id]);
        res.json({ message: 'Kegiatan berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal menghapus kegiatan' });
    }
});

// Get panitia of a kegiatan
router.get('/:id/panitia', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT kp.id, kp.user_id, kp.peran, u.nama_lengkap as nama, u.nim 
            FROM kegiatan_panitia kp
            JOIN users u ON kp.user_id = u.id
            WHERE kp.kegiatan_id = ?
        `, [id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil data panitia' });
    }
});

// Add panitia
router.post('/:id/panitia', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { user_id, peran } = req.body;
    try {
        await db.query(
            'INSERT INTO kegiatan_panitia (kegiatan_id, user_id, peran) VALUES (?, ?, ?)',
            [id, user_id, peran]
        );
        res.status(201).json({ message: 'Panitia berhasil ditambahkan' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'User ini sudah menjadi panitia di kegiatan ini' });
        }
        console.error(error);
        res.status(500).json({ error: 'Gagal menambahkan panitia' });
    }
});

// Remove panitia
router.delete('/:id/panitia/:panitia_id', verifyToken, isAdmin, async (req, res) => {
    const { panitia_id } = req.params;
    try {
        await db.query('DELETE FROM kegiatan_panitia WHERE id = ?', [panitia_id]);
        res.json({ message: 'Panitia berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal menghapus panitia' });
    }
});

module.exports = router;
