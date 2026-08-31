const { PrismaClient } = require('@prisma/client');

const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.jplzgqrbegdyqxanpbbv:Shishir%40%23adgjl@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
    }
  }
});

const neonPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_yrb7ZoW2DOXk@ep-lively-scene-b3b7tstv-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function migrate() {
  console.log('🔄 Starting data migration from Supabase to Neon.tech...');

  try {
    // 1. Fetch data from Supabase
    console.log('📦 Fetching data from Supabase...');
    const accounts = await supabasePrisma.account.findMany();
    const products = await supabasePrisma.product.findMany();
    const contacts = await supabasePrisma.contact.findMany();
    const rates = await supabasePrisma.contactProductRate.findMany();
    const invoices = await supabasePrisma.invoice.findMany({ include: { items: true } });
    const journalEntries = await supabasePrisma.journalEntry.findMany({ include: { lines: true } });
    const settings = await supabasePrisma.companySettings.findMany();

    console.log(`Fetched from Supabase:
    - Accounts: ${accounts.length}
    - Products: ${products.length}
    - Contacts: ${contacts.length}
    - Contact Product Rates: ${rates.length}
    - Invoices: ${invoices.length}
    - Journal Entries: ${journalEntries.length}
    - Settings: ${settings.length}
    `);

    // 2. Clear existing records in Neon to avoid unique constraint conflicts
    console.log('🧹 Cleaning existing temporary data in Neon...');
    await neonPrisma.journalEntryLine.deleteMany();
    await neonPrisma.journalEntry.deleteMany();
    await neonPrisma.invoiceItem.deleteMany();
    await neonPrisma.invoice.deleteMany();
    await neonPrisma.contactProductRate.deleteMany();
    await neonPrisma.contact.deleteMany();
    await neonPrisma.product.deleteMany();
    await neonPrisma.account.deleteMany();
    await neonPrisma.companySettings.deleteMany();

    // 3. Insert into Neon in dependency order
    console.log('🚀 Migrating Company Settings...');
    for (const item of settings) {
      await neonPrisma.companySettings.create({ data: item });
    }

    console.log('🚀 Migrating Accounts...');
    for (const item of accounts) {
      await neonPrisma.account.create({ data: item });
    }

    console.log('🚀 Migrating Products...');
    for (const item of products) {
      await neonPrisma.product.create({ data: item });
    }

    console.log('🚀 Migrating Contacts...');
    for (const item of contacts) {
      await neonPrisma.contact.create({ data: item });
    }

    console.log('🚀 Migrating Contact Product Rates...');
    for (const item of rates) {
      await neonPrisma.contactProductRate.create({ data: item });
    }

    console.log('🚀 Migrating Invoices & Invoice Items...');
    for (const inv of invoices) {
      const { items, ...invData } = inv;
      await neonPrisma.invoice.create({
        data: {
          ...invData,
          items: {
            create: items.map(({ id, invoiceId, ...itemData }) => ({
              ...itemData,
              id
            }))
          }
        }
      });
    }

    console.log('🚀 Migrating Journal Entries & Lines...');
    for (const entry of journalEntries) {
      const { lines, ...entryData } = entry;
      await neonPrisma.journalEntry.create({
        data: {
          ...entryData,
          lines: {
            create: lines.map(({ id, journalEntryId, ...lineData }) => ({
              ...lineData,
              id
            }))
          }
        }
      });
    }

    console.log('🎉 MIGRATION SUCCESSFUL! All data has been transferred to Neon.tech!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await supabasePrisma.$disconnect();
    await neonPrisma.$disconnect();
  }
}

migrate();
