const nodemailer = require('nodemailer');

const buildTransport = () => {
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined,
        });
    }
    return null;
};

let transporter = null;

const getTransporter = () => {
    if (transporter !== null) return transporter;
    transporter = buildTransport();
    return transporter;
};

const isMailConfigured = () => !!process.env.SMTP_HOST;

module.exports = { getTransporter, isMailConfigured };
