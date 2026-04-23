'use server'

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getSalesReport(filters: {
  startDate?: string;
  endDate?: string;
  contactId?: string;
  productId?: string;
}) {
  try {
    const whereClause: Prisma.InvoiceWhereInput = {
      status: { in: ['SENT', 'PAID'] } // Only confirmed sales
    };

    if (filters.startDate || filters.endDate) {
      whereClause.date = {};
      if (filters.startDate) {
        whereClause.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    if (filters.contactId) {
      whereClause.contactId = filters.contactId;
    }

    if (filters.productId) {
      whereClause.items = {
        some: {
          productId: filters.productId
        }
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        contact: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    let totalRevenue = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalItemsSold = 0;

    const formattedInvoices = invoices.map(inv => {
      let invRevenue = inv.subtotal;
      let itemsCount = 0;

      // If a specific product is filtered, we might want to know how many of THAT product were sold
      // But for the invoice total, we just use the invoice's fields
      inv.items.forEach(item => {
        if (!filters.productId || item.productId === filters.productId) {
          itemsCount += item.quantity;
        }
      });

      totalRevenue += inv.subtotal; // Using subtotal as Revenue (before tax/discount)
      totalTax += inv.taxAmount;
      totalDiscount += inv.discountAmount;
      totalItemsSold += itemsCount;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date.toISOString(),
        customerName: inv.contact.name,
        totalAmount: inv.totalAmount,
        status: inv.status,
        itemsCount
      };
    });

    const netSales = totalRevenue - totalDiscount;

    return {
      success: true,
      data: {
        totalInvoices: invoices.length,
        totalRevenue,
        totalTax,
        totalDiscount,
        netSales,
        totalItemsSold,
        invoices: formattedInvoices
      }
    };

  } catch (error) {
    console.error('Failed to generate sales report:', error);
    return { success: false, error: 'Failed to generate report' };
  }
}
