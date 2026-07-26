/**
 * Refactored mentor routes using Controller pattern.
 * Routes contain NO business logic — only wiring.
 */
const MentorController = require('../controllers/mentorController');

async function mentorRoutes(fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate, fastify.authorize(['MENTOR', 'SUPERADMIN'])]));

    const ctrl = new MentorController(fastify.services, fastify);

    fastify.get('/staff', (req, rep) => ctrl.listStaff(req, rep));
    fastify.post('/staff', { schema: require('../schemas/mentor.schema').createStaff }, (req, rep) => ctrl.createStaff(req, rep));
    fastify.get('/students', (req, rep) => ctrl.listStudents(req, rep));
    fastify.post('/students', { schema: require('../schemas/mentor.schema').createStudent }, (req, rep) => ctrl.createStudent(req, rep));
    fastify.put('/students/:id', (req, rep) => ctrl.updateStudent(req, rep));
    fastify.put('/staff/:id', (req, rep) => ctrl.updateStaff(req, rep));

    fastify.get('/subjects', (req) => ctrl.listSubjects(req));
    fastify.post('/subjects', { schema: require('../schemas/mentor.schema').createSubject }, (req) => ctrl.createSubject(req));
    fastify.put('/subjects/:id', (req) => ctrl.updateSubject(req));
    fastify.delete('/subjects/:id', (req) => ctrl.deleteSubject(req));

    fastify.get('/announcements', (req) => ctrl.listAnnouncements(req));
    fastify.post('/announcements', (req, rep) => ctrl.createAnnouncement(req, rep));
    fastify.put('/announcements/:id', (req, rep) => ctrl.updateAnnouncement(req, rep));
    fastify.delete('/announcements/:id', (req) => ctrl.deleteAnnouncement(req));

    fastify.get('/analytics', (req, rep) => ctrl.analytics(req, rep));
    fastify.get('/college', (req, rep) => ctrl.getCollege(req, rep));
    fastify.put('/college/workflow', (req, rep) => ctrl.updateWorkflow(req, rep));
}

module.exports = mentorRoutes;
