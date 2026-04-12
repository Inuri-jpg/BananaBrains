window.leaderboardScreen = {

    init(storage, view) {
        this.storage = storage;
        this.view    = view;
    },

    // This is being called every time the screen is shown
    show(fromScreen = 'home') {
        this._fromScreen = fromScreen;
        this._render();
        this.view.show('leaderboard');
    },

    _render() {
        const leaderboard = this.storage.loadLeaderboard();
        const listEl      = document.getElementById('leaderboardScreenList');

        listEl.innerHTML = '';

        if (leaderboard.length === 0) {
            listEl.innerHTML = `
                <div class="lb-empty">
                    <div class="lb-empty-icon">🍌</div>
                    <p>No scores yet!</p>
                    <p>Play a game to get on the board.</p>
                </div>
            `;
            return;
        }

        leaderboard.forEach((entry, index) => {
            const rank  = index + 1;
            const medal = rank === 1 ? '1️⃣' : rank === 2 ? '2️⃣' : rank === 3 ? '3️⃣' : `${rank}.`;

            const div = document.createElement('div');
            div.className = 'lb-entry';
            div.style.animationDelay = `${index * 0.07}s`;
            div.innerHTML = `
                <div class="lb-rank">${medal}</div>
                <div class="lb-info">
                    <div class="lb-name">${entry.name}</div>
                    <div class="lb-details">
                        <span>${entry.api === 'banana' ? '🍌 Banana' : '😊 Emoji'}</span>
                        <span> 📅 ${entry.date}</span>
                    </div>
                </div>
                <div class="lb-score">${entry.score}</div>
            `;
            listEl.appendChild(div);
        });
    },

    // Returns to the screen which opened the leaderboard
    goBack() {
        this.view.show(this._fromScreen || 'home');
    }
};