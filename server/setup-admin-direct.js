const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function bootstrap() {
    try {
        console.log("🚀 Bootstrapping Admin Account...");

        const passwordHash = await bcrypt.hash('Admin@123', 12);

        const user = await prisma.user.upsert({
            where: { email: 'admin@college.edu' },
            update: { passwordHash },
            create: {
                name: 'System Admin',
                email: 'admin@college.edu',
                passwordHash,
                role: 'MENTOR'
            }
        });

        console.log("✅ Admin account created/updated successfully!");
        console.log("Email: admin@college.edu");
        console.log("Password: Admin@123");
    } catch (e) {
        console.error("❌ Error during bootstrap:", e);
    } finally {
        await prisma.$disconnect();
    }
}

bootstrap();
