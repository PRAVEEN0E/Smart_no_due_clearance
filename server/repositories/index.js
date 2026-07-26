const UserRepository = require('./userRepository');
const CollegeRepository = require('./collegeRepository');
const SubjectRepository = require('./subjectRepository');
const BaseRepository = require('./base');

const REPOSITORY_MODELS = [
    'announcement', 'assignment', 'auditLog', 'customRole',
    'evaluation', 'feeRecord', 'material', 'notification', 'staffSubject', 'studentSubject'
];

function createRepositories(prisma) {
    const repos = {
        user: new UserRepository(prisma),
        college: new CollegeRepository(prisma),
        subject: new SubjectRepository(prisma),
    };

    // Auto-create repositories for remaining models
    for (const model of REPOSITORY_MODELS) {
        const key = model.charAt(0).toLowerCase() + model.slice(1);
        repos[key] = new BaseRepository(prisma, model);
    }

    return repos;
}

module.exports = { createRepositories, UserRepository, CollegeRepository, SubjectRepository };
