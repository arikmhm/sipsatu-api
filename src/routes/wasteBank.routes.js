const { Router } = require('express');
const wasteBankController = require('../controllers/wasteBank.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  kelurahan: Joi.string().required(),
  phone: Joi.string().allow(null, ''),
  operating_hours: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
});

const updateSchema = Joi.object({
  name: Joi.string(),
  address: Joi.string(),
  kelurahan: Joi.string(),
  phone: Joi.string().allow(null, ''),
  operating_hours: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
}).min(1);

router.get('/', wasteBankController.getAll);
router.get('/:id', wasteBankController.getById);
router.post('/', authenticate, authorize('admin'), validate(createSchema), wasteBankController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateSchema), wasteBankController.update);

module.exports = router;
