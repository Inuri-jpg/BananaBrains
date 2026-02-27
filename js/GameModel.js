class GameModel {
    constructor(storage){
        this.storage = storage;
        
        this.user = null;

        this.mode = null;
        this.totalRounds = 5;
        this.currentRounds = 1;
        this.whoseTurn = 1;

        this.player1 = null;
        this.player2 = null;

        this.puzzle = null;

        this.timerSeconds = 10;
        this.timeleft = 10;
        this.timerRef = null;

        this.API = {
            banana: 'https://marcconrad.com/uob/banana/api.php',
            emoji:  'https://marcconrad.com/uob/emoji/api.php'
        };
    }

    createUser(username, apiChoice){
        this.user = {
            userId: this.storage.makeUserId(),
            sessionId: this.storage.makeSessionId(),
            username: username,
            apiChoice: apiChoice,
            highScore: 0,
            gamesPlayed: 0,
            createdAt: new Date().toISOString()
        };

        this.storage.saveUser(this.user);
        console.log('GameModel: New user created >', this.user.userId);
        return this.user;
    }


    loadUser() {
        const saved = this.storage.loadUser();
        if (saved) {
            this.user = saved;
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

    /**Game setup methods */

    setupSingle(username, apiChoice) {
        this.mode = 'single';
        this.currentRound = 1;
        this.timerSeconds = this.storage.loadSettings().timerSeconds;

         /* Create or reuse identity */
         if (this.user && this.user.username === username){
            this.user.sessionId = this.storage.makeSessionId();
         } else {
            this.createUser(username, apiChoice);
         }

         this.player1 = {
            name: username,
            id: this.user.userId,
            api: apiChoice,
            score: 0
         };
    }

    setupMulti(p1Name, p1Api, p2Name, p2Api){
        this.mode = 'multi';
        this.currentRound = 1;
        this.whoseTurn = 1;
        this.timerSeconds = this.storage.loadSettings().timerSeconds;

        this.player1 = {
            name: p1Name,
            id: 'P1-' + Date.now(),
            api: p1Api,
            score: 0
        };

        this.player2 = {
            name: p2Name,
            id: 'P2-' + Date.now(),
            api: p2Api,
            score: 0
        };
    }

      /**fetching the puzzle from the API */
      async fetchPuzzle(){
        const activePlayer = this.getActivePlayer();
        const apiUrl = this.API[activePlayer.api];

        console.log('Fetching from', activePlayer.api, 'API > ', apiUrl);

        try{
            const response = await fetch(apiUrl);

            if (!response.ok){
                throw new Error('HTTP error: ' + response.status);
            }

            const data = await response.json();

            this.puzzle = data;
            console.log('Puzzle received! Secret answer: ', data.solution);
            return data;
        } catch (err){
            console.error('API Error: ', err.message);
            return null;
        }
      }

        /**Game logic */
        /* Returns whichever player is currently active */
        getActivePlayer() {
        if (this.mode === 'single') return this.player1;
        return this.whoseTurn === 1 ? this.player1 : this.player2;
    }

        /* Check if answer is correct — returns true/false */
        checkAnswer(userAnswer) {
        if (!this.puzzle) return false;
        const correct = parseInt(userAnswer) === parseInt(this.puzzle.solution);
        if (correct) {
            this.getActivePlayer().score += 1;
        }
        return correct;
    }

        /* Move game forward after each answer */
        advance() {
        if (this.mode === 'single') {
            this.currentRound += 1;
        } else {
            /* Two-player: switch turns, increment round after both played */
            if (this.whoseTurn === 1) {
                this.whoseTurn = 2;
            } else {
                this.whoseTurn = 1;
                this.currentRound += 1;
            }
        }
    }

    /* Checks if the game has finfished */
    isOver(){
        return this.currentRound > this.totalRounds;
    }

    getWinner(){
        if (this.mode === 'single') return this.player1.id;
        if (this.player1.score > this.player2.score) return this.player1;
        if (this.player2.score > this.player1.score) return this.player2;
     }

     saveResults(){
        this.storage.addScore(this.player1.name, this.player1.id, this.player1.score, this.player1.api);
        if (this.mode === 'multi'){
            this.storage.addScore(this.player2.name, this.player2.id, this.player2.score, this.player2.api);
        }

        if (this.mode === 'single'){
            this.updateUserStats(this.player1.score);
        }
     } 
}