const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 data URL or file buffer to Cloudinary
 * @param {string} fileData - Base64 data URL (e.g., "data:image/png;base64,...")
 * @param {object} options - Cloudinary upload options (folder, public_id, resource_type, etc.)
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = async (fileData, options = {}) => {
  try {
    const defaultOptions = {
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    };

    const result = await cloudinary.uploader.upload(fileData, defaultOptions);
    return result;
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error.message);
    throw error;
  }
};

/**
 * Upload a buffer (e.g., from multer) to Cloudinary via a stream
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      resource_type: 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Buffer upload error:', error.message);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete a resource from Cloudinary by public_id
 * @param {string} publicId - The public_id of the resource
 * @param {string} resourceType - 'image', 'video', 'raw' (default: 'image')
 * @returns {Promise<object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error.message);
    throw error;
  }
};

/**
 * Extract public_id from a Cloudinary URL
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null} The public_id or null
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{public_id}.{ext}
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1];
    // Remove version prefix (v1234567890/)
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
    return publicId;
  } catch {
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
