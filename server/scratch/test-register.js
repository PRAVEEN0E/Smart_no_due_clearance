const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function testRegister() {
  const name = 'Test Mentor';
  const email = 'test_mentor_' + Date.now() + '@gmail.com';
  const password = 'Password@123';
  const collegeName = 'Test College';
  const department = 'AIML';

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const college = await tx.college.create({
      data: {
        name: collegeName,
        domain: email.split('@')[1]
      }
    });

    const mentor = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'MENTOR',
        collegeId: college.id,
        department: department || null
      }
    });
    return { mentor, college };
  });

  console.log('Successfully registered:', JSON.stringify(result, null, 2));

  // Clean up
  await prisma.user.delete({ where: { id: result.mentor.id } });
  await prisma.college.delete({ where: { id: result.college.id } });
  console.log('Successfully cleaned up.');
}

testRegister()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
