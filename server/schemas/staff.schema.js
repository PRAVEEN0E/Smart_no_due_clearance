const staffSchema = {
    updateMarks: {
        body: {
            type: 'object',
            properties: {
                cat1: { type: 'integer', minimum: 0, maximum: 50 },
                cat2: { type: 'integer', minimum: 0, maximum: 50 },
                cat3: { type: 'integer', minimum: 0, maximum: 50 },
                assignment1: { type: 'integer', minimum: 0, maximum: 10 },
                assignment2: { type: 'integer', minimum: 0, maximum: 10 },
                assignment3: { type: 'integer', minimum: 0, maximum: 10 },
                assignment4: { type: 'integer', minimum: 0, maximum: 10 },
                assignment5: { type: 'integer', minimum: 0, maximum: 10 },
                activity1: { type: 'integer', minimum: 0, maximum: 10 },
                activity2: { type: 'integer', minimum: 0, maximum: 10 },
                modelLabMarks: { type: 'integer', minimum: 0, maximum: 100 },
                remedial1: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                remedial2: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                remedial3: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                attendancePercent: { type: 'number', minimum: 0, maximum: 100 }
            }
        }
    }
};

module.exports = staffSchema;
