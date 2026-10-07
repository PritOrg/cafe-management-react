// customerMail.js
const nodemailer = require('nodemailer');

// Configure OAuth2 transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: 'tech.developersteam.service@gmail.com',
    clientId: '281215278806-cf0avpp4kamislc6cms5g43e8jmgvpp8.apps.googleusercontent.com',
    clientSecret: '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',
    // refreshToken: 'your-refresh-token',
  },
});

// Welcome Email Template
const getWelcomeEmailTemplate = (firstName) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
        .container { padding: 20px; font-family: Arial, sans-serif; }
        .header { background-color: #4CAF50; color: white; padding: 10px 0; text-align: center; }
        .content { margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: gray; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Our Service, ${firstName}!</h1>
        </div>
        <div class="content">
            <p>Dear ${firstName},</p>
            <p>Thank you for registering with us. We're excited to have you on board!</p>
            <p>Best regards,</p>
            <p>Your Company Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Login Notification Email Template
const getLoginNotificationEmailTemplate = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Notification</title>
    <style>
        .container { padding: 20px; font-family: Arial, sans-serif; }
        .header { background-color: #FFA500; color: white; padding: 10px 0; text-align: center; }
        .content { margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: gray; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Login Notification</h1>
        </div>
        <div class="content">
            <p>Dear User,</p>
            <p>We noticed a login to your account. If this wasn't you, please contact support immediately.</p>
            <p>Best regards,</p>
            <p>Your Company Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const sendEmail = (to, subject, htmlContent) => {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to,
    subject,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = (to, firstName) => {
  const subject = 'Welcome to Our Service!';
  const htmlContent = getWelcomeEmailTemplate(firstName);
  try{

    return sendEmail(to, subject, htmlContent);
  }
  catch(error){
    console.error(`Error sending welcome email to ${to}:`, error);
    return error;
  }
};

const sendLoginNotificationEmail = (to) => {
  const subject = 'Login Notification';
  const htmlContent = getLoginNotificationEmailTemplate();
  return sendEmail(to, subject, htmlContent);
};

module.exports = {
  sendWelcomeEmail,
  sendLoginNotificationEmail,
};
