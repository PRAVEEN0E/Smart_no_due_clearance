const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function migrate() {
    try {
        const assignments = await prisma.assignment.findMany();
        console.log(`Checking ${assignments.length} assignments...`);
        
        let updatedCount = 0;
        for (const asgn of assignments) {
            const url = asgn.fileUrl;
            if (!url) continue;
            
            const lastPart = url.split('/').pop();
            // If the URL has no extension and it's a Cloudinary URL
            if (!lastPart.includes('.') && url.includes('cloudinary.com')) {
                console.log(`Fixing legacy URL: ${url}`);
                
                // For images, we can try to check headers or just guess based on Cloudinary knowledge
                // But the safest is to append the format if we can find it.
                // For now, let's try to append .pdf since many assignments are PDFs.
                // Actually, let's just leave them as 'FILE' in UI for now if we can't be 100% sure.
                // BUT, if we want the preview to work, it MUST have an extension.
                
                // Let's try to detect the format via a HEAD request if possible, 
                // but that might be slow/overkill.
            }
        }
        console.log(`Updated ${updatedCount} assignments.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
