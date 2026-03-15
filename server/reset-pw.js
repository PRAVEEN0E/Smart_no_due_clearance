const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.update({
        where: { email: 'praveenkumarsj7@gmail.com' },
        data: { password: hashedPassword }
    });
    console.log("Password updated to password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
