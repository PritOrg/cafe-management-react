// utils/firebaseUpload.js
const { format } = require('util');
const bucket = require('../firebase/firebase');

/**
 * Uploads a file buffer to Firebase Storage under a specific folder
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalName - Original file name
 * @param {string} mimetype - MIME type
 * @param {string} folder - Folder in Firebase Storage (e.g., 'profile-photos')
 * @returns {Promise<string>} - Public URL of uploaded image
 */
    
const uploadToFirebase = (fileBuffer, originalName, mimetype, folder) => {
    return new Promise((resolve, reject) => {
        const blob = bucket.file(`${folder}/${Date.now()}_${originalName}`);
        const blobStream = blob.createWriteStream({ metadata: { contentType: mimetype } });

        blobStream.on('error', (err) => reject(err));

        blobStream.on('finish', async () => {
            try {
                await blob.makePublic();
                const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
                resolve(publicUrl);
            } catch (err) {
                reject(err);
            }
        });

        blobStream.end(fileBuffer);
    });
};

module.exports = uploadToFirebase;
