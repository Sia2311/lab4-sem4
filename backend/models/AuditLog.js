const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        trim: true
    },

    entityType: {
        type: String,
        required: true,
        trim: true
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

    ip: {
        type: String,
        default: null
    },

    userAgent: {
        type: String,
        default: null
    },

    message: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);