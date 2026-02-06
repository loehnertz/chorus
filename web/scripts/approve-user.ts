/**
 * User Approval Script
 *
 * Approve users who are pending approval
 *
 * Usage:
 *   # List all unapproved users
 *   npx tsx scripts/approve-user.ts
 *
 *   # Approve a specific user by email
 *   npx tsx scripts/approve-user.ts user@example.com
 *
 *   # Approve a specific user by ID
 *   npx tsx scripts/approve-user.ts <user-id-uuid>
 */

import { db } from '../lib/db';

async function listUnapprovedUsers() {
  const users = await db.user.findMany({
    where: { approved: false },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (users.length === 0) {
    console.log('\n✅ No users pending approval\n');
    return;
  }

  console.log('\n📋 Users pending approval:\n');
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name || 'Unknown'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}\n`);
  });

  console.log('To approve a user, run:');
  console.log('npx tsx scripts/approve-user.ts <user-id>\n');
}

async function approveUser(identifier: string) {
  try {
    // Try to find user by ID
    const user = await db.user.findUnique({
      where: { id: identifier },
    });

    if (!user) {
      console.error(`\n❌ User not found: ${identifier}\n`);
      process.exit(1);
    }

    if (user.approved) {
      console.log(`\n✅ User "${user.name}" is already approved\n`);
      return;
    }

    // Approve the user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { approved: true },
    });

    console.log(`\n✅ Successfully approved user: ${updatedUser.name}`);
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`\nThey can now sign in and access the application.\n`);
  } catch (error) {
    console.error('\n❌ Error approving user:', error);
    process.exit(1);
  }
}

async function main() {
  const identifier = process.argv[2];

  if (!identifier) {
    // No argument provided - list unapproved users
    await listUnapprovedUsers();
  } else {
    // Argument provided - approve the user
    await approveUser(identifier);
  }

  await db.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  db.$disconnect();
  process.exit(1);
});
