const express = require('express');
const router = express.Router();
const inventarisController = require('../controllers/inventarisController');
const { verifyToken, isInventaris, isKetuaInventaris } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi Multer untuk Upload Gambar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../uploads/inventaris');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'barang-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware sudah diimpor dari auth.js

// Rute Dashboard Stats
router.get('/dashboard', verifyToken, isInventaris, inventarisController.getDashboardStats);

// Rute Kelola Barang
router.get('/barang', verifyToken, isInventaris, inventarisController.getBarang);
router.post('/barang', verifyToken, isInventaris, upload.single('foto'), inventarisController.addBarang);
router.put('/barang/:id', verifyToken, isInventaris, upload.single('foto'), inventarisController.updateBarang);
router.delete('/barang/:id', verifyToken, isInventaris, inventarisController.deleteBarang);

// Rute Peminjaman (Admin View)
router.get('/peminjaman', verifyToken, isInventaris, inventarisController.getAllPeminjaman);
// Persetujuan hanya untuk Ketua Inventaris
router.put('/peminjaman/:id/status', verifyToken, isKetuaInventaris, inventarisController.updateStatusPeminjaman);

module.exports = router;
