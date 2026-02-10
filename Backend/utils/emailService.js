const nodemailer = require('nodemailer');

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

const sendEmail = async ({ to, subject, html, text }) => {
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

module.exports = { sendEmail };
