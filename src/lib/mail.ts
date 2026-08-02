import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

const envUser = process.env.EMAIL_USER?.trim();
const authUser = (envUser && envUser.includes('@')) ? envUser : 'accounts@sokrio.com';

const envPass = process.env.EMAIL_PASSWORD?.trim();
const authPass = (envPass && envPass.length >= 12) ? envPass : 'fumw wmbq uynb mtvn';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true,
  auth: {
    user: authUser,
    pass: authPass,
  },
});

export async function getDefaultCcEmail(): Promise<string> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
      select: { defaultCcEmail: true }
    });
    return settings?.defaultCcEmail || 'sahiuddin@sokrio.com';
  } catch (e) {
    return 'sahiuddin@sokrio.com';
  }
}

export async function getDefaultFromEmail(): Promise<string> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
      select: { email: true, companyName: true }
    });
    const fromAddr = settings?.email?.trim() || 'accounts@sokrio.com';
    const compName = settings?.companyName?.trim() || 'Sokrio Technologies';
    return `${compName} <${fromAddr}>`;
  } catch (e) {
    return `Sokrio Technologies <accounts@sokrio.com>`;
  }
}

export async function sendEmail({
  to,
  cc,
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
  const effectiveCc = cc || (await getDefaultCcEmail());
  const effectiveFrom = await getDefaultFromEmail();

  // Clean recipient emails by removing dummy @example.com addresses
  const validTo = to
    .split(',')
    .map(e => e.trim())
    .filter(e => e && !e.toLowerCase().endsWith('@example.com'));

  // If no valid customer email remains, route primary recipient to CC email
  const finalTo = validTo.length > 0 ? validTo.join(', ') : effectiveCc;
  const finalCc = validTo.length > 0 ? effectiveCc : undefined;

  const senderEmailOnly = effectiveFrom.includes('<')
    ? effectiveFrom.split('<')[1].replace('>', '').trim()
    : effectiveFrom.trim();

  const mailOptions = {
    from: effectiveFrom,
    replyTo: senderEmailOnly,
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
