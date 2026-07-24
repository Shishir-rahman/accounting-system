import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
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
  const mailOptions = {
    from: `Sokrio Technologies <${process.env.EMAIL_USER}>`,
    to,
    cc,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
