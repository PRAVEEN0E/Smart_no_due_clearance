function calculateInternalMarks(evalData, subjectType) {
    const {
        cat1 = 0, cat2 = 0, cat3 = 0,
        assignment1 = 0, assignment2 = 0, assignment3 = 0, assignment4 = 0, assignment5 = 0,
        activity1 = 0, activity2 = 0,
        modelLabMarks = 0,
        attendancePercent = 0
    } = evalData;

    // 1. CATs (Max 20 Marks)
    // - Logic: Best 2 out of 3 (each out of 50).
    // - Improvement: If a remedial mark is present for a CAT, it replaces that CAT score.
    // - For Labs: Remedials are not applicable.
    const isLab = subjectType === 'FULL_LAB';
    // Remedials only replace a CAT score if they are higher than the original
    const effectiveCat1 = (!isLab && evalData.remedial1 !== undefined && evalData.remedial1 !== null) ? Math.max(evalData.remedial1, cat1 || 0) : (cat1 || 0);
    const effectiveCat2 = (!isLab && evalData.remedial2 !== undefined && evalData.remedial2 !== null) ? Math.max(evalData.remedial2, cat2 || 0) : (cat2 || 0);
    const effectiveCat3 = (!isLab && evalData.remedial3 !== undefined && evalData.remedial3 !== null) ? Math.max(evalData.remedial3, cat3 || 0) : (cat3 || 0);

    let rawCats = [effectiveCat1, effectiveCat2, effectiveCat3];

    const cats = [...rawCats].sort((a, b) => b - a);
    const bestTwoSum = cats[0] + cats[1];
    const catMarks = (bestTwoSum / 100) * 20;

    // 2. Assignments (Max 10 Marks)
    // - Logic: 5 Assignments (each out of 10).
    // - Calculation: (Sum / 50) * 10
    const assignSum = (assignment1 || 0) + (assignment2 || 0) + (assignment3 || 0) + (assignment4 || 0) + (assignment5 || 0);
    const assignMarks = (assignSum / 50) * 10;

    // 3. Activities (Max 5 Marks)
    // - Logic: 2 Activities (each out of 10).
    // - Calculation: (Sum / 20) * 5
    const activitySum = (activity1 || 0) + (activity2 || 0);
    const activityMarks = (activitySum / 20) * 5;

    // 4. Attendance (Max 5 Marks)
    // - Logic: Bucket System
    let attendanceMarks = 0;
    if (attendancePercent >= 95) attendanceMarks = 5;
    else if (attendancePercent >= 90) attendanceMarks = 4;
    else if (attendancePercent >= 85) attendanceMarks = 3;
    else if (attendancePercent >= 80) attendanceMarks = 2;
    else if (attendancePercent >= 75) attendanceMarks = 1;
    else attendanceMarks = 0;

    let total = 0;

    if (subjectType === 'FULL_LAB') {
        // For Labs (Max 40): Model Lab (20) + Activities scaled (10) + Assignments scaled (5) + Attendance (5)
        const labModelMarks = Math.min((modelLabMarks || 0), 20); // cap at 20
        const labActivityMarks = (activitySum / 20) * 10; // scale 0-20 → 0-10
        const labAssignMarks = (assignSum / 50) * 5; // scale 0-50 → 0-5
        total = labModelMarks + labActivityMarks + labAssignMarks + attendanceMarks;
    } else if (subjectType === 'THEORY_WITH_LAB') {
        // For Hybrid: CATs (20) + Assignments (10) + Activities (5) + Attendance (5) + Model Lab (e.g. 10)
        // Scaled and capped at 40
        total = catMarks + assignMarks + activityMarks + attendanceMarks + (modelLabMarks / 10);
    } else {
        // Full Theory
        total = catMarks + assignMarks + activityMarks + attendanceMarks;
    }

    // Remedial Marks applied via CAT substitution above.
    // Ensure total doesn't exceed 40

    // Ensure total doesn't exceed 40
    return Math.min(parseFloat(total.toFixed(2)), 40);
}

module.exports = {
    calculateInternalMarks
};
