const { Router } = require('express');
const uploadController = require('../controllers/upload.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const upload = require('../middlewares/upload');

const router = Router();

router.post('/', authenticate, authorize('petugas'), upload.single('file'), uploadController.upload);

module.exports = router;
