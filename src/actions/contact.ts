'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getContactsByType(type: string) {
  return await prisma.contact.findMany({
    where: { type },
    include: {
      invoices: true,
      lines: true,
      defaultProduct: true
    },
    orderBy: { name: 'asc' }
  });
}

export async function createContact(data: { name: string; type: string; email?: string; phone?: string; address?: string; defaultProductId?: string }) {
  try {
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        address: data.address,
        defaultProductId: data.defaultProductId || null
      }
    });
    
    if (data.type === 'CUSTOMER') revalidatePath('/contacts/customers');
    if (data.type === 'SUPPLIER') revalidatePath('/contacts/suppliers');
    
    return { success: true, contact };
  } catch (error) {
    console.error('Failed to create contact:', error);
    return { success: false, error: 'Failed to create contact' };
  }
}

export async function updateContact(id: string, data: { name: string; type: string; email?: string; phone?: string; address?: string; defaultProductId?: string }) {
  try {
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        address: data.address,
        defaultProductId: data.defaultProductId || null
      }
    });
    revalidatePath(`/contacts/${id}`);
    revalidatePath('/contacts/customers');
    revalidatePath('/contacts/suppliers');
    return { success: true, contact };
  } catch (error) {
    console.error('Failed to update contact:', error);
    return { success: false, error: 'Failed to update contact' };
  }
}

export async function getContactProfile(id: string) {
  return await prisma.contact.findUnique({
    where: { id },
    include: {
      invoices: {
        orderBy: { date: 'desc' }
      },
      lines: {
        include: { journalEntry: true, account: true },
        orderBy: { journalEntry: { date: 'desc' } }
      }
    }
  });
}
