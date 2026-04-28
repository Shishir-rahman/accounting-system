'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getContactsByType(type: string) {
  return await prisma.contact.findMany({
    where: { type },
    include: {
      invoices: true,
      lines: true,
      defaultProduct: true,
      customRates: true
    },
    orderBy: { name: 'asc' }
  });
}

export async function createContact(data: { 
  name: string; 
  type: string; 
  email?: string; 
  phone?: string; 
  address?: string; 
  defaultProductId?: string;
  customRates?: { productId: string; rate: number; vatType?: string; vatRate?: number }[]
}) {
  try {
    const contact = await prisma.$transaction(async (tx) => {
      const newContact = await tx.contact.create({
        data: {
          name: data.name,
          type: data.type,
          email: data.email,
          phone: data.phone,
          address: data.address,
          defaultProductId: data.defaultProductId || null
        }
      });

      if (data.customRates && data.customRates.length > 0) {
        await tx.contactProductRate.createMany({
          data: data.customRates.map(r => ({
            contactId: newContact.id,
            productId: r.productId,
            rate: r.rate,
            vatType: r.vatType || 'EXCLUDE',
            vatRate: r.vatRate || 0
          }))
        });
      }

      return newContact;
    });
    
    if (data.type === 'CUSTOMER') revalidatePath('/contacts/customers');
    if (data.type === 'SUPPLIER') revalidatePath('/contacts/suppliers');
    
    revalidatePath('/invoices/new');
    revalidatePath('/invoices');
    
    return { success: true, contact };
  } catch (error) {
    console.error('Failed to create contact:', error);
    return { success: false, error: 'Failed to create contact' };
  }
}

export async function updateContact(id: string, data: { 
  name: string; 
  type: string; 
  email?: string; 
  phone?: string; 
  address?: string; 
  defaultProductId?: string;
  customRates?: { productId: string; rate: number; vatType?: string; vatRate?: number }[]
}) {
  try {
    const contact = await prisma.$transaction(async (tx) => {
      const updatedContact = await tx.contact.update({
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

      if (data.customRates) {
        await tx.contactProductRate.deleteMany({
          where: { contactId: id }
        });

        if (data.customRates.length > 0) {
          await tx.contactProductRate.createMany({
            data: data.customRates.map(r => ({
              contactId: id,
              productId: r.productId,
              rate: r.rate,
              vatType: r.vatType || 'EXCLUDE',
              vatRate: r.vatRate || 0
            }))
          });
        }
      }

      return updatedContact;
    });

    revalidatePath(`/contacts/${id}`);
    revalidatePath('/contacts/customers');
    revalidatePath('/contacts/suppliers');
    revalidatePath('/invoices/new');
    revalidatePath('/invoices');
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
      customRates: true,
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
export async function getContactRates(contactId: string) {
  return await prisma.contactProductRate.findMany({
    where: { contactId }
  });
}
