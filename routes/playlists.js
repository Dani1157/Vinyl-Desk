const express = require('express');
const Playlist = require('../models/Playlist');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user's playlists
router.get('/', authMiddleware, async (req, res) => {
    try {
        const playlists = await Playlist.find({ userId: req.userId })
            .populate('records')
            .sort('-createdAt');
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create playlist
router.post('/', authMiddleware, async (req, res) => {
    try {
        const playlist = new Playlist({
            ...req.body,
            userId: req.userId
        });
        await playlist.save();
        res.status(201).json(playlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add record to playlist
router.post('/:id/records', authMiddleware, async (req, res) => {
    try {
        const playlist = await Playlist.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $push: { records: req.body.recordId } },
            { new: true }
        ).populate('records');
        res.json(playlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove record from playlist
router.delete('/:id/records/:recordId', authMiddleware, async (req, res) => {
    try {
        const playlist = await Playlist.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $pull: { records: req.params.recordId } },
            { new: true }
        ).populate('records');
        res.json(playlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete playlist
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await Playlist.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ message: 'Playlist deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;