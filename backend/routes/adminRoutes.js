const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const adminAbsensiController = require('../controllers/adminAbsensiController');
const adminIzinController = require('../controllers/adminIzinController');
const adminJadwalController = require('../controllers/adminJadwalController');
const adminUsersController = require('../controllers/adminUsersController');
const adminLaporanController = require('../controllers/adminLaporanController');
const adminJabatansController = require('../controllers/adminJabatansController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.use(verifyToken, isAdmin);

// Dashboard
router.get('/dashboard', adminDashboardController.getDashboard);

// Absensi
router.get('/absensi', adminAbsensiController.getAbsensiPending);
router.post('/absensi/konfirmasi', adminAbsensiController.konfirmasiAbsensi);

// Izin
router.get('/izin', adminIzinController.getIzinPending);
router.get('/izin/riwayat', adminIzinController.getIzinHistory);
router.post('/izin/konfirmasi', adminIzinController.konfirmasiIzin);

// Jadwal
router.get('/jadwal', adminJadwalController.getJadwal);
router.post('/jadwal', adminJadwalController.createJadwal);
router.post('/jadwal/salin', adminJadwalController.salinJadwal);
router.delete('/jadwal/tanggal/:tanggal', adminJadwalController.hapusJadwalTanggal);
router.delete('/jadwal/:id', adminJadwalController.hapusJadwal);

// Users
router.get('/users', adminUsersController.getUsers);
router.put('/users/:id', adminUsersController.updateUser);
router.delete('/users/:id', adminUsersController.deleteUser);

// Jabatans
router.get('/jabatans', adminJabatansController.getJabatans);

// Laporan
router.get('/laporan', adminLaporanController.getLaporan);

module.exports = router;
