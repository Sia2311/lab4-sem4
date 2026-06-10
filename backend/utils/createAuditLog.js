const AuditLog = require('../models/AuditLog');

function getClientIp(req) {
    if (!req) {
        return null;
    }

    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        null
    );
}

async function createAuditLog({
    req = null,
    action,
    entityType,
    entityId = null,
    userId = null,
    userEmail = null,
    userRole = null,
    message
}) {
    try {
        await AuditLog.create({
            action,
            entityType,
            entityId,
            userId: userId || req?.user?.id || null,
            userEmail: userEmail || req?.user?.email || null,
            userRole: userRole || req?.user?.role || null,
            ip: getClientIp(req),
            userAgent: req?.headers?.['user-agent'] || null,
            message
        });
    } catch (error) {
        console.error('Ошибка записи лога:', error);
    }
}

module.exports = createAuditLog;