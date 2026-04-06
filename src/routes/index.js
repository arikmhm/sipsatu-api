const { Router } = require('express');
const authRoutes = require('./auth.routes');
const wasteBankRoutes = require('./wasteBank.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/waste-banks', wasteBankRoutes);

module.exports = router;
