const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/login-google', authController.loginGoogle);
// router.post('/register', authController.register); // Jika dibutuhkan
router.get('/me', authController.me);

module.exports = router;
