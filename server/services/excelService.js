const xlsx = require('xlsx');

async function parseStudentExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Map Excel columns to our schema
    // Expected columns: Name, Email, Password
    return data.map(row => ({
        name: row.Name || row.name,
        email: row.Email || row.email,
        password: row.Password || row.password || 'Temporary@123'
    }));
}

async function parseFeeExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Expected columns: Email, Balance
    return data.map(row => ({
        email: row.Email || row.email,
        feeBalance: parseFloat(row.Balance || row.balance || 0)
    }));
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
    generateMarksExcel
};
