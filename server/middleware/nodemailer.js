const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tech.developersteam.service@gmail.com', // Your email
        pass: 'tech@1234' // Your email password
    }
});

// HTML email template
const welcomeEmailHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 600px;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            margin: 0 auto;
        }
        h1 {
            color: #1a73e8;
        }
        .header {
            text-align: center;
        }
        .content {
            margin-top: 20px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #777;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Bug-Latte!</h1>
        </div>
        <div class="content">
            <p>Dear [Customer Name],</p>
            <p>Thank you for joining the Bug-Latte family! We are thrilled to have you on board and can't wait for you to experience the best of our cafe, where coding meets coffee.</p>
            <p>Here's what you can expect from us:</p>
            <ul>
                <li>Delicious, freshly brewed coffee to fuel your coding sessions.</li>
                <li>A cozy and inspiring environment to work, code, and connect with fellow tech enthusiasts.</li>
                <li>Exclusive events, offers, and updates just for our members.</li>
            </ul>
            <p>We're here to make sure you have a fantastic experience at Bug-Latte. If you have any questions or need assistance, please don't hesitate to reach out to us.</p>
            <p>Happy coding and coffee drinking!</p>
            <p>Best regards,</p>
            <p>The Bug-Latte Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Bug-Latte. All rights reserved.</p>
            <p>If you did not sign up for this account, please ignore this email or contact us.</p>
        </div>
    </div>
</body>
</html>
`;

// Send welcome email
const sendWelcomeEmail = (recipientEmail, customerName) => {
    const mailOptions = {
        from: 'tech.developersteam.service@gmail.com',
        to: recipientEmail,
        subject: 'Welcome to Bug-Latte!',
        html: welcomeEmailHTML.replace('[Customer Name]', customerName)
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
    });
};

module.exports = sendWelcomeEmail;
