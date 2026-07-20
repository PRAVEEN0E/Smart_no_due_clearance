const { calculateInternalMarks } = require('../../services/marksCalculator');

describe('calculateInternalMarks', () => {
    // Edge case: empty input
    it('returns 0 for empty input', () => {
        expect(calculateInternalMarks({}, 'FULL_THEORY')).toBe(0);
    });

    it('throws for null input', () => {
        expect(() => calculateInternalMarks(null, 'FULL_THEORY')).toThrow();
    });

    it('throws for undefined input', () => {
        expect(() => calculateInternalMarks(undefined, 'FULL_THEORY')).toThrow();
    });

    it('handles missing subject type gracefully', () => {
        const result = calculateInternalMarks({ cat1: 50, cat2: 50, cat3: 50 }, undefined);
        expect(result).toBeGreaterThan(0);
    });

    // Max possible marks for theory
    it('calculates maximum theory marks correctly (best 2 of 3 CATs)', () => {
        const result = calculateInternalMarks({
            cat1: 50, cat2: 50, cat3: 10,
            assignment1: 10, assignment2: 10, assignment3: 10, assignment4: 10, assignment5: 10,
            activity1: 10, activity2: 10,
            attendancePercent: 100
        }, 'FULL_THEORY');
        expect(result).toBe(40);
    });

    // CAT calculation: best 2 of 3
    it('uses best 2 of 3 CATs', () => {
        const result = calculateInternalMarks({
            cat1: 50, cat2: 0, cat3: 0,
            assignment1: 10, assignment2: 10, assignment3: 10, assignment4: 10, assignment5: 10,
            activity1: 10, activity2: 10,
            attendancePercent: 100
        }, 'FULL_THEORY');
        // CAT: 50+0 = 50/100*20 = 10, Assign: 50/50*10 = 10, Activity: 20/20*5 = 5, Attend: 5
        // Total: 10 + 10 + 5 + 5 = 30
        expect(result).toBe(30);
    });

    // Remedial replaces CAT if higher
    it('replaces CAT with remedial when remedial is higher', () => {
        const result = calculateInternalMarks({
            cat1: 10, cat2: 10, cat3: 10,
            remedial1: 50, remedial2: 0, remedial3: 0,
            assignment1: 10, assignment2: 10, assignment3: 10, assignment4: 10, assignment5: 10,
            activity1: 10, activity2: 10,
            attendancePercent: 100
        }, 'FULL_THEORY');
        // Effective cats: 50, 10, 10. Best 2: 50+10 = 60/100*20 = 12
        // Assign: 10, Activity: 5, Attend: 5
        // Total: 12 + 10 + 5 + 5 = 32
        expect(result).toBe(32);
    });

    // Lab calculation
    it('calculates lab marks correctly', () => {
        const result = calculateInternalMarks({
            modelLabMarks: 100,
            assignment1: 10, assignment2: 10, assignment3: 10, assignment4: 10, assignment5: 10,
            activity1: 10, activity2: 10,
            attendancePercent: 100
        }, 'FULL_LAB');
        expect(result).toBe(40);
    });

    // Lab does not use remedials
    it('ignores remedials for FULL_LAB', () => {
        const result = calculateInternalMarks({
            cat1: 10, remedial1: 50,
            modelLabMarks: 100,
            assignment1: 10, assignment2: 10, assignment3: 10, assignment4: 10, assignment5: 10,
            activity1: 10, activity2: 10,
            attendancePercent: 100
        }, 'FULL_LAB');
        expect(result).toBe(40);
    });

    // Theory with lab
    it('calculates THEORY_WITH_LAB correctly', () => {
        const result = calculateInternalMarks({
            cat1: 50, cat2: 50, cat3: 50,
            modelLabMarks: 100,
            assignment1: 10, assignment2: 10, assignment3: 10, assignment4: 10, assignment5: 10,
            activity1: 10, activity2: 10,
            attendancePercent: 100
        }, 'THEORY_WITH_LAB');
        expect(result).toBe(40);
    });

    // Attendance bucket tests
    it('assigns correct attendance marks for 95%+', () => {
        const result = calculateInternalMarks({ attendancePercent: 95 }, 'FULL_THEORY');
        expect(result).toBe(5);
    });

    it('assigns correct attendance marks for 75-79%', () => {
        const result = calculateInternalMarks({ attendancePercent: 75 }, 'FULL_THEORY');
        expect(result).toBe(1);
    });

    it('assigns 0 attendance marks for below 75%', () => {
        const result = calculateInternalMarks({ attendancePercent: 74 }, 'FULL_THEORY');
        expect(result).toBe(0);
    });

    // Total capped at 40
    it('caps total marks at 40', () => {
        const result = calculateInternalMarks({
            cat1: 50, cat2: 50, cat3: 50,
            assignment1: 10, assignment2: 10, assignment3: 10, assignment4: 10, assignment5: 10,
            activity1: 10, activity2: 10,
            attendancePercent: 100
        }, 'FULL_THEORY');
        expect(result).toBeLessThanOrEqual(40);
    });

    // Partial data
    it('handles partial assignment data', () => {
        const result = calculateInternalMarks({
            cat1: 50, cat2: 45, cat3: 0,
            assignment1: 8, assignment2: 7
        }, 'FULL_THEORY');
        expect(result).toBeGreaterThan(0);
    });

    // Negative values produce negative results (no guard)
    it('passes through negative values', () => {
        const result = calculateInternalMarks({
            cat1: -10, cat2: -20, cat3: -30,
            assignment1: -5,
            activity1: -1,
            attendancePercent: -10
        }, 'FULL_THEORY');
        expect(result).toBeLessThan(0);
    });
});
