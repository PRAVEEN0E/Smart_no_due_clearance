require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

async function main() {
  console.log('Seeding database...\n');

  const hash = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

  // 1. Create College
  const college = await prisma.college.create({
    data: {
      name: 'NoDueNest College',
    },
  });
  console.log(`✓ College created: ${college.name} (${college.id})`);

  // 2. Create SUPERADMIN user
  const superadmin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@college.edu',
      passwordHash: await hash('Admin@123'),
      role: 'SUPERADMIN',
      collegeId: college.id,
    },
  });
  console.log(`✓ SUPERADMIN created: ${superadmin.email} (${superadmin.id})`);

  // 3. Create MENTOR user
  const mentor = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@college.edu',
      passwordHash: await hash('Mentor@123'),
      role: 'MENTOR',
      collegeId: college.id,
      department: 'CSE',
    },
  });
  console.log(`✓ MENTOR created: ${mentor.email} (${mentor.id})`);

  // 4. Create STAFF user
  const staff = await prisma.user.create({
    data: {
      name: 'Prof. Priya Sharma',
      email: 'priya.sharma@college.edu',
      passwordHash: await hash('Staff@123'),
      role: 'STAFF',
      collegeId: college.id,
      department: 'CSE',
    },
  });
  console.log(`✓ STAFF created: ${staff.email} (${staff.id})`);

  // 5. Create 3 Subjects
  const subjectsData = [
    { name: 'Data Structures', code: 'CS201', type: 'THEORY_WITH_LAB' },
    { name: 'Database Management Systems', code: 'CS202', type: 'FULL_THEORY' },
    { name: 'Web Technologies Lab', code: 'CS281', type: 'FULL_LAB' },
  ];

  const subjects = [];
  for (const sub of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        ...sub,
        collegeId: college.id,
        createdById: superadmin.id,
      },
    });
    subjects.push(subject);
    console.log(`✓ Subject created: ${subject.name} (${subject.code})`);
  }

  // 6. Assign staff to all 3 subjects
  for (const subject of subjects) {
    await prisma.staffSubject.create({
      data: {
        staffId: staff.id,
        subjectId: subject.id,
      },
    });
  }
  console.log(`✓ Staff assigned to ${subjects.length} subjects`);

  // 7. Create STUDENT user
  const student = await prisma.user.create({
    data: {
      name: 'Arjun Mehta',
      email: 'arjun.mehta@college.edu',
      passwordHash: await hash('Student@123'),
      role: 'STUDENT',
      collegeId: college.id,
      department: 'CSE',
      className: 'III Year CSE - A',
      registerNumber: '2021CS001',
    },
  });
  console.log(`✓ STUDENT created: ${student.email} (${student.id})`);

  // 8. Assign student to subjects
  for (const subject of subjects) {
    await prisma.studentSubject.create({
      data: {
        studentId: student.id,
        subjectId: subject.id,
      },
    });
  }
  console.log(`✓ Student assigned to ${subjects.length} subjects`);

  console.log('\n✓ Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
