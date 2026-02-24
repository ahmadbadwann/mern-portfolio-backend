const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');

const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ min: 10, max: 2000 }),
];

const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // التعديل الجديد هنا لتجاوز حماية الـ SSL في الـ Localhost
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
    // أضفناه هنا أيضاً للاحتياط
    tls: {
      rejectUnauthorized: false
    }
  });
};

// ... باقي الكود (router.post) يبقى كما هو دون تغيير
router.post('/', validateContact, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, message } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    const contact = await ContactMessage.create({ name, email, message, ipAddress });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = createTransporter();
        const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;

        await transporter.sendMail({
          from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
          to: ownerEmail,
          subject: `New Portfolio Contact from ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6EE7B7;">New Message from Your Portfolio</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td>${name}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td>${email}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Message:</td><td>${message}</td></tr>
              </table>
              <p style="color: #888; font-size: 12px;">Sent via your portfolio contact form.</p>
            </div>
          `,
        });

        await transporter.sendMail({
          from: `"${process.env.OWNER_NAME || 'Your Name'}" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Thanks for reaching out, ${name}!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hi ${name}, thanks for your message!</h2>
              <p>I've received your message and will get back to you within 24-48 hours.</p>
              <blockquote style="border-left: 3px solid #6EE7B7; padding-left: 16px; color: #555;">
                "${message}"
              </blockquote>
              <p>Talk soon,<br/><strong>${process.env.OWNER_NAME || 'Your Name'}</strong></p>
            </div>
          `,
        });
        console.log('✅ Emails sent successfully!'); // أضفت لك هذا السطر للتأكد من التيرمينال
      } catch (emailErr) {
        console.error('❌ Email send error:', emailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message received! I\'ll get back to you soon.',
      data: { id: contact._id }
    });

  } catch (err) {
    console.error('Contact error:', err.message);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

module.exports = router;