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
            .addEventListener('click', () => this.view.alert('Two Player Mode'));

        document.getElementById('btn-leader')
            .addEventListener('click', () => this.view.alert('Leaderboard'));

        document.getElementById('btn-settings')
            .addEventListener('click', () => this.view.alert('Settings'));

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
            this.showLeaderboard();
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

        document.getElementById('currentPlayerName').textContent = player.name;
        document.getElementById('currentRound').textContent = this.model.currentRound;
        document.getElementById('totalRounds').textContent = this.model.totalRounds;
        document.getElementById('currentScore').textContent = player.score;

        const apiBadge = document.querySelector('#gameplayScreen .api-badge');
        if (player.api === 'banana') {
            apiBadge.textContent = '🍌 Banana API';
            apiBadge.className = 'api-badge banana-api';
        } else {
            apiBadge.textContent = '😊 Emoji API';
            apiBadge.className = 'api-badge emoji-api';
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
}
