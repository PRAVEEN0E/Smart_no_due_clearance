const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

const mentorSchema = {
    // ── Staff ──
    createStaff: {
        body: {
            type: 'object',
            required: ['name', 'email', 'password'],
            additionalProperties: false,
            properties: {
                name: { type: 'string', minLength: 1, maxLength: 200 },
                email: { type: 'string', format: 'email', maxLength: 254 },
                password: { type: 'string', minLength: 6, maxLength: 128 },
                role: { type: 'string', enum: ['STAFF', 'MENTOR'] }
            }
        }
    },
    getStaff: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        }
    },
    updateStaff: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        },
        body: {
            type: 'object',
            required: ['name', 'email'],
            additionalProperties: false,
            properties: {
                name: { type: 'string', minLength: 1, maxLength: 200 },
                email: { type: 'string', format: 'email', maxLength: 254 },
                password: { type: 'string', minLength: 6, maxLength: 128 }
            }
        }
    },
    deleteStaff: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        }
    },

    // ── Students ──
    listStudents: {
        querystring: {
            type: 'object',
            properties: {
                page: { type: 'integer', minimum: 1, default: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
                search: { type: 'string', maxLength: 100 },
                department: { type: 'string', maxLength: 100 },
                className: { type: 'string', maxLength: 100 },
                feeStatus: { type: 'string', enum: ['cleared', 'pending', 'all'] },
                archived: { type: 'string', enum: ['true', 'false'] },
                sortBy: { type: 'string', enum: ['name', 'email', 'createdAt', 'registerNumber'] },
                sortOrder: { type: 'string', enum: ['asc', 'desc'] }
            }
        }
    },
    createStudent: {
        body: {
            type: 'object',
            required: ['name', 'email', 'password'],
            additionalProperties: false,
            properties: {
                name: { type: 'string', minLength: 1, maxLength: 200 },
                email: { type: 'string', format: 'email', maxLength: 254 },
                password: { type: 'string', minLength: 6, maxLength: 128 },
                registerNumber: { type: 'string', maxLength: 50 },
                className: { type: 'string', maxLength: 50 },
                department: { type: 'string', maxLength: 100 }
            }
        }
    },
    updateStudent: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        },
        body: {
            type: 'object',
            required: ['name', 'email'],
            additionalProperties: false,
            properties: {
                name: { type: 'string', minLength: 1, maxLength: 200 },
                email: { type: 'string', format: 'email', maxLength: 254 },
                password: { type: 'string', minLength: 6, maxLength: 128 },
                registerNumber: { type: 'string', maxLength: 50 },
                className: { type: 'string', maxLength: 50 },
                department: { type: 'string', maxLength: 100 }
            }
        }
    },
    deleteStudent: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        }
    },
    customClearance: {
        params: {
            type: 'object',
            required: ['studentId'],
            properties: { studentId: { type: 'string', pattern: UUID_PATTERN } }
        },
        body: {
            type: 'object',
            required: ['stepId', 'cleared'],
            additionalProperties: false,
            properties: {
                stepId: { type: 'string', minLength: 1, maxLength: 50 },
                cleared: { type: 'boolean' }
            }
        }
    },

    // ── Subjects ──
    createSubject: {
        body: {
            type: 'object',
            required: ['name', 'code', 'type'],
            additionalProperties: false,
            properties: {
                name: { type: 'string', minLength: 1, maxLength: 200 },
                code: { type: 'string', minLength: 1, maxLength: 20 },
                type: { type: 'string', enum: ['FULL_THEORY', 'FULL_LAB', 'THEORY_WITH_LAB'] },
                syllabusText: { type: 'string', maxLength: 10000 },
                semester: { type: 'integer', minimum: 1, maximum: 8 },
                examDate: { type: ['string', 'null'] },
                examSession: { type: 'string', enum: ['FN', 'AN'] }
            }
        }
    },
    updateSubject: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        },
        body: {
            type: 'object',
            required: ['name', 'code', 'type'],
            additionalProperties: false,
            properties: {
                name: { type: 'string', minLength: 1, maxLength: 200 },
                code: { type: 'string', minLength: 1, maxLength: 20 },
                type: { type: 'string', enum: ['FULL_THEORY', 'FULL_LAB', 'THEORY_WITH_LAB'] },
                syllabusText: { type: 'string', maxLength: 10000 },
                semester: { type: 'integer', minimum: 1, maximum: 8 },
                examDate: { type: ['string', 'null'] },
                examSession: { type: 'string', enum: ['FN', 'AN'] }
            }
        }
    },
    deleteSubject: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        }
    },

    // ── Assignments ──
    assignStaff: {
        body: {
            type: 'object',
            required: ['staffId', 'subjectId'],
            additionalProperties: false,
            properties: {
                staffId: { type: 'string', pattern: UUID_PATTERN },
                subjectId: { type: 'string', pattern: UUID_PATTERN }
            }
        }
    },
    assignStudent: {
        body: {
            type: 'object',
            required: ['studentId', 'subjectId'],
            additionalProperties: false,
            properties: {
                studentId: { type: 'string', pattern: UUID_PATTERN },
                subjectId: { type: 'string', pattern: UUID_PATTERN }
            }
        }
    },

    // ── Fees ──
    updateFee: {
        params: {
            type: 'object',
            required: ['studentId'],
            properties: { studentId: { type: 'string', pattern: UUID_PATTERN } }
        },
        body: {
            type: 'object',
            required: ['feeClearedManual'],
            additionalProperties: false,
            properties: {
                feeClearedManual: { type: 'boolean' }
            }
        }
    },
    commonFee: {
        body: {
            type: 'object',
            required: ['amount'],
            additionalProperties: false,
            properties: {
                amount: { type: 'number', minimum: 0.01, maximum: 1000000 }
            }
        }
    },

    // ── Announcements ──
    createAnnouncement: {
        body: {
            type: 'object',
            required: ['title', 'content'],
            additionalProperties: false,
            properties: {
                title: { type: 'string', minLength: 1, maxLength: 200 },
                content: { type: 'string', minLength: 1, maxLength: 50000 },
                type: { type: 'string', enum: ['CAMPUS', 'DEPARTMENT', 'EXAM'] },
                priority: { type: 'integer', minimum: 1, maximum: 5 },
                expiresAt: { type: ['string', 'null'] }
            }
        }
    },
    updateAnnouncement: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        },
        body: {
            type: 'object',
            required: ['title', 'content'],
            additionalProperties: false,
            properties: {
                title: { type: 'string', minLength: 1, maxLength: 200 },
                content: { type: 'string', minLength: 1, maxLength: 50000 },
                type: { type: 'string', enum: ['CAMPUS', 'DEPARTMENT', 'EXAM'] },
                priority: { type: 'integer', minimum: 1, maximum: 5 },
                expiresAt: { type: ['string', 'null'] }
            }
        }
    },
    deleteAnnouncement: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        }
    },

    // ── Workflow ──
    updateWorkflow: {
        body: {
            type: 'object',
            required: ['workflow'],
            additionalProperties: false,
            properties: {
                workflow: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['id', 'label', 'type'],
                        properties: {
                            id: { type: 'string', minLength: 1, maxLength: 50 },
                            label: { type: 'string', minLength: 1, maxLength: 100 },
                            type: { type: 'string', enum: ['FEE', 'STAFF_APPROVAL', 'CUSTOM'] },
                            required: { type: 'boolean' }
                        }
                    }
                }
            }
        }
    },

    // ── Hall Tickets ──
    listHallTickets: {
        querystring: {
            type: 'object',
            properties: {
                page: { type: 'integer', minimum: 1, default: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
                search: { type: 'string', maxLength: 100 }
            }
        }
    },
    aiSummary: {
        params: {
            type: 'object',
            required: ['studentId'],
            properties: { studentId: { type: 'string', pattern: UUID_PATTERN } }
        }
    },

    // ── Common ──
    uuidParam: {
        params: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string', pattern: UUID_PATTERN } }
        }
    }
};

module.exports = mentorSchema;
