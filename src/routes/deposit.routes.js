const { Router } = require('express');
const depositController = require('../controllers/deposit.controller');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const Joi = require('joi');

const router = Router();

const createSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  payment_status: Joi.string().valid('paid', 'unpaid').default('unpaid'),
  payment_proof_url: Joi.string().allow(null, ''),
  items: Joi.array()
    .items(
      Joi.object({
        category_id: Joi.string().uuid().required(),
        weight: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required(),
});

router.get('/today', authenticate, authorize('petugas'), depositController.getToday);
router.get('/', authenticate, depositController.getAll);
router.get('/:id', authenticate, depositController.getById);
router.post('/', authenticate, authorize('petugas'), validate(createSchema), depositController.create);
router.patch('/:id/pay', authenticate, authorize('petugas'), upload.single('payment_proof'), depositController.pay);

module.exports = router;
