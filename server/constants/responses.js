const { HTTP_STATUS, ERROR_CODES } = require('./index');

function success(reply, data = null, message = 'Success', statusCode = HTTP_STATUS.OK, meta = {}) {
    const body = { success: true, message, data };
    if (Object.keys(meta).length > 0) body.meta = meta;
    return reply.status(statusCode).send(body);
}

function created(reply, data = null, message = 'Created successfully') {
    return success(reply, data, message, HTTP_STATUS.CREATED);
}

function error(reply, message, code = ERROR_CODES.INTERNAL_ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
    const body = { success: false, error: message, code };
    if (details) body.details = Array.isArray(details) ? details : [details];
    return reply.status(statusCode).send(body);
}

function badRequest(reply, message, code = ERROR_CODES.VALIDATION_ERROR, details = null) {
    return error(reply, message, code, HTTP_STATUS.BAD_REQUEST, details);
}

function unauthorized(reply, message = 'Authentication required', code = ERROR_CODES.AUTH_TOKEN_INVALID) {
    return error(reply, message, code, HTTP_STATUS.UNAUTHORIZED);
}

function forbidden(reply, message = 'Insufficient permissions', code = ERROR_CODES.AUTH_INSUFFICIENT_ROLE) {
    return error(reply, message, code, HTTP_STATUS.FORBIDDEN);
}

function notFound(reply, message = 'Resource not found', code = ERROR_CODES.DB_NOT_FOUND) {
    return error(reply, message, code, HTTP_STATUS.NOT_FOUND);
}

function conflict(reply, message, code = ERROR_CODES.DB_UNIQUE_CONSTRAINT) {
    return error(reply, message, code, HTTP_STATUS.CONFLICT);
}

function tooManyRequests(reply, message = 'Rate limit exceeded', retryAfter = null) {
    const body = { success: false, error: message, code: ERROR_CODES.RATE_LIMIT_EXCEEDED };
    if (retryAfter) body.retryAfter = retryAfter;
    return reply.status(HTTP_STATUS.TOO_MANY_REQUESTS).send(body);
}

function serverError(reply, message = 'An unexpected error occurred', code = ERROR_CODES.INTERNAL_ERROR) {
    return error(reply, message, code, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

module.exports = {
    success, created, error,
    badRequest, unauthorized, forbidden, notFound, conflict,
    tooManyRequests, serverError,
};
