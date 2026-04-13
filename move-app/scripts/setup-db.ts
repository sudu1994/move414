#!/usr/bin/env tsx
/**
 * MOVE — Database setup script
 * Run: npx tsx scripts/setup-db.ts
 */
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up MOVE database...\n');

  // 1. Generate Prisma client
  console.log('1/4 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 2. Push schema
  console.log('\n2/4 Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  // 3. Seed
  console.log('\n3/4 Seeding initial data...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

  // 4. Verify
  console.log('\n4/4 Verifying...');
  const userCount    = await prisma.user.count();
  const partnerCount = await prisma.partner.count();
  const peakCount    = await prisma.peakSeason.count();
  const recycleCount = await prisma.recyclePartner.count();

  console.log('\n✅ Database ready:');
  console.log(`   Users:           ${userCount}`);
  console.log(`   Partners:        ${partnerCount}`);
  console.log(`   Peak seasons:    ${peakCount}`);
  console.log(`   Recycle shops:   ${recycleCount}`);
  console.log('\nRun: npm run dev\n');
}

main()
  .catch((e) => { console.error('❌ Setup failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
