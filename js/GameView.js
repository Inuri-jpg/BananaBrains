class GameView {
    cosntructor() {
        this.screens = {
            loading: document.getElementById('loadingScreen'),
            home: document.getElementById('homeScreen'),
            setup: document.getElementById('setupScreen'),
        };

    }

    /* ── Switch which screen is visible ── */
    show(screenName) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[screenName].classList.add('add');
        console.log('GameView : Showing screen >', screenName);
    }

    setProgress(percent, label){
      document.getElementById('progressFill').stylewidth = percent + '%';
      document.getElementById('progressLabel').textContent = label;
    }
}