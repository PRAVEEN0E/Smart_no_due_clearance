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
    await page.close();
    return pdfBuffer;
}

async function generateFeeReportPDF(collegeName, department, students) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; margin-bottom: 40px; }
            .college-name { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .dept-name { font-size: 18px; font-weight: 600; color: #64748b; margin-top: 5px; }
            .report-title { font-size: 14px; font-weight: 700; background: #f1f5f9; padding: 8px 20px; border-radius: 20px; display: inline-block; margin-top: 20px; color: #475569; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 12px; }
            th { background: #f8fafc; color: #475569; font-weight: 700; text-align: left; padding: 15px 10px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; }
            .balance { font-weight: 700; color: #e11d48; }
            .balance.zero { color: #059669; }
            .status { font-weight: 600; font-size: 10px; padding: 4px 10px; border-radius: 10px; text-transform: uppercase; }
            .status-cleared { background: #dcfce7; color: #166534; }
            .status-pending { background: #fee2e2; color: #991b1b; }
            
            .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="college-name">${collegeName || 'Institutional Report'}</h1>
            <h2 class="dept-name">Department of ${department || 'General'}</h2>
            <div class="report-title">FEE CLEARANCE & NO-DUE STATUS REPORT</div>
        </div>

        <table>
            <thead>
                <tr>
                    <th width="5%">S.No</th>
                    <th width="30%">Student Name</th>
                    <th width="30%">Email ID</th>
                    <th width="15%">Balance</th>
                    <th width="20%">Status</th>
                </tr>
            </thead>
            <tbody>
                ${students.map((s, i) => {
                    const balance = s.feeRecord?.feeBalance || 0;
                    const isCleared = s.feeRecord?.feeClearedManual || s.feeRecord?.feeClearedAuto;
                    return `
                    <tr>
                        <td>${i + 1}</td>
                        <td style="font-weight: 600;">${s.name}</td>
                        <td>${s.email}</td>
                        <td class="balance ${balance === 0 ? 'zero' : ''}">₹${balance.toLocaleString()}</td>
                        <td>
                            <span class="status ${isCleared ? 'status-cleared' : 'status-pending'}">
                                ${isCleared ? 'Cleared' : 'Pending'}
                            </span>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>

        <div class="footer">
            <div>Generated on ${new Date().toLocaleString()}</div>
            <div>Institutional Records System | Confidential Report</div>
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
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    await page.close();
    return pdfBuffer;
}

module.exports = { generateMarksPDF, generateFeeReportPDF };
