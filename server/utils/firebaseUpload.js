const fs = require('fs');
const path = require('path');
const { format } = require('util');
const { getBucket, STORAGE_DRIVER } = require('../firebase/firebase');

const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const uploadLocal = async (fileBuffer, originalName) => {
    const dir = path.join(LOCAL_UPLOAD_DIR);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${Date.now()}_${String(originalName).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, fileBuffer);
    const publicBase = process.env.PUBLIC_UPLOAD_URL || 'http://localhost:4969/uploads';
    return `${publicBase}/${filename}`;
};

const uploadFirebase = (fileBuffer, originalName, mimetype, folder) => {
    return new Promise((resolve, reject) => {
        const bucket = getBucket();
        if (!bucket) {
            return reject(new Error('Firebase storage not initialised'));
        }
        const blob = bucket.file(`${folder}/${Date.now()}_${originalName}`);
        const blobStream = blob.createWriteStream({ metadata: { contentType: mimetype } });
        blobStream.on('error', (err) => reject(err));
        blobStream.on('finish', async () => {
            try {
                await blob.makePublic();
                resolve(format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`));
            } catch (err) {
                reject(err);
            }
        });
        blobStream.end(fileBuffer);
    });
};

const uploadToFirebase = async (fileBuffer, originalName, mimetype, folder) => {
    if (STORAGE_DRIVER === 'local') {
        return uploadLocal(fileBuffer, originalName);
    }
    return uploadFirebase(fileBuffer, originalName, mimetype, folder);
};

module.exports = uploadToFirebase;
