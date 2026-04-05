/**
 * GameView.js
 * The View layer in the MVC architecture.
 *
 * Responsible solely for DOM manipulation — reading from and writing to the UI.
 * Contains no game logic. The Controller calls View methods; the View never
 * calls back into the Controller directly.
 *
 * This separation (MVC) supports the version control discussion (Week 2):
 * each layer can be developed and committed independently, with clear
 * component boundaries that aid collaboration and code reviews.
 */
class GameView {
    constructor() {
        // Map of screen names to their DOM elements
        this.screens = {
            loading:     document.getElementById('loadingScreen'),
            home:        document.getElementById('homeScreen'),
            setup:       document.getElementById('setupScreen'),
            gameplay:    document.getElementById('gameplayScreen'),
            multiplayer: document.getElementById('multiplayerSetupScreen'),
            results:     document.getElementById('resultsScreen'),
            leaderboard: document.getElementById('leaderboardScreen'),
            settings:    document.getElementById('settingsScreen')
        };
    }

    /** Show a named screen, hiding all others. */
    show(screenName) {
        Object.values(this.screens).forEach(s => { if (s) s.classList.remove('active'); });
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            console.log('GameView: Showing screen >', screenName);
        } else {
            console.error('GameView: Unknown screen >', screenName);
        }
    }

    setProgress(percent, label) {
        document.getElementById('progressFill').style.width   = percent + '%';
        document.getElementById('progressLabel').textContent  = label;
    }

    showReturningUser(username, highScore) {
        document.getElementById('returningName').textContent  = username;
        document.getElementById('returningScore').textContent = highScore;
        document.getElementById('returningBadge').classList.add('visible');
    }

    /**
     * Animate the display of the auto-generated UserId and SessionId.
     * This makes the virtual identity creation visible to the user,
     * which is a key talking point for the Week 5 (Virtual Identity) theme.
     */
    showGeneratedIds(userId, sessionId) {
        const uEl = document.getElementById('display-userId');
        const sEl = document.getElementById('display-sessionId');
        const cEl = document.getElementById('display-created');

        uEl.textContent = 'Generating...';
        sEl.textContent = 'Generating...';
        uEl.classList.add('id-generating');
        sEl.classList.add('id-generating');

        setTimeout(() => {
            uEl.textContent = userId;
            sEl.textContent = sessionId;
            cEl.textContent = new Date().toLocaleDateString();
            uEl.classList.remove('id-generating');
            sEl.classList.remove('id-generating');
        }, 600);
    }

    getTypedName() {
        return document.getElementById('nameInput').value.trim();
    }

    getSelectedApi() {
        const selected = document.querySelector('.api-option.selected');
        return selected ? selected.dataset.api : 'banana';
    }

    alert(msg) {
        window.alert(msg);
    }
}
