const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Setting up Test Branding ---');
    
    // 1. Create or Update a Test College
    const college = await prisma.college.upsert({
        where: { domain: 'mit' },
        update: {
            name: 'MIT Institute of Technology',
            primaryColor: '#dc2626', // Vibrant Red
            logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/44/MIT_Seal.svg',
        },
        create: {
            name: 'MIT Institute of Technology',
            domain: 'mit',
            primaryColor: '#dc2626',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/44/MIT_Seal.svg',
        },
    });

    // 2. Find a test student and assign them to this college
    const student = await prisma.user.findFirst({
        where: { role: 'STUDENT' }
    });

    if (student) {
        await prisma.user.update({
            where: { id: student.id },
            data: { collegeId: college.id }
        });
        console.log(`Success: Updated student ${student.email} to MIT branding!`);
    }

    console.log(`College: ${college.name}`);
    console.log(`Subdomain: ${college.domain}`);
    console.log(`Color: ${college.primaryColor}`);
    console.log('--- Test Setup Complete ---');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
