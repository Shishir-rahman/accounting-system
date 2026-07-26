import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER || 'sarkershishir4@gmail.com';
const emailPass = process.env.EMAIL_PASSWORD || 'bruu ixif fmws tohj';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

export async function sendEmail({
  to,
  cc = 's.sarker009s@gmail.com',
  subject,
  text,
  html,
  attachments,
}: {
  to: string;
  cc?: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  // Clean recipient emails by removing dummy @example.com addresses
  const validTo = to
    .split(',')
    .map(e => e.trim())
    .filter(e => e && !e.toLowerCase().endsWith('@example.com'));

  // If no valid customer email remains, route primary recipient to CC email
  const finalTo = validTo.length > 0 ? validTo.join(', ') : cc;
  const finalCc = validTo.length > 0 ? cc : undefined;

  const mailOptions = {
    from: `Sokrio Technologies <${emailUser}>`,
    to: finalTo,
    cc: finalCc,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}
