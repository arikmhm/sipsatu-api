const { Router } = require('express');
const priceController = require('../controllers/price.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const router = Router();

const createSchema = Joi.object({
  waste_bank_id: Joi.string().uuid().required(),
  category_id: Joi.string().uuid().required(),
  price_per_unit: Joi.number().positive().required(),
  effective_date: Joi.date().iso().allow(null, ''),
});

router.get('/', authenticate, priceController.getLatest);
router.post('/', authenticate, authorize('admin'), validate(createSchema), priceController.create);

module.exports = router;
