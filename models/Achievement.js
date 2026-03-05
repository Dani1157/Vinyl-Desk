const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: '🏆' },
    unlockedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Achievement', achievementSchema);