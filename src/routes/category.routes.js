const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().required(),
  unit: Joi.string().default('kg'),
});

const updateSchema = Joi.object({
  name: Joi.string(),
  unit: Joi.string(),
  is_active: Joi.boolean(),
}).min(1);

router.get('/', authenticate, categoryController.getAll);
router.post('/', authenticate, authorize('admin'), validate(createSchema), categoryController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateSchema), categoryController.update);

module.exports = router;
