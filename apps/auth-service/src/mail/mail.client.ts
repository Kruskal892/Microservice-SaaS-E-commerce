import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'node:path';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICE,
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

export const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, unknown>,
) => {
  // Nx copies src/mail/templates to dist/templates beside the bundled main.js.
  const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`);
  const html = await ejs.renderFile(templatePath, data);
  const result = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
  if (!result.accepted?.length || result.rejected?.length) {
    throw new Error('SMTP server did not accept the OTP recipient');
  }
};
