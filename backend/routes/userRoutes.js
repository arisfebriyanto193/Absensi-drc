const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../absen.dinusrobotic.org/uploads');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.use(verifyToken);

router.get('/dashboard', userController.getDashboard);
router.post('/absen', upload.fields([{ name: 'foto_before', maxCount: 1 }, { name: 'foto_after', maxCount: 1 }]), userController.submitAbsen);
router.post('/izin', upload.single('file_bukti'), userController.submitIzin);
router.get('/jadwal', userController.getJadwal);
router.get('/izin/jadwal', userController.getJadwalIzin);
router.get('/riwayat', userController.getRiwayat);
router.get('/profil', userController.getProfil);
router.put('/profil', userController.updateProfil);

module.exports = router;
