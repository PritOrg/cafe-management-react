const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'firebase';

let bucket = null;

const getBucket = () => {
    if (bucket) return bucket;
    if (STORAGE_DRIVER !== 'firebase') {
        return null;
    }
    // Lazy require so local-driver / test boots never load Firebase Admin
    const admin = require('firebase-admin');
    let serviceAccount;
    try {
        serviceAccount = require('./cafe-management-2c495-firebase-adminsdk-nbvw7-48441b7dc5.json');
    } catch (err) {
        console.error('Firebase service account not found:', err.message);
        throw new Error('STORAGE_DRIVER=firebase but Firebase credentials are missing');
    }
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'gs://cafe-management-2c495.appspot.com',
        });
    }
    bucket = admin.storage().bucket();
    return bucket;
};

module.exports = { getBucket, STORAGE_DRIVER };
