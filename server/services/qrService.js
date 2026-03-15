const QRCode = require('qrcode');

async function generateVerificationQR(hallTicketId, studentEmail) {
    try {
        const verificationUrl = `http://localhost:5173/verify/hallticket/${hallTicketId}`;
        const qrDataUrl = await QRCode.toDataURL(verificationUrl);
        return qrDataUrl;
    } catch (err) {
        console.error("QR Generation Error:", err);
        return null;
    }
}

module.exports = {
    generateVerificationQR
};
