const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 120
    },

    emailVerified: {
        type: Boolean,
        default: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['student', 'teacher', 'security', 'admin'],
        default: 'student'
    },

    twoFactorCode: {
        type: String,
        default: null
    },

    twoFactorExpires: {
        type: Date,
        default: null
    },

    twoFactorAttempts: {
        type: Number,
        default: 0
    },

    twoFactorLockedUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);