'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCompanySettings() {
  let settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  });

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        id: 'default',
        companyName: 'My Company',
        currency: 'BDT'
      }
    });
  }

  return settings;
}

export async function updateCompanySettings(data: {
  companyName: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  currency: string;
  invoicePrefix?: string;
  defaultNotes?: string;
  logoUrl?: string;
}) {
  try {
    const settings = await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: {
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.taxId,
        currency: data.currency,
        invoicePrefix: data.invoicePrefix || 'INV-',
        defaultNotes: data.defaultNotes,
        logoUrl: data.logoUrl
      },
      create: {
        id: 'default',
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.taxId,
        currency: data.currency,
        invoicePrefix: data.invoicePrefix || 'INV-',
        defaultNotes: data.defaultNotes,
        logoUrl: data.logoUrl
      }
    });

    revalidatePath('/settings');
    revalidatePath('/invoices');
    return { success: true, settings };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}
