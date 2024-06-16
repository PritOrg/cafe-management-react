const admin = require('firebase-admin');
const serviceAccount = require('./cafe-management-2c495-firebase-adminsdk-nbvw7-4e5b8d2993.json'); // Path to your Firebase service account key

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://cafe-management-2c495.appspot.com' // Replace with your storage bucket URL
});

const bucket = admin.storage().bucket();

module.exports = bucket;
