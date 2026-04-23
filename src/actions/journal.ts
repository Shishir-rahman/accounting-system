'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const defaultChartOfAccounts = [
  { code: '1000', name: 'Cash', type: 'ASSET', description: 'Petty Cash', isSystem: true },
  { code: '1010', name: 'Bank', type: 'ASSET', description: 'Main Bank Account', isSystem: true },
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to suppliers', isSystem: true },
  { code: '3000', name: 'Owner Equity', type: 'EQUITY', description: 'Owner investments and drawings', isSystem: true },
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', description: 'Income from sales', isSystem: true },
  { code: '4010', name: 'Service Revenue', type: 'REVENUE', description: 'Income from services', isSystem: true },
  { code: '5000', name: 'Office Rent', type: 'EXPENSE', description: 'Rent for office space', isSystem: true },
  { code: '5010', name: 'Salary Expense', type: 'EXPENSE', description: 'Employee salaries', isSystem: true },
  { code: '5020', name: 'Utilities', type: 'EXPENSE', description: 'Electricity, water, etc.', isSystem: true },
  { code: '5030', name: 'VAT Paid', type: 'EXPENSE', description: 'Value Added Tax paid', isSystem: true },
  { code: '5040', name: 'TAX Paid', type: 'EXPENSE', description: 'Income Tax paid', isSystem: true }
];

const defaultContacts = [
  { name: 'Walk-in Customer', type: 'CUSTOMER' },
  { name: 'Office Supply Co.', type: 'SUPPLIER' },
];

export async function setupChartOfAccounts() {
  const count = await prisma.account.count();
  if (count === 0) {
    for (const acc of defaultChartOfAccounts) {
      await prisma.account.create({ data: acc });
    }
  }

  const contactCount = await prisma.contact.count();
  if (contactCount === 0) {
    for (const contact of defaultContacts) {
      await prisma.contact.create({ data: contact });
    }
  }
}

export async function getAccounts() {
  return await prisma.account.findMany({
    orderBy: { code: 'asc' }
  });
}

export async function createAccount(data: { code: string; name: string; type: string; description?: string }) {
  try {
    const existing = await prisma.account.findUnique({ where: { code: data.code } });
    if (existing) return { success: false, error: 'Account code already exists' };

    const account = await prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
        isSystem: false
      }
    });
    return { success: true, account };
  } catch (error) {
    console.error('Failed to create account:', error);
    return { success: false, error: 'Failed to create account' };
  }
}

export async function getContacts() {
  return await prisma.contact.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createJournalEntry(data: {
  date: string;
  description: string;
  reference?: string;
  lines: { accountId: string; debit: number; credit: number; description?: string; contactId?: string }[];
}) {
  try {
    // Clean up empty lines
    const validLines = data.lines.filter(line => line.accountId && (line.debit > 0 || line.credit > 0));

    if (validLines.length < 2) {
      return { success: false, error: 'A journal entry must have at least two lines.' };
    }

    const totalDebit = validLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = validLines.reduce((sum, line) => sum + line.credit, 0);

    // Using a small epsilon to account for floating point inaccuracies
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return { success: false, error: `Debits (${totalDebit}) and Credits (${totalCredit}) must balance.` };
    }

    if (totalDebit === 0) {
      return { success: false, error: 'Journal entry must have a non-zero value' };
    }

    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date(data.date),
        description: data.description,
        reference: data.reference,
        lines: {
          create: validLines.map(line => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description || null,
            contactId: line.contactId || null
          }))
        }
      }
    });

    revalidatePath('/journal');
    revalidatePath('/ledgers');
    revalidatePath('/');
    return { success: true, entry };
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    return { success: false, error: 'Failed to save to database' };
  }
}

export async function getJournalEntries() {
  return await prisma.journalEntry.findMany({
    include: {
      lines: {
        include: { account: true, contact: true }
      }
    },
    orderBy: { date: 'desc' }
  });
}

export async function getSummaryData() {
  // Aggregate data from Journal lines for Dashboard
  const accounts = await prisma.account.findMany();
  const lines = await prisma.journalEntryLine.findMany({
    include: { account: true }
  });

  let totalBank = 0;
  let totalCash = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  lines.forEach(line => {
    const accType = line.account.type;
    const accName = line.account.name;

    // Assets increase with Debit, decrease with Credit
    if (accType === 'ASSET') {
      const net = line.debit - line.credit;
      if (accName === 'Bank') totalBank += net;
      if (accName === 'Cash') totalCash += net;
    }
    
    // Revenue increases with Credit, decreases with Debit
    if (accType === 'REVENUE') {
      totalIncome += (line.credit - line.debit);
    }

    // Expense increases with Debit, decreases with Credit
    if (accType === 'EXPENSE') {
      totalExpense += (line.debit - line.credit);
    }
  });

  return {
    totalBank,
    totalCash,
    totalBalance: totalBank + totalCash,
    totalIncome,
    totalExpense,
    netIncome: totalIncome - totalExpense
  };
}

export async function getLedgerLines(accountId: string) {
  if (!accountId) return [];
  
  return await prisma.journalEntryLine.findMany({
    where: { accountId },
    include: {
      journalEntry: true,
      contact: true
    },
    orderBy: {
      journalEntry: { date: 'asc' }
    }
  });
}
