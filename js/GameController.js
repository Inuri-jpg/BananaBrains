class GameController {
    constructor(model, view, storage) {
        this.model = model;
        this.view = view;
        this.storage = storage;
        this.timerInterval = null;
        this._answerLocked = false; // Guards against double-submit
    }

    registerEvents() {
        console.log('GameController: Registering events...');

        // Home buttons
        document.getElementById('btn-single')
            .addEventListener('click', () => this.onSinglePlayerClick());

        document.getElementById('btn-multi')
    .addEventListener('click', () => this.onMultiPlayerClick());

    
    document.getElementById('btn-multi-back')
    .addEventListener('click', () => this.view.show('home'));

    document.getElementById('btn-start-multi')
    .addEventListener('click', () => this.onStartMultiClick());

        document.getElementById('btn-leader')
    .addEventListener('click', () => {
        window.leaderboardScreen.show('home');
         });

        document.getElementById('btn-settings')
    .addEventListener('click', () => this.view.show('settings'));

        // Setup screen
        document.getElementById('btn-setup-back')
            .addEventListener('click', () => this.view.show('home'));

        document.querySelectorAll('.api-option').forEach(btn => {
            btn.addEventListener('click', () => this.onApiOptionClick(btn));
        });

        document.getElementById('nameInput')
            .addEventListener('input', () => this.onNameInput());

        document.getElementById('btn-start-single')
            .addEventListener('click', () => this.onStartSingleClick());

        document.getElementById('submitAnswerBtn')
            .addEventListener('click', () => this.handleAnswerSubmit());

        //Enter key support on answer input
        document.getElementById('answerInput')
        .addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleAnswerSubmit();
    });

        // Results screen buttons
        document.getElementById('playAgainBtn')
        .addEventListener('click', () => {
            this.view.show('setup');
        });

        document.getElementById('viewLeaderboardBtn')
    .addEventListener('click', () => {
        window.leaderboardScreen.show('results');
    });

    document.getElementById('btn-leaderboard-back')
    .addEventListener('click', () => {
        window.leaderboardScreen.goBack();
    });

        document.getElementById('backToHomeBtn')
        .addEventListener('click', () => {
            this.view.show('home');
        });

        console.log('⚡ All events registered!');
    }

    onSinglePlayerClick() {
        if (this.model.user) {
            document.getElementById('nameInput').value = this.model.user.username;
        }

        const freshId = this.storage.makeUserId();
        const freshSess = this.storage.makeSessionId();
        this.view.showGeneratedIds(freshId, freshSess);

        this.view.show('setup');
    }

    onApiOptionClick(clickedBtn) {
        document.querySelectorAll('.api-option')
            .forEach(b => b.classList.remove('selected'));

        clickedBtn.classList.add('selected');
    }

    onNameInput() {
        const freshId = this.storage.makeUserId();
        const freshSess = this.storage.makeSessionId();
        this.view.showGeneratedIds(freshId, freshSess);
    }

    onStartSingleClick() {
        const name = this.view.getTypedName();
        const api = this.view.getSelectedApi();

        if (name === '') {
            this.view.alert('Please enter your username.');
            return;
        }

        this.model.setupSingle(name, api);
        this._answerLocked = false;

        this.view.show('gameplay');
        this.startGameplay();
    }

   async startGameplay() {
    const player = this.model.getActivePlayer();

    // Update HUD
    document.getElementById('currentPlayerName').textContent = player.name;
    document.getElementById('currentRound').textContent = this.model.currentRound;
    document.getElementById('totalRounds').textContent = this.model.totalRounds;
    document.getElementById('currentScore').textContent = player.score;

    // Update API badge
    const apiBadge = document.querySelector('.api-badge');
    if (player.api === 'banana') {
        apiBadge.textContent = '🍌 Banana API';
        apiBadge.className = 'api-badge banana-api';
    } else {
        apiBadge.textContent = '😊 Emoji API';
        apiBadge.className = 'api-badge emoji-api';
    }

    // Show turn indicator for multiplayer
    if (this.model.mode === 'multi') {
        let turnIndicator = document.getElementById('turnIndicator');
        
        if (!turnIndicator) {
            turnIndicator = document.createElement('div');
            turnIndicator.id = 'turnIndicator';
            turnIndicator.style.cssText = `
                text-align: center; 
                padding: 15px; 
                background: rgba(255,217,61,0.2); 
                border: 2px solid rgba(255,217,61,0.5);
                border-radius: 12px; 
                margin-bottom: 15px; 
                font-weight: 700;
                font-size: 1.2em;
                color: var(--yellow);
            `;
            const hudElement = document.querySelector('.game-hud');
            hudElement.parentNode.insertBefore(turnIndicator, hudElement.nextSibling);
        }
        
        turnIndicator.textContent = `${player.name}'s Turn`;
    }

    await this.loadNextPuzzle();
}

  async loadNextPuzzle() {
    const answerInput = document.getElementById('answerInput');
    const submitBtn = document.getElementById('submitAnswerBtn');

    // Reset UI
    this._answerLocked = false;
    document.getElementById('puzzleLoading').style.display = 'block';
    document.getElementById('puzzleImageWrapper').style.display = 'none';
    answerInput.disabled = true;
    submitBtn.disabled = true;
    answerInput.value = '';

    try {
        const puzzle = await this.model.fetchPuzzle();
        if (!puzzle) throw new Error('Puzzle fetch failed');

        document.getElementById('puzzleImage').src = puzzle.question;
        document.getElementById('puzzleLoading').style.display = 'none';
        document.getElementById('puzzleImageWrapper').style.display = 'block';

        answerInput.disabled = false;
        submitBtn.disabled = false;
        answerInput.focus();

        // Reset timer
        this.model.timeLeft = this.model.timerSeconds;
        document.getElementById('timerValue').textContent = this.model.timeLeft;
        this.startTimer();

    } catch (err) {
        alert('Failed to load puzzle. Try again.');
    }
}

    startTimer() {
        this.stopTimer();

        this.timerInterval = setInterval(() => {
            this.model.timeLeft--;
            document.getElementById('timerValue').textContent = this.model.timeLeft;

            if (this.model.timeLeft <= 3) {
                document.getElementById('timerDisplay').classList.add('warning');
            }

            if (this.model.timeLeft <= 0) {
                this.stopTimer();
                this.handleAnswerSubmit(true);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        document.getElementById('timerDisplay')
            .classList.remove('warning');
    }

    handleAnswerSubmit(isTimeout = false) {
    if (this._answerLocked) return;

    const rawValue = document.getElementById('answerInput').value.trim();

    if (!isTimeout) {
    if (rawValue === '') {
        alert('Please enter a number!');
        return;
    }
    
    if (Number.isNaN(Number(rawValue))) {
        alert('Enter a valid number!');
        return;
}
    }

    this._answerLocked = true;
    this.stopTimer();

    const answer = isTimeout ? -1 : Number(rawValue);
    const isCorrect = this.model.checkAnswer(answer);

    const feedbackEl = document.getElementById('feedbackMessage');
    feedbackEl.style.display = 'block';

    if (isTimeout) {
    feedbackEl.textContent = `⏰ Time's up! Answer was ${this.model.puzzle.solution}`;
    feedbackEl.className = 'feedback-message error';
    } else if (isCorrect) {
    feedbackEl.textContent = '🎉 Correct!';
    feedbackEl.className = 'feedback-message correct';
    } else {
    feedbackEl.textContent = `❌ Wrong! Answer was ${this.model.puzzle.solution}`;
    feedbackEl.className = 'feedback-message wrong';
    }

    document.getElementById('currentScore')
        .textContent = this.model.getActivePlayer().score;

    setTimeout(() => {
        feedbackEl.style.display = 'none';

        // Advance FIRST
        this.model.advance();

        // After: this.model.advance();

// Check if game is over
if (this.model.isOver()) {
    this.stopTimer();
    this.model.saveResults();

    // Show results for single or multiplayer
    if (this.model.mode === 'single') {
        const player = this.model.getActivePlayer();
        document.getElementById('winnerName').textContent = player.name;
        document.getElementById('finalScore').textContent =
            player.score + " / " + this.model.totalRounds;
        document.getElementById('accuracy').textContent =
            Math.round((player.score / this.model.totalRounds) * 100) + "%";
        document.getElementById('apiUsed').textContent =
            player.api === 'banana' ? "🍌 Banana API" : "😊 Emoji API";
        document.getElementById('resultUserId').textContent = player.id;
        document.getElementById('resultSessionId').textContent =
            this.model.user.sessionId;
    } else {
        // Multiplayer results
        const winner = this.model.getWinner();
        
        if (winner === null) {
            document.getElementById('winnerName').textContent = "It's a Tie! 🤝";
        } else {
            document.getElementById('winnerName').textContent = winner.name + ' Wins! 🏆';
        }
        
        document.getElementById('finalScore').textContent =
            `${this.model.player1.name}: ${this.model.player1.score} | ${this.model.player2.name}: ${this.model.player2.score}`;
        
        const p1Acc = Math.round((this.model.player1.score / this.model.totalRounds) * 100);
        const p2Acc = Math.round((this.model.player2.score / this.model.totalRounds) * 100);
        document.getElementById('accuracy').textContent = `P1: ${p1Acc}% | P2: ${p2Acc}%`;
        
        document.getElementById('apiUsed').textContent =
            `P1: ${this.model.player1.api === 'banana' ? '🍌' : '😊'} | P2: ${this.model.player2.api === 'banana' ? '🍌' : '😊'}`;
        
        document.getElementById('resultUserId').textContent = 'Multiplayer Mode';
        document.getElementById('resultSessionId').textContent = '—';
    }

    this.showAchievements(this.model.getActivePlayer().score, this.model.totalRounds);
    this.view.show('results');
    return;
}

// Next round/turn
document.getElementById('currentRound').textContent = this.model.currentRound;

// Update for next player in multiplayer
if (this.model.mode === 'multi') {
    this.startGameplay(); // Refresh HUD for next player's turn
} else {
    this.loadNextPuzzle();
}
        // THEN check if game is over
        if (this.model.isOver()) {
            this.stopTimer();
            this.model.saveResults();

            const player = this.model.getActivePlayer();

            document.getElementById('winnerName').textContent = player.name;
            document.getElementById('finalScore').textContent =
                player.score + " / " + this.model.totalRounds;
            document.getElementById('accuracy').textContent =
                Math.round((player.score / this.model.totalRounds) * 100) + "%";
            document.getElementById('apiUsed').textContent =
                player.api === 'banana' ? "🍌 Banana API" : "😊 Emoji API";
            document.getElementById('resultUserId').textContent = player.id;
            document.getElementById('resultSessionId').textContent =
                this.model.user.sessionId;

            // Show achievements
            this.launchConfetti();
            this.showAchievements(player.score, this.model.totalRounds);

            setTimeout(() => {
            const notif = document.getElementById('leaderboardNotification');
            if (notif) notif.style.display = 'block';
            }, 1000);

            this.view.show('results');
            return;
        }

        // Next round
        document.getElementById('currentRound')
            .textContent = this.model.currentRound;

        this.loadNextPuzzle();
    }, 2000);
}

  showAchievements(score, total) {
    const achievements = [];
    const accuracy = (score / total) * 100;
    if (score === total) achievements.push({ icon: '🌟', text: 'Perfect Score!' });
    if (accuracy >= 80) achievements.push({ icon: '🎯', text: 'Sharp Shooter' });
    if (score >= 3) achievements.push({ icon: '🧠', text: 'Brain Power' });

    const container = document.getElementById('achievementContainer');
    if (!container) return;
    container.innerHTML = '';

    achievements.forEach((ach, i) => {
        const badge = document.createElement('div');
        badge.className = 'achievement-badge';
        badge.style.animationDelay = `${i * 0.2}s`;
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
          const c = document.createElement('div');
          c.className = 'confetti-piece';
           c.style.left = Math.random() * 100 + '%';
           c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
           c.style.animationDelay = Math.random() * 3 + 's';
           c.style.animationDuration = (Math.random() * 3 + 2) + 's';
           container.appendChild(c);
       }
    }

showLeaderboard() {
    console.log('🏆 Showing leaderboard');
    
    const leaderboard = this.storage.loadLeaderboard();
    const listEl = document.getElementById('leaderboardList');
    
if (!listEl) {
    let message = '🏆 LEADERBOARD 🏆\n\n';
    
    if (leaderboard.length === 0) {
        message += 'No scores yet! Play to add your name.';
    } else {
        leaderboard.forEach((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            message += `${medal} ${entry.name} - ${entry.score} pts\n`;
            message += `   API: ${entry.api === 'banana' ? '🍌' : '😊'} | ${entry.date}\n\n`;
        });
    }
    this.view.alert(message);
    return;
}

// If leaderboard overlay exists in HTML
listEl.innerHTML = '';
    
    if (leaderboard.length === 0) {
        listEl.innerHTML = `
            <div class="empty-leaderboard">
                <div class="empty-leaderboard-icon">🏆</div>
                <p>No scores yet!</p>
                <p>Play some games to see your name here.</p>
            </div>
        `;
    } else {
        leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            
            entryDiv.innerHTML = `
                <div class="leaderboard-rank">${medal}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${entry.name}</div>
                    <div class="leaderboard-details">
                        <span>👤 ${entry.userId.substring(0, 12)}...</span>
                        <span>${entry.api === 'banana' ? '🍌 Banana' : '😊 Emoji'}</span>
                        <span>📅 ${entry.date}</span>
                    </div>
                </div>
                <div class="leaderboard-score">${entry.score}</div>
            `;
            
            listEl.appendChild(entryDiv);
        });
    }
    document.getElementById('leaderboardOverlay').style.display = 'flex';
}

//mutliplayer screen functions 
onMultiPlayerClick() {
    console.log('⚡ EVENT: Two Players button clicked');
    
    // Generate initial IDs
    window.multiplayerScreen.generateInitialIds();
    
    // Clear previous names
    document.getElementById('player1Name').value = '';
    document.getElementById('player2Name').value = '';
    
    this.view.show('multiplayer');
}

onStartMultiClick() {
    console.log('⚡ EVENT: Start Multiplayer clicked');
    
    const p1Name = document.getElementById('player1Name').value.trim();
    const p2Name = document.getElementById('player2Name').value.trim();
    
    if (p1Name === '' || p2Name === '') {
        this.view.alert('Both players must enter their names! 🍌');
        return;
    }
    
    const p1Api = document.querySelector('.api-option.selected[data-player="1"]').dataset.api;
    const p2Api = document.querySelector('.api-option.selected[data-player="2"]').dataset.api;
    
    // Setup multiplayer game in model
    this.model.setupMulti(p1Name, p1Api, p2Name, p2Api);
    
    console.log('👥 Multiplayer game setup:', {
        player1: { name: p1Name, api: p1Api },
        player2: { name: p2Name, api: p2Api }
    });
    
    // Navigate to gameplay
    this.view.show('gameplay');
    this.startGameplay();
}
}
