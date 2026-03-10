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
 * Validate email format and verify domain can receive mail
 * Checks MX records first, then falls back to A/AAAA records (per RFC 5321)
 * On network errors (DNS unavailable), passes validation to avoid false rejections
 */
const validateEmail = async (email) => {
  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Extract domain and check if it can receive mail
  const domain = email.split('@')[1];

  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) return true;
  } catch (err) {
    // ENOTFOUND = domain doesn't exist; other errors = DNS network issue
    if (err.code === 'ENOTFOUND') return false;
    if (err.code !== 'ENODATA') return true; // DNS unavailable, assume valid
  }

  try {
    const aRecords = await dns.promises.resolve4(domain);
    if (aRecords && aRecords.length > 0) return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND') return false;
    if (err.code !== 'ENODATA') return true;
  }

  try {
    const aaaaRecords = await dns.promises.resolve6(domain);
    if (aaaaRecords && aaaaRecords.length > 0) return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND') return false;
    if (err.code !== 'ENODATA') return true;
  }

  return false;
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
