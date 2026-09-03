const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const supabase = require('../config/supabase');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'civicfix';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }

    cb(null, true);
  }
});

const uploadImage = async (file, userId) => {
  if (!file?.buffer) {
    throw new Error('No image file received');
  }

  if (!userId) {
    throw new Error('User ID is required for image upload');
  }

  const extension =
    path.extname(file.originalname || '').toLowerCase() || '.jpg';

  const objectPath =
    `${userId}/${Date.now()}-${crypto.randomUUID()}${extension}`;

  // The "civicfix" bucket must already exist in Supabase.
  // Do NOT create or modify the bucket during an upload.
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(objectPath);

  if (!data?.publicUrl) {
    throw new Error(
      'Image upload succeeded but no public URL was returned'
    );
  }

  return {
    url: data.publicUrl,
    public_id: objectPath
  };
};

module.exports = {
  upload,
  uploadImage,
  BUCKET
};