const express = require('express');
const router = express.Router();
const sekretarisController = require('../controllers/sekretarisController');
const { verifyToken, isSekretaris } = require('../middleware/auth');

// Middleware: Hanya Sekretaris (atau Admin) yang bisa akses
router.use(verifyToken);
router.use(isSekretaris);

// Routes untuk Template Surat
router.get('/template', sekretarisController.getTemplates);
router.get('/template/:id', sekretarisController.getTemplateById);
router.post('/template', sekretarisController.createTemplate);
router.put('/template/:id', sekretarisController.updateTemplate);
router.delete('/template/:id', sekretarisController.deleteTemplate);

// Route untuk daftar users (anggota)
router.get('/users', sekretarisController.getUsers);

// Routes untuk Riwayat Surat Menyurat
router.get('/surat', sekretarisController.getRiwayatSurat);
router.post('/surat', sekretarisController.createSurat);
router.delete('/surat/:id', sekretarisController.deleteSurat);

module.exports = router;
