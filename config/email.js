const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
// Supports multiple email providers via environment variables
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - EMAIL_HOST, EMAIL_USER, or EMAIL_PASS missing');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email with error handling
const sendEmail = async (options) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email transporter not configured, skipping email send');
    return { success: false, reason: 'not_configured' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Ella Rises" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, reason: 'send_failed', error: error.message };
  }
};

// Pre-built email templates
const emailTemplates = {
  // Contact form submission notification
  contactNotification: (data) => ({
    subject: `New Contact Form Submission: ${data.subject}`,
    text: `
New message from Ella Rises website contact form:

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Sent from Ella Rises Website
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #3A3F3B; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3A3F3B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f5ea; padding: 30px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #CE325B; }
    .message-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #9AB59D; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">From:</span> ${data.name}
      </div>
      <div class="field">
        <span class="label">Email:</span> <a href="mailto:${data.email}">${data.email}</a>
      </div>
      <div class="field">
        <span class="label">Subject:</span> ${data.subject}
      </div>
      <div class="message-box">
        <span class="label">Message:</span>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      </div>
    </div>
    <div class="footer">
      Sent from Ella Rises Website Contact Form
    </div>
  </div>
</body>
</html>
    `.trim()
  }),

  // Auto-reply to contact form submitter
  contactAutoReply: (data) => ({
    subject: 'Thank you for contacting Ella Rises!',
    text: `
Dear ${data.name},

Thank you for reaching out to Ella Rises! We have received your message and will get back to you as soon as possible.

Here's a copy of your message:
Subject: ${data.subject}
Message: ${data.message}

If you have any urgent inquiries, please don't hesitate to reach out again.

With gratitude,
The Ella Rises Team

---
Empowering young women to pursue higher education and STEAM careers
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #3A3F3B; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FFD8D1 0%, #F9F5EA 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; color: #3A3F3B; font-size: 28px; }
    .content { background: white; padding: 30px; }
    .message-copy { background: #f9f5ea; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #3A3F3B; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
    .footer p { margin: 5px 0; }
    .highlight { color: #CE325B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${data.name}</strong>,</p>
      <p>Thank you for reaching out to <span class="highlight">Ella Rises</span>! We have received your message and will get back to you as soon as possible.</p>
      
      <div class="message-copy">
        <p><strong>Your message:</strong></p>
        <p><em>Subject: ${data.subject}</em></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      </div>
      
      <p>If you have any urgent inquiries, please don't hesitate to reach out again.</p>
      <p>With gratitude,<br><strong>The Ella Rises Team</strong></p>
    </div>
    <div class="footer">
      <p><strong>Ella Rises</strong></p>
      <p>Empowering young women to pursue higher education and STEAM careers</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  })
};

module.exports = {
  sendEmail,
  emailTemplates,
  createTransporter
};

