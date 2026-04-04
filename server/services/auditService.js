async function logAction(prisma, { action, details, userId, userEmail }) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                details: typeof details === 'object' ? JSON.stringify(details) : details,
                userId,
                userEmail
            }
        });
    } catch (err) {
        console.error("Audit Logging Failed:", err);
    }
}

module.exports = { logAction };
