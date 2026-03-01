class VinylDesk {
    constructor() {
        // DOM Elements
        this.vinyl = document.getElementById('vinyl');
        this.tonearm = document.getElementById('tonearm');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.linkInput = document.getElementById('linkInput');
        this.playBtn = document.getElementById('playBtn');
        this.trackTitle = document.getElementById('trackTitle');
        this.statusText = document.getElementById('statusText');
        this.trackMeta = document.getElementById('trackMeta');
        this.progressFill = document.getElementById('progressFill');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.visualizerCanvas = document.getElementById('visualizer');
        this.ctx = this.visualizerCanvas.getContext('2d');
        
        // Audio Elements
        this.mainAudio = document.getElementById('mainAudio');
        this.crackleAudio = document.getElementById('crackleAudio');
        this.rainAudio = document.getElementById('rainAudio');
        
        // YouTube Player
        this.youtubePlayer = null;
        this.isYouTubeReady = false;
        
        // State
        this.isPlaying = false;
        this.currentSource = null;
        this.currentFileIndex = -1;
        this.playQueue = [];
        this.crackleOn = false;
        this.rainOn = false;
        this.repeatOn = false;
        this.shuffleOn = false;
        this.currentTheme = 'dark';
        this.visualizerMode = 'bars';
        this.equalizerOn = false;
        this.weatherEffect = 'none';
        this.widgetMode = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.playbackSpeed = 1.0;
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
        
        // Fish Theme State
        this.fishTheme = false;
        this.fishSchool = [];
        this.bubbleSwarm = [];
        this.fishTypes = ['🐠', '🐟', '🐡', '🐋', '🦈', '🐬', '🐙', '🦑', '🐠', '🐟', '🐡'];
        this.fishCount = 0;
        this.fishInterval = null;
        this.bubbleInterval = null;
        
        // Lyrics State
        this.lyricsEnabled = false;
        this.currentLyrics = [];
        this.lyricsContainer = null;
        this.lyricsInterval = null;
        
        // Piano State
        this.pianoEnabled = false;
        this.pianoContainer = null;
        this.pianoKeys = [];
        this.pianoNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.pianoOctaves = [3, 4, 5];
        this.pianoAudioContext = null;
        this.pianoRecording = null;
        this.pianoRecordingStartTime = 0;
        
        // Beat Matcher State
        this.beatMatcherActive = false;
        this.beatMatcherScore = 0;
        this.beatMatcherInterval = null;
        this.beatMatcherLastBeat = 0;
        this.beatMatcherLastHit = 0;
        this.beatMatcherBPM = 120;
        this.beatMatcherPerfectHits = 0;
        this.beatMatcherGoodHits = 0;
        this.beatMatcherMisses = 0;
        this.beatMatcherHandler = null;
        this.beatMatcherGameUI = null;
        
        // Rhythm Game State
        this.rhythmGameActive = false;
        this.rhythmGameNotes = [];
        this.rhythmGameScore = 0;
        this.rhythmGameCombo = 0;
        this.rhythmGameMaxCombo = 0;
        this.rhythmGameInterval = null;
        this.rhythmGameKeyHandler = null;
        this.rhythmGameUI = null;
        
        // Visualizer
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.animationFrame = null;
        
        // Notifications
        this.notificationTimeout = null;
        
        // Drag overlay timeout
        this.dragOverlayTimeout = null;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupVinylDropZone();
        this.setupDragAndDrop();
        await this.loadYouTubeAPI();
        this.startTimeUpdate();
        this.setupAudioContext();
        this.setupPianoAudio();
        this.setVolume(70);
        this.createWeatherEffects();
        this.setupKeyboardShortcuts();
        this.loadThemeFromStorage();
        this.setupMediaSession();
        this.createExitButton();
        this.createLyricsContainer();
        this.createPiano();
        this.createMiniGames();
        this.createWaveEffects();
        this.addTonearmIndicator();
        
        // Load crackle/rain
        this.crackleAudio.volume = 0.2;
        this.rainAudio.volume = 0.15;
        
        // Initialize queue display
        this.updateQueueDisplay();
        
        // Show welcome notification
        this.showNotification('🎵 Welcome to Vinyl Desk! Press F for Fish Theme!', 'info', 5000);
    }
    
    setupEventListeners() {
        // Tab switching
        document.getElementById('tabLink').addEventListener('click', () => this.switchTab('link'));
        document.getElementById('tabFile').addEventListener('click', () => this.switchTab('file'));
        
        // Play button
        this.playBtn.addEventListener('click', () => this.playYouTubeLink());
        this.linkInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.playYouTubeLink();
        });
        
        // Play/Pause
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // File input
        const fileArea = document.getElementById('fileArea');
        const fileInput = document.getElementById('fileInput');
        
        fileArea.addEventListener('click', () => fileInput.click());
        fileArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileArea.classList.add('dragover');
        });
        
        fileArea.addEventListener('dragleave', () => {
            fileArea.classList.remove('dragover');
        });
        
        fileArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Volume
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Progress bar click
        document.getElementById('progressBar').addEventListener('click', (e) => this.seek(e));
        
        // Control buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.playPrevious());
        document.getElementById('nextBtn').addEventListener('click', () => this.playNext());
        document.getElementById('shuffleBtn').addEventListener('click', () => this.toggleShuffle());
        document.getElementById('repeatBtn').addEventListener('click', () => this.toggleRepeat());
        document.getElementById('crackleToggle').addEventListener('click', () => this.toggleCrackle());
        document.getElementById('rainToggle').addEventListener('click', () => this.toggleRain());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Add weather toggle
        const weatherBtn = document.createElement('button');
        weatherBtn.className = 'ctrl-btn';
        weatherBtn.id = 'weatherToggle';
        weatherBtn.innerHTML = '<i class="fas fa-cloud-sun"></i> Weather';
        weatherBtn.addEventListener('click', () => this.toggleWeather());
        document.querySelector('.control-bar').appendChild(weatherBtn);
        
        // Add visualizer mode toggle
        const vizBtn = document.createElement('button');
        vizBtn.className = 'ctrl-btn';
        vizBtn.id = 'vizModeToggle';
        vizBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Viz Mode';
        vizBtn.addEventListener('click', () => this.toggleVisualizerMode());
        document.querySelector('.control-bar').appendChild(vizBtn);
        
        // Add widget mode toggle
        const widgetBtn = document.createElement('button');
        widgetBtn.className = 'ctrl-btn';
        widgetBtn.id = 'widgetToggle';
        widgetBtn.innerHTML = '<i class="fas fa-window-restore"></i> Widget';
        widgetBtn.addEventListener('click', () => this.toggleWidgetMode());
        document.querySelector('.control-bar').appendChild(widgetBtn);
        
        // Add speed control
        const speedBtn = document.createElement('button');
        speedBtn.className = 'ctrl-btn';
        speedBtn.id = 'speedToggle';
        speedBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Speed 1x';
        speedBtn.addEventListener('click', () => this.cycleSpeed());
        document.querySelector('.control-bar').appendChild(speedBtn);
        
        // Add fish theme toggle
        const fishBtn = document.createElement('button');
        fishBtn.className = 'ctrl-btn';
        fishBtn.id = 'fishThemeBtn';
        fishBtn.innerHTML = '<i class="fas fa-fish"></i> Fish Theme';
        fishBtn.addEventListener('click', () => this.toggleFishTheme());
        document.querySelector('.control-bar').appendChild(fishBtn);
        
        // Audio events
        this.mainAudio.addEventListener('timeupdate', () => this.updateProgress());
        this.mainAudio.addEventListener('ended', () => this.handleTrackEnd());
        this.mainAudio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.mainAudio.addEventListener('error', (e) => this.handleAudioError(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    // ===== FISH THEME =====
    toggleFishTheme() {
        this.fishTheme = !this.fishTheme;
        const btn = document.getElementById('fishThemeBtn');
        
        if (this.fishTheme) {
            btn.classList.add('active');
            document.documentElement.setAttribute('data-theme', 'underwater');
            this.startFishTheme();
            this.showNotification('🐠 Fish Theme Activated! Click the fish!', 'success', 3000);
        } else {
            btn.classList.remove('active');
            this.stopFishTheme();
            this.setTheme(this.currentTheme);
            this.showNotification('🌊 Fish Theme Deactivated', 'info', 2000);
        }
    }
    
    startFishTheme() {
        // Create fish container
        const container = document.createElement('div');
        container.className = 'fish-theme-container';
        container.id = 'fishThemeContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        document.body.appendChild(container);
        
        // Add water background
        const waterBg = document.createElement('div');
        waterBg.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a2f4a, #0f3a5a);
            opacity: 0.7;
            z-index: -1;
            animation: water-wave 10s infinite alternate;
        `;
        document.body.appendChild(waterBg);
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fish-swim {
                0% { transform: translateX(-200px) translateY(0) rotate(0deg); }
                25% { transform: translateX(25vw) translateY(-20px) rotate(5deg); }
                50% { transform: translateX(50vw) translateY(0) rotate(0deg); }
                75% { transform: translateX(75vw) translateY(20px) rotate(-5deg); }
                100% { transform: translateX(calc(100vw + 200px)) translateY(0) rotate(0deg); }
            }
            
            @keyframes fish-swim-reverse {
                0% { transform: translateX(calc(100vw + 200px)) translateY(0) rotate(180deg); }
                25% { transform: translateX(75vw) translateY(20px) rotate(175deg); }
                50% { transform: translateX(50vw) translateY(0) rotate(180deg); }
                75% { transform: translateX(25vw) translateY(-20px) rotate(185deg); }
                100% { transform: translateX(-200px) translateY(0) rotate(180deg); }
            }
            
            @keyframes bubble-float {
                0% { transform: translateY(100vh) scale(0); opacity: 0; }
                20% { opacity: 0.5; }
                80% { opacity: 0.3; }
                100% { transform: translateY(-100px) scale(1); opacity: 0; }
            }
            
            @keyframes water-wave {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            .fish {
                position: absolute;
                font-size: 30px;
                cursor: pointer;
                pointer-events: auto;
                transition: transform 0.2s;
                filter: drop-shadow(0 0 5px rgba(0,255,255,0.5));
                z-index: 10000;
                animation: fish-swim 15s linear infinite;
            }
            
            .fish:hover {
                transform: scale(1.3) !important;
                filter: drop-shadow(0 0 15px gold);
                z-index: 10001;
            }
            
            .bubble {
                position: absolute;
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(173,216,230,0.3));
                border-radius: 50%;
                pointer-events: none;
                animation: bubble-float 8s infinite ease-in;
            }
        `;
        document.head.appendChild(style);
        
        // Create fish
        for (let i = 0; i < 20; i++) {
            this.createFish();
        }
        
        // Create bubbles
        this.bubbleInterval = setInterval(() => {
            this.createBubble();
        }, 500);
        
        // Fish counter
        const counter = document.createElement('div');
        counter.id = 'fishCounter';
        counter.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
            padding: 10px 20px;
            border-radius: 30px;
            color: white;
            font-size: 1.2rem;
            z-index: 10002;
            border: 1px solid var(--accent-primary);
        `;
        counter.innerHTML = `🐠 Fish: <span id="fishCount">0</span>`;
        document.body.appendChild(counter);
    }
    
    createFish() {
        const container = document.getElementById('fishThemeContainer');
        if (!container) return;
        
        const fish = document.createElement('div');
        fish.className = 'fish';
        const fishType = this.fishTypes[Math.floor(Math.random() * this.fishTypes.length)];
        fish.innerHTML = fishType;
        
        // Random position and animation
        const top = Math.random() * 80 + 10;
        const duration = 12 + Math.random() * 10;
        const delay = Math.random() * 10;
        const reverse = Math.random() > 0.5;
        
        fish.style.top = top + '%';
        fish.style.animationDuration = duration + 's';
        fish.style.animationDelay = delay + 's';
        fish.style.animationName = reverse ? 'fish-swim-reverse' : 'fish-swim';
        fish.style.fontSize = (20 + Math.random() * 30) + 'px';
        fish.style.opacity = 0.6 + Math.random() * 0.3;
        
        // Click handler to collect fish
        fish.addEventListener('click', () => {
            this.fishCount++;
            document.getElementById('fishCount').textContent = this.fishCount;
            fish.style.transform = 'scale(1.5)';
            fish.style.opacity = '0';
            setTimeout(() => fish.remove(), 200);
            this.showNotification(`🐠 +1 Fish! Total: ${this.fishCount}`, 'success', 500);
            
            // Achievement messages
            if (this.fishCount === 10) {
                this.showNotification('🏆 Achievement: Fish Collector!', 'success', 3000);
            }
            if (this.fishCount === 25) {
                this.showNotification('🏆 Achievement: Master Fisher!', 'success', 3000);
            }
            if (this.fishCount === 50) {
                this.showNotification('🏆 Achievement: Ocean King!', 'success', 5000);
            }
        });
        
        container.appendChild(fish);
        this.fishSchool.push(fish);
    }
    
    createBubble() {
        const container = document.getElementById('fishThemeContainer');
        if (!container) return;
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = 5 + Math.random() * 30;
        const left = Math.random() * 100;
        const duration = 6 + Math.random() * 8;
        
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = left + '%';
        bubble.style.animationDuration = duration + 's';
        bubble.style.opacity = 0.1 + Math.random() * 0.3;
        
        container.appendChild(bubble);
        
        // Remove bubble after animation
        setTimeout(() => {
            if (bubble.parentNode) bubble.remove();
        }, duration * 1000);
    }
    
    stopFishTheme() {
        // Remove fish container
        const container = document.getElementById('fishThemeContainer');
        if (container) container.remove();
        
        // Remove water background
        const waterBg = document.querySelector('div[style*="background: linear-gradient(135deg, #0a2f4a"]');
        if (waterBg) waterBg.remove();
        
        // Remove fish counter
        const counter = document.getElementById('fishCounter');
        if (counter) counter.remove();
        
        // Clear intervals
        if (this.bubbleInterval) {
            clearInterval(this.bubbleInterval);
            this.bubbleInterval = null;
        }
        
        this.fishSchool = [];
        this.fishCount = 0;
    }
    
    // ===== BEAT MATCHER =====
    startBeatMatcher() {
        if (this.beatMatcherActive) {
            this.stopBeatMatcher();
            return;
        }
        
        this.beatMatcherActive = true;
        this.beatMatcherScore = 0;
        this.beatMatcherPerfectHits = 0;
        this.beatMatcherGoodHits = 0;
        this.beatMatcherMisses = 0;
        this.beatMatcherBPM = 120;
        
        // Create game UI
        this.beatMatcherGameUI = document.createElement('div');
        this.beatMatcherGameUI.className = 'beat-matcher-ui';
        this.beatMatcherGameUI.id = 'beatMatcherUI';
        this.beatMatcherGameUI.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            padding: 30px;
            border-radius: 30px;
            border: 2px solid var(--accent-primary);
            z-index: 10002;
            text-align: center;
            min-width: 400px;
            box-shadow: 0 0 50px var(--accent-primary);
        `;
        
        this.beatMatcherGameUI.innerHTML = `
            <h2 style="margin-bottom: 20px;">🎵 Beat Matcher</h2>
            <div style="font-size: 3rem; margin: 20px 0;" id="beatCounter">0</div>
            <div style="display: flex; justify-content: space-around; margin: 20px 0;">
                <div>Perfect: <span id="perfectCount">0</span></div>
                <div>Good: <span id="goodCount">0</span></div>
                <div>Miss: <span id="missCount">0</span></div>
            </div>
            <div style="margin: 20px 0;">
                <div style="font-size: 1.5rem;">BPM: <span id="bpmDisplay">${this.beatMatcherBPM}</span></div>
                <input type="range" id="bpmSlider" min="60" max="200" value="${this.beatMatcherBPM}" style="width: 100%; margin: 10px 0;">
            </div>
            <div style="color: var(--accent-primary); margin: 20px 0;">
                <i class="fas fa-arrow-left"></i> Press SPACE on the beat! <i class="fas fa-arrow-right"></i>
            </div>
            <button class="ctrl-btn" id="stopBeatMatcher" style="width: 100%;">Stop Game</button>
        `;
        
        document.body.appendChild(this.beatMatcherGameUI);
        
        // BPM slider
        const bpmSlider = document.getElementById('bpmSlider');
        bpmSlider.addEventListener('input', (e) => {
            this.beatMatcherBPM = parseInt(e.target.value);
            document.getElementById('bpmDisplay').textContent = this.beatMatcherBPM;
            
            if (this.beatMatcherInterval) {
                clearInterval(this.beatMatcherInterval);
                this.startBeatInterval();
            }
        });
        
        // Stop button
        document.getElementById('stopBeatMatcher').addEventListener('click', () => {
            this.stopBeatMatcher();
        });
        
        // Start beat interval
        this.startBeatInterval();
        
        // Spacebar handler
        const spaceHandler = (e) => {
            if (e.code === 'Space' && this.beatMatcherActive) {
                e.preventDefault();
                
                this.beatMatcherLastHit = Date.now();
                
                if (this.beatMatcherLastBeat === 0) {
                    this.showNotification('⏰ Wait for the first beat!', 'info', 1000);
                    return;
                }
                
                const timeSinceBeat = this.beatMatcherLastHit - this.beatMatcherLastBeat;
                const accuracy = Math.abs(timeSinceBeat);
                
                if (accuracy < 50) {
                    this.beatMatcherPerfectHits++;
                    this.beatMatcherScore += 100;
                    this.showNotification('🎯 PERFECT! +100', 'success', 200);
                } else if (accuracy < 100) {
                    this.beatMatcherGoodHits++;
                    this.beatMatcherScore += 50;
                    this.showNotification('👍 GOOD! +50', 'info', 200);
                } else {
                    this.beatMatcherMisses++;
                    this.showNotification('👎 MISS...', 'error', 200);
                }
                
                // Update UI
                document.getElementById('beatCounter').textContent = this.beatMatcherScore;
                document.getElementById('perfectCount').textContent = this.beatMatcherPerfectHits;
                document.getElementById('goodCount').textContent = this.beatMatcherGoodHits;
                document.getElementById('missCount').textContent = this.beatMatcherMisses;
            }
        };
        
        document.addEventListener('keydown', spaceHandler);
        this.beatMatcherHandler = spaceHandler;
    }
    
    startBeatInterval() {
        if (this.beatMatcherInterval) {
            clearInterval(this.beatMatcherInterval);
        }
        
        this.beatMatcherInterval = setInterval(() => {
            if (!this.beatMatcherActive) return;
            
            this.beatMatcherLastBeat = Date.now();
            
            // Create visual beat indicator
            const beat = document.createElement('div');
            beat.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 300px;
                height: 300px;
                border-radius: 50%;
                background: var(--accent-primary);
                opacity: 0.3;
                pointer-events: none;
                z-index: 10002;
                animation: beatPulse 0.2s ease-out;
            `;
            document.body.appendChild(beat);
            setTimeout(() => beat.remove(), 200);
            
        }, 60000 / this.beatMatcherBPM);
    }
    
    stopBeatMatcher() {
        this.beatMatcherActive = false;
        if (this.beatMatcherInterval) {
            clearInterval(this.beatMatcherInterval);
            this.beatMatcherInterval = null;
        }
        if (this.beatMatcherHandler) {
            document.removeEventListener('keydown', this.beatMatcherHandler);
        }
        
        if (this.beatMatcherGameUI) {
            this.beatMatcherGameUI.remove();
            this.beatMatcherGameUI = null;
        }
        
        this.showNotification(`🏆 Final Score: ${this.beatMatcherScore}`, 'success', 3000);
    }
    
    // ===== RHYTHM GAME =====
    startRhythmGame() {
        if (this.rhythmGameActive) {
            this.stopRhythmGame();
            return;
        }
        
        this.rhythmGameActive = true;
        this.rhythmGameScore = 0;
        this.rhythmGameCombo = 0;
        this.rhythmGameMaxCombo = 0;
        this.rhythmGameNotes = [];
        
        // Create game UI
        this.rhythmGameUI = document.createElement('div');
        this.rhythmGameUI.className = 'rhythm-game-ui';
        this.rhythmGameUI.id = 'rhythmGameUI';
        this.rhythmGameUI.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            padding: 30px;
            border-radius: 30px;
            border: 2px solid var(--accent-primary);
            z-index: 10002;
            text-align: center;
            min-width: 500px;
            box-shadow: 0 0 50px var(--accent-primary);
        `;
        
        this.rhythmGameUI.innerHTML = `
            <h2 style="margin-bottom: 20px;">🎸 Rhythm Game</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div>Score: <span id="rhythmScore">0</span></div>
                <div>Combo: <span id="rhythmCombo">0</span></div>
                <div>Max Combo: <span id="rhythmMaxCombo">0</span></div>
            </div>
            <div id="rhythmLanes" style="display: flex; justify-content: center; gap: 20px; margin: 30px 0;">
                <div class="rhythm-lane" data-key="A" style="width: 80px; height: 200px; background: rgba(255,51,102,0.2); border-radius: 10px; border: 2px solid var(--accent-primary); position: relative;">
                    <div style="margin-top: 10px;">A</div>
                </div>
                <div class="rhythm-lane" data-key="S" style="width: 80px; height: 200px; background: rgba(107,78,255,0.2); border-radius: 10px; border: 2px solid var(--accent-secondary); position: relative;">
                    <div style="margin-top: 10px;">S</div>
                </div>
                <div class="rhythm-lane" data-key="D" style="width: 80px; height: 200px; background: rgba(0,212,255,0.2); border-radius: 10px; border: 2px solid var(--accent-tertiary); position: relative;">
                    <div style="margin-top: 10px;">D</div>
                </div>
                <div class="rhythm-lane" data-key="F" style="width: 80px; height: 200px; background: rgba(255,193,7,0.2); border-radius: 10px; border: 2px solid #ffc107; position: relative;">
                    <div style="margin-top: 10px;">F</div>
                </div>
            </div>
            <div style="margin: 20px 0; color: var(--text-secondary);">
                Press A, S, D, F when notes reach the bottom!
            </div>
            <button class="ctrl-btn" id="stopRhythmGame" style="width: 100%;">Stop Game</button>
        `;
        
        document.body.appendChild(this.rhythmGameUI);
        
        // Note generation interval
        this.rhythmGameInterval = setInterval(() => {
            if (!this.rhythmGameActive) return;
            
            const lanes = document.querySelectorAll('.rhythm-lane');
            if (lanes.length === 0) return;
            
            const randomLane = Math.floor(Math.random() * lanes.length);
            const lane = lanes[randomLane];
            
            const note = document.createElement('div');
            note.className = 'rhythm-note';
            note.style.cssText = `
                position: absolute;
                top: 0;
                left: 10px;
                right: 10px;
                height: 30px;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                border-radius: 15px;
                animation: note-fall ${2 - Math.min(0.5, this.rhythmGameScore / 2000)}s linear forwards;
            `;
            
            note.addEventListener('animationend', () => {
                if (note.parentNode) {
                    note.remove();
                    this.rhythmGameCombo = 0;
                    this.showNotification('❌ Miss!', 'error', 300);
                }
            });
            
            lane.appendChild(note);
        }, 800);
        
        // Key handler
        this.rhythmGameKeyHandler = (e) => {
            if (!this.rhythmGameActive) return;
            
            const key = e.key.toUpperCase();
            if (!['A', 'S', 'D', 'F'].includes(key)) return;
            
            const lane = document.querySelector(`.rhythm-lane[data-key="${key}"]`);
            if (!lane) return;
            
            const notes = lane.querySelectorAll('.rhythm-note');
            
            if (notes.length > 0) {
                const note = notes[0];
                const noteStyle = window.getComputedStyle(note);
                const top = parseInt(noteStyle.top) || 0;
                
                if (top > 150) {
                    note.remove();
                    this.rhythmGameScore += 100;
                    this.rhythmGameCombo++;
                    this.rhythmGameMaxCombo = Math.max(this.rhythmGameMaxCombo, this.rhythmGameCombo);
                    
                    document.getElementById('rhythmScore').textContent = this.rhythmGameScore;
                    document.getElementById('rhythmCombo').textContent = this.rhythmGameCombo;
                    document.getElementById('rhythmMaxCombo').textContent = this.rhythmGameMaxCombo;
                    
                    this.showNotification(`🎯 Hit! +100 (${this.rhythmGameCombo}x Combo!)`, 'success', 300);
                    if (this.pianoAudioContext) {
                        this.playPianoNote('C4', 261.63);
                    }
                }
            }
        };
        
        document.addEventListener('keydown', this.rhythmGameKeyHandler);
        
        // Stop button
        document.getElementById('stopRhythmGame').addEventListener('click', () => {
            this.stopRhythmGame();
        });
    }
    
    stopRhythmGame() {
        this.rhythmGameActive = false;
        
        if (this.rhythmGameInterval) {
            clearInterval(this.rhythmGameInterval);
            this.rhythmGameInterval = null;
        }
        
        if (this.rhythmGameKeyHandler) {
            document.removeEventListener('keydown', this.rhythmGameKeyHandler);
        }
        
        if (this.rhythmGameUI) {
            this.rhythmGameUI.remove();
            this.rhythmGameUI = null;
        }
        
        this.rhythmGameNotes = [];
        this.showNotification(`🏆 Rhythm Game Score: ${this.rhythmGameScore}`, 'success', 3000);
    }
    
    // ===== VINYL SPIN CHALLENGE =====
    startVinylChallenge() {
        this.showNotification('💿 Spin the vinyl! Click as fast as you can!', 'info', 3000);
        
        let spins = 0;
        const vinyl = this.vinyl;
        const originalSpin = vinyl.style.animation;
        
        vinyl.style.animation = 'spin 0.5s linear infinite';
        
        const clickHandler = (e) => {
            e.stopPropagation();
            spins++;
            this.showNotification(`💫 Spins: ${spins}`, 'success', 200);
            
            if (spins >= 30) {
                this.showNotification('🎉 YOU WIN! Perfect spin master!', 'success', 3000);
                vinyl.style.animation = originalSpin;
                vinyl.removeEventListener('click', clickHandler);
            }
        };
        
        vinyl.addEventListener('click', clickHandler);
        
        setTimeout(() => {
            vinyl.removeEventListener('click', clickHandler);
            if (spins < 30) {
                this.showNotification(`💿 You spun ${spins} times. Try again!`, 'info', 3000);
            }
            vinyl.style.animation = originalSpin;
        }, 10000);
    }
    
    // ===== MELODY MEMORY GAME =====
    startMemoryGame() {
        this.showNotification('🧠 Melody Memory - Watch the sequence!', 'info', 3000);
        
        const notes = ['do', 're', 'mi', 'fa', 'so', 'la', 'ti'];
        let sequence = [];
        let playerSequence = [];
        let round = 1;
        
        const gameContainer = document.createElement('div');
        gameContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            padding: 30px;
            border-radius: 30px;
            border: 2px solid var(--accent-primary);
            z-index: 10002;
            text-align: center;
            min-width: 400px;
        `;
        
        gameContainer.innerHTML = `
            <h3 style="margin-bottom: 20px;">Round <span id="roundNum">1</span></h3>
            <div id="noteDisplay" style="font-size: 3rem; margin: 20px 0;">🎵</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px;">
                ${notes.map(note => `<button class="ctrl-btn note-btn" data-note="${note}" style="font-size: 1.2rem;">${note.toUpperCase()}</button>`).join('')}
            </div>
        `;
        
        document.body.appendChild(gameContainer);
        
        const playSequence = () => {
            sequence.push(notes[Math.floor(Math.random() * notes.length)]);
            playerSequence = [];
            
            let i = 0;
            const interval = setInterval(() => {
                if (i < sequence.length) {
                    const note = sequence[i];
                    this.showNotification(`🎵 ${note.toUpperCase()}`, 'info', 300);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 800);
        };
        
        playSequence();
        
        document.querySelectorAll('.note-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const note = btn.dataset.note;
                playerSequence.push(note);
                
                if (playerSequence[playerSequence.length - 1] !== sequence[playerSequence.length - 1]) {
                    this.showNotification('❌ Wrong note! Game over!', 'error', 2000);
                    gameContainer.remove();
                } else if (playerSequence.length === sequence.length) {
                    round++;
                    document.getElementById('roundNum').textContent = round;
                    this.showNotification('✅ Correct! Next round!', 'success', 1000);
                    setTimeout(playSequence, 1000);
                }
            });
        });
    }
    
    // ===== MINI GAMES MENU =====
    createMiniGames() {
        const gamesBtn = document.createElement('button');
        gamesBtn.className = 'ctrl-btn';
        gamesBtn.id = 'gamesBtn';
        gamesBtn.innerHTML = '<i class="fas fa-gamepad"></i> Games';
        gamesBtn.addEventListener('click', () => this.showGamesMenu());
        document.querySelector('.control-bar').appendChild(gamesBtn);
    }
    
    showGamesMenu() {
        const menu = document.createElement('div');
        menu.className = 'games-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            padding: 30px;
            border-radius: 30px;
            border: 2px solid var(--accent-primary);
            z-index: 10001;
            box-shadow: 0 0 50px var(--accent-primary);
            min-width: 350px;
            animation: menu-appear 0.3s;
        `;
        
        menu.innerHTML = `
            <h2 style="margin-bottom: 20px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <i class="fas fa-gamepad" style="color: var(--accent-primary);"></i> 
                Mini Games
            </h2>
            <div style="display: grid; gap: 15px;">
                <button class="ctrl-btn" id="beatMatcherBtn" style="width: 100%; padding: 15px;">
                    <i class="fas fa-drum"></i> Beat Matcher
                </button>
                <button class="ctrl-btn" id="rhythmGameBtn" style="width: 100%; padding: 15px;">
                    <i class="fas fa-guitar"></i> Rhythm Game
                </button>
                <button class="ctrl-btn" id="vinylSpinBtn" style="width: 100%; padding: 15px;">
                    <i class="fas fa-record-vinyl"></i> Vinyl Spin Challenge
                </button>
                <button class="ctrl-btn" id="memoryGameBtn" style="width: 100%; padding: 15px;">
                    <i class="fas fa-brain"></i> Melody Memory
                </button>
                <button class="ctrl-btn" id="closeGamesBtn" style="width: 100%; padding: 15px; background: rgba(255,0,0,0.3);">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        document.getElementById('closeGamesBtn').addEventListener('click', () => menu.remove());
        document.getElementById('beatMatcherBtn').addEventListener('click', () => {
            menu.remove();
            this.startBeatMatcher();
        });
        document.getElementById('rhythmGameBtn').addEventListener('click', () => {
            menu.remove();
            this.startRhythmGame();
        });
        document.getElementById('vinylSpinBtn').addEventListener('click', () => {
            menu.remove();
            this.startVinylChallenge();
        });
        document.getElementById('memoryGameBtn').addEventListener('click', () => {
            menu.remove();
            this.startMemoryGame();
        });
    }
    
    // ===== PIANO FEATURE =====
    setupPianoAudio() {
        try {
            this.pianoAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Piano audio not supported');
        }
    }
    
    createPiano() {
        const container = document.createElement('div');
        container.className = 'piano-container';
        container.id = 'pianoContainer';
        container.style.cssText = `
            margin-top: 20px;
            padding: 20px;
            background: var(--glass-bg);
            border-radius: 20px;
            border: 1px solid var(--glass-border);
            display: none;
            position: relative;
            z-index: 10;
            overflow-x: auto;
            white-space: nowrap;
        `;
        
        this.pianoOctaves.forEach(octave => {
            this.pianoNotes.forEach((note, index) => {
                const isBlack = note.includes('#');
                const key = document.createElement('div');
                key.className = `piano-key ${isBlack ? 'black' : 'white'}`;
                key.dataset.note = `${note}${octave}`;
                key.dataset.frequency = this.getNoteFrequency(note, octave);
                
                key.style.cssText = `
                    display: inline-block;
                    width: ${isBlack ? '40px' : '60px'};
                    height: ${isBlack ? '120px' : '200px'};
                    background: ${isBlack ? '#333' : 'white'};
                    margin-left: ${isBlack ? '-20px' : '0'};
                    margin-right: ${isBlack ? '-20px' : '0'};
                    border-radius: 0 0 5px 5px;
                    border: 1px solid #666;
                    position: relative;
                    z-index: ${isBlack ? '2' : '1'};
                    cursor: pointer;
                    transition: all 0.1s;
                    color: ${isBlack ? 'white' : '#333'};
                    text-align: center;
                    line-height: ${isBlack ? '120px' : '200px'};
                    font-size: 12px;
                    box-shadow: 0 5px 10px rgba(0,0,0,0.2);
                `;
                
                key.innerHTML = `${note}${octave}`;
                
                key.addEventListener('mouseenter', () => {
                    key.style.transform = 'scale(1.02)';
                    key.style.boxShadow = '0 0 20px var(--accent-primary)';
                });
                
                key.addEventListener('mouseleave', () => {
                    key.style.transform = 'scale(1)';
                    key.style.boxShadow = '0 5px 10px rgba(0,0,0,0.2)';
                });
                
                key.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.playPianoNote(key.dataset.note, key.dataset.frequency);
                    key.style.background = isBlack ? '#666' : '#f0f0f0';
                    key.style.transform = 'scale(0.98)';
                    this.showNotification(`🎹 ${key.dataset.note}`, 'info', 200);
                });
                
                key.addEventListener('mouseup', () => {
                    key.style.background = isBlack ? '#333' : 'white';
                    key.style.transform = 'scale(1)';
                });
                
                key.addEventListener('mouseleave', () => {
                    key.style.background = isBlack ? '#333' : 'white';
                    key.style.transform = 'scale(1)';
                });
                
                container.appendChild(key);
                this.pianoKeys.push(key);
            });
        });
        
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 10px;
            justify-content: center;
        `;
        
        const recordBtn = document.createElement('button');
        recordBtn.className = 'ctrl-btn';
        recordBtn.innerHTML = '<i class="fas fa-circle"></i> Record';
        recordBtn.addEventListener('click', () => this.togglePianoRecording());
        
        const playBtn = document.createElement('button');
        playBtn.className = 'ctrl-btn';
        playBtn.innerHTML = '<i class="fas fa-play"></i> Play Recording';
        playBtn.addEventListener('click', () => this.playPianoRecording());
        
        const clearBtn = document.createElement('button');
        clearBtn.className = 'ctrl-btn';
        clearBtn.innerHTML = '<i class="fas fa-trash"></i> Clear';
        clearBtn.addEventListener('click', () => this.clearPianoRecording());
        
        controls.appendChild(recordBtn);
        controls.appendChild(playBtn);
        controls.appendChild(clearBtn);
        container.appendChild(controls);
        
        const visualizerContainer = document.querySelector('.visualizer-container');
        visualizerContainer.appendChild(container);
        this.pianoContainer = container;
        
        const pianoBtn = document.createElement('button');
        pianoBtn.className = 'ctrl-btn';
        pianoBtn.id = 'pianoToggle';
        pianoBtn.innerHTML = '<i class="fas fa-piano"></i> Piano';
        pianoBtn.addEventListener('click', () => this.togglePiano());
        document.querySelector('.control-bar').appendChild(pianoBtn);
    }
    
    getNoteFrequency(note, octave) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const A4Index = notes.indexOf('A') + 4 * 12;
        
        let noteIndex = notes.indexOf(note) + octave * 12;
        let semitonesFromA4 = noteIndex - A4Index;
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
    
    playPianoNote(note, frequency) {
        if (!this.pianoAudioContext) return;
        
        const oscillator = this.pianoAudioContext.createOscillator();
        const gainNode = this.pianoAudioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.3, this.pianoAudioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.pianoAudioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.pianoAudioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.pianoAudioContext.currentTime + 0.5);
        
        if (this.pianoRecording) {
            this.pianoRecording.push({
                note,
                frequency,
                time: Date.now() - this.pianoRecordingStartTime
            });
        }
    }
    
    togglePiano() {
        this.pianoEnabled = !this.pianoEnabled;
        const btn = document.getElementById('pianoToggle');
        
        if (this.pianoEnabled) {
            this.pianoContainer.style.display = 'block';
            btn.classList.add('active');
            this.showNotification('🎹 Piano enabled! Click keys or use keyboard (A-S-D-F-G-H-J-K-L)', 'success', 3000);
        } else {
            this.pianoContainer.style.display = 'none';
            btn.classList.remove('active');
        }
    }
    
    togglePianoRecording() {
        if (!this.pianoRecording) {
            this.pianoRecording = [];
            this.pianoRecordingStartTime = Date.now();
            this.showNotification('🔴 Recording started...', 'warning', 2000);
        } else {
            this.pianoRecording = null;
            this.showNotification('⏹️ Recording stopped', 'info', 2000);
        }
    }
    
    playPianoRecording() {
        if (!this.pianoRecording || this.pianoRecording.length === 0) {
            this.showNotification('No recording to play', 'info', 2000);
            return;
        }
        
        this.showNotification('▶️ Playing recording...', 'success', 2000);
        
        this.pianoRecording.forEach(note => {
            setTimeout(() => {
                this.playPianoNote(note.note, note.frequency);
            }, note.time);
        });
    }
    
    clearPianoRecording() {
        this.pianoRecording = null;
        this.showNotification('🗑️ Recording cleared', 'info', 2000);
    }
    
    // ===== LYRICS FEATURE =====
    createLyricsContainer() {
        let container = document.getElementById('lyricsContainer');
        if (!container) {
            container = document.createElement('div');
            container.className = 'lyrics-container';
            container.id = 'lyricsContainer';
            container.style.cssText = `
                margin-top: 20px;
                padding: 15px;
                background: var(--glass-bg);
                border-radius: 20px;
                border: 1px solid var(--glass-border);
                max-height: 200px;
                overflow-y: auto;
                scroll-behavior: smooth;
                display: none;
                position: relative;
                z-index: 10;
            `;
            
            const visualizerContainer = document.querySelector('.visualizer-container');
            if (visualizerContainer) {
                visualizerContainer.appendChild(container);
            } else {
                document.querySelector('.desk .inner').appendChild(container);
            }
        }
        
        this.lyricsContainer = container;
        
        if (!document.getElementById('lyricsToggle')) {
            const lyricsBtn = document.createElement('button');
            lyricsBtn.className = 'ctrl-btn';
            lyricsBtn.id = 'lyricsToggle';
            lyricsBtn.innerHTML = '<i class="fas fa-align-left"></i> Lyrics';
            lyricsBtn.addEventListener('click', () => this.toggleLyrics());
            document.querySelector('.control-bar').appendChild(lyricsBtn);
        }
    }
    
    toggleLyrics() {
        this.lyricsEnabled = !this.lyricsEnabled;
        const btn = document.getElementById('lyricsToggle');
        
        if (this.lyricsEnabled && this.isPlaying) {
            this.fetchLyrics();
            this.lyricsContainer.style.display = 'block';
            btn.classList.add('active');
            this.showNotification('📝 Lyrics enabled', 'success', 2000);
        } else if (this.lyricsEnabled && !this.isPlaying) {
            this.showNotification('🎵 Start playing to see lyrics', 'info', 2000);
            this.lyricsContainer.style.display = 'block';
            this.showPlaceholderLyrics();
            btn.classList.add('active');
        } else {
            this.lyricsContainer.style.display = 'none';
            btn.classList.remove('active');
            if (this.lyricsInterval) {
                clearInterval(this.lyricsInterval);
            }
            this.showNotification('📝 Lyrics disabled', 'info', 2000);
        }
    }
    
    showPlaceholderLyrics() {
        const placeholderLyrics = [
            "🎵 Waiting for music...",
            "✨ Drop a file or paste a link",
            "💫 Lyrics will appear here",
            "🎶 Press play to start",
            "🌟 Enjoy the vibes!"
        ];
        
        this.currentLyrics = placeholderLyrics;
        this.updateLyricsDisplay();
    }
    
    fetchLyrics() {
        const trackName = this.trackTitle.textContent.toLowerCase();
        let lyrics = [
            "🎵 Now playing...",
            "✨ Enjoy the music",
            "💫 Feel the rhythm",
            "🎶 Let it flow",
            "🌟 Good vibes only"
        ];
        
        this.currentLyrics = lyrics;
        this.updateLyricsDisplay();
        
        let index = 0;
        if (this.lyricsInterval) clearInterval(this.lyricsInterval);
        
        this.lyricsInterval = setInterval(() => {
            if (this.isPlaying && this.lyricsEnabled) {
                this.highlightLyric(index);
                index = (index + 1) % this.currentLyrics.length;
            }
        }, 3000);
    }
    
    updateLyricsDisplay() {
        if (!this.lyricsContainer) return;
        
        this.lyricsContainer.innerHTML = '';
        this.currentLyrics.forEach((line, i) => {
            const div = document.createElement('div');
            div.className = 'lyric-line';
            div.id = `lyric-${i}`;
            div.textContent = line;
            div.style.cssText = `
                padding: 8px 12px;
                text-align: center;
                color: var(--text-secondary);
                transition: all 0.3s;
                font-size: 1rem;
                border-radius: 10px;
                margin: 2px 0;
            `;
            this.lyricsContainer.appendChild(div);
        });
    }
    
    highlightLyric(index) {
        document.querySelectorAll('.lyric-line').forEach(line => {
            line.classList.remove('active');
            line.style.cssText = `
                padding: 8px 12px;
                text-align: center;
                color: var(--text-secondary);
                font-size: 1rem;
                border-radius: 10px;
                margin: 2px 0;
            `;
        });
        
        const activeLine = document.getElementById(`lyric-${index}`);
        if (activeLine) {
            activeLine.classList.add('active');
            activeLine.style.cssText = `
                padding: 8px 12px;
                text-align: center;
                color: var(--accent-primary);
                font-size: 1.1rem;
                font-weight: bold;
                text-shadow: 0 0 10px var(--accent-primary);
                background: rgba(255, 51, 102, 0.1);
                border-radius: 10px;
                margin: 2px 0;
                transform: scale(1.02);
            `;
            
            activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // ===== EXIT WIDGET BUTTON =====
    createExitButton() {
        const exitBtn = document.createElement('button');
        exitBtn.className = 'exit-widget-btn';
        exitBtn.id = 'exitWidgetBtn';
        exitBtn.innerHTML = '<i class="fas fa-times"></i>';
        exitBtn.title = 'Exit Widget Mode';
        document.body.appendChild(exitBtn);
        
        exitBtn.addEventListener('click', () => {
            if (this.widgetMode) {
                this.toggleWidgetMode();
            }
        });
    }
    
    // ===== TONARM INDICATOR =====
    addTonearmIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'tonearm-indicator';
        indicator.innerHTML = '<i class="fas fa-circle"></i> ON VINYL';
        this.tonearm.appendChild(indicator);
    }
    
    // ===== KEYBOARD SHORTCUTS =====
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            if (this.beatMatcherActive && e.code === 'Space') {
                return;
            }
            
            if (this.rhythmGameActive && ['KeyA', 'KeyS', 'KeyD', 'KeyF'].includes(e.code)) {
                return;
            }
            
            if (this.pianoEnabled) {
                const pianoKeyMap = {
                    'KeyA': 'C4',
                    'KeyW': 'C#4',
                    'KeyS': 'D4',
                    'KeyE': 'D#4',
                    'KeyD': 'E4',
                    'KeyF': 'F4',
                    'KeyT': 'F#4',
                    'KeyG': 'G4',
                    'KeyY': 'G#4',
                    'KeyH': 'A4',
                    'KeyU': 'A#4',
                    'KeyJ': 'B4',
                    'KeyK': 'C5'
                };
                
                if (pianoKeyMap[e.code]) {
                    e.preventDefault();
                    const note = pianoKeyMap[e.code];
                    const freq = this.getNoteFrequency(note.slice(0, -1), parseInt(note.slice(-1)));
                    this.playPianoNote(note, freq);
                    
                    const pianoKey = Array.from(this.pianoKeys).find(k => k.dataset.note === note);
                    if (pianoKey) {
                        pianoKey.style.background = '#ff3366';
                        pianoKey.style.transform = 'scale(0.98)';
                        setTimeout(() => {
                            pianoKey.style.background = note.includes('#') ? '#333' : 'white';
                            pianoKey.style.transform = 'scale(1)';
                        }, 200);
                    }
                    return;
                }
            }
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (!this.beatMatcherActive) {
                        this.togglePlayPause();
                    }
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) this.playNext();
                    else this.seekBy(5);
                    break;
                case 'ArrowLeft':
                    if (e.ctrlKey) this.playPrevious();
                    else this.seekBy(-5);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.setVolume(Math.min(100, this.volumeSlider.value + 5));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.setVolume(Math.max(0, this.volumeSlider.value - 5));
                    break;
                case 'KeyM':
                    this.toggleMute();
                    break;
                case 'KeyR':
                    this.toggleRepeat();
                    break;
                case 'KeyS':
                    this.toggleShuffle();
                    break;
                case 'KeyF':
                    this.toggleFavorite();
                    break;
                case 'KeyW':
                    this.toggleWidgetMode();
                    break;
                case 'KeyV':
                    this.toggleVisualizerMode();
                    break;
                case 'KeyC':
                    this.toggleCrackle();
                    break;
                case 'KeyL':
                    this.toggleLyrics();
                    break;
                case 'KeyP':
                    this.togglePiano();
                    break;
                case 'KeyG':
                    this.showGamesMenu();
                    break;
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                case 'Digit6':
                case 'Digit7':
                    const themeIndex = parseInt(e.code.replace('Digit', '')) - 1;
                    const themes = ['dark', 'sunset', 'ocean', 'forest', 'midnight', 'coffee', 'underwater'];
                    if (themeIndex < themes.length) {
                        this.setTheme(themes[themeIndex]);
                    }
                    break;
            }
        });
    }
    
    // ===== MEDIA SESSION =====
    setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                this.seekBy(-(details.seekOffset || 10));
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                this.seekBy(details.seekOffset || 10);
            });
        }
    }
    
    // ===== WEATHER EFFECTS - NOW WITH ALL 10! =====
    createWeatherEffects() {
        // Original 4
        const rainContainer = document.createElement('div');
        rainContainer.className = 'rain-container';
        rainContainer.id = 'rainContainer';
        document.body.appendChild(rainContainer);
        
        const snowContainer = document.createElement('div');
        snowContainer.className = 'snow-container';
        snowContainer.id = 'snowContainer';
        document.body.appendChild(snowContainer);
        
        const starsContainer = document.createElement('div');
        starsContainer.className = 'stars-container';
        starsContainer.id = 'starsContainer';
        document.body.appendChild(starsContainer);
        
        const firefliesContainer = document.createElement('div');
        firefliesContainer.className = 'fireflies-container';
        firefliesContainer.id = 'firefliesContainer';
        document.body.appendChild(firefliesContainer);
        
        // NEW: Add 6 more weather effects!
        this.createAurora();
        this.createClouds();
        this.createLeaves();
        this.createButterflies();
        this.createRainbow();
        this.createFog();
        
        this.createRain(50);
        this.createSnow(30);
        this.createStars(100);
        this.createFireflies(20);
    }
    
    createAurora() {
        const container = document.createElement('div');
        container.className = 'aurora-container';
        container.id = 'auroraContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9995;
            opacity: 0;
            transition: opacity 0.5s ease;
            background: linear-gradient(135deg, rgba(0,255,0,0.1), rgba(0,0,255,0.1), rgba(255,0,255,0.1));
            animation: aurora-wave 15s infinite alternate;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes aurora-wave {
                0% { background-position: 0% 50%; opacity: 0.3; filter: hue-rotate(0deg); }
                50% { background-position: 100% 50%; opacity: 0.7; filter: hue-rotate(30deg); }
                100% { background-position: 0% 50%; opacity: 0.3; filter: hue-rotate(0deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(container);
    }
    
    createClouds() {
        const container = document.createElement('div');
        container.className = 'clouds-container';
        container.id = 'cloudsContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9995;
            opacity: 0;
            transition: opacity 0.5s ease;
            overflow: hidden;
        `;
        
        for (let i = 0; i < 12; i++) {
            const cloud = document.createElement('div');
            cloud.style.cssText = `
                position: absolute;
                top: ${Math.random() * 70}%;
                left: ${Math.random() * 100}%;
                width: ${100 + Math.random() * 200}px;
                height: ${40 + Math.random() * 50}px;
                background: rgba(255,255,255,0.2);
                border-radius: 100px;
                filter: blur(20px);
                animation: cloud-float ${40 + Math.random() * 60}s linear infinite;
                animation-delay: ${Math.random() * -30}s;
                box-shadow: 0 0 30px rgba(255,255,255,0.1);
            `;
            container.appendChild(cloud);
        }
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes cloud-float {
                from { transform: translateX(-300px); }
                to { transform: translateX(calc(100vw + 300px)); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(container);
    }
    
    createLeaves() {
        const container = document.createElement('div');
        container.className = 'leaves-container';
        container.id = 'leavesContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9995;
            opacity: 0;
            transition: opacity 0.5s ease;
            overflow: hidden;
        `;
        
        const leaves = ['🍂', '🍁', '🌿', '🍃', '🌱', '🍂', '🍁'];
        for (let i = 0; i < 40; i++) {
            const leaf = document.createElement('div');
            leaf.innerHTML = leaves[Math.floor(Math.random() * leaves.length)];
            leaf.style.cssText = `
                position: absolute;
                top: -50px;
                left: ${Math.random() * 100}%;
                font-size: ${20 + Math.random() * 25}px;
                opacity: 0.6;
                animation: leaf-fall ${10 + Math.random() * 15}s linear infinite;
                animation-delay: ${Math.random() * -10}s;
                transform: rotate(${Math.random() * 360}deg);
                filter: drop-shadow(0 0 5px rgba(255,200,100,0.3));
            `;
            container.appendChild(leaf);
        }
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes leaf-fall {
                0% { transform: translateY(-50px) rotate(0deg); opacity: 0.6; }
                50% { transform: translateY(50vh) rotate(180deg); opacity: 0.4; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0.2; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(container);
    }
    
    createButterflies() {
        const container = document.createElement('div');
        container.className = 'butterflies-container';
        container.id = 'butterfliesContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9995;
            opacity: 0;
            transition: opacity 0.5s ease;
            overflow: hidden;
        `;
        
        const butterflies = ['🦋', '🦋', '🦋', '🦋', '🦋'];
        const colors = ['#ff69b4', '#87cefa', '#98fb98', '#dda0dd', '#f0e68c'];
        for (let i = 0; i < 25; i++) {
            const butterfly = document.createElement('div');
            butterfly.innerHTML = butterflies[Math.floor(Math.random() * butterflies.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            butterfly.style.cssText = `
                position: absolute;
                top: ${Math.random() * 100}%;
                left: -50px;
                font-size: ${20 + Math.random() * 20}px;
                opacity: 0.7;
                animation: butterfly-fly ${20 + Math.random() * 20}s linear infinite;
                animation-delay: ${Math.random() * -15}s;
                filter: drop-shadow(0 0 5px ${color});
                color: ${color};
            `;
            container.appendChild(butterfly);
        }
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes butterfly-fly {
                0% { transform: translateX(-50px) translateY(0) rotate(0deg); }
                20% { transform: translateX(20vw) translateY(-30px) rotate(10deg); }
                40% { transform: translateX(40vw) translateY(20px) rotate(-5deg); }
                60% { transform: translateX(60vw) translateY(-20px) rotate(8deg); }
                80% { transform: translateX(80vw) translateY(30px) rotate(-10deg); }
                100% { transform: translateX(100vw) translateY(0) rotate(0deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(container);
    }
    
    createRainbow() {
        const container = document.createElement('div');
        container.className = 'rainbow-container';
        container.id = 'rainbowContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9995;
            opacity: 0;
            transition: opacity 0.5s ease;
            overflow: hidden;
        `;
        
        const rainbow = document.createElement('div');
        rainbow.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            width: 80vw;
            height: 40vh;
            background: linear-gradient(180deg, 
                rgba(255,0,0,0.2) 0%, 
                rgba(255,165,0,0.2) 16.6%, 
                rgba(255,255,0,0.2) 33.3%, 
                rgba(0,255,0,0.2) 50%, 
                rgba(0,0,255,0.2) 66.6%, 
                rgba(75,0,130,0.2) 83.3%, 
                rgba(238,130,238,0.2) 100%);
            border-radius: 50% 50% 0 0;
            filter: blur(20px);
            animation: rainbow-pulse 5s infinite alternate;
        `;
        container.appendChild(rainbow);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rainbow-pulse {
                0% { opacity: 0.3; transform: translateX(-50%) scale(0.9); }
                100% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(container);
    }
    
    createFog() {
        const container = document.createElement('div');
        container.className = 'fog-container';
        container.id = 'fogContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9995;
            opacity: 0;
            transition: opacity 0.5s ease;
            overflow: hidden;
        `;
        
        for (let i = 0; i < 5; i++) {
            const fog = document.createElement('div');
            fog.style.cssText = `
                position: absolute;
                top: 0;
                left: ${i * 20}%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, 
                    rgba(255,255,255,0), 
                    rgba(255,255,255,0.1), 
                    rgba(255,255,255,0.2), 
                    rgba(255,255,255,0.1), 
                    rgba(255,255,255,0));
                filter: blur(50px);
                animation: fog-drift ${30 + i * 10}s infinite alternate;
                animation-delay: ${i * -5}s;
            `;
            container.appendChild(fog);
        }
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fog-drift {
                0% { transform: translateX(-20%) scale(1); opacity: 0.2; }
                50% { transform: translateX(20%) scale(1.2); opacity: 0.4; }
                100% { transform: translateX(-20%) scale(1); opacity: 0.2; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(container);
    }
    
    createRain(count) {
        const container = document.getElementById('rainContainer');
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const drop = document.createElement('div');
            drop.className = 'raindrop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
            drop.style.animationDelay = Math.random() * 2 + 's';
            drop.style.opacity = 0.3 + Math.random() * 0.7;
            container.appendChild(drop);
        }
    }
    
    createSnow(count) {
        const container = document.getElementById('snowContainer');
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            flake.style.left = Math.random() * 100 + '%';
            flake.style.animationDuration = (3 + Math.random() * 5) + 's';
            flake.style.animationDelay = Math.random() * 3 + 's';
            flake.style.width = (2 + Math.random() * 6) + 'px';
            flake.style.height = flake.style.width;
            container.appendChild(flake);
        }
    }
    
    createStars(count) {
        const container = document.getElementById('starsContainer');
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.width = (1 + Math.random() * 3) + 'px';
            star.style.height = star.style.width;
            star.style.setProperty('--duration', (1 + Math.random() * 3) + 's');
            star.style.animationDelay = Math.random() * 2 + 's';
            container.appendChild(star);
        }
    }
    
    createFireflies(count) {
        const container = document.getElementById('firefliesContainer');
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const firefly = document.createElement('div');
            firefly.className = 'firefly';
            firefly.style.left = Math.random() * 100 + '%';
            firefly.style.top = Math.random() * 100 + '%';
            firefly.style.animationDuration = (5 + Math.random() * 10) + 's';
            firefly.style.animationDelay = Math.random() * 3 + 's';
            container.appendChild(firefly);
        }
    }
    
    setWeatherEffect(effect) {
        // Hide all weather effects
        document.getElementById('rainContainer').classList.remove('active');
        document.getElementById('snowContainer').classList.remove('active');
        document.getElementById('starsContainer').classList.remove('active');
        document.getElementById('firefliesContainer').classList.remove('active');
        
        // Hide new weather effects
        const aurora = document.getElementById('auroraContainer');
        const clouds = document.getElementById('cloudsContainer');
        const leaves = document.getElementById('leavesContainer');
        const butterflies = document.getElementById('butterfliesContainer');
        const rainbow = document.getElementById('rainbowContainer');
        const fog = document.getElementById('fogContainer');
        
        if (aurora) aurora.classList.remove('active');
        if (clouds) clouds.classList.remove('active');
        if (leaves) leaves.classList.remove('active');
        if (butterflies) butterflies.classList.remove('active');
        if (rainbow) rainbow.classList.remove('active');
        if (fog) fog.classList.remove('active');
        
        // Show selected effect
        if (effect !== 'none') {
            const element = document.getElementById(effect + 'Container');
            if (element) {
                element.classList.add('active');
                
                // Special messages for each effect
                const messages = {
                    'rain': '☔ Rainy day vibes...',
                    'snow': '❄️ Winter wonderland!',
                    'stars': '✨ Stargazing mode...',
                    'fireflies': '🪰 Magical fireflies!',
                    'aurora': '🌌 Northern lights dancing!',
                    'clouds': '☁️ Floating in the clouds...',
                    'leaves': '🍂 Autumn leaves falling...',
                    'butterflies': '🦋 Butterflies everywhere!',
                    'rainbow': '🌈 Rainbow in the sky!',
                    'fog': '🌫️ Mysterious fog rolling in...'
                };
                
                this.showNotification(messages[effect] || `🌦️ ${effect} effect enabled`, 'info', 2000);
            }
        }
        
        this.weatherEffect = effect;
    }
    
    toggleWeather() {
        const effects = ['none', 'rain', 'snow', 'stars', 'fireflies', 'aurora', 'clouds', 'leaves', 'butterflies', 'rainbow', 'fog'];
        const currentIndex = effects.indexOf(this.weatherEffect);
        const nextIndex = (currentIndex + 1) % effects.length;
        this.setWeatherEffect(effects[nextIndex]);
    }
    
    // ===== TOGGLE FUNCTIONS =====
    toggleShuffle() {
        this.shuffleOn = !this.shuffleOn;
        const btn = document.getElementById('shuffleBtn');
        btn.classList.toggle('active');
        
        if (this.shuffleOn) {
            this.shuffleQueue();
            this.showNotification('🔀 Shuffle enabled', 'success', 1500);
        } else {
            this.showNotification('🔀 Shuffle disabled', 'info', 1500);
        }
    }
    
    toggleMute() {
        this.mainAudio.muted = !this.mainAudio.muted;
        if (this.youtubePlayer) {
            if (this.mainAudio.muted) {
                this.youtubePlayer.mute();
            } else {
                this.youtubePlayer.unMute();
            }
        }
        
        this.showNotification(
            this.mainAudio.muted ? '🔇 Muted' : '🔊 Unmuted',
            'info',
            1000
        );
    }
    
    seekBy(seconds) {
        if (this.currentSource === 'file') {
            this.mainAudio.currentTime = Math.max(0, Math.min(
                this.mainAudio.currentTime + seconds,
                this.mainAudio.duration
            ));
        }
    }
    
    toggleFavorite() {
        if (!this.currentSource) return;
        
        let trackInfo;
        if (this.currentSource === 'file' && this.currentFileIndex !== -1) {
            trackInfo = this.playQueue[this.currentFileIndex];
        } else if (this.currentSource === 'youtube') {
            trackInfo = {
                name: this.trackTitle.textContent,
                url: this.linkInput.value
            };
        }
        
        if (!trackInfo) return;
        
        const isFavorite = this.favorites.some(f => f.url === trackInfo.url);
        
        if (isFavorite) {
            this.favorites = this.favorites.filter(f => f.url !== trackInfo.url);
            this.showNotification('💔 Removed from favorites', 'info', 2000);
        } else {
            this.favorites.push(trackInfo);
            this.showNotification('❤️ Added to favorites', 'success', 2000);
        }
        
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }
    
    setPlaybackSpeed(speed) {
        this.playbackSpeed = speed;
        this.mainAudio.playbackRate = speed;
        if (this.youtubePlayer && this.youtubePlayer.setPlaybackRate) {
            this.youtubePlayer.setPlaybackRate(speed);
        }
        
        this.showNotification(`⚡ Playback speed: ${speed}x`, 'info', 1500);
    }
    
    toggleVisualizerMode() {
        const modes = ['bars', 'wave', 'circle', 'combined'];
        const currentIndex = modes.indexOf(this.visualizerMode);
        this.visualizerMode = modes[(currentIndex + 1) % modes.length];
        
        this.showNotification(`📊 Visualizer: ${this.visualizerMode} mode`, 'info', 1500);
    }
    
    cycleSpeed() {
        const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        const currentIndex = speeds.indexOf(this.playbackSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        this.setPlaybackSpeed(speeds[nextIndex]);
        
        const btn = document.getElementById('speedToggle');
        btn.innerHTML = `<i class="fas fa-tachometer-alt"></i> Speed ${this.playbackSpeed}x`;
    }
    
    // ===== ERROR HANDLING =====
    handleAudioError(e) {
        console.error('Audio error:', e);
        this.showNotification('❌ Error playing audio. Try another file.', 'error', 3000);
    }
    
    handleResize() {
        if (this.visualizerCanvas) {
            this.visualizerCanvas.width = this.visualizerCanvas.clientWidth;
            this.visualizerCanvas.height = this.visualizerCanvas.clientHeight;
        }
    }
    
    // ===== NOTIFICATIONS =====
    showNotification(message, type = 'info', duration = 3000) {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'info': 'fa-info-circle',
            'warning': 'fa-exclamation-triangle'
        }[type] || 'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    // ===== THEME MANAGEMENT =====
    loadThemeFromStorage() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        }
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const btn = document.getElementById('themeToggle');
        const icons = {
            'dark': 'moon',
            'sunset': 'sun',
            'ocean': 'water',
            'forest': 'tree',
            'midnight': 'star',
            'coffee': 'mug-hot',
            'underwater': 'fish'
        };
        btn.innerHTML = `<i class="fas fa-${icons[theme]}"></i> Theme`;
        
        this.showNotification(`🎨 Theme changed to ${theme}`, 'success', 1500);
    }
    
    // ===== DRAG & DROP SETUP =====
    setupVinylDropZone() {
        this.vinyl.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.vinyl.classList.add('drop-hover');
        });
        
        this.vinyl.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.vinyl.classList.remove('drop-hover');
        });
        
        this.vinyl.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.vinyl.classList.remove('drop-hover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFiles(files);
                this.showNotification('🎵 Dropped on vinyl! Loading tracks...', 'success', 2000);
            }
        });
        
        this.vinyl.addEventListener('click', (e) => {
            if (this.rhythmGameActive) {
                return;
            }
            document.getElementById('fileInput').click();
        });
    }
    
    setupDragAndDrop() {
        const overlay = document.getElementById('dragOverlay');
        
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            overlay.classList.add('show');
            
            if (this.dragOverlayTimeout) {
                clearTimeout(this.dragOverlayTimeout);
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            
            this.dragOverlayTimeout = setTimeout(() => {
                overlay.classList.remove('show');
            }, 200);
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.dragOverlayTimeout) {
                clearTimeout(this.dragOverlayTimeout);
            }
            overlay.classList.remove('show');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });
    }
    
    // ===== WIDGET MODE =====
    toggleWidgetMode() {
        this.widgetMode = !this.widgetMode;
        const desk = document.querySelector('.desk');
        const exitBtn = document.getElementById('exitWidgetBtn');
        
        if (this.widgetMode) {
            desk.classList.add('widget-mode');
            desk.style.position = 'fixed';
            desk.style.top = '50%';
            desk.style.left = '50%';
            desk.style.transform = 'translate(-50%, -50%)';
            desk.style.cursor = 'grab';
            exitBtn.classList.add('show');
            this.makeDraggable(desk);
            this.showNotification('📱 Widget mode enabled - Drag me anywhere! Double-click title to exit', 'success', 3000);
            
            desk.ondblclick = () => {
                this.toggleWidgetMode();
            };
        } else {
            desk.classList.remove('widget-mode');
            desk.style.position = 'relative';
            desk.style.top = 'auto';
            desk.style.left = 'auto';
            desk.style.transform = 'none';
            desk.style.cursor = 'default';
            desk.ondblclick = null;
            exitBtn.classList.remove('show');
            this.removeDraggable(desk);
            this.showNotification('🏠 Back to desktop mode', 'info', 2000);
        }
    }
    
    makeDraggable(element) {
        const dragHandler = (e) => {
            if (!this.widgetMode) return;
            this.isDragging = true;
            element.style.cursor = 'grabbing';
            
            const rect = element.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
        };
        
        const moveHandler = (e) => {
            if (!this.isDragging || !this.widgetMode) return;
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            const maxX = window.innerWidth - element.offsetWidth - 20;
            const maxY = window.innerHeight - element.offsetHeight - 20;
            
            element.style.left = Math.max(10, Math.min(x, maxX)) + 'px';
            element.style.top = Math.max(10, Math.min(y, maxY)) + 'px';
            element.style.transform = 'none';
        };
        
        const upHandler = () => {
            this.isDragging = false;
            if (this.widgetMode) {
                element.style.cursor = 'grab';
            }
        };
        
        element.addEventListener('mousedown', dragHandler);
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
        
        element._dragHandlers = { dragHandler, moveHandler, upHandler };
    }
    
    removeDraggable(element) {
        if (element._dragHandlers) {
            element.removeEventListener('mousedown', element._dragHandlers.dragHandler);
            document.removeEventListener('mousemove', element._dragHandlers.moveHandler);
            document.removeEventListener('mouseup', element._dragHandlers.upHandler);
            delete element._dragHandlers;
        }
    }
    
    // ===== TAB SWITCHING =====
    switchTab(tab) {
        const linkTab = document.getElementById('tabLink');
        const fileTab = document.getElementById('tabFile');
        const linkSection = document.getElementById('linkSection');
        const fileSection = document.getElementById('fileSection');
        
        if (tab === 'link') {
            linkTab.classList.add('active');
            fileTab.classList.remove('active');
            linkSection.style.display = 'block';
            fileSection.style.display = 'none';
        } else {
            fileTab.classList.add('active');
            linkTab.classList.remove('active');
            linkSection.style.display = 'none';
            fileSection.style.display = 'block';
        }
    }
    
    // ===== FILE HANDLING =====
    handleFiles(files) {
        const audioFiles = Array.from(files).filter(f => 
            f.type.startsWith('audio/') || 
            f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
        );
        
        if (audioFiles.length === 0) {
            this.showNotification('❌ Please drop audio files only', 'error', 3000);
            return;
        }
        
        document.getElementById('fileInfo').innerHTML = `✅ Loaded ${audioFiles.length} file(s)`;
        this.showNotification(`📀 Loaded ${audioFiles.length} tracks`, 'success', 2000);
        
        audioFiles.forEach(file => {
            const url = URL.createObjectURL(file);
            this.playQueue.push({
                type: 'file',
                url: url,
                name: file.name,
                size: file.size,
                duration: 0,
                added: new Date().toISOString()
            });
        });
        
        this.updateQueueDisplay();
        
        if (!this.isPlaying && this.playQueue.length > 0 && this.currentFileIndex === -1) {
            this.playFile(0);
        }
    }
    
    // ===== PLAYBACK CONTROL =====
    playFile(index) {
        if (index < 0 || index >= this.playQueue.length) return;
        
        if (this.youtubePlayer && this.currentSource === 'youtube') {
            this.youtubePlayer.pauseVideo();
        }
        
        this.currentSource = 'file';
        this.currentFileIndex = index;
        const item = this.playQueue[index];
        
        this.recentlyPlayed.unshift({
            name: item.name,
            url: item.url,
            time: new Date().toISOString()
        });
        this.recentlyPlayed = this.recentlyPlayed.slice(0, 20);
        localStorage.setItem('recentlyPlayed', JSON.stringify(this.recentlyPlayed));
        
        this.mainAudio.src = item.url;
        this.mainAudio.load();
        this.mainAudio.playbackRate = this.playbackSpeed;
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: item.name,
                artist: 'Vinyl Desk',
                album: 'Local File',
                artwork: [{ src: 'data:image/svg+xml,' + encodeURIComponent('<svg><circle fill="#ff3366"/></svg>') }]
            });
        }
        
        const playPromise = this.mainAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.vinyl.classList.add('spinning');
                this.tonearm.classList.add('playing');
                this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                this.trackTitle.textContent = this.truncateName(item.name, 50);
                this.statusText.textContent = 'Now Playing';
                
                this.connectAudioToVisualizer();
                
                if (this.lyricsEnabled) {
                    this.fetchLyrics();
                }
            }).catch(error => {
                console.error('Playback error:', error);
                this.statusText.textContent = 'Click to play';
                this.showNotification('❌ Playback error. Try another file.', 'error', 3000);
            });
        }
        
        this.updateQueueDisplay();
    }
    
    // ===== YOUTUBE PLAYBACK =====
    playYouTubeLink() {
        const link = this.linkInput.value.trim();
        if (!link) {
            this.statusText.textContent = 'Paste a link first';
            this.showNotification('📝 Paste a YouTube link first', 'info', 2000);
            return;
        }
        
        const videoId = this.extractYouTubeId(link);
        if (!videoId) {
            this.statusText.textContent = 'Invalid YouTube link';
            this.showNotification('❌ Invalid YouTube link', 'error', 2000);
            return;
        }
        
        this.playYouTube(videoId);
    }
    
    extractYouTubeId(url) {
        const patterns = [
            /youtu\.be\/([^#&?]{11})/,
            /watch\?v=([^#&?]{11})/,
            /embed\/([^#&?]{11})/,
            /v\/([^#&?]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }
    
    async loadYouTubeAPI() {
        return new Promise((resolve) => {
            if (window.YT) {
                this.isYouTubeReady = true;
                resolve();
                return;
            }
            
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(tag, firstScript);
            
            window.onYouTubeIframeAPIReady = () => {
                this.isYouTubeReady = true;
                console.log('YouTube API Ready');
                resolve();
            };
        });
    }
    
    playYouTube(videoId) {
        if (!this.isYouTubeReady) {
            this.statusText.textContent = 'YouTube loading...';
            setTimeout(() => this.playYouTube(videoId), 1000);
            return;
        }
        
        if (this.currentSource === 'file') {
            this.mainAudio.pause();
        }
        
        const container = document.getElementById('youtubeContainer');
        container.innerHTML = '';
        
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        container.appendChild(playerDiv);
        
        this.youtubePlayer = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'disablekb': 1,
                'modestbranding': 1,
                'playsinline': 1,
                'origin': window.location.origin,
                'rel': 0
            },
            events: {
                'onReady': (e) => {
                    this.currentSource = 'youtube';
                    this.isPlaying = true;
                    this.vinyl.classList.add('spinning');
                    this.tonearm.classList.add('playing');
                    this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                    
                    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
                        .then(r => r.json())
                        .then(data => {
                            this.trackTitle.textContent = data.title || 'YouTube Video';
                        })
                        .catch(() => {
                            this.trackTitle.textContent = 'YouTube Video';
                        });
                    
                    this.statusText.textContent = 'Now Playing';
                    
                    e.target.setVolume(this.volumeSlider.value);
                    if (this.playbackSpeed !== 1.0) {
                        e.target.setPlaybackRate(this.playbackSpeed);
                    }
                    
                    this.startSimulatedVisualizer();
                    
                    this.showNotification('▶️ YouTube playback started', 'success', 2000);
                    
                    if (this.lyricsEnabled) {
                        this.fetchLyrics();
                    }
                },
                'onStateChange': (e) => {
                    if (e.data === YT.PlayerState.PLAYING) {
                        this.isPlaying = true;
                        this.vinyl.classList.add('spinning');
                        this.tonearm.classList.add('playing');
                        this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                    } else if (e.data === YT.PlayerState.PAUSED) {
                        this.isPlaying = false;
                        this.vinyl.classList.remove('spinning');
                        this.tonearm.classList.remove('playing');
                        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                    } else if (e.data === YT.PlayerState.ENDED) {
                        this.isPlaying = false;
                        this.vinyl.classList.remove('spinning');
                        this.tonearm.classList.remove('playing');
                        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                        this.statusText.textContent = 'Finished';
                        this.showNotification('✅ Track ended', 'info', 2000);
                    }
                },
                'onError': (e) => {
                    console.error('YouTube Error:', e.data);
                    this.showYouTubeFallback(videoId);
                }
            }
        });
    }
    
    showYouTubeFallback(videoId) {
        const container = document.querySelector('.visualizer-container');
        const fallback = document.createElement('div');
        fallback.className = 'youtube-fallback';
        fallback.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>This video can't be played here (embedding disabled)</p>
            <button onclick="window.open('https://youtu.be/${videoId}', '_blank')">
                <i class="fab fa-youtube"></i> Open in YouTube
            </button>
        `;
        
        container.appendChild(fallback);
        this.showNotification('⚠️ Video cannot be embedded - opening in YouTube', 'warning', 5000);
        
        setTimeout(() => fallback.remove(), 8000);
    }
    
    // ===== PLAY/PAUSE TOGGLE =====
    togglePlayPause() {
        if (this.currentSource === 'file') {
            if (this.isPlaying) {
                this.mainAudio.pause();
                this.isPlaying = false;
                this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                this.vinyl.classList.remove('spinning');
                this.tonearm.classList.remove('playing');
            } else {
                this.mainAudio.play().then(() => {
                    this.isPlaying = true;
                    this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                    this.vinyl.classList.add('spinning');
                    this.tonearm.classList.add('playing');
                }).catch(e => console.error('Play error:', e));
            }
        } else if (this.youtubePlayer) {
            if (this.isPlaying) {
                this.youtubePlayer.pauseVideo();
            } else {
                this.youtubePlayer.playVideo();
            }
        } else if (this.playQueue.length > 0) {
            this.playFile(0);
        } else {
            this.showNotification('📀 Add music to play', 'info', 2000);
        }
    }
    
    // ===== QUEUE MANAGEMENT =====
    playNext() {
        if (this.playQueue.length === 0) return;
        
        let nextIndex;
        if (this.shuffleOn) {
            do {
                nextIndex = Math.floor(Math.random() * this.playQueue.length);
            } while (nextIndex === this.currentFileIndex && this.playQueue.length > 1);
        } else {
            nextIndex = this.currentFileIndex + 1;
            if (nextIndex >= this.playQueue.length) {
                if (this.repeatOn) {
                    nextIndex = 0;
                } else {
                    return;
                }
            }
        }
        
        this.playFile(nextIndex);
    }
    
    playPrevious() {
        if (this.playQueue.length === 0) return;
        
        let prevIndex = this.currentFileIndex - 1;
        if (prevIndex < 0) {
            if (this.repeatOn) {
                prevIndex = this.playQueue.length - 1;
            } else {
                return;
            }
        }
        
        this.playFile(prevIndex);
    }
    
    handleTrackEnd() {
        if (this.repeatOn && this.playQueue.length > 0) {
            this.playNext();
        } else {
            this.isPlaying = false;
            this.vinyl.classList.remove('spinning');
            this.tonearm.classList.remove('playing');
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            this.statusText.textContent = 'Track ended';
        }
    }
    
    shuffleQueue() {
        if (this.playQueue.length < 2) return;
        
        for (let i = this.playQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playQueue[i], this.playQueue[j]] = [this.playQueue[j], this.playQueue[i]];
        }
        
        if (this.currentSource === 'file' && this.currentFileIndex !== -1) {
            const currentUrl = this.playQueue[this.currentFileIndex]?.url;
            this.currentFileIndex = this.playQueue.findIndex(item => item.url === currentUrl);
        }
        
        this.updateQueueDisplay();
        this.showNotification('🔀 Queue shuffled', 'success', 1500);
    }
    
    toggleRepeat() {
        this.repeatOn = !this.repeatOn;
        const btn = document.getElementById('repeatBtn');
        btn.classList.toggle('active');
        
        this.showNotification(
            this.repeatOn ? '🔁 Repeat enabled' : '➡️ Repeat disabled',
            'info',
            1500
        );
    }
    
    updateQueueDisplay() {
        const queueList = document.getElementById('queueList');
        
        if (this.playQueue.length === 0) {
            queueList.innerHTML = '<div class="queue-item"><i class="fas fa-music"></i><div class="track-info"><div class="track-name">Drop MP3 files to add them here</div></div></div>';
            return;
        }
        
        queueList.innerHTML = '';
        this.playQueue.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'queue-item';
            if (index === this.currentFileIndex && this.currentSource === 'file') {
                div.classList.add('playing');
            }
            
            const size = (item.size / 1024 / 1024).toFixed(2);
            const duration = item.duration ? this.formatTime(item.duration) : '--:--';
            
            div.innerHTML = `
                <i class="fas ${index === this.currentFileIndex ? 'fa-play' : 'fa-music'}"></i>
                <div class="track-info">
                    <div class="track-name">${this.truncateName(item.name, 50)}</div>
                    <div class="track-details">${size} MB · ${duration}</div>
                </div>
                <button class="ctrl-btn play-queue-btn" data-index="${index}" style="padding: 5px 10px;">
                    <i class="fas fa-play"></i>
                </button>
            `;
            
            const playBtn = div.querySelector('.play-queue-btn');
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.currentTarget.dataset.index);
                this.playFile(idx);
            });
            
            div.addEventListener('dblclick', () => this.playFile(index));
            
            queueList.appendChild(div);
        });
    }
    
    clearQueue() {
        this.playQueue = [];
        this.currentFileIndex = -1;
        this.currentSource = null;
        
        if (this.mainAudio) {
            this.mainAudio.pause();
            this.mainAudio.src = '';
        }
        
        if (this.youtubePlayer) {
            this.youtubePlayer.pauseVideo();
        }
        
        this.isPlaying = false;
        this.vinyl.classList.remove('spinning');
        this.tonearm.classList.remove('playing');
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Play';
        this.trackTitle.textContent = 'Queue cleared';
        this.statusText.textContent = 'Ready';
        this.trackMeta.textContent = '00:00 / 00:00';
        this.progressFill.style.width = '0%';
        
        this.updateQueueDisplay();
        this.showNotification('🗑️ Queue cleared', 'info', 2000);
    }
    
    // ===== AUDIO CONTEXT & VISUALIZER =====
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.visualize();
        } catch (e) {
            console.log('Web Audio API not supported, using simulated visualizer');
            this.startSimulatedVisualizer();
        }
    }
    
    connectAudioToVisualizer() {
        if (!this.audioContext || !this.analyser || !this.mainAudio) return;
        
        try {
            if (this.source) {
                this.source.disconnect();
            }
            
            this.source = this.audioContext.createMediaElementSource(this.mainAudio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (e) {
            console.log('Could not connect to visualizer, using simulated');
            this.startSimulatedVisualizer();
        }
    }
    
    visualize() {
        if (!this.ctx || !this.analyser) return;
        
        const draw = () => {
            if (!this.animationFrame) {
                this.animationFrame = requestAnimationFrame(draw);
                return;
            }
            
            this.ctx.clearRect(0, 0, this.visualizerCanvas.width, this.visualizerCanvas.height);
            
            if (this.currentSource === 'file' && this.isPlaying && this.analyser) {
                this.analyser.getByteFrequencyData(this.dataArray);
                
                switch(this.visualizerMode) {
                    case 'bars':
                        this.drawBarsVisualizer();
                        break;
                    case 'wave':
                        this.drawWaveVisualizer();
                        break;
                    case 'circle':
                        this.drawCircleVisualizer();
                        break;
                    case 'combined':
                        this.drawCombinedVisualizer();
                        break;
                    default:
                        this.drawBarsVisualizer();
                }
            } else if (this.currentSource === 'youtube' && this.isPlaying) {
                this.drawSimulatedVisualizer();
            } else {
                this.drawIdleVisualizer();
            }
            
            this.animationFrame = requestAnimationFrame(draw);
        };
        
        draw();
    }
    
    drawBarsVisualizer() {
        const barWidth = this.visualizerCanvas.width / this.dataArray.length;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const x = i * barWidth;
            const height = (this.dataArray[i] / 255) * this.visualizerCanvas.height;
            
            if (height > 0) {
                const gradient = this.ctx.createLinearGradient(0, this.visualizerCanvas.height, 0, this.visualizerCanvas.height - height);
                gradient.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#ff3366');
                gradient.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#6b4eff');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x, this.visualizerCanvas.height - height, barWidth - 1, height);
                
                this.ctx.shadowColor = gradient;
                this.ctx.shadowBlur = 10;
            }
        }
    }
    
    drawWaveVisualizer() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#ff3366';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
        
        const sliceWidth = this.visualizerCanvas.width / this.dataArray.length;
        let x = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 128;
            const y = v * this.visualizerCanvas.height / 2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.ctx.stroke();
    }
    
    drawCircleVisualizer() {
        const centerX = this.visualizerCanvas.width / 2;
        const centerY = this.visualizerCanvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#6b4eff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
        this.ctx.stroke();
        
        for (let i = 0; i < this.dataArray.length; i += 4) {
            const angle = (i / this.dataArray.length) * Math.PI * 2;
            const value = this.dataArray[i] / 255;
            const x = centerX + Math.cos(angle) * (radius + value * 40);
            const y = centerY + Math.sin(angle) * (radius + value * 40);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3 + value * 4, 0, 2 * Math.PI);
            this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#ff3366';
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
        }
    }
    
    drawCombinedVisualizer() {
        this.ctx.globalAlpha = 0.5;
        this.drawBarsVisualizer();
        
        this.ctx.globalAlpha = 1;
        this.drawWaveVisualizer();
        
        const centerX = this.visualizerCanvas.width / 2;
        const centerY = this.visualizerCanvas.height / 2;
        const radius = 30;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() + '40';
        this.ctx.fill();
    }
    
    drawSimulatedVisualizer() {
        const time = Date.now() * 0.001;
        const freqData = new Uint8Array(64);
        
        for (let i = 0; i < freqData.length; i++) {
            freqData[i] = 128 + 
                Math.sin(time * 2 + i * 0.1) * 60 +
                Math.sin(time * 4 + i * 0.2) * 40 +
                Math.sin(time * 8 + i * 0.3) * 20;
        }
        
        const barWidth = this.visualizerCanvas.width / freqData.length;
        
        for (let i = 0; i < freqData.length; i++) {
            const x = i * barWidth;
            const height = (freqData[i] / 255) * this.visualizerCanvas.height;
            
            const gradient = this.ctx.createLinearGradient(0, this.visualizerCanvas.height, 0, this.visualizerCanvas.height - height);
            gradient.addColorStop(0, '#ff3366');
            gradient.addColorStop(1, '#6b4eff');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, this.visualizerCanvas.height - height, barWidth - 1, height);
        }
    }
    
    drawIdleVisualizer() {
        this.ctx.font = '16px Space Grotesk';
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.textAlign = 'center';
        
        if (this.fishTheme) {
            this.ctx.fillText('🐠 Fish Theme Active - Click the fish! 🐟', this.visualizerCanvas.width/2, this.visualizerCanvas.height/2);
        } else {
            this.ctx.fillText('🎵 Drop music on the vinyl! Press F for Fish Theme!', this.visualizerCanvas.width/2, this.visualizerCanvas.height/2);
        }
        
        const time = Date.now() * 0.001;
        for (let i = 0; i < 5; i++) {
            const x = this.visualizerCanvas.width/2 + Math.sin(time + i) * 50;
            const y = this.visualizerCanvas.height/2 + 30 + Math.cos(time + i) * 20;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() + '80';
            this.ctx.fill();
        }
    }
    
    startSimulatedVisualizer() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const draw = () => {
            if (!this.isPlaying) {
                this.drawIdleVisualizer();
                this.animationFrame = requestAnimationFrame(draw);
                return;
            }
            
            this.drawSimulatedVisualizer();
            this.animationFrame = requestAnimationFrame(draw);
        };
        
        draw();
    }
    
    // ===== WAVE EFFECTS =====
    createWaveEffects() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes menu-appear {
                from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            @keyframes note-fall {
                from { top: 0; }
                to { top: 170px; }
            }
            
            @keyframes beatPulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ===== PROGRESS & TIME =====
    updateProgress() {
        if (this.mainAudio.duration) {
            const percent = (this.mainAudio.currentTime / this.mainAudio.duration) * 100;
            this.progressFill.style.width = percent + '%';
            
            const current = this.formatTime(this.mainAudio.currentTime);
            const duration = this.formatTime(this.mainAudio.duration);
            this.trackMeta.textContent = `${current} / ${duration}`;
            
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setPositionState({
                    duration: this.mainAudio.duration,
                    playbackRate: this.playbackSpeed,
                    position: this.mainAudio.currentTime
                });
            }
        }
    }
    
    updateDuration() {
        if (this.mainAudio.duration && this.currentFileIndex !== -1) {
            this.playQueue[this.currentFileIndex].duration = this.mainAudio.duration;
            this.updateQueueDisplay();
        }
    }
    
    seek(e) {
        if (!this.mainAudio.duration) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.mainAudio.currentTime = percent * this.mainAudio.duration;
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    truncateName(name, maxLength) {
        if (!name) return '';
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength - 3) + '...';
    }
    
    // ===== VOLUME CONTROL =====
    setVolume(value) {
        const volume = value / 100;
        this.mainAudio.volume = volume;
        
        if (this.youtubePlayer && this.youtubePlayer.setVolume) {
            this.youtubePlayer.setVolume(value);
        }
        
        this.crackleAudio.volume = volume * 0.3;
        this.rainAudio.volume = volume * 0.2;
        
        const levelBar = document.querySelector('.level-bar');
        if (levelBar) {
            levelBar.style.width = value + '%';
        }
    }
    
    // ===== TOGGLE EFFECTS =====
    toggleCrackle() {
        this.crackleOn = !this.crackleOn;
        const btn = document.getElementById('crackleToggle');
        
        if (this.crackleOn) {
            this.crackleAudio.play().catch(e => console.log('Crackle play failed:', e));
            btn.classList.add('active');
            this.showNotification('📀 Crackle effect ON', 'success', 1500);
        } else {
            this.crackleAudio.pause();
            this.crackleAudio.currentTime = 0;
            btn.classList.remove('active');
            this.showNotification('📀 Crackle effect OFF', 'info', 1500);
        }
    }
    
    toggleRain() {
        this.rainOn = !this.rainOn;
        const btn = document.getElementById('rainToggle');
        
        if (this.rainOn) {
            this.rainAudio.play().catch(e => console.log('Rain play failed:', e));
            btn.classList.add('active');
            this.setWeatherEffect('rain');
            this.showNotification('🌧️ Rain sounds ON', 'success', 1500);
        } else {
            this.rainAudio.pause();
            this.rainAudio.currentTime = 0;
            btn.classList.remove('active');
            if (this.weatherEffect === 'rain') {
                this.setWeatherEffect('none');
            }
            this.showNotification('🌧️ Rain sounds OFF', 'info', 1500);
        }
    }
    
    toggleTheme() {
        const themes = ['dark', 'sunset', 'ocean', 'forest', 'midnight', 'coffee', 'underwater'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }
    
    startTimeUpdate() {
        setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: true 
            });
            document.getElementById('currentTime').textContent = timeString;
        }, 1000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.desk = new VinylDesk();
});