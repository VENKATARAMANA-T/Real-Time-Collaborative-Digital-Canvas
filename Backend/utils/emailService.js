const nodemailer = require('nodemailer');
const dns = require('dns');

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

/**
 * Validate email format and verify domain has MX records
 */
const validateEmail = async (email) => {
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Extract domain and check MX records
  const domain = email.split('@')[1];
  try {
    const addresses = await dns.promises.resolveMx(domain);
    return addresses && addresses.length > 0;
  } catch {
    return false;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  // Validate email before attempting to send
  const isValid = await validateEmail(to);
  if (!isValid) {
    const err = new Error('Invalid email address. Please check and try again.');
    err.code = 'INVALID_EMAIL';
    throw err;
  }

  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text
  });
};

module.exports = { sendEmail, validateEmail };
