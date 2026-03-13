require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter for all other routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  // Length limits
  if (name.length > 100 || subject.length > 200 || message.length > 2000) {
    return res.status(400).json({ success: false, message: 'Input exceeds maximum length.' });
  }

  // If email config is not provided, just log and return success (demo mode)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Contact form submission (demo mode – configure EMAIL_USER/EMAIL_PASS to send emails):');
    console.log({ name, email, subject, message });
    return res.json({ success: true, message: 'Message received! I will get back to you soon.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: `[Work-website] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Subject:</strong> ${subject}</p>
             <hr>
             <p>${message.replace(/\n/g, '<br>')}</p>`,
    });

    res.json({ success: true, message: 'Message sent! I will get back to you soon.' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
});

// Fallback – serve index.html for any unmatched route
app.get('*', generalLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Work-website is running at http://localhost:${PORT}`);
});
