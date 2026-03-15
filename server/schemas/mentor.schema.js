const mentorSchema = {
    createStaff: {
        body: {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 6 },
                role: { type: 'string', enum: ['STAFF', 'MENTOR'] }
            }
        }
    },
    createStudent: {
        body: {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 6 }
            }
        }
    },
    createSubject: {
        body: {
            type: 'object',
            required: ['name', 'code', 'type'],
            properties: {
                name: { type: 'string' },
                code: { type: 'string' },
                type: { type: 'string', enum: ['FULL_THEORY', 'FULL_LAB', 'THEORY_WITH_LAB'] },
                syllabusText: { type: 'string' }
            }
        }
    },
    assignStaff: {
        body: {
            type: 'object',
            required: ['staffId', 'subjectId'],
            properties: {
                staffId: { type: 'string' },
                subjectId: { type: 'string' }
            }
        }
    },
    assignStudent: {
        body: {
            type: 'object',
            required: ['studentId', 'subjectId'],
            properties: {
                studentId: { type: 'string' },
                subjectId: { type: 'string' }
            }
        }
    },
    updateFee: {
        body: {
            type: 'object',
            required: ['feeClearedManual'],
            properties: {
                feeClearedManual: { type: 'boolean' }
            }
        }
    }
};

module.exports = mentorSchema;
