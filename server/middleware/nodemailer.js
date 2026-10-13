const nodemailer = require('nodemailer');

const BREVO_HOST = 'smtp-relay.brevo.com';

const buildTransport = () => {
    const smtpHost = process.env.SMTP_HOST || '';
    // Brevo relay auto-selected when no generic SMTP host is configured and a
    // Brevo login/key is present.
    const brevo = !smtpHost && (process.env.BREVO_API_KEY || process.env.BREVO_SMTP_LOGIN);
    const host = smtpHost || (brevo ? BREVO_HOST : '');
    if (!host) return null;

    const user = brevo
        ? (process.env.BREVO_SMTP_LOGIN || process.env.SMTP_USER || process.env.MAIL_FROM || '')
        : (process.env.SMTP_USER || process.env.MAIL_FROM || '');
    const pass = brevo
        ? (process.env.BREVO_API_KEY || process.env.SMTP_PASS)
        : process.env.SMTP_PASS;
    // Credentialed relays (Brevo, or generic SMTP with a user) need login + pass.
    if ((brevo || user) && (!user || !pass)) return null;

    return nodemailer.createTransport({
        host,
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
    // For a credentialed relay (Brevo/Gmail) the envelope must be a verified
    // sender: prefer an explicit MAIL_FROM / relay login over a legacy SMTP_USER.
    const sender = from
        || process.env.SMTP_FROM
        || process.env.MAIL_FROM
        || process.env.BREVO_SMTP_LOGIN
        || process.env.SMTP_USER
        || 'no-reply@localhost';
    return client.sendMail({ from: sender, to, subject, html, text });
};

module.exports = { getTransporter, isMailConfigured, sendMail };
