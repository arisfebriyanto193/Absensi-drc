const express = require('express');
const router = express.Router();
const adminJabatansController = require('../controllers/adminJabatansController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, isAdmin, adminJabatansController.getJabatans);

module.exports = router;
