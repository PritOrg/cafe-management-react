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

/** Send an email via the configured SMTP driver. Throws if SMTP is not configured. */
const sendMail = async ({ to, subject, html, text, from }) => {
    const client = getTransporter();
    if (!client) throw new Error('SMTP is not configured');
    const sender = from || process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@localhost';
    return client.sendMail({ from: sender, to, subject, html, text });
};

module.exports = { getTransporter, isMailConfigured, sendMail };
