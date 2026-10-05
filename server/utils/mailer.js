const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  console.log(`[mail] SMTP configured via ${process.env.SMTP_HOST}`);
} else {
  console.log('[mail] SMTP_HOST not set: notification emails will be logged to the console instead.');
}

/**
 * Send an email, never throwing. Without SMTP configuration the full
 * message is printed to the server console so the flow stays observable.
 */
async function sendEmail({ to, subject, text }) {
  const from = process.env.SMTP_FROM || 'GratiWall <no-reply@gratiwall.edu>';
  if (!transporter) {
    console.log('[mail] (console fallback) ----------------------------------------');
    console.log(`[mail] To: ${to}`);
    console.log(`[mail] Subject: ${subject}`);
    console.log(`[mail] ${text}`);
    console.log('[mail] ----------------------------------------------------------');
    return { delivered: false, logged: true };
  }
  try {
    await transporter.sendMail({ from, to, subject, text });
    return { delivered: true };
  } catch (err) {
    console.error('[mail] Failed to send email (continuing anyway):', err.message);
    return { delivered: false, error: err.message };
  }
}

module.exports = { sendEmail };
