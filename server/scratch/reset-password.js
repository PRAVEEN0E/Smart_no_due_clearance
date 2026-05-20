const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'pe9727179@gmail.com';
  const plainPassword = 'password123';
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const updatedUser = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { passwordHash }
  });

  console.log(`Successfully reset password for ${updatedUser.email} (${updatedUser.name}) to: ${plainPassword}`);
}

main()
  .catch(e => console.error('Error resetting password:', e))
  .finally(() => prisma.$disconnect());
