'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createJournalEntry } from './journal';
import { getCompanySettings } from './settings';
import { sendEmail } from '@/lib/mail';
import { generateInvoicePDF } from '@/lib/pdf';

export async function getInvoices() {
  return await prisma.invoice.findMany({
    include: {
      contact: true,
      items: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getInvoiceById(id: string) {
  return await prisma.invoice.findUnique({
    where: { id },
    include: {
      contact: true,
      items: {
        include: { product: true }
      }
    }
  });
}

export async function createInvoice(data: {
  contactId: string;
  date: string;
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
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
    const taxRate = data.taxRate || 0;
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = data.taxAmount || (totalAfterDiscount * (taxRate / 100)); 
    const totalAmount = totalAfterDiscount + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        billingPeriodStart: data.billingPeriodStart ? new Date(data.billingPeriodStart) : null,
        billingPeriodEnd: data.billingPeriodEnd ? new Date(data.billingPeriodEnd) : null,
        contactId: data.contactId,
        subtotal,
        discountAmount,
        taxRate,
        taxAmount,
        totalAmount,
        notes: data.notes,
        status: 'DRAFT',
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
  date: string;
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
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
    const taxRate = data.taxRate || 0;
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = data.taxAmount || (totalAfterDiscount * (taxRate / 100)); 
    const totalAmount = totalAfterDiscount + taxAmount;

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
        subtotal,
        discountAmount,
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
      include: { contact: true, items: true }
    });

    if (!invoice) return { success: false, error: 'Invoice not found' };
    if (invoice.status !== 'DRAFT') return { success: false, error: 'Invoice is already sent or paid' };

    // Send Real Email
    if (invoice.contact.email) {
      const emailBody = `Dear Concern,

We are contacting you regarding invoice no- ${invoice.invoiceNumber} of the invoice. Please check the attached file for the updated invoice, make a bill against this invoice by a cheque/Bkash & notify us as soon as possible.

We are working regularly to upgrade our system for your efficiency, which is our vision as we prioritize our customers first. Please make sure that you don't have any pending bills with us or pay the pending ASAP if you have.

From now on, Sokrio is offering your payment (Optional) through bKash ( 01798013530 ) to reduce your valuable time. Please mention your invoice number as a reference for the payment.`;

      const settings = await getCompanySettings();
      const pdfBuffer = await generateInvoicePDF(invoice, settings.logoUrl || undefined);

      await sendEmail({
        to: invoice.contact.email,
        subject: `Invoice ${invoice.invoiceNumber} from Sokrio`,
        text: emailBody,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    } else {
      console.warn(`No email address found for contact ${invoice.contact.name}. Skipping email.`);
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

    let vatAccount = null;
    if (invoice.taxAmount > 0) {
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

    // 3. Credit Sales Revenue (Subtotal of goods/services)
    lines.push({ accountId: salesAccount.id, debit: 0, credit: invoice.subtotal });

    // 4. Credit VAT Payable (Liability to Government)
    if (invoice.taxAmount > 0 && vatAccount) {
      lines.push({ accountId: vatAccount.id, debit: 0, credit: invoice.taxAmount });
    }

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
