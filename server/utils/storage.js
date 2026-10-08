const fs = require('fs');
const path = require('path');
const uploadToCloudinary = require('./cloudinaryUpload');
const { deleteFromCloudinary } = uploadToCloudinary;

const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/**
 * Active storage driver:
 *   explicit STORAGE_DRIVER (local | cloudinary), else
 *   cloudinary when CLOUDINARY_CLOUD_NAME is configured, else local.
 */
const resolveStorageDriver = () =>
    process.env.STORAGE_DRIVER
    || (process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local');

const uploadLocal = async (fileBuffer, originalName) => {
    if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
        fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
    }
    const filename = `${Date.now()}_${String(originalName).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, filename), fileBuffer);
    const publicBase = process.env.PUBLIC_UPLOAD_URL || 'http://localhost:4969/uploads';
    return `${publicBase}/${filename}`;
};

/**
 * Storage-agnostic upload used by controllers. Returns a public URL.
 * Signature: (fileBuffer, originalName, mimetype, folder)
 */
const uploadToStorage = async (fileBuffer, originalName, mimetype, folder = 'menu-img') => {
    const driver = resolveStorageDriver();
    if (driver === 'cloudinary') {
        return uploadToCloudinary(fileBuffer, originalName, mimetype, folder);
    }
    return uploadLocal(fileBuffer, originalName);
};

/**
 * Best-effort removal of a previously stored image (used when replacing an
 * image so we don't accumulate orphaned assets). Never throws.
 */
const deleteStoredImage = async (url) => {
    if (!url || typeof url !== 'string') return;
    try {
        if (/res\.cloudinary\.com/.test(url)) {
            return await deleteFromCloudinary(url);
        }
        if (url.includes('/uploads/')) {
            const filename = path.basename(url.split('/uploads/').pop() || '');
            const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
            if (filename && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error('deleteStoredImage failed:', err.message);
    }
    return undefined;
};

module.exports = uploadToStorage;
module.exports.resolveStorageDriver = resolveStorageDriver;
module.exports.deleteStoredImage = deleteStoredImage;
