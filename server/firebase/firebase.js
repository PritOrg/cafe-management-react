const admin = require('firebase-admin');
const serviceAccount = require('./cafe-management-2c495-firebase-adminsdk-nbvw7-48441b7dc5.json'); // Path to your Firebase service account key

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'gs://cafe-management-2c495.appspot.com'
    });
} catch (error) {
    console.error('Error initializing Firebase:', error);
    process.exit(1);
}

const bucket = admin.storage().bucket();

module.exports = bucket;