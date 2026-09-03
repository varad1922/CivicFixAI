const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const supabase = require('../config/supabase');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'civicfix';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

let bucketReady;
const ensureBucket = async () => {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { error: createError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: '5MB',
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (createError && !/already exists|duplicate/i.test(createError.message || '')) {
        // Existing buckets may have been created manually. Try to make the
        // existing bucket public rather than failing every upload.
        const { error: updateError } = await supabase.storage.updateBucket(BUCKET, {
          public: true,
          fileSizeLimit: '5MB',
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        });
        if (updateError) throw new Error(`Storage bucket '${BUCKET}' is unavailable: ${createError.message}`);
      }
    })().catch(error => {
      bucketReady = null;
      throw error;
    });
  }
  return bucketReady;
};

const uploadImage = async (file, userId) => {
  if (!file?.buffer) throw new Error('No image file received');
  await ensureBucket();

  const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const objectPath = `${userId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
    upsert: false
  });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error('Image upload succeeded but no public URL was returned');

  return { url: data.publicUrl, public_id: objectPath };
};

module.exports = { upload, uploadImage, BUCKET };
