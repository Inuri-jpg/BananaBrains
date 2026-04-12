/**
 * settings.js
 * Manages the Settings screen UI and persistence.
 *
 * Virtual Identity - timer settings affect how long a session's puzzles run.
 * Settings are persisted in localStorage under the 'bananaBrain_settings' key.
 */
window.settingsScreen = {
    currentSettings: {
        sound:        true,
        timerSeconds: 10,
        difficulty:   'medium',
        volume:       70
    },

    init() {
        console.log('SettingsScreen: Initialized');
        this.loadSettings();
        this.registerEvents();
        this.updateUI();
    },

    registerEvents() {
        // Sound toggle - click event on a custom toggle switch
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.currentSettings.sound = !this.currentSettings.sound;
                this.updateUI();
                console.log('SettingsScreen: Sound toggled’', this.currentSettings.sound);
            });
        }

        // Difficulty buttons â€” click events
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentSettings.difficulty = btn.dataset.difficulty;
                this.updateUI();
                console.log('SettingsScreen: Difficulty’', this.currentSettings.difficulty);
            });
        });

        // Timer -/+ buttons
        const timerMinus = document.getElementById('timerMinus');
        const timerPlus  = document.getElementById('timerPlus');

        if (timerMinus) {
            timerMinus.addEventListener('click', () => {
                if (this.currentSettings.timerSeconds > 5) {
                    this.currentSettings.timerSeconds -= 5;
                    this.updateUI();
                }
            });
        }
        if (timerPlus) {
            timerPlus.addEventListener('click', () => {
                if (this.currentSettings.timerSeconds < 60) {
                    this.currentSettings.timerSeconds += 5;
                    this.updateUI();
                }
            });
        }

        // Volume slider - 'input' event fires on every drag movement
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
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // Reset button
        const resetBtn = document.getElementById('resetSettingsBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset all settings to default?')) this.resetSettings();
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

        console.log('SettingsScreen: All events registered');
    },

    loadSettings() {
        const storage = window.controller ? window.controller.storage : null;
        if (storage) {
            this.currentSettings = storage.loadSettings();
            console.log('SettingsScreen: Loaded via StorageManager', this.currentSettings);
        } else {
            // Fallback for early init before controller is ready
            const raw = localStorage.getItem('bananaBrain_settings');
            if (raw) this.currentSettings = JSON.parse(raw);
        }
    },

    saveSettings() {
        const storage = window.controller ? window.controller.storage : null;
        if (storage) {
            storage.saveSettings(this.currentSettings);
        } else {
            localStorage.setItem('bananaBrain_settings', JSON.stringify(this.currentSettings));
        }
        console.log('SettingsScreen: Settings saved â†’', this.currentSettings);

        const message = document.getElementById('settingsMessage');
        if (message) {
            message.classList.add('show');
            setTimeout(() => message.classList.remove('show'), 2000);
        }
        this.playTestSound();
    },

    resetSettings() {
        this.currentSettings = {
            sound: true, timerSeconds: 10, difficulty: 'medium', volume: 70
        };
        this.updateUI();
        this.saveSettings();
        console.log('SettingsScreen: Reset to defaults');
    },

    updateUI() {
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.classList.toggle('active', this.currentSettings.sound);
        }

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.difficulty === this.currentSettings.difficulty);
        });

        const timerValue = document.getElementById('timerValue');
        if (timerValue) timerValue.textContent = this.currentSettings.timerSeconds + 's';

        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue  = document.getElementById('volumeValue');
        if (volumeSlider) volumeSlider.value  = this.currentSettings.volume;
        if (volumeValue)  volumeValue.textContent = this.currentSettings.volume + '%';
    },

    /** Play a brief test tone using the Web Audio API to confirm sound is working. */
    playTestSound() {
        if (!this.currentSettings.sound) return;
        try {
            const ctx        = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain       = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.frequency.value = 523.25; // C5
            oscillator.type            = 'sine';
            gain.gain.value            = this.currentSettings.volume / 100 * 0.3;
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.2);
        } catch (e) {
            console.log('SettingsScreen: Web Audio API not available');
        }
    }
};