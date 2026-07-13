const express = require('express');
const router = express.Router();
const inventarisController = require('../controllers/inventarisController');
const { verifyToken } = require('../middleware/auth');

// Semua user yang login (admin & user) bisa akses
router.use(verifyToken);

// Mendapatkan daftar barang untuk katalog peminjaman
router.get('/barang', inventarisController.getBarang);

// Pengajuan peminjaman
router.post('/request', inventarisController.requestPeminjaman);

// Riwayat peminjaman user
router.get('/riwayat', inventarisController.getUserPeminjaman);

module.exports = router;
