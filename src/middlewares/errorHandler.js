const errorHandler = (err, req, res, next) => {
  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Ukuran file maksimal 5MB',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  const body = { success: false, message };
  if (err.errors) body.errors = err.errors;

  if (!err.statusCode) {
    console.error(err);
  }

  return res.status(statusCode).json(body);
};

module.exports = errorHandler;
