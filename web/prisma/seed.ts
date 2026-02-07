import { PrismaClient, Frequency } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const SAMPLE_CHORES: { title: string; frequency: Frequency; description?: string }[] = [
  // Daily (5)
  { title: 'Wash dishes', frequency: 'DAILY', description: 'Hand-wash or load dishwasher' },
  { title: 'Wipe kitchen counters', frequency: 'DAILY' },
  { title: 'Take out trash', frequency: 'DAILY' },
  { title: 'Make the bed', frequency: 'DAILY' },
  { title: 'Tidy living room', frequency: 'DAILY', description: 'Pick up clutter, fluff pillows' },

  // Weekly (5)
  { title: 'Vacuum floors', frequency: 'WEEKLY', description: 'All rooms including under furniture' },
  { title: 'Mop kitchen floor', frequency: 'WEEKLY' },
  { title: 'Clean bathroom', frequency: 'WEEKLY', description: 'Toilet, sink, shower, mirror' },
  { title: 'Do laundry', frequency: 'WEEKLY', description: 'Wash, dry, fold, and put away' },
  { title: 'Water plants', frequency: 'WEEKLY' },

  // Bi-weekly (2)
  { title: 'Clean out car', frequency: 'BIWEEKLY', description: 'Remove trash, vacuum seats' },
  { title: 'Wipe down appliances', frequency: 'BIWEEKLY' },

  // Monthly (4)
  { title: 'Deep clean fridge', frequency: 'MONTHLY', description: 'Remove expired items, wipe shelves' },
  { title: 'Clean windows', frequency: 'MONTHLY' },
  { title: 'Dust ceiling fans', frequency: 'MONTHLY' },
  { title: 'Organize pantry', frequency: 'MONTHLY', description: 'Check expiration dates, reorganize' },

  // Bi-monthly (2)
  { title: 'Deep clean bathroom tiles', frequency: 'BIMONTHLY', description: 'Scrub grout and reseal' },
  { title: 'Rotate seasonal clothes', frequency: 'BIMONTHLY' },

  // Semi-annual (2)
  { title: 'Service HVAC system', frequency: 'SEMIANNUAL', description: 'Change filters, check ducts' },
  { title: 'Deep clean carpets', frequency: 'SEMIANNUAL', description: 'Steam clean all carpeted rooms' },

  // Yearly (3)
  { title: 'Deep clean oven', frequency: 'YEARLY', description: 'Full interior cleaning cycle' },
  { title: 'Clean gutters', frequency: 'YEARLY' },
  { title: 'Flip/rotate mattresses', frequency: 'YEARLY' },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data (preserve users)
  console.log('Clearing existing data...');
  await prisma.choreCompletion.deleteMany();
  await prisma.choreAssignment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.chore.deleteMany();

  // Create chores
  console.log('Creating sample chores...');
  const chores = await Promise.all(
    SAMPLE_CHORES.map((chore) =>
      prisma.chore.create({
        data: {
          title: chore.title,
          frequency: chore.frequency,
          description: chore.description ?? null,
        },
      }),
    ),
  );
  console.log(`Created ${chores.length} chores`);

  // If users exist, create sample assignments and completions
  const users = await prisma.user.findMany({ where: { approved: true } });

  if (users.length > 0) {
    console.log(`Found ${users.length} approved user(s), creating assignments and completions...`);

    // Assign some chores to users (round-robin)
    const assignments = [];
    for (let i = 0; i < chores.length; i++) {
      const user = users[i % users.length];
      assignments.push(
        prisma.choreAssignment.create({
          data: {
            choreId: chores[i].id,
            userId: user.id,
          },
        }),
      );
    }
    await Promise.all(assignments);
    console.log(`Created ${assignments.length} assignments`);

    // Create some sample completions (last 7 days)
    const completions = [];
    const now = new Date();
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);

      // Complete 2-3 random chores per day
      const shuffled = [...chores].sort(() => Math.random() - 0.5);
      const count = 2 + Math.floor(Math.random() * 2);

      for (let j = 0; j < count && j < shuffled.length; j++) {
        const user = users[Math.floor(Math.random() * users.length)];
        completions.push(
          prisma.choreCompletion.create({
            data: {
              choreId: shuffled[j].id,
              userId: user.id,
              completedAt: date,
            },
          }),
        );
      }
    }
    await Promise.all(completions);
    console.log(`Created ${completions.length} completions`);
  } else {
    console.log('No approved users found, skipping assignments and completions');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
