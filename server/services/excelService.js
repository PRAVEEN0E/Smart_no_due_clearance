const xlsx = require('xlsx');

async function parseStudentExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Map Excel columns to our schema by also checking normalized keys
    return data.map(row => {
        const normalizedRow = {};
        for (let key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                normalizedRow[key.toLowerCase().replace(/[\s_]+/g, '')] = row[key];
            }
        }
        
        return {
            name: row.Name || row.name || row['Student Name'] || normalizedRow.name || normalizedRow.studentname || null,
            email: row.Email || row.email || row['Email ID'] || normalizedRow.email || normalizedRow.emailid || null,
            registerNumber: row.RegisterNumber || row.registerNumber || row['Register Number'] || row['Reg No'] || normalizedRow.registernumber || normalizedRow.registerno || normalizedRow.regno || normalizedRow.registern || null,
            password: row.Password || row.password || row['Initial Password'] || normalizedRow.password || normalizedRow.initialpassword || 'Temporary@123',
            className: row['Class'] || row['Section'] || row['Class/Section'] || row.className || row.class || normalizedRow.class || normalizedRow.section || normalizedRow['class/section'] || null,
            department: row.Department || row.department || row.dept || normalizedRow.department || normalizedRow.dept || null
        };
    });
}

async function parseFeeExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Enhanced mapping to support various column names
    return data.map(row => {
        const email = row.Email || row.email || row['Email ID'] || row['User Email'] || row['Student Email'];
        const balance = row.Balance || row.balance || row['Fee Balance'] || row['Due Amount'] || row['Amount'] || row['Fee'] || 0;
        
        return {
            email: email ? email.toString().trim() : null,
            feeBalance: parseFloat(balance)
        };
    }).filter(item => item.email); // Only return rows with an email
}

async function generateFeeExcel(students) {
    const data = students.map(s => ({
        'Student Name': s.name,
        'Email ID': s.email,
        'Department': s.department || 'N/A',
        'Class': s.className || 'N/A',
        'Current Fee Balance': s.feeRecord?.feeBalance || 0,
        'Payment Status': s.feeRecord?.feeClearedManual ? 'Manually Cleared' : (s.feeRecord?.feeClearedAuto ? 'Cleared' : 'Pending')
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Fee_Balances");

    // Set column widths
    ws['!cols'] = [
        { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
    ];

    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function parseMarksExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    return data.map(row => ({
        email: row.Email || row.email,
        cat1: parseInt(row.CAT1 || 0),
        cat2: parseInt(row.CAT2 || 0),
        cat3: parseInt(row.CAT3 || 0),
        assignment1: parseInt(row.Assignment1 || 0),
        assignment2: parseInt(row.Assignment2 || 0),
        assignment3: parseInt(row.Assignment3 || 0),
        assignment4: parseInt(row.Assignment4 || 0),
        assignment5: parseInt(row.Assignment5 || 0),
        activity1: parseInt(row.Activity1 || 0),
        activity2: parseInt(row.Activity2 || 0),
        attendance: parseFloat(row.Attendance || 0)
    }));
}

async function generateMarksExcel(subjectName, evaluations) {
    const data = evaluations.map(e => ({
        'Student Name': e.student.name,
        'Email': e.student.email,
        'CAT 1': e.cat1 || 0,
        'CAT 2': e.cat2 || 0,
        'CAT 3': e.cat3 || 0,
        'Assignment 1': e.assignment1 || 0,
        'Assignment 2': e.assignment2 || 0,
        'Assignment 3': e.assignment3 || 0,
        'Assignment 4': e.assignment4 || 0,
        'Assignment 5': e.assignment5 || 0,
        'Activity 1': e.activity1 || 0,
        'Activity 2': e.activity2 || 0,
        'Attendance %': e.attendancePercent || 0,
        'Internal Marks': e.internalMarksTotal || 0,
        'Status': e.staffApproved ? 'Approved' : 'Pending'
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Marks");

    // Set column widths
    const wscols = [
        { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
    ];
    ws['!cols'] = wscols;

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
}

module.exports = {
    parseStudentExcel,
    parseFeeExcel,
    parseMarksExcel,
    generateMarksExcel,
    generateFeeExcel
};
