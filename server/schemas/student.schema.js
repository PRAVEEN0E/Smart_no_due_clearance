const studentSchema = {
    updateProfile: {
        body: {
            type: 'object',
            properties: {
                name: { type: 'string', minLength: 1, maxLength: 100 },
                dob: { type: 'string', maxLength: 20 },
                department: { type: 'string', maxLength: 50 },
                className: { type: 'string', maxLength: 50 }
            }
        }
    },
    generateQA: {
        body: {
            type: 'object',
            required: ['subjectId'],
            properties: {
                subjectId: { type: 'string', format: 'uuid' }
            }
        }
    },
    chat: {
        body: {
            type: 'object',
            required: ['message'],
            properties: {
                message: { type: 'string', minLength: 1, maxLength: 2000 },
                subjectId: { type: 'string', format: 'uuid' }
            }
        }
    },
    remedialPlan: {
        body: {
            type: 'object',
            required: ['subjectId'],
            properties: {
                subjectId: { type: 'string', format: 'uuid' }
            }
        }
    },
    predict: {
        params: {
            type: 'object',
            required: ['subjectId'],
            properties: {
                subjectId: { type: 'string', format: 'uuid' }
            }
        }
    },
    deleteAssignment: {
        params: {
            type: 'object',
            required: ['assignmentId'],
            properties: {
                assignmentId: { type: 'string', format: 'uuid' }
            }
        }
    }
};

module.exports = studentSchema;