const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const env = require('../config/env');
const AppError = require('../utils/AppError');

exports.upload = async (file) => {
  if (!file) {
    throw new AppError(400, 'File wajib diupload');
  }

  const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
  const filename = `${uuidv4()}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(env.SUPABASE_BUCKET)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new AppError(500, 'Gagal upload file: ' + error.message);
  }

  const { data } = supabase.storage
    .from(env.SUPABASE_BUCKET)
    .getPublicUrl(filename);

  return data.publicUrl;
};
