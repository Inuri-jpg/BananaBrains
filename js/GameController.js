class GameController {
    constructor (model, view, storage){
        this.model = model;
        this.view = view;
        this.storage = storage;
    }

    registerEvents(){
        console.log('GameController : Registereing all the events....');

        /*Home screen buttons*/
        document.getElementById('btn-single').addEventListener('click', () => {
            this.onSinglePlayerClick();
        });

        document.getElementById('btn-multi').addEventListener('click', () => {
            this.view.alert('Two Player Mode');
        });

        document.getElementById('btn-leader').addEventListener('click', () => {
            this.view.alert('Leaderboard');
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.view.alert('settings');
        });

         /* ── SETUP SCREEN ── */
       document.getElementById('btn-setup-back').addEventListener('click', () => {
        this.view.show('home');
       });

        document.querySelectorAll('.api-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.onApiOptionClick(btn);
            });
        });

        document.getElementById('nameInput').addEventListener('input', () => {
            this.onNameInput();
        });

        document.getElementById('btn-start-single').addEventListener('click', () => {
            this.onStartSingleClick();
        });

        console.log('⚡ GameController: All events registered!');
}
    /* Handler: "Single Player" button clicked */
    onSinglePlayerClick() {
        console.log('EVENT: Single Player clicked');

        if (this.model.user){
            document.getElementById('nameInput').value = this.model.user.username;
        }

        const freshId = this.storage.makeUserId();
        const freshSess = this.storage.makeSessionId();
        this.view.showGeneratedIds(freshId, freshSess);

        this.view.show('setup');
    }

    /* Handler: an API option button was clicked */
    onApiOptionClick(clickedBtn) {
        console.log('⚡ EVENT fired: API option clicked →', clickedBtn.dataset.api);

        document.querySelectorAll('.api-option').forEach(b => {
            b.classList.remove('selected');
        });

        clickedBtn.classList.add('selected');
    }

    onNameInput() {
        /* Regenerate IDs every time they type */
        const freshId   = this.storage.makeUserId();
        const freshSess = this.storage.makeSessionId();
        this.view.showGeneratedIds(freshId, freshSess);
    }

    /* Handler: "Let's Play!" was clicked */
    onStartSingleClick() {
        console.log('⚡ EVENT fired: Start Single Player clicked');

        /* Get values from the view */
        const name = this.view.getTypedName();
        const api  = this.view.getSelectedApi();

        if (name === ''){
         this.view.alert('Please enter your username ; ');
         return;
        }

        this.model.setupSingle(name,api);

        console.log('Virtual Identity saved:', this.model.user);

       this.view.show('gameplay');
    
       /* Start the game */
       this.startGameplay();

    }

    /* ════════════════════════════════════════════════════════════════
   GAMEPLAY METHODS
   ════════════════════════════════════════════════════════════════ */

async startGameplay() {
    console.log('🎮 Starting gameplay...');
    
    const player = this.model.getActivePlayer();
    
    /* Update HUD */
    document.getElementById('currentPlayerName').textContent = player.name;
    document.getElementById('currentRound').textContent = this.model.currentRound;
    document.getElementById('totalRounds').textContent = this.model.totalRounds;
    document.getElementById('currentScore').textContent = player.score;
    
    /* Update API badge */
    const apiBadge = document.querySelector('.api-badge');
    if (player.api === 'banana') {
        apiBadge.textContent = '🍌 Banana API';
        apiBadge.className = 'api-badge banana-api';
    } else {
        apiBadge.textContent = '😊 Emoji API';
        apiBadge.className = 'api-badge emoji-api';
    }
    
    /* Load first puzzle */
    await this.loadNextPuzzle();
}

async loadNextPuzzle() {
    console.log('🌐 INTEROPERABILITY: Loading puzzle from API');
    
    /* Show loading state */
    document.getElementById('puzzleLoading').style.display = 'block';
    document.getElementById('puzzleImageWrapper').style.display = 'none';
    document.getElementById('answerInput').disabled = true;
    document.getElementById('submitAnswerBtn').disabled = true;
    document.getElementById('answerInput').value = '';
    
    try {
        /* Fetch puzzle from external API */
        const puzzle = await this.model.fetchPuzzle();
        
        if (!puzzle) {
            throw new Error('Failed to fetch puzzle');
        }
        
        /* Display puzzle */
        document.getElementById('puzzleImage').src = puzzle.question;
        document.getElementById('puzzleLoading').style.display = 'none';
        document.getElementById('puzzleImageWrapper').style.display = 'block';
        document.getElementById('answerInput').disabled = false;
        document.getElementById('submitAnswerBtn').disabled = false;
        document.getElementById('answerInput').focus();
        
        console.log('✓ Puzzle loaded from API');
        
        /* Start timer */
        this.startTimer();
        
    } catch (error) {
        console.error('❌ Error loading puzzle:', error);
        alert('Failed to load puzzle. Please check your internet connection.');
    }
}

startTimer() {
    this.timerInterval = setInterval(() => {
        this.model.timeLeft--;
        document.getElementById('timerValue').textContent = this.model.timeLeft;
        
        if (this.model.timeLeft <= 3) {
            document.getElementById('timerDisplay').classList.add('warning');
        }
        
        if (this.model.timeLeft <= 0) {
            this.stopTimer();
            this.handleAnswerSubmit();
        }
    }, 1000);
}

stopTimer() {
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }
    document.getElementById('timerDisplay').classList.remove('warning');
}

handleAnswerSubmit() {
    const answer = parseInt(document.getElementById('answerInput').value);
    
    if (isNaN(answer)) {
        alert('Please enter a valid number!');
        return;
    }
    
    this.stopTimer();
    
    const isCorrect = this.model.checkAnswer(answer);
    
    /* Show feedback */
    const feedbackEl = document.getElementById('feedbackMessage');
    if (isCorrect) {
        feedbackEl.textContent = '🎉 Correct!';
        feedbackEl.className = 'feedback-message correct';
    } else {
        feedbackEl.textContent = `❌ Wrong! Answer was ${this.model.puzzle.solution}`;
        feedbackEl.className = 'feedback-message wrong';
    }
    feedbackEl.style.display = 'block';
    
    /* Update score */
    document.getElementById('currentScore').textContent = this.model.getActivePlayer().score;
    
    /* Move to next round */
    setTimeout(() => {
        feedbackEl.style.display = 'none';
        this.model.advance();
        
        if (this.model.isOver()) {
            alert('Game Over! Final Score: ' + this.model.getActivePlayer().score);
            this.view.show('home');
        } else {
            document.getElementById('currentRound').textContent = this.model.currentRound;
            this.model.timeLeft = this.model.timerSeconds;
            this.loadNextPuzzle();
        }
    }, 2000);
}
}