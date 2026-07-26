const ssrClients = new Map();

function addSSEClient(userId, client) {
    if (!ssrClients.has(userId)) ssrClients.set(userId, new Set());
    ssrClients.get(userId).add(client);
}

function removeSSEClient(userId, client) {
    const clients = ssrClients.get(userId);
    if (clients) {
        clients.delete(client);
        if (clients.size === 0) ssrClients.delete(userId);
    }
}

function broadcastToUser(userId, data) {
    const clients = ssrClients.get(userId);
    if (!clients) return;
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
        try {
            client.write(payload);
        } catch {
            clients.delete(client);
        }
    }
}

async function sendNotification(prisma, { userId, title, message, type = 'INFO' }) {
    try {
        const notification = await prisma.notification.create({
            data: { userId, title, message, type }
        });
        broadcastToUser(userId, {
            type: 'NEW_NOTIFICATION',
            notification
        });
        return notification;
    } catch (error) {
        console.error("Failed to send notification:", error);
    }
}

module.exports = { sendNotification, addSSEClient, removeSSEClient, broadcastToUser };