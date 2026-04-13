/**
 * GameModel.js
 * The Model layer in the MVC architecture.
 *
 * Responsibilities:
 *  - Holds all game state (players, scores, rounds, timer)
 *  - Fetches puzzles from external APIs 
 *  - Manages user authentication and identity 
 *  - Contains pure game logic (no DOM access)
 *
 * Interoperability:
 *   fetchPuzzle() makes an HTTP GET request to an external REST API
 *   (marcconrad.com) running on a different server and written in a different
 *   language (PHP). The response is JSON, which is deserialized with
 *   response.json(). This is syntactic interoperability, both systems agree
 *   on HTTP as the protocol and JSON as the data format.
 *   Chosen over SOAP because REST is lightweight, stateless, and requires no
 *   XML envelope — ideal for a browser-based game fetching simple puzzle data.
 */
class GameModel {
    constructor(storage) {
        this.storage = storage;

        this.user         = null;
        this.mode         = null;
        this.totalRounds  = 5;
        this.currentRound = 1;
        this.whoseTurn    = 1;

        this.player1 = null;
        this.player2 = null;

        this.puzzle       = null;
        this.timerSeconds = 10;
        this.timeLeft     = 10;
        this.timerRef     = null;

        /**
         * External API endpoints.
         * Both are REST APIs returning JSON over HTTPS demonstrating
         * that the game can interoperate with multiple independent services.
         * The player chooses which API to use, so each player in a multiplayer
         * game may call a DIFFERENT external server — illustrating heterogeneous
         * interoperability (components on different systems using the same protocol).
         */
        this.API = {
            banana: 'https://marcconrad.com/uob/banana/api.php',
            emoji:  'https://marcconrad.com/uob/smile/api.php'
        };
    }

    /**
     * Create a new user and persist their virtual identity.
     * A unique userId (permanent) and sessionId (per-login) are generated.
     * The password is hashed before storage plain text passwords are never saved.
     */
    createUser(username, apiChoice, password) {
        this.user = {
            userId:       this.storage.makeUserId(),
            sessionId:    this.storage.makeSessionId(),
            username:     username,
            passwordHash: password ? this.storage.hashPassword(password) : null,
            apiChoice:    apiChoice,
            highScore:    0,
            gamesPlayed:  0,
            createdAt:    new Date().toISOString()
        };
        this.storage.saveUser(this.user);
        console.log('GameModel: New user created >', this.user.userId);
        return this.user;
    }

    /**
     * Authenticate a returning user.
     * Compares the entered password against the stored hash.
     * A new sessionId is issued on every successful login, invalidating
     * any previous session this is stateless session management.
     * @returns {'ok' | 'not_found' | 'wrong_password'}
     */
    authenticate(username, password) {
        const saved = this.storage.loadUser();
        if (!saved || saved.username !== username) {
            return 'not_found';
        }
        if (saved.passwordHash && !this.storage.verifyPassword(password, saved.passwordHash)) {
            console.log('GameModel: Authentication FAILED for >', username);
            return 'wrong_password';
        }
        this.user           = saved;
        this.user.sessionId = this.storage.makeSessionId(); // new session token
        this.storage.saveUser(this.user);
        console.log('GameModel: Authentication PASSED >', username);
        return 'ok';
    }

    /** Load a previously saved user from localStorage. */
    loadUser() {
        const saved = this.storage.loadUser();
        if (saved) {
            this.user           = saved;
            this.user.sessionId = this.storage.makeSessionId();
            console.log('GameModel: Returning user >', saved.username);
        }
        return saved;
    }

    updateUserStats(finalScore) {
        if (!this.user) return;
        this.user.gamesPlayed += 1;
        if (finalScore > this.user.highScore) {
            this.user.highScore = finalScore;
        }
        this.storage.saveUser(this.user);
    }

    setupSingle(username, apiChoice) {
        this.mode         = 'single';
        this.currentRound = 1;
        this.timerSeconds = this.storage.loadSettings().timerSeconds;

        if (this.user && this.user.username === username) {
            this.user.sessionId = this.storage.makeSessionId();
        } else {
            this.createUser(username, apiChoice);
        }

        this.player1 = {
            name:  username,
            id:    this.user.userId,
            api:   apiChoice,
            score: 0
        };
    }

    /**
     * Set up a multiplayer game with both players' authenticated identities.
     * @param {string} p1UserId - real userId from authentication/registration
     * @param {string} p2UserId - real userId from authentication/registration
     */
    setupMulti(p1Name, p1Api, p2Name, p2Api, p1UserId, p2UserId) {
        this.mode         = 'multi';
        this.currentRound = 1;
        this.whoseTurn    = 1;
        this.timerSeconds = this.storage.loadSettings().timerSeconds;

        this.player1 = {
            name:  p1Name,
            id:    p1UserId || ('P1-' + Date.now()),
            api:   p1Api,
            score: 0
        };
        this.player2 = {
            name:  p2Name,
            id:    p2UserId || ('P2-' + (Date.now() + 1)),
            api:   p2Api,
            score: 0
        };

        console.log('GameModel: Multiplayer setup complete', {
            player1: { name: p1Name, api: p1Api, id: this.player1.id },
            player2: { name: p2Name, api: p2Api, id: this.player2.id }
        });
    }

    /**
     * Fetch a puzzle from the external REST API chosen by the active player.
     *
     * This method demonstrates interoperability:
     *  - Uses the Fetch API to make an HTTP GET request (REST, not SOAP/GraphQL)
     *  - The remote server (marcconrad.com) runs PHP on different infrastructure
     *  - The JSON response is deserialized with response.json(), this is
     *    syntactic interoperability: both sides agree on HTTP + JSON format
     *  - Error handling ensures the game degrades gracefully on network failure
     *
     * Why REST over SOAP?
     *  REST is stateless, lightweight, and returns JSON which is natively
     *  parsed by JavaScript. SOAP would require XML parsing and is far more
     *  verbose unnecessary overhead for a simple puzzle request.
     */
    async fetchPuzzle() {
        const activePlayer = this.getActivePlayer();
        const apiUrl       = this.API[activePlayer.api];

        console.log(`GameModel: Fetching puzzle from [${activePlayer.api}] API’ ${apiUrl}`);

        try {
            // HTTP GET request the REST verb for retrieving a resource
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('HTTP error: ' + response.status);
            }

            // Deserialization: converting the JSON string into a JS object
            const data = await response.json();

            this.puzzle = data;
            console.log('GameModel: Puzzle received. Solution hidden from UI.');
            return data;

        } catch (err) {
            console.error('GameModel: API fetch failed >', err.message);
            return null;
        }
    }

    getActivePlayer() {
        if (this.mode === 'single') return this.player1;
        return this.whoseTurn === 1 ? this.player1 : this.player2;
    }

    checkAnswer(userAnswer) {
        if (!this.puzzle) return false;
        const userNum     = Number(userAnswer);
        const solutionNum = Number(this.puzzle.solution);
        if (Number.isNaN(userNum) || Number.isNaN(solutionNum)) return false;
        const correct = userNum === solutionNum;
        if (correct) this.getActivePlayer().score += 1;
        return correct;
    }

    advance() {
        if (this.mode === 'single') {
            this.currentRound += 1;
        } else {
            if (this.whoseTurn === 1) {
                this.whoseTurn = 2;
            } else {
                this.whoseTurn = 1;
                this.currentRound += 1;
            }
        }
    }

    isOver() {
        return this.currentRound > this.totalRounds;
    }

    getWinner() {
        if (this.mode === 'single') return this.player1;
        if (this.player1.score > this.player2.score) return this.player1;
        if (this.player2.score > this.player1.score) return this.player2;
        return null; // tie
    }

    saveResults() {
        this.storage.addScore(this.player1.name, this.player1.id, this.player1.score, this.player1.api);
        if (this.mode === 'multi') {
            this.storage.addScore(this.player2.name, this.player2.id, this.player2.score, this.player2.api);
        }
        if (this.mode === 'single') {
            this.updateUserStats(this.player1.score);
        }
    }
}