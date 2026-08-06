const swaggerConfig = {
    openapi: {
        openapi: '3.0.3',
        info: {
            title: 'NoDueNest API',
            description: 'Multi-tenant institutional clearance workflow automation API',
            version: '2.0.0',
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Development' },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                    description: 'JWT token stored in httpOnly cookie'
                },
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'Invalid credentials.' },
                        code: { type: 'string', example: 'AUTH_INVALID_CREDENTIALS' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Success' },
                        data: { type: 'object' },
                        meta: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer' },
                                page: { type: 'integer' },
                                limit: { type: 'integer' },
                                totalPages: { type: 'integer' }
                            }
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string', enum: ['STUDENT', 'STAFF', 'MENTOR', 'SUPERADMIN'] }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 1 }
                    }
                },
            }
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Users', description: 'User management' },
            { name: 'Colleges', description: 'College management' },
            { name: 'Subjects', description: 'Subject management' },
            { name: 'Mentor', description: 'Mentor operations' },
            { name: 'Staff', description: 'Staff operations' },
            { name: 'Student', description: 'Student operations' },
            { name: 'Materials', description: 'Course materials' },
            { name: 'Notifications', description: 'Notifications' },
            { name: 'SuperAdmin', description: 'Super Admin operations' },
            { name: 'System', description: 'System endpoints' },
        ]
    },
    exposeRoute: true
};

module.exports = swaggerConfig;
