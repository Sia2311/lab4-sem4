const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },

    entityType: {
        type: String,
        required: true
    },

    entityId: {
        type: String,
        default: null
    },

    userId: {
        type: String,
        default: null
    },

    userEmail: {
        type: String,
        default: null
    },

    userRole: {
        type: String,
        default: null
    },

    message: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);