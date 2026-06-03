const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    status: {
        type: String,
        required: true,
        default: 'OPEN'
    },

    responsible: {
        type: String,
        required: true
    },

    date: {
        type: String,
        required: true
    },

    mapPoint: {
        floor: {
            type: Number,
            default: null
        },
        x: {
            type: Number,
            default: null
        },
        y: {
            type: Number,
            default: null
        },
        place: {
            type: String,
            default: null
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);