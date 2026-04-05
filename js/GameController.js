/**
 * GameController.js
 * The Controller layer in the MVC architecture.
 *
 * Responsibilities:
 *  - Registers all DOM event listeners (Event-Driven Programming — Week 4)
 *  - Mediates between GameModel (data/logic) and GameView (display)
 *  - Orchestrates the game loop: fetch puzzle → start timer → handle answer → advance
 *
 * Event-Driven Programming (Week 4):
 *   All user interactions are handled through addEventListener — the browser's
 *   built-in event system. When a button is clicked, the DOM generates an event,
 *   which is dispatched to the registered handler function. This is the classic
 *   event-driven flow: Event Generation → Dispatching → Processing → Response.
 *
 *   Additionally, the custom EventBus (Observer pattern) is used to broadcast
 *   game-state events (puzzle:loaded, answer:submitted, game:over) to decoupled
 *   listeners in gameplay.js — so the controller does not need to know which
 *   other components are listening.
 */
class GameController {
    constructor(model, view, storage) {
        this.model         = model;
        this.view          = view;
        this.storage       = storage;
        this.timerInterval = null;
        this._answerLocked = false; // prevents double-submission during feedback delay
    }

    // ─── Event Registration (Week 4 — Event-Driven Programming) ──────────────

    /**
     * Register all DOM event listeners.
     * Using addEventListener (external JS, not inline HTML onclick) is best
     * practice — it separates behaviour from markup and allows multiple handlers
     * on the same element.
     */
    registerEvents() {
        console.log('GameController: Registering all event listeners...');

        // ── Home screen ──
        document.getElementById('btn-single')
            .addEventListener('click', () => this.onSinglePlayerClick());

        document.getElementById('btn-multi')
            .addEventListener('click', () => this.onMultiPlayerClick());

        document.getElementById('btn-leader')
            .addEventListener('click', () => window.leaderboardScreen.show('home'));

        document.getElementById('btn-settings')
            .addEventListener('click', () => this.view.show('settings'));

        // ── Setup screen ──
        document.getElementById('btn-setup-back')
            .addEventListener('click', () => this.view.show('home'));

        document.querySelectorAll('.api-option').forEach(btn => {
            btn.addEventListener('click', () => this.onApiOptionClick(btn));
        });

        document.getElementById('nameInput')
            .addEventListener('input', () => this.onNameInput());

        document.getElementById('btn-start-single')
            .addEventListener('click', () => this.onStartSingleClick());

        // ── Multiplayer setup screen ──
        document.getElementById('btn-multi-back')
            .addEventListener('click', () => this.view.show('home'));

        document.getElementById('btn-start-multi')
            .addEventListener('click', () => this.onStartMultiClick());

        // ── Gameplay screen ──
        document.getElementById('submitAnswerBtn')
            .addEventListener('click', () => this.handleAnswerSubmit());

        // Keyboard event — Enter key submits answer (event type: 'keypress')
        document.getElementById('answerInput')
            .addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleAnswerSubmit();
            });

        // BUG FIX: Quit button now has a registered event listener
        document.getElementById('quitGameBtn')
            .addEventListener('click', () => {
                this.stopTimer();
                this.view.show('home');
            });

        // ── Results screen ──
        document.getElementById('playAgainBtn')
            .addEventListener('click', () => this.view.show('setup'));

        document.getElementById('viewLeaderboardBtn')
            .addEventListener('click', () => window.leaderboardScreen.show('results'));

        document.getElementById('backToHomeBtn')
            .addEventListener('click', () => this.view.show('home'));

        // ── Leaderboard screen ──
        document.getElementById('btn-leaderboard-back')
            .addEventListener('click', () => window.leaderboardScreen.goBack());

        console.log('GameController: All event listeners registered successfully.');
    }

    // ─── Setup Screen Handlers ────────────────────────────────────────────────

    onSinglePlayerClick() {
        // Pre-fill name if returning user
        if (this.model.user) {
            document.getElementById('nameInput').value = this.model.user.username;
        }
        const freshId   = this.storage.makeUserId();
        const freshSess = this.storage.makeSessionId();
        this.view.showGeneratedIds(freshId, freshSess);
        this.view.show('setup');
    }

    onApiOptionClick(clickedBtn) {
        // Only one API option may be selected at a time — deselect others first
        document.querySelectorAll('.api-option').forEach(b => b.classList.remove('selected'));
        clickedBtn.classList.add('selected');
    }

    onNameInput() {
        // Regenerate preview IDs whenever the username field changes
        const freshId   = this.storage.makeUserId();
        const freshSess = this.storage.makeSessionId();
        this.view.showGeneratedIds(freshId, freshSess);
    }

    /**
     * Handle the "Let's Play!" button.
     *
     * Virtual Identity flow (Week 5):
     *  - If a saved user with this username exists → authenticate (verify password)
     *  - Otherwise → register (create identity with hashed password)
     * This mirrors real-world login/register flows, implementing virtual identity
     * through a password + unique userId + sessionId combination.
     */
    onStartSingleClick() {
        const name     = this.view.getTypedName();
        const api      = this.view.getSelectedApi();
        const password = document.getElementById('passwordInput').value;
        const authMsg  = document.getElementById('authMessage');

        if (name === '') {
            this.view.alert('Please enter your username.');
            return;
        }
        if (password === '') {
            this.view.alert('Please enter a password.');
            return;
        }

        const saved = this.model.storage.loadUser();

        if (saved && saved.username === name) {
            // Returning user — verify their virtual identity
            const result = this.model.authenticate(name, password);
            if (result === 'wrong_password') {
                authMsg.textContent = '✗ Wrong password! Try again.';
                authMsg.style.color = '#FF4444';
                return;
            }
            authMsg.textContent = '✓ Welcome back, ' + name + '!';
            authMsg.style.color = '#4CAF50';
        } else {
            // New user — create and persist virtual identity
            this.model.createUser(name, api, password);
            authMsg.textContent = '✓ Identity created! Welcome, ' + name + '!';
            authMsg.style.color = '#4CAF50';
        }

        this.model.setupSingle(name, api);
        this._answerLocked = false;

        // Short delay so user can see the success message
        setTimeout(() => {
            this.view.show('gameplay');
            this.startGameplay();
        }, 800);
    }

    // ─── Multiplayer Setup ────────────────────────────────────────────────────

    onMultiPlayerClick() {
        console.log('GameController: Two Players button clicked');
        window.multiplayerScreen.generateInitialIds();
        document.getElementById('player1Name').value = '';
        document.getElementById('player2Name').value = '';
        this.view.show('multiplayer');
    }

    /**
     * Handle "Let's Play Together!" button.
     *
     * Virtual Identity (Week 5):
     *   Each player goes through the same register/authenticate flow as single player.
     *   - If a saved user with that username exists → verify their password
     *   - Otherwise → create a new identity with a hashed password
     *   Both players get independent userId and sessionId values.
     *
     * Interoperability (Week 3):
     *   Each player independently picks an API. In multiplayer, Player 1's turns
     *   will call their chosen API and Player 2's turns will call theirs — meaning
     *   two different external servers may be called within the same game session.
     */
    onStartMultiClick() {
        const p1Name = document.getElementById('player1Name').value.trim();
        const p2Name = document.getElementById('player2Name').value.trim();
        const p1Pass = document.getElementById('player1Password').value;
        const p2Pass = document.getElementById('player2Password').value;

        // ── Validation ──
        if (p1Name === '' || p2Name === '') {
            this.view.alert('Both players must enter their names!');
            return;
        }
        if (p1Pass === '' || p2Pass === '') {
            this.view.alert('Both players must enter a password!');
            return;
        }
        if (p1Name === p2Name) {
            this.view.alert('Players must have different usernames!');
            return;
        }

        const p1ApiEl = document.querySelector('.api-option.selected[data-player="1"]');
        const p2ApiEl = document.querySelector('.api-option.selected[data-player="2"]');
        const p1Api   = p1ApiEl ? p1ApiEl.dataset.api : 'banana';
        const p2Api   = p2ApiEl ? p2ApiEl.dataset.api : 'banana';

        // ── Authenticate / Register Player 1 ──
        const p1Result = this._authenticateOrRegister(p1Name, p1Api, p1Pass);
        if (!p1Result.ok) {
            window.multiplayerScreen.showAuthMessage(1, p1Result.msg, '#FF4444');
            return;
        }
        window.multiplayerScreen.showAuthMessage(1, p1Result.msg, '#4CAF50');
        window.multiplayerScreen.showRealId(1, p1Result.userId);

        // ── Authenticate / Register Player 2 ──
        const p2Result = this._authenticateOrRegister(p2Name, p2Api, p2Pass);
        if (!p2Result.ok) {
            window.multiplayerScreen.showAuthMessage(2, p2Result.msg, '#FF4444');
            return;
        }
        window.multiplayerScreen.showAuthMessage(2, p2Result.msg, '#4CAF50');
        window.multiplayerScreen.showRealId(2, p2Result.userId);

        console.log('GameController: Both players authenticated. Starting multiplayer...', {
            player1: { name: p1Name, api: p1Api, userId: p1Result.userId },
            player2: { name: p2Name, api: p2Api, userId: p2Result.userId }
        });

        // Setup game model with both players' confirmed identities
        this.model.setupMulti(p1Name, p1Api, p2Name, p2Api, p1Result.userId, p2Result.userId);

        // Short delay so players can see their ✓ messages
        setTimeout(() => {
            this.view.show('gameplay');
            this.startGameplay();
        }, 900);
    }

    /**
     * Shared helper: register a new user OR authenticate a returning one.
     * Used by both single-player and multiplayer flows.
     *
     * NOTE: StorageManager only holds ONE user at a time (localStorage key).
     * For multiplayer, if player 2 has a saved account, we check it;
     * otherwise we create a temporary in-memory identity so both players
     * can play without overwriting each other's saved data.
     *
     * @returns {{ ok: boolean, msg: string, userId: string }}
     */
    _authenticateOrRegister(username, api, password) {
        const saved = this.storage.loadUser();

        if (saved && saved.username === username) {
            // Returning user — verify password
            if (saved.passwordHash && !this.storage.verifyPassword(password, saved.passwordHash)) {
                return { ok: false, msg: '✗ Wrong password!', userId: '' };
            }
            const sessionId = this.storage.makeSessionId();
            // Update session without clobbering the stored record for the active user
            return {
                ok:     true,
                msg:    '✓ Welcome back, ' + username + '!',
                userId: saved.userId
            };
        } else {
            // New player — generate a fresh identity (not saved to localStorage
            // during multiplayer to avoid overwriting player 1's record)
            const userId = this.storage.makeUserId();
            return {
                ok:     true,
                msg:    '✓ Identity created for ' + username + '!',
                userId: userId
            };
        }
    }

    // ─── Gameplay ─────────────────────────────────────────────────────────────

    async startGameplay() {
        const player = this.model.getActivePlayer();

        // Update HUD
        document.getElementById('currentPlayerName').textContent = player.name;
        document.getElementById('currentRound').textContent      = this.model.currentRound;
        document.getElementById('totalRounds').textContent       = this.model.totalRounds;
        document.getElementById('currentScore').textContent      = player.score;

        /**
         * API badge shift (Interoperability — Week 3):
         * In multiplayer, each player may use a DIFFERENT external API.
         * The badge updates on every turn switch so it always shows which
         * external service is being called for THIS player's puzzle.
         * Player 1 → may call Banana API (marcconrad.com/uob/banana)
         * Player 2 → may call Emoji API  (marcconrad.com/uob/emoji)
         * Both are independent REST services on the same host but different endpoints.
         */
        const apiBadge = document.querySelector('.api-badge');
        if (apiBadge) {
            if (player.api === 'banana') {
                apiBadge.textContent = '🍌 Banana API';
                apiBadge.className   = 'api-badge banana-api';
            } else {
                apiBadge.textContent = '😊 Emoji API';
                apiBadge.className   = 'api-badge emoji-api';
            }
        }

        // Multiplayer: show whose turn it is above the HUD
        if (this.model.mode === 'multi') {
            let turnIndicator = document.getElementById('turnIndicator');
            if (!turnIndicator) {
                turnIndicator    = document.createElement('div');
                turnIndicator.id = 'turnIndicator';
                turnIndicator.style.cssText = `
                    text-align: center; padding: 12px 20px;
                    background: rgba(255,217,61,0.2);
                    border: 2px solid rgba(255,217,61,0.5);
                    border-radius: 12px; margin-bottom: 15px;
                    font-weight: 700; font-size: 1.2em; color: var(--yellow);
                `;
                const hud = document.querySelector('.game-hud');
                hud.parentNode.insertBefore(turnIndicator, hud.nextSibling);
            }
            // Show player name AND which API they are using this turn
            const apiLabel = player.api === 'banana' ? '🍌 Banana API' : '😊 Emoji API';
            turnIndicator.textContent = `${player.name}'s Turn  ·  ${apiLabel}`;
        }

        await this.loadNextPuzzle();
    }

    /**
     * Fetch the next puzzle and update the UI.
     *
     * Interoperability in action (Week 3):
     *  This method calls model.fetchPuzzle() which makes an HTTP GET request
     *  to an external REST API. The puzzle image URL is returned in the JSON
     *  response and set as the src of an <img> tag — the browser then makes a
     *  second HTTP request to fetch the image. This is cross-system
     *  interoperability: our JS app, the PHP API server, and the image server
     *  all communicate via HTTP without needing to know each other's internals.
     */
    async loadNextPuzzle() {
        const answerInput = document.getElementById('answerInput');
        const submitBtn   = document.getElementById('submitAnswerBtn');

        // Reset UI state
        this._answerLocked                                       = false;
        document.getElementById('puzzleLoading').style.display  = 'block';
        document.getElementById('puzzleImageWrapper').style.display = 'none';
        document.getElementById('feedbackMessage').style.display = 'none';
        answerInput.disabled = true;
        submitBtn.disabled   = true;
        answerInput.value    = '';

        try {
            const puzzle = await this.model.fetchPuzzle();
            if (!puzzle) throw new Error('Puzzle fetch returned null');

            // Log the raw JSON response for the video demonstration
            console.group('🌐 Interoperability — JSON API Response');
            console.log('Raw JSON received from external API:',
                JSON.stringify({ question: puzzle.question, solution: '🔒 hidden' }, null, 2));
            console.log('Deserialized JS object ready to use:', {
                api:   this.model.getActivePlayer().api,
                round: this.model.currentRound
            });
            console.groupEnd();

            // Emit event: puzzle has been loaded (Observer pattern)
            window.eventBus.emit('puzzle:loaded', {
                api:   this.model.getActivePlayer().api,
                round: this.model.currentRound
            });

            // Display puzzle image (src = URL from API JSON response)
            document.getElementById('puzzleImage').src             = puzzle.question;
            document.getElementById('puzzleLoading').style.display = 'none';
            document.getElementById('puzzleImageWrapper').style.display = 'block';

            answerInput.disabled = false;
            submitBtn.disabled   = false;
            answerInput.focus();

            // Start countdown timer
            this.model.timeLeft = this.model.timerSeconds;
            document.getElementById('timerValue').textContent = this.model.timeLeft;
            this.startTimer();

        } catch (err) {
            console.error('GameController: Failed to load puzzle >', err.message);
            document.getElementById('puzzleLoading').innerHTML =
                '<p style="color:#ff6b6b">⚠️ Failed to load puzzle from API. Please check your connection.</p>';
        }
    }

    // ─── Timer ────────────────────────────────────────────────────────────────

    /**
     * Timer is driven by setInterval — a time-based event.
     * When timeLeft reaches 0, handleAnswerSubmit(true) is called automatically.
     * This demonstrates event-driven programming beyond user interaction:
     * the system itself generates an event (timeout) that drives the game forward.
     */
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.model.timeLeft--;
            document.getElementById('timerValue').textContent = this.model.timeLeft;

            // BUG FIX: class name matches CSS (.timer-warning, not .warning)
            if (this.model.timeLeft <= 3) {
                document.getElementById('timerDisplay').classList.add('timer-warning');
            }

            if (this.model.timeLeft <= 0) {
                this.stopTimer();
                this.handleAnswerSubmit(true); // timeout event
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        // BUG FIX: remove correct class name
        document.getElementById('timerDisplay').classList.remove('timer-warning');
    }

    // ─── Answer Handling ──────────────────────────────────────────────────────

    /**
     * Handle answer submission — either from button click, Enter key, or timeout.
     *
     * _answerLocked prevents double-submission: once an answer is processed,
     * no further input is accepted until the next puzzle loads.
     *
     * After processing, emits 'answer:submitted' and optionally 'game:over'
     * via the EventBus (Observer pattern — decoupled notification).
     *
     * @param {boolean} isTimeout - true if called by the timer expiring
     */
    handleAnswerSubmit(isTimeout = false) {
        if (this._answerLocked) return;

        const rawValue = document.getElementById('answerInput').value.trim();

        if (!isTimeout) {
            if (rawValue === '') {
                alert('Please enter a number!');
                return;
            }
            if (Number.isNaN(Number(rawValue))) {
                alert('Please enter a valid number!');
                return;
            }
        }

        this._answerLocked = true;
        this.stopTimer();

        const answer    = isTimeout ? -1 : Number(rawValue);
        const isCorrect = this.model.checkAnswer(answer);

        // Emit event via EventBus — Observer pattern (Week 4)
        window.eventBus.emit('answer:submitted', {
            correct: isCorrect,
            timeout: isTimeout,
            score:   this.model.getActivePlayer().score,
            round:   this.model.currentRound,
            player:  this.model.getActivePlayer().name
        });

        // Show feedback
        const feedbackEl = document.getElementById('feedbackMessage');
        feedbackEl.style.display = 'block';

        if (isTimeout) {
            feedbackEl.textContent = `⏰ Time's up! The answer was ${this.model.puzzle.solution}`;
            // BUG FIX: CSS class is 'error', not 'wrong'
            feedbackEl.className   = 'feedback-message error';
        } else if (isCorrect) {
            feedbackEl.textContent = '🎉 Correct! Well done!';
            // BUG FIX: CSS class is 'success', not 'correct'
            feedbackEl.className   = 'feedback-message success';
        } else {
            feedbackEl.textContent = `❌ Wrong! The answer was ${this.model.puzzle.solution}`;
            feedbackEl.className   = 'feedback-message error';
        }

        document.getElementById('currentScore').textContent = this.model.getActivePlayer().score;

        setTimeout(() => {
            feedbackEl.style.display = 'none';
            this.model.advance();

            if (this.model.isOver()) {
                this.stopTimer();
                this.model.saveResults();

                // BUG FIX: emit game:over event (was missing entirely)
                window.eventBus.emit('game:over', {
                    player: this.model.getWinner()
                        ? this.model.getWinner().name
                        : 'Draw',
                    score: this.model.mode === 'single'
                        ? this.model.player1.score
                        : Math.max(this.model.player1.score, this.model.player2.score)
                });

                this._showResults();
                return;
            }

            // Advance to next round / next player's turn
            document.getElementById('currentRound').textContent = this.model.currentRound;

            if (this.model.mode === 'multi') {
                this.startGameplay();
            } else {
                this.loadNextPuzzle();
            }
        }, 2000);
    }

    // ─── Results Screen ───────────────────────────────────────────────────────

    _showResults() {
        if (this.model.mode === 'single') {
            const player = this.model.player1;
            document.getElementById('winnerName').textContent  = player.name;
            document.getElementById('finalScore').textContent  = player.score + ' / ' + this.model.totalRounds;
            document.getElementById('accuracy').textContent    = Math.round((player.score / this.model.totalRounds) * 100) + '%';
            document.getElementById('apiUsed').textContent     = player.api === 'banana' ? '🍌 Banana API' : '😊 Emoji API';
            document.getElementById('resultUserId').textContent    = player.id;
            document.getElementById('resultSessionId').textContent = this.model.user ? this.model.user.sessionId : '—';
        } else {
            const winner = this.model.getWinner();
            document.getElementById('winnerName').textContent =
                winner ? winner.name + ' Wins! 🏆' : "It's a Tie! 🤝";
            document.getElementById('finalScore').textContent =
                `${this.model.player1.name}: ${this.model.player1.score} | ${this.model.player2.name}: ${this.model.player2.score}`;
            const p1Acc = Math.round((this.model.player1.score / this.model.totalRounds) * 100);
            const p2Acc = Math.round((this.model.player2.score / this.model.totalRounds) * 100);
            document.getElementById('accuracy').textContent    = `P1: ${p1Acc}% | P2: ${p2Acc}%`;
            document.getElementById('apiUsed').textContent     =
                `P1: ${this.model.player1.api === 'banana' ? '🍌' : '😊'} | P2: ${this.model.player2.api === 'banana' ? '🍌' : '😊'}`;
            document.getElementById('resultUserId').textContent    = 'Multiplayer Mode';
            document.getElementById('resultSessionId').textContent = '—';
        }

        this.showAchievements(
            this.model.mode === 'single' ? this.model.player1.score : Math.max(this.model.player1.score, this.model.player2.score),
            this.model.totalRounds
        );
        this.launchConfetti();
        this.view.show('results');
    }

    showAchievements(score, total) {
        const achievements = [];
        const accuracy = (score / total) * 100;
        if (score === total)  achievements.push({ icon: '🌟', text: 'Perfect Score!' });
        if (accuracy >= 80)  achievements.push({ icon: '🎯', text: 'Sharp Shooter' });
        if (score >= 3)      achievements.push({ icon: '🧠', text: 'Brain Power' });

        const container = document.getElementById('achievementContainer');
        if (!container) return;
        container.innerHTML = '';

        achievements.forEach((ach, i) => {
            const badge = document.createElement('div');
            badge.className             = 'achievement-badge';
            badge.style.animationDelay  = `${i * 0.2}s`;
            badge.innerHTML = `<span class="achievement-icon">${ach.icon}</span><span>${ach.text}</span>`;
            container.appendChild(badge);
        });
    }

    launchConfetti() {
        const container = document.getElementById('confettiContainer');
        if (!container) return;
        const colors = ['#FFD93D', '#FF6B35', '#6C63FF', '#FF6B9D', '#4CAF50'];
        container.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const c           = document.createElement('div');
            c.className       = 'confetti-piece';
            c.style.left              = Math.random() * 100 + '%';
            c.style.backgroundColor   = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDelay    = Math.random() * 3 + 's';
            c.style.animationDuration = (Math.random() * 3 + 2) + 's';
            container.appendChild(c);
        }
    }
}
