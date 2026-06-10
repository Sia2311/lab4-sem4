const AuditLog = require('../models/AuditLog');

function getClientIp(req) {
    const rawIp =
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;

    if (!rawIp) {
        return null;
    }

    return rawIp.replace('::ffff:', '');
}

async function createAuditLog({
    req,
    action,
    entityType,
    entityId = null,
    message,
    user = null
}) {
    try {
        const logUser = user || req.user || {};

        await AuditLog.create({
            action,
            entityType,
            entityId,
            userId: logUser.id || logUser._id || null,
            userEmail: logUser.email || null,
            userRole: logUser.role || null,
            ip: getClientIp(req),
            userAgent: req.headers['user-agent'] || null,
            message
        });
    } catch (error) {
        console.error('Ошибка записи лога:', error);
    }
}

module.exports = createAuditLog;