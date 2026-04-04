async function logAction(prisma, { action, details, userId, userEmail, collegeId }) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                details: typeof details === 'object' ? JSON.stringify(details) : details,
                userId,
                userEmail,
                collegeId
            }
        });
    } catch (err) {
        console.error("Audit Logging Failed:", err);
    }
}

module.exports = { logAction };
