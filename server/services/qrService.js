const QRCode = require('qrcode');

async function generateVerificationQR(studentId, studentEmail) {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verificationUrl = `${baseUrl}/verify/hallticket/${studentId}`;
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
            margin: 2,
            scale: 8,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        return qrDataUrl;
    } catch (err) {
        console.error("QR Generation Error:", err);
        return null;
    }
}

module.exports = {
    generateVerificationQR
};
