const AuditLog = require('../models/AuditLog');

async function getAuditLogs(req, res) {
    try {
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json(
            logs.map(log => ({
                id: log._id,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                userId: log.userId,
                userEmail: log.userEmail,
                userRole: log.userRole,
                message: log.message,
                createdAt: log.createdAt
            }))
        );
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка загрузки журнала действий'
        });
    }
}

module.exports = {
    getAuditLogs
};