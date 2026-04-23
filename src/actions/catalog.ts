'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createProduct(data: { name: string; type: string; price: number; description?: string }) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        type: data.type, // 'PRODUCT' or 'SERVICE'
        price: data.price,
        description: data.description,
      }
    });
    revalidatePath('/products');
    return { success: true, product };
  } catch (error) {
    console.error('Failed to create product:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProduct(id: string, data: { name: string; type: string; price: number; description?: string }) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        description: data.description
      }
    });
    revalidatePath('/products');
    return { success: true, product };
  } catch (error) {
    console.error('Failed to update product:', error);
    return { success: false, error: 'Failed to update product' };
  }
}
