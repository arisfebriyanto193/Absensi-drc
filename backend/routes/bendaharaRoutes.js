const express = require('express');
const router = express.Router();
const bendaharaController = require('../controllers/bendaharaController');
const ekskulController = require('../controllers/ekskulController');
const { verifyToken, isBendahara } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi Multer untuk upload bukti
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../absen.dinusrobotic.org/uploads/keuangan');
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
const upload = multer({ storage });

router.use(verifyToken, isBendahara);

// Pengaturan
router.get('/pengaturan', bendaharaController.getPengaturan);
router.post('/pengaturan', bendaharaController.updatePengaturan);

// Dashboard
router.get('/dashboard', bendaharaController.getDashboard);

// Kas Anggota
router.get('/kas-anggota', bendaharaController.getKasAnggota);
router.post('/kas-anggota', bendaharaController.updateKasAnggota);
router.post('/kas-anggota/toggle', bendaharaController.toggleKasBulan);
router.post('/kas-anggota/reset/:id', bendaharaController.resetKasBulan);

// Kegiatan
router.get('/kegiatan', bendaharaController.getKegiatan);
router.post('/kegiatan', bendaharaController.createKegiatan);
router.get('/kegiatan/:id', bendaharaController.getKegiatanById);
router.delete('/kegiatan/:id', bendaharaController.deleteKegiatan);

// Transaksi dalam Kegiatan
router.post('/kegiatan/:id/transaksi', upload.single('bukti'), bendaharaController.createTransaksi);
router.delete('/transaksi/:trxId', bendaharaController.deleteTransaksi);

// Ekskul Robotic
router.get('/ekskul', ekskulController.getSekolah);
router.post('/ekskul', ekskulController.addSekolah);
router.get('/ekskul/:id', ekskulController.getDetailSekolah);
router.delete('/ekskul/:id', ekskulController.deleteSekolah);
router.post('/ekskul/:id/pembelajaran', ekskulController.addPembelajaran);
router.put('/ekskul/pembelajaran/:pembelajaran_id', ekskulController.updatePembelajaran);
router.put('/ekskul/pembelajaran/:pembelajaran_id/status', ekskulController.toggleStatusPembelajaran);
router.put('/ekskul/pengajar/:pengajar_id/status', ekskulController.toggleStatusPengajar);
router.delete('/ekskul/pembelajaran/:pembelajaran_id', ekskulController.deletePembelajaran);

module.exports = router;
