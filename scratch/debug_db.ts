import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const beol = await prisma.contact.findFirst({
    where: { name: 'BEOL' },
    include: { customRates: true }
  });
  
  console.log('BEOL Contact:', JSON.stringify(beol, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
