const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['REGISTER', 'CHANGE_EMAIL'],
        required: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    newEmail: {
        type: String,
        default: null,
        trim: true,
        lowercase: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    name: {
        type: String,
        default: null
    },

    passwordHash: {
        type: String,
        default: null
    },

    codeHash: {
        type: String,
        required: true
    },

    attempts: {
        type: Number,
        default: 0
    },

    lockedUntil: {
        type: Date,
        default: null
    },

    expiresAt: {
        type: Date,
        required: true,
        index: {
            expires: 0
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);