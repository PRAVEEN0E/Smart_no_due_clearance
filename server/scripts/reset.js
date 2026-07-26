require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

const SEED_SCRIPT = path.join(__dirname, 'seed.js');

async function main() {
  const args = process.argv.slice(2);
  const shouldSeed = args.includes('--seed');
  const force = args.includes('--force');

  if (!force) {
    console.log('WARNING: This will DELETE ALL data in the database.');
    console.log('Use --force to skip this confirmation.\n');
    // Simpler than readline — use env or just force requirement
    process.exit(1);
  }

  console.log('Resetting database...');

  // Delete in dependency order (children before parents)
  const tables = [
    'exam_attendance',
    'material',
    'assignment',
    'hall_ticket',
    'fee_record',
    'notification',
    'evaluation',
    'student_subject',
    'staff_subject',
    'announcement',
    'audit_log',
    'custom_role',
    'user',
    'subject',
    'college',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    console.log(`  ✓ Cleared ${table}`);
  }

  console.log('✓ All tables cleared.\n');

  if (shouldSeed) {
    console.log('Running seed script...\n');
    execSync(`node "${SEED_SCRIPT}"`, { stdio: 'inherit' });
  }

  console.log('✓ Reset complete.');
}

main()
  .catch((e) => {
    console.error('Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
