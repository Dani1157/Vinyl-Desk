const express = require('express');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update game stats
router.post('/gamestats', authMiddleware, async (req, res) => {
    try {
        const { game, score, perfectHits, combo, fishCaught } = req.body;
        const user = await User.findById(req.userId);
        
        if (game === 'beatMatcher') {
            if (score > user.gameStats.beatMatcher.highScore) {
                user.gameStats.beatMatcher.highScore = score;
            }
            user.gameStats.beatMatcher.perfectHits += perfectHits || 0;
            user.gameStats.beatMatcher.gamesPlayed += 1;
        } else if (game === 'rhythmGame') {
            if (score > user.gameStats.rhythmGame.highScore) {
                user.gameStats.rhythmGame.highScore = score;
            }
            if (combo > user.gameStats.rhythmGame.maxCombo) {
                user.gameStats.rhythmGame.maxCombo = combo;
            }
            user.gameStats.rhythmGame.gamesPlayed += 1;
        } else if (game === 'fishCollection') {
            user.gameStats.fishCollection.fishCaught += fishCaught || 0;
            user.stats.totalFishCaught += fishCaught || 0;
        }
        
        await user.save();
        res.json(user.gameStats);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update preferences
router.patch('/preferences', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        user.preferences = { ...user.preferences, ...req.body };
        await user.save();
        res.json(user.preferences);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get achievements
router.get('/achievements', authMiddleware, async (req, res) => {
    try {
        const achievements = await Achievement.find({ userId: req.userId }).sort('-unlockedAt');
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add achievement
router.post('/achievements', authMiddleware, async (req, res) => {
    try {
        const achievement = new Achievement({
            ...req.body,
            userId: req.userId
        });
        await achievement.save();
        res.status(201).json(achievement);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;