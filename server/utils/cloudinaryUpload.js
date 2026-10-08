let client = null;

const getClient = () => {
    if (client) return client;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error(
            'STORAGE_DRIVER=cloudinary but CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are missing'
        );
    }
    // Lazy require so non-Cloudinary boots never load the SDK.
    const { v2: cloudinary } = require('cloudinary');
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    client = cloudinary;
    return client;
};

/**
 * Upload a memory buffer to Cloudinary and return the public HTTPS URL.
 * Signature matches the other storage drivers: (buffer, originalName, mimetype, folder).
 */
const uploadToCloudinary = (fileBuffer, originalName, _mimetype, folder = 'menu-img') => {
    const cloudinary = getClient();
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                // Keep the original extension when possible.
                filename_override: originalName ? String(originalName).replace(/[^a-zA-Z0-9._-]/g, '_') : undefined,
            },
            (error, result) => {
                if (error) return reject(error);
                return resolve(result.secure_url || result.url);
            }
        );
        stream.on('error', reject);
        stream.end(fileBuffer);
    });
};

/** Derive a Cloudinary public_id (folder/name) from a delivery URL, or null. */
const publicIdFromUrl = (url) => {
    try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith('res.cloudinary.com')) return null;
        const parts = parsed.pathname.split('/').filter(Boolean);
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;
        let tail = parts.slice(uploadIndex + 1);
        if (tail[0] && /^v\d+$/.test(tail[0])) tail = tail.slice(1);
        if (!tail.length) return null;
        tail[tail.length - 1] = tail[tail.length - 1].replace(/\.[a-z0-9]+$/i, '');
        return tail.join('/');
    } catch {
        return null;
    }
};

/** Best-effort delete of a previously uploaded Cloudinary asset. */
const deleteFromCloudinary = async (url) => {
    const publicId = publicIdFromUrl(url);
    if (!publicId) return { skipped: true };
    const cloudinary = getClient();
    return cloudinary.uploader.destroy(publicId);
};

module.exports = uploadToCloudinary;
module.exports.deleteFromCloudinary = deleteFromCloudinary;
module.exports.publicIdFromUrl = publicIdFromUrl;
