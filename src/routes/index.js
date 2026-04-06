const { Router } = require('express');
const authRoutes = require('./auth.routes');
const wasteBankRoutes = require('./wasteBank.routes');
const categoryRoutes = require('./category.routes');
const priceRoutes = require('./price.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const depositRoutes = require('./deposit.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/waste-banks', wasteBankRoutes);
router.use('/waste-categories', categoryRoutes);
router.use('/waste-prices', priceRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/deposits', depositRoutes);

module.exports = router;
