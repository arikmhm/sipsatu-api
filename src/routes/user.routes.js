const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().allow(null, ''),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('petugas').required(),
  waste_bank_id: Joi.string().uuid().required(),
});

router.get('/nasabah/search', authenticate, authorize('petugas'), userController.searchNasabah);
router.get('/', authenticate, authorize('admin'), userController.getAll);
router.get('/:id', authenticate, authorize('admin'), userController.getById);
router.post('/', authenticate, authorize('admin'), validate(createSchema), userController.create);

module.exports = router;
