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

module.exports = uploadToCloudinary;
