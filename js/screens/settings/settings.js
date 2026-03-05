window.settingsScreen = {
    currentSettings: {
        sound: true,
        timerSeconds: 30,
        difficulty: 'medium',
        volume: 70
    },

    init() {
        console.log('✓ Settings screen initialized');
        this.loadSettings();
        this.registerEvents();
        this.updateUI();
    },

    registerEvents() {
        // Sound toggle
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.currentSettings.sound = !this.currentSettings.sound;
                this.updateUI();
                console.log('⚡ Sound toggled:', this.currentSettings.sound);
            });
        }

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentSettings.difficulty = btn.dataset.difficulty;
                this.updateUI();
                console.log('⚡ Difficulty changed:', this.currentSettings.difficulty);
            });
        });

        // Timer controls
        const timerMinus = document.getElementById('timerMinus');
        const timerPlus = document.getElementById('timerPlus');

        if (timerMinus) {
            timerMinus.addEventListener('click', () => {
                if (this.currentSettings.timerSeconds > 10) {
                    this.currentSettings.timerSeconds -= 5;
                    this.updateUI();
                    console.log('⚡ Timer decreased:', this.currentSettings.timerSeconds);
                }
            });
        }

        if (timerPlus) {
            timerPlus.addEventListener('click', () => {
                if (this.currentSettings.timerSeconds < 60) {
                    this.currentSettings.timerSeconds += 5;
                    this.updateUI();
                    console.log('⚡ Timer increased:', this.currentSettings.timerSeconds);
                }
            });
        }

        // Volume slider
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.currentSettings.volume = parseInt(e.target.value);
                this.updateUI();
            });
        }

        // Save button
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetSettingsBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset all settings to default?')) {
                    this.resetSettings();
                }
            });
        }

        // Back button
        const backBtn = document.getElementById('btn-settings-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.controller && window.controller.view) {
                    window.controller.view.show('home');
                }
            });
        }

        console.log('✓ Settings events registered');
    },

    loadSettings() {
        const saved = localStorage.getItem('bananaBrain_settings');
        if (saved) {
            this.currentSettings = JSON.parse(saved);
            console.log('👤 Settings loaded from localStorage:', this.currentSettings);
        } else {
            console.log('Using default settings');
        }
    },

    saveSettings() {
        localStorage.setItem('bananaBrain_settings', JSON.stringify(this.currentSettings));
        console.log('👤 Settings saved to localStorage:', this.currentSettings);

        // Show success message
        const message = document.getElementById('settingsMessage');
        if (message) {
            message.classList.add('show');
            setTimeout(() => {
                message.classList.remove('show');
            }, 2000);
        }

        this.playTestSound();
    },

    resetSettings() {
        this.currentSettings = {
            sound: true,
            timerSeconds: 30,
            difficulty: 'medium',
            volume: 70
        };
        this.updateUI();
        this.saveSettings();
        console.log('Settings reset to defaults');
    },

    updateUI() {
        // Update sound toggle
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            if (this.currentSettings.sound) {
                soundToggle.classList.add('active');
            } else {
                soundToggle.classList.remove('active');
            }
        }

        // Update difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            if (btn.dataset.difficulty === this.currentSettings.difficulty) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        // Update timer value
        const timerValue = document.getElementById('timerValue');
        if (timerValue) {
            timerValue.textContent = this.currentSettings.timerSeconds + 's';
        }

        // Update volume slider and value
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        if (volumeSlider) {
            volumeSlider.value = this.currentSettings.volume;
        }
        if (volumeValue) {
            volumeValue.textContent = this.currentSettings.volume + '%';
        }
    },

    playTestSound() {
        if (!this.currentSettings.sound) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';
            gainNode.gain.value = this.currentSettings.volume / 100 * 0.3;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Web Audio API not available');
        }
    }
};