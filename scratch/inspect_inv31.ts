import prisma from '../src/lib/prisma';

async function main() {
  const inv = await prisma.invoice.findUnique({
    where: { invoiceNumber: 'INV-2026-0031' },
    include: { contact: true, items: { include: { product: true } } }
  });
  console.log('Invoice details:', JSON.stringify(inv, null, 2));
}

main().catch(console.error);
