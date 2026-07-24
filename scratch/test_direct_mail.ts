import fs from 'fs';
import path from 'path';

// Parse .env manually
try {
  const envPath = path.resolve(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim().startsWith('#') || !line.includes('=')) return;
    const parts = line.split('=');
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value;
  });
} catch (e) {
  console.error('Failed to load .env file', e);
}

import nodemailer from 'nodemailer';
import prisma from '../src/lib/prisma';
import { generateInvoicePDF } from '../src/lib/pdf';
import { getCompanySettings } from '../src/actions/settings';

async function main() {
  console.log('Sending invoice INV-2026-0031 with full SMTP debug...');

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: 'INV-2026-0031' },
    include: { contact: true, items: { include: { product: true } } }
  });

  if (!invoice) {
    console.error('Invoice not found');
    return;
  }

  const settings = await getCompanySettings();
  const pdfBuffer = await generateInvoicePDF(invoice, settings.logoUrl || undefined);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    logger: true,
    debug: true,
  });

  const mailOptions = {
    from: `sarkershishir4@gmail.com`,
    to: invoice.contact.email || 'im.shishir.rahman@gmail.com',
    subject: `Invoice ${invoice.invoiceNumber} from Sokrio Technologies`,
    text: `Dear Concern,\n\nPlease find attached invoice ${invoice.invoiceNumber}.\n\nThank you,\nSokrio Technologies Ltd.`,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('RESULT:', info);
}

main().catch(console.error);
