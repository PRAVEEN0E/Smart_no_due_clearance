// pdfService handles browser/chromium
const fs = require('fs');
const path = require('path');
const { generateVerificationQR } = require('./qrService');
const { sendHallTicketUnlockedEmail } = require('./emailService');

async function checkAndUnlock(studentId, prisma) {
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
            studentSubjects: { include: { subject: true } },
            feeRecord: true,
            createdBy: true,
            college: true
        }
    });

    if (!student) return null;

    const evaluations = await prisma.evaluation.findMany({
        where: { studentId }
    });

    const allStaffApproved = student.studentSubjects.length > 0 && student.studentSubjects.every(ss => {
        const ev = evaluations.find(e => e.subjectId === ss.subjectId);
        return ev && ev.staffApproved;
    });

    const feeCleared = student.feeRecord && (student.feeRecord.feeClearedAuto || student.feeRecord.feeClearedManual);

    if (allStaffApproved && feeCleared) {
        // let ticket = await prisma.hallTicket.findUnique({ where: { studentId } });
        // if (ticket && ticket.isUnlocked) return ticket;

        console.log(`🎫 Generating Secure Hall Ticket for ${student.name}...`);

        const verificationCode = `VAL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const qrDataUrl = await generateVerificationQR(studentId, student.email);
        const mentorSignature = student.createdBy?.signatureUrl || null;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<link href="https://fonts.googleapis.com/css2?family=Mrs+Saint+Delafield&display=swap" rel="stylesheet">

<style>

body {
    font-family: "Times New Roman", serif;
    padding: 5mm;
    margin: 0;
    background: #fff;
    color: #000;
}

.container {
    border: 1.5pt solid #000;
    padding: 15pt 20pt;
    height: 270mm;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
}

/* HEADER */
.header {
    text-align: center;
    margin-bottom: 15pt;
}

.college {
    font-size: 18pt;
    font-weight: bold;
    margin: 0;
    letter-spacing: 0.5pt;
    text-transform: uppercase;
}

.affiliation {
    font-size: 10pt;
    font-style: italic;
    margin-top: 2pt;
}

.doc-type {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 8pt;
    text-transform: uppercase;
    text-decoration: underline;
}

/* INFO */
.info-table {
    width: 100%;
    margin-top: 10pt;
    margin-bottom: 10pt;
    font-size: 11pt;
}

.info-table td {
    padding: 2pt 0;
}

.label {
    font-weight: bold;
    width: 80pt;
}

.sep {
    width: 8pt;
}

/* TABLE */
.exam-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 5pt;
}

.exam-table th {
    border-top: 1.5pt solid #000;
    border-bottom: 1pt solid #000;
    padding: 10pt 4pt;
    font-size: 10pt;
    text-align: left;
}

.exam-table td {
    padding: 8pt 4pt;
    font-size: 11pt;
    border-bottom: 0.5pt solid #eee;
}

/* QR */
.qr-section {
    position: absolute;
    top: 65pt;
    right: 25pt;
    text-align: center;
}

.qr-section img {
    width: 60pt;
    height: 60pt;
}

.qr-code-text {
    font-family: monospace;
    font-size: 7pt;
    margin-top: 2pt;
}

/* FOOTER */
.end-entries {
    text-align: center;
    margin-top: 10pt;
    font-style: italic;
    font-size: 9pt;
}

.signature-font {
    font-family: 'Mrs Saint Delafield', cursive;
    font-size: 26pt;
    color: #1a1a1a;
}

.validity-note {
    position: absolute;
    bottom: 90pt;
    left: 20pt;
    font-size: 9pt;
    font-style: italic;
}

.footer-sigs {
    position: absolute;
    bottom: 30pt;
    left: 20pt;
    right: 20pt;
    display: flex;
    justify-content: space-between;
}

.sig-item {
    width: 32%;
    text-align: center;
}

.sig-box {
    height: 45pt;
    margin-bottom: 4pt;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sig-box img {
    max-height: 45pt;
}

.sig-title {
    border-top: 1pt solid #000;
    font-size: 9pt;
    font-weight: bold;
    padding-top: 2pt;
    text-transform: uppercase;
}

</style>

</head>

<body>

<div class="container">

    <!-- HEADER -->

    <div class="header">

        <div class="college">
            ${student.college?.name || 'INSTITUTION NAME'}
        </div>

        <div class="affiliation">
            (An Autonomous Institution, affiliated to Anna University)
        </div>

        <div class="doc-type">
            HALL TICKET FOR SEMESTER EXAMINATIONS - ${new Date().toLocaleString('default', { month: 'long' }).toUpperCase()} ${new Date().getFullYear()}
        </div>

    </div>


    <!-- STUDENT INFO -->

    <table class="info-table">

        <tr>

            <td width="55%">

                <table width="100%">

                    <tr>
                        <td class="label">Programme</td>
                        <td class="sep">:</td>
                        <td class="value">
                            B.E ${student.department || 'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING'}
                        </td>
                    </tr>

                    <tr>
                        <td class="label">Reg No</td>
                        <td class="sep">:</td>
                        <td class="value">
                            ${student.email.toUpperCase()}
                        </td>
                    </tr>

                    <tr>
                        <td class="label">FN</td>
                        <td class="sep">:</td>
                        <td class="value">
                            09:30 AM - 12:30 PM
                        </td>
                    </tr>

                </table>

            </td>

            <td width="45%">

                <table width="100%">

                    <tr>
                        <td class="label">DOB</td>
                        <td class="sep">:</td>
                        <td class="value">
                            ${student.dob || '12/04/2004'}
                        </td>
                    </tr>

                    <tr>
                        <td class="label">Name</td>
                        <td class="sep">:</td>
                        <td class="value">
                            ${student.name.toUpperCase()}
                        </td>
                    </tr>

                    <tr>
                        <td class="label">AN</td>
                        <td class="sep">:</td>
                        <td class="value">
                            01:30 PM - 04:30 PM
                        </td>
                    </tr>

                </table>

            </td>

        </tr>

    </table>


    <!-- SUBJECT TABLE -->

    <table class="exam-table">

        <thead>

            <tr>

                <th width="10%">SEM</th>
                <th width="20%">COURSE CODE</th>
                <th width="45%">COURSE TITLE</th>
                <th width="25%">DATE AND SESSION</th>

            </tr>

        </thead>

        <tbody>

            ${student.studentSubjects.map((ss, index) => {
            const baseDate = new Date();
            // Generate exam dates: starting from 15 days out, every 2-3 days
            const examDates = [];
            for (let d = 0; d < 6; d++) {
                const examDate = new Date(baseDate);
                examDate.setDate(baseDate.getDate() + 15 + (d * 2));
                examDates.push(examDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
            }
            const session = (index % 2 === 0) ? 'FN' : 'AN';
            const date = examDates[index % examDates.length];

            return `
                <tr>
                    <td>4</td>
                    <td style="font-family: monospace; font-weight: bold;">${ss.subject.code}</td>
                    <td>${ss.subject.name}</td>
                    <td style="text-align: center; font-weight: bold;">${date} ${session}</td>
                </tr>`;
        }).join('')}

        </tbody>

    </table>


    <div class="end-entries">
        End of entries
    </div>


    <!-- QR -->

    <div class="qr-section">

        <img src="${qrDataUrl}" />

        <div class="qr-code-text">
            ${verificationCode}
        </div>

    </div>


    <!-- VALIDITY -->

    <div class="validity-note">

        This Hall Ticket is valid only if approved by Controller of Examinations.

    </div>


    <!-- SIGNATURES -->

    <div class="footer-sigs">

        <div class="sig-item">

            <div class="sig-box">
                <span class="signature-font">M. Arulselvan</span>
            </div>

            <div class="sig-title">
                Controller of Examinations
            </div>

        </div>


        <div class="sig-item">

            <div class="sig-box">

                ${mentorSignature ? `<img src="${mentorSignature}" />` : '<span class="signature-font">P. Velavan</span>'}

            </div>

            <div class="sig-title">
                Principal Signature
            </div>

        </div>


        <div class="sig-item">

            <div class="sig-box"></div>

            <div class="sig-title">
                Candidate Signature
            </div>

        </div>

    </div>


</div>

</body>

</html>
`;

        const { getBrowser } = require('./pdfService');
        const browser = await getBrowser();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // Save PDF locally instead of Cloudinary to bypass strict PDF delivery restrictions
        const fileName = `ticket_${studentId}_${Date.now()}.pdf`;
        const dirPath = path.join(__dirname, '../uploads/halltickets');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, pdfBuffer);
        
        const pdfUrl = `/uploads/halltickets/${fileName}`;

        const { sendNotification } = require('./notificationService');
        await sendNotification(prisma, {
            userId: studentId,
            title: 'Hall Ticket Unlocked',
            message: 'Your secure hall ticket is now ready for download!',
            type: 'SUCCESS'
        });

        // Send Email Notification with Cloudinary URL
        sendHallTicketUnlockedEmail(student.email, student.name, pdfUrl);

        return prisma.hallTicket.upsert({
            where: { studentId },
            update: { isUnlocked: true, generatedAt: new Date(), pdfUrl: pdfUrl, qrCodeData: qrDataUrl, verificationCode },
            create: { studentId, isUnlocked: true, generatedAt: new Date(), pdfUrl: pdfUrl, qrCodeData: qrDataUrl, verificationCode }
        });
    }
    return null;
}

module.exports = { checkAndUnlock };
