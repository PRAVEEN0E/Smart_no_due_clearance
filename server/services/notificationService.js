async function sendNotification(prisma, { userId, title, message, type = 'INFO', io }) {
    try {
        const notification = await prisma.notification.create({
            data: { userId, title, message, type }
        });

        if (io) {
            io.to(userId).emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        console.error("Failed to send notification:", error);
    }
}

module.exports = { sendNotification };
