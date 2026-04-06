const { Router } = require('express');
const authRoutes = require('./auth.routes');
const wasteBankRoutes = require('./wasteBank.routes');
const categoryRoutes = require('./category.routes');
const priceRoutes = require('./price.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/waste-banks', wasteBankRoutes);
router.use('/waste-categories', categoryRoutes);
router.use('/waste-prices', priceRoutes);

module.exports = router;
