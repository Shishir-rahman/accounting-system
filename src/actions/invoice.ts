'use server'

import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createJournalEntry } from './journal';
import { getCompanySettings } from './settings';
import { sendEmail } from '@/lib/mail';
import { generateInvoicePDF } from '@/lib/pdf';

function getSystemDefaultAttachments(defaultAttachmentsJson?: string | null): { filename: string; content: Buffer }[] {
  const attachments: { filename: string; content: Buffer }[] = [];

  // 1. Always include NBR Tax Exemption Certificate PDF by default
  const nbrPath = path.join(process.cwd(), 'public', 'attachments', 'NBR_Tax_Exemption_Certificate.pdf');
  if (fs.existsSync(nbrPath)) {
    try {
      attachments.push({
        filename: 'NBR_Tax_Exemption_Certificate_Sokrio.pdf',
        content: fs.readFileSync(nbrPath)
      });
    } catch (e) {
      console.error('Failed to read NBR certificate PDF:', e);
    }
  }

  // 2. Add user-uploaded additional attachments from Settings
  if (defaultAttachmentsJson) {
    try {
      const list = JSON.parse(defaultAttachmentsJson);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item.filename && item.base64) {
            const base64Data = item.base64.includes(',') ? item.base64.split(',')[1] : item.base64;
            attachments.push({
              filename: item.filename,
              content: Buffer.from(base64Data, 'base64')
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse defaultAttachments JSON:', e);
    }
  }

  return attachments;
}

export async function getInvoices() {
  try {
    return await prisma.invoice.findMany({
      include: {
        contact: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return [];
  }
}

export async function getInvoiceById(id: string) {
  try {
    return await prisma.invoice.findUnique({
      where: { id },
      include: {
        contact: true,
        items: {
          include: { product: true }
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch invoice by id:', error);
    return null;
  }
}

export async function createInvoice(data: {
  contactId: string;
  customerBin?: string;
  date: string;
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  discountAmount?: number;
  discountNote?: string;
  vatRate?: number;
  vatAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  category?: string;
  items: { productId?: string; description: string; quantity: number; unitPrice: number; vatType?: string; vatRate?: number }[];
}) {
  try {
    const settings = await getCompanySettings();
    const count = await prisma.invoice.count();
    const prefix = settings.invoicePrefix || 'INV-';
    const invoiceNumber = `${prefix}${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals
    const items = data.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = data.discountAmount || 0;
    const discountNote = data.discountNote || null;

    const excludeVatSum = items.reduce((sum, item) => {
      const rate = item.vatRate || 0;
      if (item.vatType === 'EXCLUDE' && rate > 0) {
        return sum + (item.quantity * item.unitPrice * (rate / 100));
      }
      return sum;
    }, 0);

    const includeVatSum = items.reduce((sum, item) => {
      const rate = item.vatRate || 0;
      if (item.vatType === 'INCLUDE' && rate > 0) {
        const lineTotal = item.quantity * item.unitPrice;
        return sum + (lineTotal - (lineTotal / (1 + rate / 100)));
      }
      return sum;
    }, 0);

    const individualVat = excludeVatSum + includeVatSum;
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const vatRate = data.vatRate || 0;
    const vatAmount = data.vatAmount !== undefined ? data.vatAmount : (individualVat > 0 ? individualVat : (totalAfterDiscount * (vatRate / 100)));
    const taxRate = data.taxRate || 0;
    const taxAmount = data.taxAmount !== undefined ? data.taxAmount : (totalAfterDiscount * (taxRate / 100));
    
    // totalAmount: Subtotal - Discount + EXCLUDE VAT + TAX
    const totalAmount = totalAfterDiscount + (individualVat > 0 ? excludeVatSum : (vatRate > 0 ? vatAmount : 0)) + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        billingPeriodStart: data.billingPeriodStart ? new Date(data.billingPeriodStart) : null,
        billingPeriodEnd: data.billingPeriodEnd ? new Date(data.billingPeriodEnd) : null,
        contactId: data.contactId,
        customerBin: data.customerBin || null,
        category: data.category || null,
        subtotal,
        discountAmount,
        discountNote,
        vatRate,
        vatAmount,
        taxRate,
        taxAmount,
        totalAmount,
        notes: data.notes,
        status: 'DUE',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            description: item.description,
            vatType: item.vatType || 'EXCLUDE',
            vatRate: item.vatRate || 0,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }))
        }
      }
    });

    // Save sticky descriptions and rates for the customer
    for (const item of data.items) {
      if (item.productId) {
        await prisma.contactProductRate.upsert({
          where: {
            contactId_productId: {
              contactId: data.contactId,
              productId: item.productId
            }
          },
          update: {
            lastDescription: item.description,
            rate: item.unitPrice,
            vatType: item.vatType || 'EXCLUDE',
            vatRate: item.vatRate || 0
          },
          create: {
            contactId: data.contactId,
            productId: item.productId,
            rate: item.unitPrice,
            lastDescription: item.description,
            vatType: item.vatType || 'EXCLUDE',
            vatRate: item.vatRate || 0
          }
        });
      }
    }

    revalidatePath('/invoices');
    return { success: true, id: invoice.id };
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return { success: false, error: 'Failed to create invoice' };
  }
}

export async function updateInvoice(id: string, data: {
  contactId: string;
  customerBin?: string;
  date: string;
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  discountAmount?: number;
  discountNote?: string;
  vatRate?: number;
  vatAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  category?: string;
  items: { productId?: string; description: string; quantity: number; unitPrice: number; vatType?: string; vatRate?: number }[];
}) {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Invoice not found' };
    if (existing.status !== 'DRAFT') return { success: false, error: 'Only DRAFT invoices can be edited' };

    // Calculate totals
    const items = data.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = data.discountAmount || 0;
    const discountNote = data.discountNote || null;

    const excludeVatSum = items.reduce((sum, item) => {
      const rate = item.vatRate || 0;
      if (item.vatType === 'EXCLUDE' && rate > 0) {
        return sum + (item.quantity * item.unitPrice * (rate / 100));
      }
      return sum;
    }, 0);

    const includeVatSum = items.reduce((sum, item) => {
      const rate = item.vatRate || 0;
      if (item.vatType === 'INCLUDE' && rate > 0) {
        const lineTotal = item.quantity * item.unitPrice;
        return sum + (lineTotal - (lineTotal / (1 + rate / 100)));
      }
      return sum;
    }, 0);

    const individualVat = excludeVatSum + includeVatSum;
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const vatRate = data.vatRate || 0;
    const vatAmount = data.vatAmount !== undefined ? data.vatAmount : (individualVat > 0 ? individualVat : (totalAfterDiscount * (vatRate / 100)));
    const taxRate = data.taxRate || 0;
    const taxAmount = data.taxAmount !== undefined ? data.taxAmount : (totalAfterDiscount * (taxRate / 100));
    
    // totalAmount: Subtotal - Discount + EXCLUDE VAT + TAX
    const totalAmount = totalAfterDiscount + (individualVat > 0 ? excludeVatSum : (vatRate > 0 ? vatAmount : 0)) + taxAmount;

    // We must replace items. So delete existing, create new.
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        billingPeriodStart: data.billingPeriodStart ? new Date(data.billingPeriodStart) : null,
        billingPeriodEnd: data.billingPeriodEnd ? new Date(data.billingPeriodEnd) : null,
        contactId: data.contactId,
        customerBin: data.customerBin || null,
        category: data.category || null,
        subtotal,
        discountAmount,
        discountNote,
        vatRate,
        vatAmount,
        taxRate,
        taxAmount,
        totalAmount,
        notes: data.notes,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            description: item.description,
            vatType: item.vatType || 'EXCLUDE',
            vatRate: item.vatRate || 0,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }))
        }
      }
    });

    // Save sticky descriptions and rates for the customer
    for (const item of data.items) {
      if (item.productId) {
        await prisma.contactProductRate.upsert({
          where: {
            contactId_productId: {
              contactId: data.contactId,
              productId: item.productId
            }
          },
          update: {
            lastDescription: item.description,
            rate: item.unitPrice,
            vatType: item.vatType || 'EXCLUDE',
            vatRate: item.vatRate || 0
          },
          create: {
            contactId: data.contactId,
            productId: item.productId,
            rate: item.unitPrice,
            lastDescription: item.description,
            vatType: item.vatType || 'EXCLUDE',
            vatRate: item.vatRate || 0
          }
        });
      }
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    return { success: true, id: invoice.id };
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return { success: false, error: 'Failed to update invoice' };
  }
}

export async function sendInvoice(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { contact: true, items: { include: { product: true } } }
    });

    if (!invoice) return { success: false, error: 'Invoice not found' };
    if (invoice.status === 'PAID') return { success: false, error: 'Invoice is already paid' };

    // Send Real Email
    if (invoice.contact.email) {
      const emailBody = `Dear Concern,

We are contacting you regarding invoice no- ${invoice.invoiceNumber} of the invoice. Please check the attached file for the updated invoice, make a bill against this invoice by a cheque/Bkash & notify us as soon as possible.

We are working regularly to upgrade our system for your efficiency, which is our vision as we prioritize our customers first. Please make sure that you don't have any pending bills with us or pay the pending ASAP if you have.

From now on, Sokrio is offering your payment (Optional) through bKash ( 01798013530 ) to reduce your valuable time. Please mention your invoice number as a reference for the payment.`;

      const settings = await getCompanySettings();
      const pdfBuffer = await generateInvoicePDF(invoice, settings.logoUrl || undefined, settings);
      const custName = invoice.contact?.name ? invoice.contact.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Customer';
      const extraAttachments = getSystemDefaultAttachments(settings.defaultAttachments);

      const emailResult = await sendEmail({
        to: invoice.contact.email,
        subject: `Invoice ${invoice.invoiceNumber} from Sokrio`,
        text: emailBody,
        attachments: [
          {
            filename: `${custName}_${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
          },
          ...extraAttachments
        ],
      });

      if (!emailResult.success) {
        return { success: false, error: emailResult.error ? `Failed to send email: ${emailResult.error}` : 'Failed to send email.' };
      }
    } else {
      return { success: false, error: `No email address found for contact ${invoice.contact.name}.` };
    }

    // Auto-Journal Entry
    // Find or create required accounts
    let arAccount = await prisma.account.findFirst({ where: { name: 'Accounts Receivable' } });
    if (!arAccount) {
      arAccount = await prisma.account.create({ data: { code: '1200', name: 'Accounts Receivable', type: 'ASSET', isSystem: true } });
    }

    let salesAccount = await prisma.account.findFirst({ where: { name: 'Sales Revenue' } });
    if (!salesAccount) {
      return { success: false, error: 'Sales Revenue account not found.' };
    }

    let discountAccount = null;
    if (invoice.discountAmount > 0) {
      discountAccount = await prisma.account.findFirst({ where: { name: 'Discount Allowed' } });
      if (!discountAccount) {
        discountAccount = await prisma.account.create({ data: { code: '5050', name: 'Discount Allowed', type: 'EXPENSE', isSystem: true } });
      }
    }

    const totalVatAndTax = (invoice.vatAmount || 0) + (invoice.taxAmount || 0);

    let vatAccount = null;
    if (totalVatAndTax > 0) {
      vatAccount = await prisma.account.findFirst({ where: { name: 'VAT Payable' } });
      if (!vatAccount) {
        vatAccount = await prisma.account.create({ data: { code: '2100', name: 'VAT Payable', type: 'LIABILITY', isSystem: true } });
      }
    }

    // Build the 4-way Journal Lines
    const lines = [];
    // 1. Debit AR (Total Amount Customer Owes)
    lines.push({ accountId: arAccount.id, debit: invoice.totalAmount, credit: 0, contactId: invoice.contactId });
    
    // 2. Debit Discount Allowed (Expense for the discount given)
    if (invoice.discountAmount > 0 && discountAccount) {
      lines.push({ accountId: discountAccount.id, debit: invoice.discountAmount, credit: 0 });
    }

    // 3. Credit VAT Payable (Liability to Government)
    if (totalVatAndTax > 0 && vatAccount) {
      lines.push({ accountId: vatAccount.id, debit: 0, credit: totalVatAndTax });
    }

    // 4. Credit Sales Revenue (Net Sales Revenue excluding VAT/Tax)
    const netSalesRevenue = Math.max(0, (invoice.totalAmount + invoice.discountAmount) - totalVatAndTax);
    lines.push({ accountId: salesAccount.id, debit: 0, credit: netSalesRevenue });

    // Validate if Debit equals Credit (Total + Discount = Subtotal + Tax)
    // Note: totalAmount = subtotal - discount + tax. Therefore: totalAmount + discount = subtotal + tax. Perfect.

    const journalRes = await createJournalEntry({
      date: new Date().toISOString(),
      description: `Invoice ${invoice.invoiceNumber} for ${invoice.contact.name}`,
      reference: invoice.invoiceNumber,
      lines: lines
    });

    if (!journalRes.success) {
      return { success: false, error: `Failed to create journal entry: ${journalRes.error}` };
    }

    // 3. Update Invoice Status
    await prisma.invoice.update({
      where: { id },
      data: { status: 'SENT' }
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    revalidatePath('/journal');
    revalidatePath('/ledgers');

    return { success: true };
  } catch (error) {
    console.error('Failed to send invoice:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function getLatestInvoiceByCategory(contactId: string, category: string) {
  try {
    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        contactId,
        category,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return { success: true, invoice: latestInvoice };
  } catch (error) {
    console.error('Failed to get latest invoice by category:', error);
    return { success: false, error: 'Failed to get latest invoice by category' };
  }
}

export async function updateInvoiceStatus(id: string, status: string) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { contact: true } });
    if (!invoice) return { success: false, error: 'Invoice not found' };

    // If changing to PAID, create journal entry for payment if needed
    if (status === 'PAID' && invoice.status !== 'PAID') {
      let bankAccount = await prisma.account.findFirst({ where: { type: 'ASSET', name: { contains: 'Bank' } } });
      if (!bankAccount) {
        bankAccount = await prisma.account.findFirst({ where: { type: 'ASSET' } });
      }

      let arAccount = await prisma.account.findFirst({ where: { name: 'Accounts Receivable' } });

      if (bankAccount && arAccount) {
        await createJournalEntry({
          date: new Date().toISOString(),
          description: `Payment received for Invoice ${invoice.invoiceNumber} from ${invoice.contact.name}`,
          reference: invoice.invoiceNumber,
          lines: [
            { accountId: bankAccount.id, debit: invoice.totalAmount, credit: 0 },
            { accountId: arAccount.id, debit: 0, credit: invoice.totalAmount, contactId: invoice.contactId }
          ]
        });
      }
    }

    await prisma.invoice.update({
      where: { id },
      data: { status }
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    revalidatePath('/journal');
    revalidatePath('/ledgers');

    return { success: true };
  } catch (error) {
    console.error('Failed to update invoice status:', error);
    return { success: false, error: 'Failed to update invoice status' };
  }
}

export async function sendReminderEmail(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { contact: true, items: { include: { product: true } } }
    });

    if (!invoice) return { success: false, error: 'Invoice not found' };
    if (!invoice.contact.email) {
      return { success: false, error: `No email address found for contact ${invoice.contact.name}.` };
    }

    const emailBody = `Dear Concern,

We thank you for being our customer. As per our regular billing policy, your organization is requested to pay the necessary dues within 7 working days of receiving the bill per month. Unfortunately, as our records suggest, we are yet to receive the necessary due payments from your organization till date.

Please make the necessary overdue payments by the 15th of this month to our designated bank or bKash account to continue using the Sokrio DMS service (Please mention your invoice number as a reference for the payment) and inform our accounts department accordingly in the following email address/ number.

If this amount has already been paid, please disregard this notice and we apologize for any inconvenience. We look forward to continuing our value-adding business relationship in the future. Please feel free to communicate with us for any clarification and/or queries.

From now on, Sokrio is offering your payment (Optional) through bKash to this number 01798013530 to reduce your valuable time. Please mention your invoice number as a reference for the payment.`;

    const settings = await getCompanySettings();
    const pdfBuffer = await generateInvoicePDF(invoice, settings.logoUrl || undefined, settings);
    const custName = invoice.contact?.name ? invoice.contact.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Customer';
    const extraAttachments = getSystemDefaultAttachments(settings.defaultAttachments);

    const emailResult = await sendEmail({
      to: invoice.contact.email,
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} from Sokrio`,
      text: emailBody,
      attachments: [
        {
          filename: `${custName}_${invoice.invoiceNumber}_Reminder.pdf`,
          content: pdfBuffer,
        },
        ...extraAttachments
      ],
    });

    if (!emailResult.success) {
      return { success: false, error: 'Failed to send reminder email.' };
    }

    revalidatePath('/invoices');
    return { success: true, message: `Reminder email sent to ${invoice.contact.email}` };
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return { success: false, error: 'Failed to send reminder email' };
  }
}

export async function sendWarningEmail(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { contact: true, items: { include: { product: true } } }
    });

    if (!invoice) return { success: false, error: 'Invoice not found' };
    if (!invoice.contact.email) {
      return { success: false, error: `No email address found for contact ${invoice.contact.name}.` };
    }

    const emailBody = `Dear Concern,

We thank you for being our customer. We hope this email finds you well. We are writing to bring to your attention the matter of overdue payment of Sokrio. Which has already been crossed the timeline, and despite our previous continuous reminders, we have yet to receive the required payment.

Please find the following payment options available for your convenience:

Online Payment: By Bkash Merchant Account 01798 013530
Bank Transfer: Bank Name: UCB (Uttara Branch) Account Name: Sokrio Technologies Ltd. Account Number: 0832101000024879 Routing Number: 245264630
Cheque Payment: If you prefer to make the payment via cheque, please make it payable to Sokrio Technologies Ltd and mail it to our dedicated key person to collect it by the 15th of this month. Please note the amount should be deposited to our account on or before the 15th of this month.
Once the payment has been made (by bkash /BEFTN), kindly notify us by email to update our records accordingly. If you have any questions or require further assistance, please do not hesitate to contact our Accounts Department.

In this circumstance, we regret to inform you that failing to clear the due bill within the 15th of this month, will impact on temporarily deactivating your account from 16th of this month onwards.

Temporary deactivation means that your company won't be able to access our services, starting from the admin account, followed by management web accesses, and finally the front liner mobile access points. These deactivations will take place on a daily basis starting with the admin account on 16th of this month and finally field level mobile access points on 18th of this month, considering the payment has not reached our account till then. In such a case, any deactivated account will reactivate upon receiving payment. We feel embarrassed to send this mail considering our good relationship, but this step is taken as a last resort to ensure timely payments and to maintain fairness among all our clients; as we have already implemented a monthly payment process within the due date with all our other clients.

If this amount has already been paid, please disregard this notice and we apologize for any inconvenience. We look forward to continuing our value-adding business relationship in the future. Please feel free to communicate with us for any clarification and/or queries.

 

Thank you for your immediate attention.`;

    const settings = await getCompanySettings();
    const pdfBuffer = await generateInvoicePDF(invoice, settings.logoUrl || undefined, settings);
    const custName = invoice.contact?.name ? invoice.contact.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Customer';
    const extraAttachments = getSystemDefaultAttachments(settings.defaultAttachments);

    const emailResult = await sendEmail({
      to: invoice.contact.email,
      subject: `URGENT WARNING: Overdue Payment Notice - Invoice ${invoice.invoiceNumber}`,
      text: emailBody,
      attachments: [
        {
          filename: `${custName}_${invoice.invoiceNumber}_Warning.pdf`,
          content: pdfBuffer,
        },
        ...extraAttachments
      ],
    });

    if (!emailResult.success) {
      return { success: false, error: 'Failed to send warning email.' };
    }

    revalidatePath('/invoices');
    return { success: true, message: `Warning email sent to ${invoice.contact.email}` };
  } catch (error) {
    console.error('Failed to send warning email:', error);
    return { success: false, error: 'Failed to send warning email' };
  }
}

export async function getInvoicePdfBase64(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { contact: true, items: { include: { product: true } } }
    });
    if (!invoice) return { success: false, error: 'Invoice not found' };

    const settings = await getCompanySettings();
    const pdfBuffer = await generateInvoicePDF(invoice, settings.logoUrl || undefined, settings);
    const base64 = pdfBuffer.toString('base64');
    const custName = invoice.contact?.name ? invoice.contact.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Customer';
    return {
      success: true,
      filename: `${custName}_${invoice.invoiceNumber}.pdf`,
      base64
    };
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return { success: false, error: 'Failed to generate PDF' };
  }
}
