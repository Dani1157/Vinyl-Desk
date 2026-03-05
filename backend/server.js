const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());

// ==================== MODELS ====================

// User Schema
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
        visualizerMode: { type: String, default: 'bars' }
    },
    
    stats: {
        totalTracksPlayed: { type: Number, default: 0 },
        totalPlayTime: { type: Number, default: 0 }
    }
});

// Record Schema
const recordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    artist: { type: String, default: 'Unknown Artist' },
    youtubeId: { type: String },
    youtubeUrl: { type: String },
    fileUrl: { type: String },
    duration: { type: Number },
    coverArt: { type: String },
    playCount: { type: Number, default: 0 },
    lastPlayed: { type: Date },
    addedToCollection: { type: Date, default: Date.now },
    rating: { type: Number, default: 0 }
});

// Playlist Schema
const playlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Record' }],
    isPublic: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

// Achievement Schema
const achievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    icon: { type: String },
    unlockedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);
const Playlist = mongoose.model('Playlist', playlistSchema);
const Achievement = mongoose.model('Achievement', achievementSchema);

// ==================== MIDDLEWARE ====================

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error();
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) throw new Error();
        
        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

// ==================== AUTH ROUTES ====================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            email,
            password: hashedPassword,
            avatar: ['🎵', '🎸', '🎹', '🎷', '🎺', '🎻'][Math.floor(Math.random() * 6)]
        });
        
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                gameStats: user.gameStats,
                stats: user.stats
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                gameStats: user.gameStats,
                stats: user.stats
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== USER ROUTES ====================

// Get user profile
app.get('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update game stats
app.post('/api/users/gamestats', authMiddleware, async (req, res) => {
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
        }
        
        await user.save();
        res.json(user.gameStats);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== RECORD ROUTES ====================

// Get user's records
app.get('/api/records', authMiddleware, async (req, res) => {
    try {
        const records = await Record.find({ userId: req.userId }).sort('-addedToCollection');
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add record
app.post('/api/records', authMiddleware, async (req, res) => {
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

// ==================== TEST ROUTE ====================

app.get('/', (req, res) => {
    res.json({ 
        message: '🎵 Vinyl Desk API is running!',
        endpoints: {
            auth: '/api/auth (POST: /signup, /login)',
            users: '/api/users (GET: /profile, POST: /gamestats)',
            records: '/api/records (GET, POST)'
        }
    });
});

// ==================== DATABASE CONNECTION ====================

// Try to connect to MongoDB, but don't crash if it fails
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinyl-desk');
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.log('⚠️ MongoDB not connected - running in mock mode');
        console.log('   To use database, install MongoDB or use MongoDB Atlas');
    }
};

connectDB();

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✨ Server running on port ${PORT}`);
    console.log(`📝 Test the API at http://localhost:${PORT}`);
});