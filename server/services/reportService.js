// pdfService handles browser launching

async function generateMarksPDF(subjectName, evaluations, staffName) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #020c0c; margin: 0; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 12px 8px; border: 1px solid #e2e8f0; }
            td { padding: 10px 8px; border: 1px solid #e2e8f0; }
            .total { font-weight: bold; color: #10b981; }
            .status-approved { color: #059669; font-weight: bold; }
            .status-pending { color: #dc2626; font-weight: bold; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
            .sig-box { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; margin-top: 40px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="title">Internal Marks Report</h1>
            <p class="subtitle">Subject: ${subjectName} | Generated on: ${new Date().toLocaleDateString()}</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Reg No / Email</th>
                    <th>Student Name</th>
                    <th>CAT 1</th>
                    <th>CAT 2</th>
                    <th>CAT 3</th>
                    <th>Attendance</th>
                    <th>Internal Total</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${evaluations.map(e => `
                    <tr>
                        <td>${e.student.email}</td>
                        <td>${e.student.name}</td>
                        <td>${e.cat1 || 0}</td>
                        <td>${e.cat2 || 0}</td>
                        <td>${e.cat3 || 0}</td>
                        <td>${e.attendancePercent || 0}%</td>
                        <td class="total">${e.internalMarksTotal || 0}/40</td>
                        <td class="${e.staffApproved ? 'status-approved' : 'status-pending'}">
                            ${e.staffApproved ? 'Approved' : 'Pending'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            <div class="sig-box">
                Academic Coordinator
            </div>
            <div class="sig-box">
                Faculty Signature<br>
                <strong>${staffName}</strong>
            </div>
        </div>
    </body>
    </html>
    `;

    const { getBrowser } = require('./pdfService');
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    await browser.close();
    return pdfBuffer;
}

module.exports = { generateMarksPDF };
