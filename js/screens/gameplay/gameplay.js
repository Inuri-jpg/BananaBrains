/**
 * gameplay.js
 * Observer registrations for the gameplay screen.
 *
 * This module demonstrates the Observer Pattern
 *   - Three observers subscribe to the global EventBus
 *   - They are notified automatically when the GameController emits events
 *   - Neither this module nor GameController holds a reference to the other.
 *     they are fully decoupled, communicating only through named events.
 */
window.gameplayScreen = {

    init() {
        console.log('GameplayScreen: Initializing observers (Observer Pattern)');
        this.registerObservers();
    },

    registerObservers() {

        /**
         * Observer 1 puzzle:loaded
         * Fires when a new puzzle has been successfully fetched from the external API.
         * Updates the API badge to show which service provided this puzzle.
         */
        window.eventBus.on('puzzle:loaded', (data) => {
            console.log(`Observer [puzzle:loaded] Round ${data.round}, API: ${data.api}`);
            this.updateApiLabel(data.api);
        });

        /**
         * Observer 2 answer:submitted
         * Fires when the player submits an answer (correct, wrong, or timeout).
         * Updates the score display in real time.
         */
        window.eventBus.on('answer:submitted', (data) => {
            console.log(`Observer [answer:submitted] Correct: ${data.correct}, Score: ${data.score}, Player: ${data.player}`);
            this.updateScoreDisplay(data.score);
        });

        /**
         * Observer 3 game:over
         * Fires when all rounds have been completed.
         * Plays a completion sound triggered entirely by the event,
         * with no direct call from GameController. This demonstrates
         * that observers act independently of the publisher.
         */
        window.eventBus.on('game:over', (data) => {
            console.log(`Observer [game:over] Winner: ${data.player}, Final score: ${data.score}`);
            this.playEndSound();
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
    },

    /**
     * Play a short celebratory sound when the game ends.
     * Called exclusively by the game:over observer, not by GameController directly.
     * This proves the Observer pattern: the publisher (GameController) does not
     * know or care what the subscriber does in response to the event.
     */
    playEndSound() {
        try {
            const ctx  = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523, 659, 784, 1047]; 
            notes.forEach((freq, i) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type            = 'sine';
                gain.gain.value     = 0.15;
                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime  + i * 0.15 + 0.2);
            });
            console.log('Observer [game:over]: End sound played via Web Audio API');
        } catch (e) {
            console.log('Observer [game:over]: Web Audio API not available');
        }
    }
};