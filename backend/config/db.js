const mongoose = require('mongoose');

async function connectDB() {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab4_incidents';

        await mongoose.connect(MONGO_URI);

        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = connectDB;