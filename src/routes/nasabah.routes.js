const { Router } = require('express');
const nasabahController = require('../controllers/nasabah.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role');

const router = Router();

router.get('/dashboard', authenticate, authorize('nasabah'), nasabahController.getDashboard);

module.exports = router;
