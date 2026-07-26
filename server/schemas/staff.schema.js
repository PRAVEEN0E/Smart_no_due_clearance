const rejectSchema = {
    body: {
        type: 'object',
        required: ['rejectionReason'],
        properties: {
            rejectionReason: { type: 'string', minLength: 1, maxLength: 1000 }
        }
    }
};

const staffSchema = {
    updateMarks: {
        body: {
            type: 'object',
            properties: {
                cat1: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                cat2: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                cat3: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                assignment1: { type: 'integer', minimum: 0, maximum: 10, nullable: true },
                assignment2: { type: 'integer', minimum: 0, maximum: 10, nullable: true },
                assignment3: { type: 'integer', minimum: 0, maximum: 10, nullable: true },
                assignment4: { type: 'integer', minimum: 0, maximum: 10, nullable: true },
                assignment5: { type: 'integer', minimum: 0, maximum: 10, nullable: true },
                activity1: { type: 'integer', minimum: 0, maximum: 10, nullable: true },
                activity2: { type: 'integer', minimum: 0, maximum: 10, nullable: true },
                modelLabMarks: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
                remedial1: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                remedial2: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                remedial3: { type: 'integer', minimum: 0, maximum: 50, nullable: true },
                attendancePercent: { type: 'number', minimum: 0, maximum: 100, nullable: true }
            }
        }
    },
    rejectEvaluation: rejectSchema
};

module.exports = staffSchema;
