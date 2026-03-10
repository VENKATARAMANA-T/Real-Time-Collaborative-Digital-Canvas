// utils/email.js
const sgMail = require('@sendgrid/mail');
const dns = require('dns');

// Load SendGrid API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Validate email format and (optionally) verify domain exists via DNS.
 * In cloud environments, DNS lookups may fail, so it's optional.
 */
const validateEmail = async (email, checkDNS = false) => {
  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  if (!checkDNS) return true; // Skip DNS check for cloud

  const domain = email.split('@')[1];

  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) return true;
  } catch (err) {
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

/**
 * Send email using SendGrid
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // Validate email before sending
  const isValid = await validateEmail(to, false); // false = skip DNS for cloud
  if (!isValid) {
    const err = new Error('Invalid email address. Please check and try again.');
    err.code = 'INVALID_EMAIL';
    throw err;
  }

  const from = process.env.SMTP_FROM || 'noreply@yourproject.sendgrid.net';

  const msg = {
    to,
    from,
    subject,
    text,
    html: html || text
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('SendGrid error:', err.response?.body || err.message);
    throw err;
  }
};

module.exports = { sendEmail, validateEmail };