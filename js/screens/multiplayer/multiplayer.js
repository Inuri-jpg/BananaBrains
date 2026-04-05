/**
 * multiplayer.js
 * Handles the Two Player setup screen UI behaviour.
 *
 * Virtual Identity (Week 5):
 *   Each player goes through the same register/authenticate flow as single player.
 *   Password fields are shown for both players. New players are registered;
 *   returning players must verify their password before the game starts.
 *
 * Event-Driven (Week 4):
 *   All interactions (name input, password input, API selection) are handled
 *   through addEventListener — no inline HTML event handlers.
 */
window.multiplayerScreen = {

    init() {
        console.log('MultiplayerScreen: Initialized');
        this.registerEvents();
    },

    registerEvents() {

        // Player 1 name input — regenerate ID preview as they type
        const p1Input = document.getElementById('player1Name');
        if (p1Input) {
            p1Input.addEventListener('input', () => {
                document.getElementById('p1-id').textContent = 'USER-' + Date.now() + '-****';
            });
        }

        // Player 2 name input — regenerate ID preview as they type
        const p2Input = document.getElementById('player2Name');
        if (p2Input) {
            p2Input.addEventListener('input', () => {
                document.getElementById('p2-id').textContent = 'USER-' + Date.now() + '-****';
            });
        }

        // Player 1 API selection
        document.querySelectorAll('.api-option[data-player="1"]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.api-option[data-player="1"]')
                    .forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                console.log('MultiplayerScreen: Player 1 selected API →', btn.dataset.api);
            });
        });

        // Player 2 API selection
        document.querySelectorAll('.api-option[data-player="2"]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.api-option[data-player="2"]')
                    .forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                console.log('MultiplayerScreen: Player 2 selected API →', btn.dataset.api);
            });
        });

        console.log('MultiplayerScreen: All events registered');
    },

    generateInitialIds() {
        document.getElementById('p1-id').textContent = 'USER-' + Date.now() + '-****';
        document.getElementById('p2-id').textContent = 'USER-' + (Date.now() + 1) + '-****';
    },

    /**
     * Show an auth status message under a player's card.
     * @param {1|2}    player  - which player
     * @param {string} msg     - text to show
     * @param {string} color   - CSS colour (green = ok, red = error)
     */
    showAuthMessage(player, msg, color) {
        const el = document.getElementById(`p${player}-authMsg`);
        if (el) { el.textContent = msg; el.style.color = color; }
    },

    /** Update the ID preview for a player once their real userId is known. */
    showRealId(player, userId) {
        const el = document.getElementById(`p${player}-id`);
        if (el) el.textContent = userId;
    }
};
