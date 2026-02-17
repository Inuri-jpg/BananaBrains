class GameView {
    constructor() {
        this.screens = {
            loading: document.getElementById('loadingScreen'),
            home: document.getElementById('homeScreen'),
            setup: document.getElementById('setupScreen'),
        };
    }

    /* ── Switch which screen is visible ── */
    show(screenName) {
        Object.values(this.screens).forEach(s => { if (s) s.classList.remove('active'); });
        this.screens[screenName].classList.add('active');
        console.log('GameView : Showing screen >', screenName);
    }

    setProgress(percent, label){
      document.getElementById('progressFill').style.width = percent + '%';
      document.getElementById('progressLabel').textContent = label;
    }

    showReturningUser(username, highScore) {
        document.getElementById('returningName').textContent  = username;
        document.getElementById('returningScore').textContent = highScore;
        document.getElementById('returningBadge').classList.add('visible');
    }

}