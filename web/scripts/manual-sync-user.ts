/**
 * Manual User Sync Script
 *
 * Use this if user sync is failing and you need to manually create
 * a User record in the app database from a Neon Auth user.
 *
 * Usage:
 *   npx tsx scripts/manual-sync-user.ts <email>
 *
 * This will:
 * 1. Look up the user in Neon Auth
 * 2. Create a corresponding User record in the app database
 * 3. Set approved=true (since you're manually adding them)
 */

// CRITICAL: Load environment variables BEFORE any imports
import { config } from 'dotenv';
config({ path: '.env.development.local' });

import { db } from '../lib/db';

async function manualSyncUser(email: string) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    // Limit email length
    if (email.length > 255) {
      console.error('❌ Email too long (max 255 characters)');
      process.exit(1);
    }

    // Disable in production
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ This script is disabled in production for security reasons');
      console.error('   Please use the Neon Console to manage users in production');
      process.exit(1);
    }

    console.log(`\nLooking for Neon Auth user with email: ${email}...`);

    // Query the neon_auth.user table directly
    const neonAuthUser = await db.$queryRaw<Array<{
      id: string;
      email: string;
      name: string;
      image: string | null;
    }>>`
      SELECT id, email, name, image
      FROM neon_auth.user
      WHERE email = ${email}
    `;

    if (!neonAuthUser || neonAuthUser.length === 0) {
      console.error(`\n❌ No user found in Neon Auth with email: ${email}`);
      console.log('Make sure you signed up first!\n');
      process.exit(1);
    }

    const authUser = neonAuthUser[0];
    console.log(`✓ Found Neon Auth user: ${authUser.name} (${authUser.id})`);

    // Check if User record already exists in app database
    const existingUser = await db.user.findUnique({
      where: { id: authUser.id },
    });

    if (existingUser) {
      console.log(`\n⚠️  User record already exists in app database`);
      console.log(`   Approved: ${existingUser.approved}`);

      if (!existingUser.approved) {
        console.log(`\n   Updating to approved=true...`);
        await db.user.update({
          where: { id: authUser.id },
          data: { approved: true },
        });
        console.log(`✓ User approved!`);
      }

      console.log(`\nYou can now sign in and access the dashboard.\n`);
      return;
    }

    // Create User record in app database
    console.log(`\nCreating User record in app database...`);
    const user = await db.user.create({
      data: {
        id: authUser.id,
        name: authUser.name,
        image: authUser.image,
        approved: true, // Auto-approve since this is manual
      },
    });

    console.log(`\n✅ User created and approved!`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Approved: ${user.approved}`);
    console.log(`\nYou can now sign in and access the dashboard.\n`);

  } catch (error) {
    console.error('\n❌ Error syncing user:', error);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.log('\nUsage: npx tsx scripts/manual-sync-user.ts <email>\n');
  console.log('Example: npx tsx scripts/manual-sync-user.ts user@example.com\n');
  process.exit(1);
}

manualSyncUser(email)
  .then(() => db.$disconnect())
  .catch((error) => {
    console.error(error);
    db.$disconnect();
    process.exit(1);
  });
