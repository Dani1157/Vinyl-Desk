const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '🎵' },
    createdAt: { type: Date, default: Date.now },
    
    gameStats: {
        beatMatcher: {
            highScore: { type: Number, default: 0 },
            perfectHits: { type: Number, default: 0 },
            gamesPlayed: { type: Number, default: 0 }
        },
        rhythmGame: {
            highScore: { type: Number, default: 0 },
            maxCombo: { type: Number, default: 0 },
            gamesPlayed: { type: Number, default: 0 }
        },
        fishCollection: {
            fishCaught: { type: Number, default: 0 },
            rareFish: { type: Number, default: 0 }
        }
    },
    
    preferences: {
        theme: { type: String, default: 'dark' },
        defaultVolume: { type: Number, default: 70 },
        visualizerMode: { type: String, default: 'bars' },
        weatherEffect: { type: String, default: 'none' }
    },
    
    stats: {
        totalTracksPlayed: { type: Number, default: 0 },
        totalPlayTime: { type: Number, default: 0 },
        totalFishCaught: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('User', userSchema);