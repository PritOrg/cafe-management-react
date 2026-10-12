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

const itemsTable = (items = []) => {
    if (!items.length) return '';
    const rows = items
        .map(
            (it) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eee">${escapeHtml(it.name || 'Item')}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center">${Number(it.qty) || 1}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">&#8377;${Number(it.amount || 0).toFixed(2)}</td>
        </tr>`
        )
        .join('');
    return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 16px">
      <thead><tr style="background:#f1eef5;color:#49454f">
        <th style="padding:8px 10px;text-align:left">Item</th>
        <th style="padding:8px 10px">Qty</th>
        <th style="padding:8px 10px;text-align:right">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const orderConfirmationTemplate = ({ orderNumber, total, itemCount, items = [] }, brand) => {
    const name = escapeHtml(brand?.title || 'Restaurant');
    return shell(brand, `Order ${orderNumber} received`, `
      <p style="margin-top:0">Thanks for ordering with us! Here's your order summary:</p>
      ${itemsTable(items)}
      <p style="margin:4px 0 0"><strong>Total: &#8377;${Number(total || 0).toFixed(2)}</strong></p>
      <p style="font-size:13px;color:#666;margin:4px 0 16px">Items: ${Number(itemCount) || 0} · Order #${escapeHtml(orderNumber)}</p>
      <p style="margin-top:0">We're preparing your order — a printed bill is available at the counter.</p>
      <p>Best regards,<br />The ${name} team</p>
    `);
};

const invoiceTemplate = ({ invoiceNumber, grandTotal, items = [] }, brand) => {
    const name = escapeHtml(brand?.title || 'Restaurant');
    return shell(brand, `Invoice ${invoiceNumber}`, `
      <p style="margin-top:0">Your bill is ready — a quick summary:</p>
      ${itemsTable(items)}
      <p style="font-size:15px"><strong>Invoice total: &#8377;${Number(grandTotal || 0).toFixed(2)}</strong></p>
      <p>Your GST-compliant invoice (${escapeHtml(invoiceNumber)}) is attached as a PDF — print it from any device.</p>
      <p>Thank you,<br />The ${name} team</p>
    `);
};

const sendOrderConfirmationEmail = (to, data, brand) =>
    sendMail({
        to,
        subject: `Order ${data.orderNumber} received`,
        html: orderConfirmationTemplate(data, brand),
    });

const sendInvoiceEmail = (to, data, pdfBuffer, brand) =>
    sendMail({
        to,
        subject: `Invoice ${data.invoiceNumber}`,
        html: invoiceTemplate(data, brand),
        attachments: [{ filename: `${data.invoiceNumber}.pdf`, content: Buffer.from(pdfBuffer) }],
    });

module.exports = { sendWelcomeEmail, sendLoginNotificationEmail, sendOrderConfirmationEmail, sendInvoiceEmail };
