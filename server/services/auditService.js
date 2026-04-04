async function logAction(prisma, { action, details, userId, userEmail, method, url, statusCode }) {
    try {
        const logData = {
            action,
            userId: userId || 'SYSTEM',
            userEmail: userEmail || 'system@internal',
            details: JSON.stringify({
                method,
                url,
                statusCode,
                params: details?.params,
                body: details?.body ? filterSensitiveData(details.body) : undefined,
                result: details?.result
            })
        };

        await prisma.auditLog.create({ data: logData });
    } catch (err) {
        console.error("Audit Logging Failed:", err);
    }
}

function filterSensitiveData(body) {
    const sensitiveFields = ['password', 'token', 'secret', 'passwordHash'];
    const filtered = { ...body };
    sensitiveFields.forEach(field => {
        if (field in filtered) filtered[field] = '********';
    });
    return filtered;
}

module.exports = { logAction };
