const nodemailer = require('nodemailer');

const BREVO_HOST = 'smtp-relay.brevo.com';

const buildTransport = () => {
    const brevo = process.env.BREVO_API_KEY;
    const smtpHost = process.env.SMTP_HOST || (brevo ? BREVO_HOST : '');
    if (!smtpHost) return null;

    const user = process.env.SMTP_USER || process.env.BREVO_SMTP_LOGIN || process.env.MAIL_FROM || '';
    const pass = process.env.SMTP_PASS || (brevo ? brevo : undefined);
    // Brevo always requires a login email + the key (502 'authenticate' otherwise).
    if (brevo && (!user || !pass)) return null;

    return nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: user ? { user, pass } : undefined,
    });
};

let transporter = null;

const getTransporter = () => {
    if (transporter !== null) return transporter;
    transporter = buildTransport();
    return transporter;
};

const isMailConfigured = () => !!getTransporter();

/** Send an email via the configured SMTP driver. Throws if mail is not configured. */
const sendMail = async ({ to, subject, html, text, from }) => {
    const client = getTransporter();
    if (!client) throw new Error('SMTP is not configured');
    const sender = from || process.env.SMTP_FROM || process.env.SMTP_USER || process.env.MAIL_FROM || 'no-reply@localhost';
    return client.sendMail({ from: sender, to, subject, html, text });
};

module.exports = { getTransporter, isMailConfigured, sendMail };
