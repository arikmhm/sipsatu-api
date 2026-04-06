const nasabahService = require('../services/nasabah.service');
const { success } = require('../utils/response');

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await nasabahService.getDashboard(req.user.id);
    return success(res, 200, 'Dashboard nasabah', data);
  } catch (err) {
    next(err);
  }
};
