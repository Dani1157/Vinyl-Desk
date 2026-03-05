const express = require('express');
const Record = require('../models/Record');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user's records
router.get('/', authMiddleware, async (req, res) => {
    try {
        const records = await Record.find({ userId: req.userId }).sort('-addedToCollection');
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add record
router.post('/', authMiddleware, async (req, res) => {
    try {
        const record = new Record({
            ...req.body,
            userId: req.userId
        });
        await record.save();
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update play count
router.patch('/:id/play', authMiddleware, async (req, res) => {
    try {
        const record = await Record.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { 
                $inc: { playCount: 1 },
                lastPlayed: new Date()
            },
            { new: true }
        );
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update record
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const record = await Record.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: req.body },
            { new: true }
        );
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete record
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await Record.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ message: 'Record deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;