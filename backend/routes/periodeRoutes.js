const express = require('express');
const router = express.Router();
const periodeController = require('../controllers/periodeController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, periodeController.getPeriodes);
router.get('/active', verifyToken, periodeController.getActivePeriode);
router.post('/transition', verifyToken, isAdmin, periodeController.createPeriodeAndTransition);

module.exports = router;
