import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const customerNames = [
  'Tradesworth Household Limited',
  'M. Ahmed Tea & Lands Company Limited',
  'Muazuddin Steel Industries Limited',
  'Heidelberg Cement Bangladesh Ltd.',
  'Family Crafts',
  'Kai International',
  'Orient Machineries',
  'Amin Square (BD) Ltd.',
  'S. Hoque International',
  'Celestial Tech Ltd.',
  'Barakah Bites Ltd.',
  'TRUST INFINITY FIRMS BANGLADESH',
  'BD Star Agro Foods',
  'Popy Library',
  'Winpower Group',
  'Zinix Incoporation',
  'Systech Digital Limited',
  'Fair Food & Lifestyle',
  'BEOL',
  'Monno Medical College & Hospital',
  'Brac Dairy & Food Project',
  'Chittagong Feed Ltd.',
  'Paragon Agro Ltd.',
  'Ispahani Tea Limited',
  'Chef Food Industries Ltd',
  'Lal Teer Seed Limited',
  'Olympic Milk Food Packaging Inds. (Pvt.) Ltd',
  'Supreme Ifad Consumer Bangladesh Pvt Ltd.',
  'Temakaw Fashion Limited',
  'General Engineers Ltd.',
  'Ahmed Food Products (Pvt.) Ltd.',
  'KITTY INDUSTRIES LTD.',
  'Perfume Chemical Industries PLC.',
  'Romania Food & Beverage Ltd.',
  'Smile Food Products Limited',
  'Paragon Poultry Ltd.',
  'Paragon Dairy',
  'Linkage',
  'Rangpur Dairy',
  'R.B. Agro Food Industries',
  'Astro Engineering Ltd.',
  'MinMax Consumer Care',
  'Rahul Group'
];

async function main() {
  console.log('Seeding customers into database...');
  let count = 0;
  for (const name of customerNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const existing = await prisma.contact.findFirst({
      where: { name: trimmed, type: 'CUSTOMER' }
    });
    if (!existing) {
      await prisma.contact.create({
        data: {
          name: trimmed,
          type: 'CUSTOMER',
          email: `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
        }
      });
      count++;
    }
  }
  const total = await prisma.contact.count({ where: { type: 'CUSTOMER' } });
  console.log(`Seeding complete: Created ${count} new customers. Total customers: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
