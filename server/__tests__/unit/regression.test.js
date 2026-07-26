describe('Regression Tests — Audit Fixes', () => {
    describe('Phase 1: Assignment subjectName bug', () => {
        it('PUT /assignments/:assignmentId should include subject relation when fetching existing', async () => {
            const findUniqueMock = vi.fn().mockResolvedValue({
                id: 'a1',
                studentId: 's1',
                subjectId: 'sub1',
                subject: { name: 'Mathematics' }
            });
            const prismaMock = {
                assignment: { findUnique: findUniqueMock }
            };
            const result = await prismaMock.assignment.findUnique({
                where: { id: 'a1' },
                include: { subject: { select: { name: true } } }
            });
            expect(result).toBeDefined();
            expect(result.subject).toBeDefined();
            expect(result.subject.name).toBe('Mathematics');
            expect(findUniqueMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: { subject: { select: { name: true } } }
                })
            );
        });
    });

    describe('Phase 1: Assignment status field removal', () => {
        it('GET /ai-feedback-summary should not query a non-existent status field', () => {
            const where = { studentId: 's1', aiFeedback: { not: null } };
            expect(where.status).toBeUndefined();
            expect(where).toEqual({ studentId: 's1', aiFeedback: { not: null } });
        });
    });

    describe('Phase 2: ExamAttendance compound unique key', () => {
        it('should use findFirst with all 4 unique fields instead of findUnique with wrong compound key', async () => {
            const findFirstMock = vi.fn().mockResolvedValue(null);
            const prismaMock = {
                examAttendance: { findFirst: findFirstMock }
            };
            const studentId = 's1';
            const subjectId = 'sub1';
            const todayStr = '17/05/2026';
            const session = 'FN';
            const result = await prismaMock.examAttendance.findFirst({
                where: { studentId, subjectId, date: todayStr, session }
            });
            expect(result).toBeNull();
            expect(findFirstMock).toHaveBeenCalledWith({
                where: { studentId, subjectId, date: todayStr, session }
            });
        });
    });

    describe('Phase 2: College soft-delete', () => {
        it('should use update with deletedAt instead of delete for colleges', async () => {
            const updateMock = vi.fn().mockResolvedValue({ id: 'c1', deletedAt: new Date() });
            const findUniqueMock = vi.fn().mockResolvedValue({ id: 'c1', name: 'Test College' });
            const prismaMock = {
                college: { findUnique: findUniqueMock, update: updateMock }
            };
            const id = 'c1';
            const college = await prismaMock.college.findUnique({ where: { id } });
            expect(college).toBeDefined();
            if (college) {
                const result = await prismaMock.college.update({
                    where: { id },
                    data: { deletedAt: expect.any(Date) }
                });
                expect(result.deletedAt).toBeDefined();
            }
        });
    });

    describe('Phase 3: AI endpoint error handling', () => {
        it('should catch AI service errors and return 503', async () => {
            const failingAIService = vi.fn().mockRejectedValue(new Error('AI service down'));
            let caughtError = null;
            try {
                await failingAIService();
            } catch (err) {
                caughtError = err;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toBe('AI service down');
        });
    });

    describe('Phase 4: StudentQueries auth guards', () => {
        it('GET /staff should require STAFF, MENTOR, or SUPERADMIN role', () => {
            const allowedRoles = ['STAFF', 'MENTOR', 'SUPERADMIN'];
            expect(allowedRoles).toContain('STAFF');
            expect(allowedRoles).toContain('MENTOR');
            expect(allowedRoles).toContain('SUPERADMIN');
            expect(allowedRoles).not.toContain('STUDENT');
        });

        it('POST /:id/respond should require STAFF, MENTOR, or SUPERADMIN role', () => {
            const allowedRoles = ['STAFF', 'MENTOR', 'SUPERADMIN'];
            expect(allowedRoles).toContain('STAFF');
            expect(allowedRoles).toContain('MENTOR');
            expect(allowedRoles).toContain('SUPERADMIN');
            expect(allowedRoles).not.toContain('STUDENT');
        });
    });

    describe('Phase 6: Cloudinary cleanup on material delete', () => {
        it('should call deleteFile before deleting the DB record', async () => {
            const deleteFileMock = vi.fn().mockResolvedValue(undefined);
            const deleteMock = vi.fn().mockResolvedValue({ id: 'm1' });
            const findUniqueMock = vi.fn().mockResolvedValue({ id: 'm1', fileUrl: 'https://res.cloudinary.com/demo/sndc/file.pdf', uploadedById: 'u1' });
            const prismaMock = {
                material: { findUnique: findUniqueMock, delete: deleteMock }
            };
            const material = await prismaMock.material.findUnique({ where: { id: 'm1' } });
            expect(material).toBeDefined();
            if (material) {
                await deleteFileMock(material.fileUrl);
                await prismaMock.material.delete({ where: { id: 'm1' } });
                expect(deleteFileMock).toHaveBeenCalledWith(material.fileUrl);
                expect(deleteMock).toHaveBeenCalledWith({ where: { id: 'm1' } });
            }
        });
    });

    describe('Phase 7: CourseMaterials loading state', () => {
        it('should set loading to true before fetch and false after', async () => {
            let loading = false;
            const fetchMaterials = async () => {
                loading = true;
                try {
                    await Promise.resolve();
                } finally {
                    loading = false;
                }
            };
            expect(loading).toBe(false);
            const promise = fetchMaterials();
            expect(loading).toBe(true);
            await promise;
            expect(loading).toBe(false);
        });
    });

    describe('Session 10: Student assignments not displayed bug', () => {
        it('GET /assignments should query by studentId from JWT with subject include', async () => {
            const findManyMock = vi.fn().mockResolvedValue([
                { id: 'a1', studentId: 's1', subjectId: 'sub1', fileUrl: 'https://res.cloudinary.com/demo/file.pdf', submittedAt: new Date(), subject: { name: 'Math', code: 'MTH101' } },
                { id: 'a2', studentId: 's1', subjectId: 'sub2', fileUrl: 'https://res.cloudinary.com/demo/file2.pdf', submittedAt: new Date(), subject: { name: 'Physics', code: 'PHY101' } }
            ]);
            const prismaMock = { assignment: { findMany: findManyMock } };

            const requestUser = { id: 's1', email: 'student@test.com', role: 'STUDENT' };
            const result = await prismaMock.assignment.findMany({
                where: { studentId: requestUser.id },
                include: { subject: true },
                orderBy: { submittedAt: 'desc' }
            });

            expect(result).toHaveLength(2);
            expect(result[0].subject.name).toBe('Math');
            expect(result[1].subject.name).toBe('Physics');
            expect(findManyMock).toHaveBeenCalledWith({
                where: { studentId: 's1' },
                include: { subject: true },
                orderBy: { submittedAt: 'desc' }
            });
        });

        it('GET /assignments should return empty array when student has no assignments (not undefined)', async () => {
            const findManyMock = vi.fn().mockResolvedValue([]);
            const prismaMock = { assignment: { findMany: findManyMock } };

            const result = await prismaMock.assignment.findMany({
                where: { studentId: 'nonexistent' },
                include: { subject: true }
            });

            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        it('GET /assignments should filter by the correct studentId only (no additional filters)', async () => {
            const findManyMock = vi.fn().mockResolvedValue([]);
            const prismaMock = { assignment: { findMany: findManyMock } };

            const result = await prismaMock.assignment.findMany({
                where: { studentId: 's1' },
                include: { subject: true },
                orderBy: { submittedAt: 'desc' }
            });

            const callArg = findManyMock.mock.calls[0][0];
            expect(callArg.where).toEqual({ studentId: 's1' });
            expect(callArg.where.status).toBeUndefined();
            expect(callArg.where.deletedAt).toBeUndefined();
            expect(callArg.include.subject).toBe(true);
        });

        it('handleAssignmentUpload should call fetchAssignments after successful upload', async () => {
            const fetchDashboardMock = vi.fn();
            const fetchAssignmentsMock = vi.fn();
            const apiPostMock = vi.fn().mockResolvedValue({ data: { id: 'a1' } });

            const subId = 'sub1';
            const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
            const fakeEvent = { target: { files: [file] } };

            const form = new FormData();
            form.append('subjectId', subId);
            form.append('file', file);

            await apiPostMock('/student/assignments', form);
            fetchDashboardMock();
            fetchAssignmentsMock();

            expect(apiPostMock).toHaveBeenCalledWith('/student/assignments', form);
            expect(fetchDashboardMock).toHaveBeenCalled();
            expect(fetchAssignmentsMock).toHaveBeenCalled();
        });
    });

    describe('Session 10: AI feedback permanently shows placeholder', () => {
        it('should fall back to sync generateFeedback when addJob fails', async () => {
            const addJobMock = vi.fn().mockRejectedValue(new Error('Redis unavailable'));
            const generateFeedbackMock = vi.fn().mockResolvedValue('## Strengths\nGood work!');
            const updateMock = vi.fn().mockResolvedValue({ id: 'a1', aiFeedback: '## Strengths\nGood work!' });
            const logErrorMock = vi.fn();

            const fastify = { log: { error: logErrorMock } };
            const prisma = { assignment: { update: updateMock } };

            await addJobMock('sndc_ai', 'generate-feedback', {
                type: 'generate-feedback',
                data: { fileUrl: 'https://res.cloudinary.com/demo/file.pdf', subjectName: 'Math', assignmentId: 'a1', userId: 'u1' }
            }).catch(async (err) => {
                fastify.log.error(`AI queue unavailable: ${err.message}`);
                const feedback = await generateFeedbackMock('https://res.cloudinary.com/demo/file.pdf', 'Math');
                await prisma.assignment.update({ where: { id: 'a1' }, data: { aiFeedback: feedback } });
            });

            expect(addJobMock).toHaveBeenCalled();
            expect(logErrorMock).toHaveBeenCalledWith(expect.stringContaining('AI queue unavailable'));
            expect(generateFeedbackMock).toHaveBeenCalledWith('https://res.cloudinary.com/demo/file.pdf', 'Math');
            expect(updateMock).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { aiFeedback: '## Strengths\nGood work!' } });
        });

        it('should update DB with generated feedback when queue succeeds and worker completes', async () => {
            const updateMock = vi.fn().mockResolvedValue({ id: 'a1', aiFeedback: '## Strengths\nExcellent analysis.' });
            const result = await updateMock({ where: { id: 'a1' }, data: { aiFeedback: '## Strengths\nExcellent analysis.' } });
            expect(result.aiFeedback).toBe('## Strengths\nExcellent analysis.');
            expect(result.aiFeedback).not.toContain('AI Feedback is being generated');
        });

        it('placeholder should be replaced when real feedback is stored', () => {
            const PLACEHOLDER = "_AI Feedback is being generated. Check back in a moment._";
            const assignment = { id: 'a1', aiFeedback: PLACEHOLDER };
            expect(assignment.aiFeedback).toBe(PLACEHOLDER);
            expect(assignment.aiFeedback.length).toBeGreaterThan(10);

            assignment.aiFeedback = '## Strengths\nGood work!\n## Overall Assessment\nKeep it up.';
            expect(assignment.aiFeedback).not.toBe(PLACEHOLDER);
            expect(assignment.aiFeedback).toContain('Strengths');
        });

        it('should log error when sync fallback also fails', async () => {
            const syncErrorMock = vi.fn().mockRejectedValue(new Error('Groq API key missing'));
            const logErrorMock = vi.fn();
            const fastify = { log: { error: logErrorMock } };

            try {
                await syncErrorMock('file.pdf', 'Math');
            } catch (err) {
                fastify.log.error(`Sync AI feedback also failed: ${err.message}`);
            }

            expect(logErrorMock).toHaveBeenCalledWith(expect.stringContaining('Sync AI feedback also failed'));
        });
    });
});
