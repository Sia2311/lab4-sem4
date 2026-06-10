const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 120
    },

    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 1500
    },

    location: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 120
    },

    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'],
        required: true,
        default: 'OPEN'
    },

    responsible: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 120
    },

    date: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{4}-\d{2}-\d{2}$/
    },

    mapPoint: {
        floor: {
            type: Number,
            min: 1,
            max: 20,
            default: null
        },
        x: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },
        y: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },
        place: {
            type: String,
            trim: true,
            maxlength: 120,
            default: null
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);