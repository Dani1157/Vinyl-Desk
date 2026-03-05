const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    artist: { type: String, default: 'Unknown Artist' },
    youtubeId: { type: String },
    youtubeUrl: { type: String },
    fileUrl: { type: String },
    duration: { type: Number, default: 0 },
    coverArt: { type: String, default: '💿' },
    playCount: { type: Number, default: 0 },
    lastPlayed: { type: Date },
    addedToCollection: { type: Date, default: Date.now },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    tags: [{ type: String }],
    notes: { type: String, default: '' }
});

module.exports = mongoose.model('Record', recordSchema);