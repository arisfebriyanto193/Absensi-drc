const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isBendahara } = require('../middleware/auth');

// Get all kegiatan for Bendahara (with summary of finances)
router.get('/', verifyToken, isBendahara, async (req, res) => {
    try {
        const [kegiatan] = await db.query('SELECT * FROM kegiatan ORDER BY created_at DESC');
        
        // Dapatkan rekap per kegiatan
        const [rekap] = await db.query(`
            SELECT kegiatan_id, jenis, SUM(jumlah) as total
            FROM kegiatan_keuangan
            GROUP BY kegiatan_id, jenis
        `);

        // Gabungkan rekap ke data kegiatan
        const result = kegiatan.map(k => {
            const pemasukan = rekap.find(r => r.kegiatan_id === k.id && r.jenis === 'Pemasukan')?.total || 0;
            const pengeluaran = rekap.find(r => r.kegiatan_id === k.id && r.jenis === 'Pengeluaran')?.total || 0;
            return {
                ...k,
                pemasukan: parseFloat(pemasukan),
                pengeluaran: parseFloat(pengeluaran),
                saldo: parseFloat(pemasukan) - parseFloat(pengeluaran)
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil laporan kegiatan' });
    }
});

// Get detail laporan kegiatan (Info + Semua Transaksi)
router.get('/:id/laporan', verifyToken, isBendahara, async (req, res) => {
    try {
        const [kegiatan] = await db.query('SELECT * FROM kegiatan WHERE id = ?', [req.params.id]);
        if (kegiatan.length === 0) return res.status(404).json({ error: 'Kegiatan tidak ditemukan' });

        const [keuangan] = await db.query(`
            SELECT kk.*, u.nama_lengkap as pembuat
            FROM kegiatan_keuangan kk
            LEFT JOIN users u ON kk.created_by = u.id
            WHERE kk.kegiatan_id = ?
            ORDER BY kk.tanggal DESC, kk.created_at DESC
        `, [req.params.id]);

        res.json({
            ...kegiatan[0],
            keuangan
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil detail laporan kegiatan' });
    }
});

module.exports = router;
