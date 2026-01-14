import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_SECURE = (process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';

const isEmailConfigured = () =>
  Boolean(EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS && EMAIL_FROM);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error('Email service is not configured');
  }
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

export const ensureEmailConfigured = () => {
  if (!isEmailConfigured()) {
    throw new Error('Email service is not configured');
  }
};

export const sendPasswordResetEmail = async (recipientEmail: string, otp: string) => {
  const transporter = getTransporter();
  const subject = 'Your Doodle Digest password reset code';
  const text = `Your password reset code is ${otp}. It expires in 15 minutes.`;
  const html = `<p>Your password reset code is <strong>${otp}</strong>. It expires in 15 minutes.</p>`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: recipientEmail,
    subject,
    text,
    html,
  });
};
