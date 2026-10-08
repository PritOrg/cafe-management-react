// Brand-aware transactional email templates.
// Uses the shared SMTP driver (see middleware/nodemailer.js) — no hardcoded creds.
const { sendMail } = require('../middleware/nodemailer');

const escapeHtml = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const shell = (brand, title, bodyHtml) => {
    const name = escapeHtml(brand?.title || 'Restaurant');
    const primary = brand?.primaryColor || '#ff6b35';
    const logo = brand?.logoUrl
        ? `<img src="${escapeHtml(brand.logoUrl)}" alt="${name}" style="height:40px;margin-bottom:8px" />`
        : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:${escapeHtml(primary)};color:#fff;padding:20px;text-align:center;border-radius:12px 12px 0 0">
      ${logo}
      <h1 style="margin:0;font-size:20px">${name}</h1>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;color:#1d1b20;line-height:1.6">
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#888;font-size:12px;margin-top:16px">
      &copy; ${new Date().getFullYear()} ${name}
    </p>
  </div>
</body>
</html>`;
};

const welcomeTemplate = (firstName, brand) => {
    const name = escapeHtml(brand?.title || 'Restaurant');
    const who = escapeHtml(firstName || 'there');
    return shell(brand, `Welcome to ${name}`, `
      <p>Dear ${who},</p>
      <p>Thank you for registering with us. We're excited to have you on board!</p>
      <p>Best regards,<br />The ${name} team</p>
    `);
};

const loginNotificationTemplate = (brand) => {
    const name = escapeHtml(brand?.title || 'Restaurant');
    return shell(brand, 'Login notification', `
      <p>We noticed a login to your account.</p>
      <p>If this wasn't you, please contact support immediately.</p>
      <p>Best regards,<br />The ${name} team</p>
    `);
};

const sendWelcomeEmail = (to, firstName, brand) =>
    sendMail({
        to,
        subject: `Welcome to ${brand?.title || 'us'}!`,
        html: welcomeTemplate(firstName, brand),
    });

const sendLoginNotificationEmail = (to, brand) =>
    sendMail({
        to,
        subject: 'Login notification',
        html: loginNotificationTemplate(brand),
    });

module.exports = { sendWelcomeEmail, sendLoginNotificationEmail };
