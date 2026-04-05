/**
 * gameplay.js
 * Observer registrations for the gameplay screen.
 *
 * This module demonstrates the Observer Pattern discussed under Event-Driven Programming:
 *   - Three observers subscribe to the global EventBus
 *   - They are notified automatically when the GameController emits events
 *   - Neither this module nor GameController holds a reference to the other —
 *     they are fully decoupled, communicating only through named events.
 *
 * This also mirrors the Pub-Sub architecture discussed under the event driven programming section:
 *   Publisher  (GameController) → EventBus → Subscribers (observers)
 */

window.gameplayScreen = {

    init() {
        console.log('GameplayScreen: Initializing observers');
        this.registerObservers();
    },

    registerObservers() {

         /**
         * Observer 1 — puzzle:loaded
         * Fires when a new puzzle has been successfully fetched from the external API.
         * Updates the API badge to show which service provided this puzzle.
         */
        window.eventBus.on('puzzle:loaded', (data) => {
            console.log(`Observer [puzzle:loaded] Round ${data.round} - API: ${data.api}`);
            this.updateApiLabel(data.api);
        });

        /**
         * Observer 2 — answer:submitted
         * Fires when the player submits an answer (correct, wrong, or timeout).
         * Updates the score display in real time.
         */
        window.eventBus.on('answer:submitted', (data) => {
            console.log(`Observer [answer:submitted] Correct: ${data.correct} Score: ${data.score}`);
            this.updateScoreDisplay(data.score);
        });

        /**
         * Observer 3 — game:over
         * Fires when all rounds have been completed.
         */
        window.eventBus.on('game:over', (data) => {
            console.log(`Observer [game:over] → Winner: ${data.player}, Final score: ${data.score}`);
            
        });

        console.log('GameplayScreen: 3 observers registered on EventBus');
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