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

    showGeneratedIds(userId, sessionId){ 
        const uEl = document.getElementById('display-userId');
        const sEl = document.getElementById('display-sessionId');
        const cEl = document.getElementById('display-created');

        uEl.textContent = 'Generating....';
        sEl.textContent = 'Genrating.....';
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

    getSelectedApi(){
        const selected = document.querySelector('.api-option.selected');
        return selected ? selected.dataset.api : 'banana';
    }

    alert(msg) {
        window.alert(msg);
    }
}