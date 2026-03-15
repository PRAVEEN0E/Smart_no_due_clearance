function generateAcademicSuggestions(evaluations) {
    const suggestions = [];

    evaluations.forEach(ev => {
        const subjectName = ev.subject.name;

        // 1. Attendance checks
        if (ev.attendancePercent < 75) {
            suggestions.push({
                type: 'critical',
                subject: subjectName,
                message: `Your attendance is ${ev.attendancePercent}%, which is below the 75% threshold. Focus on attending upcoming classes to avoid remedial requirements.`
            });
        }

        // 2. CAT marks checks
        const cats = [ev.cat1 || 0, ev.cat2 || 0, ev.cat3 || 0];
        const lowCats = cats.filter(m => m < 25); // Assuming 50 is max
        if (lowCats.length > 0) {
            suggestions.push({
                type: 'warning',
                subject: subjectName,
                message: `You have scored low in some CATs. Reach out to your staff for clarification on topics you found difficult before the final exams.`
            });
        }

        // 3. Assignment checks
        const assignments = [ev.assignment1, ev.assignment2, ev.assignment3, ev.assignment4, ev.assignment5];
        const missingAssignments = assignments.filter(a => a === 0 || a === null).length;
        if (missingAssignments > 0) {
            suggestions.push({
                type: 'info',
                subject: subjectName,
                message: `You have ${missingAssignments} pending assignments. Submitting these will provide a significant boost to your internal marks total.`
            });
        }

        // 4. Achievement / Positive reinforcement
        if (ev.internalMarksTotal > 35) {
            suggestions.push({
                type: 'success',
                subject: subjectName,
                message: `Excellent performance! You have a strong internal score of ${ev.internalMarksTotal.toFixed(1)}. Keep up the consistency.`
            });
        }
    });

    // If no specific suggestions, add a general one
    if (suggestions.length === 0) {
        suggestions.push({
            type: 'info',
            subject: 'General',
            message: 'All your academic records look stable. Keep monitoring your portal for updates from staff.'
        });
    }

    return suggestions;
}

module.exports = { generateAcademicSuggestions };
