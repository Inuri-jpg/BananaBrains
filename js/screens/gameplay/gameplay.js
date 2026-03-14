window.gameplayScreen = {

    init() {
        console.log('GameplayScreen: Initializing observers');
        this.registerObservers();
    },

    registerObservers() {

        // Observer 1 — listens for puzzle loaded
        window.eventBus.on('puzzle:loaded', (data) => {
            console.log(`Observer [puzzle:loaded] Round ${data.round} - API: ${data.api}`);
            this.updateApiLabel(data.api);
        });

        // Observer 2 — listens for answer submitted
        window.eventBus.on('answer:submitted', (data) => {
            console.log(`Observer [answer:submitted] Correct: ${data.correct} Score: ${data.score}`);
            this.updateScoreDisplay(data.score);
        });

        // Observer 3 — listens for game over
        window.eventBus.on('game:over', (data) => {
            console.log(`Observer [game:over] Winner: ${data.player} Score: ${data.score}`);
        });

        console.log('GameplayScreen: 3 observers registered');
    },

    updateApiLabel(api) {
        const badge = document.querySelector('.api-badge');
        if (!badge) return;
        badge.textContent = api === 'banana' ? '🍌 Banana API' : '😊 Emoji API';
    },

    updateScoreDisplay(score) {
        const scoreEl = document.getElementById('currentScore');
        if (!scoreEl) return;
        scoreEl.textContent = score;
    }

};