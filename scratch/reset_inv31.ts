import prisma from '../src/lib/prisma';

async function main() {
  const inv = await prisma.invoice.update({
    where: { invoiceNumber: 'INV-2026-0031' },
    data: { status: 'DRAFT' }
  });
  console.log('Invoice INV-2026-0031 status reset to DRAFT');
}

main().catch(console.error);
