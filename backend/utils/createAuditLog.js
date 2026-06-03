const AuditLog = require('../models/AuditLog');

async function createAuditLog({
    req,
    action,
    entityType,
    entityId = null,
    message
}) {
    try {
        await AuditLog.create({
            action,
            entityType,
            entityId,
            userId: req.user?.id || null,
            userEmail: req.user?.email || null,
            userRole: req.user?.role || null,
            message
        });
    } catch (error) {
        console.error('Ошибка записи лога:', error);
    }
}

module.exports = createAuditLog;