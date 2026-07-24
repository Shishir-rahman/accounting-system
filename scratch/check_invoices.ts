import prisma from '../src/lib/prisma';

async function main() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      contact: true
    }
  });

  console.log('Recent Invoices:');
  invoices.forEach(inv => {
    console.log(`- ID: ${inv.id}, Number: ${inv.invoiceNumber}, Contact: ${inv.contact.name}, Status: ${inv.status}, CreatedAt: ${inv.createdAt}`);
  });
}

main().catch(console.error);
