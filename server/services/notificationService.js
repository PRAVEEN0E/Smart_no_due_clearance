async function sendNotification(prisma, { userId, title, message, type = 'INFO' }) {
    try {
        const notification = await prisma.notification.create({
            data: { userId, title, message, type }
        });

        return notification;
    } catch (error) {
        console.error("Failed to send notification:", error);
    }
}

module.exports = { sendNotification };
