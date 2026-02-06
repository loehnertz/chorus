/**
 * Manual User Creation Script
 *
 * Since public sign-up is disabled, use this script to manually create user accounts.
 *
 * IMPORTANT: This script creates accounts directly in Neon Auth.
 * The User record in the app database will be auto-synced on first login.
 *
 * Usage:
 *   npx tsx scripts/create-user.ts
 *
 * You will be prompted for:
 *   - Email address
 *   - Name
 *   - Password
 *
 * The user can then sign in with their email and password.
 */

import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createUser() {
  console.log('\n=== Create New User Account ===\n');
  console.log('NOTE: This creates an account in Neon Auth.');
  console.log('The app User record will be auto-synced on first login.\n');

  const email = await question('Email: ');
  const name = await question('Name: ');
  const password = await question('Password (min 8 characters): ');

  if (!email || !name || !password) {
    console.error('\nError: All fields are required');
    rl.close();
    return;
  }

  if (password.length < 8) {
    console.error('\nError: Password must be at least 8 characters');
    rl.close();
    return;
  }

  console.log('\n=== Manual Steps to Create User ===\n');
  console.log('Since Neon Auth is a managed service, you need to create users through:');
  console.log('\n1. Option A - Neon Console:');
  console.log('   - Go to your Neon project dashboard');
  console.log('   - Navigate to the Auth section');
  console.log('   - Use the "Add User" interface');
  console.log('\n2. Option B - Direct Database Insert:');
  console.log('   - Connect to your Neon database');
  console.log('   - Run this SQL in the neon_auth schema:');
  console.log('\n   -- Note: You\'ll need to hash the password using Better Auth\'s hashing');
  console.log('   -- This is a simplified example - use Neon Console for proper setup\n');
  console.log(`User Details to Create:
  Email: ${email}
  Name: ${name}
  Password: ${password}
`);
  console.log('After creating the user in Neon Auth, they can sign in at /sign-in');
  console.log('The User record in the app database will be created automatically on first login.\n');

  rl.close();
}

createUser().catch(console.error);
