import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed peak seasons
  await prisma.peakSeason.createMany({
    data: [
      {
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-04-15'),
        surcharge: 15000,
        label: 'Spring 2026 繁忙期',
        isActive: true,
      },
      {
        startDate: new Date('2027-02-01'),
        endDate: new Date('2027-04-15'),
        surcharge: 15000,
        label: 'Spring 2027 繁忙期',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // Seed recycle partners
  await prisma.recyclePartner.createMany({
    data: [
      {
        name: 'Hard Off',
        website: 'https://www.hardoff.co.jp',
        locations: ['Tokyo', 'Kanagawa', 'Osaka', 'Aichi'],
        commissionPct: 0.15,
      },
      {
        name: 'Eco Ring',
        website: 'https://www.eco-ring.com',
        locations: ['Tokyo', 'Osaka', 'Fukuoka'],
        commissionPct: 0.12,
      },
      {
        name: 'Book Off',
        website: 'https://www.bookoff.co.jp',
        locations: ['Tokyo', 'Kanagawa', 'Osaka', 'Aichi', 'Fukuoka'],
        commissionPct: 0.10,
      },
    ],
    skipDuplicates: true,
  });

  // Seed sample partners (moving companies)
  await prisma.partner.createMany({
    data: [
      {
        name: 'Tanaka Hikkoshi',
        companyName: '田中引越センター',
        email: 'tanaka@example.com',
        phone: '03-1234-5678',
        prefecture: ['Tokyo', 'Kanagawa', 'Saitama'],
        cities: ['Shinjuku', 'Shibuya', 'Machida', 'Yokohama'],
        maxDistanceKm: 50,
        truckCount: 5,
        rating: 4.8,
        contractRate: 35000,
      },
      {
        name: 'Fast Move Tokyo',
        companyName: 'ファストムーブ東京',
        email: 'fastmove@example.com',
        phone: '03-9876-5432',
        prefecture: ['Tokyo', 'Chiba'],
        cities: ['Shibuya', 'Meguro', 'Setagaya', 'Chiba'],
        maxDistanceKm: 40,
        truckCount: 3,
        rating: 4.6,
        contractRate: 32000,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
