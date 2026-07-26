const AuthService = require('./authService');
const CollegeService = require('./collegeService');
const UserService = require('./userService');

function createServices(repos) {
    return {
        auth: new AuthService(repos),
        college: new CollegeService(repos),
        user: new UserService(repos),
    };
}

module.exports = { createServices, AuthService, CollegeService, UserService };
