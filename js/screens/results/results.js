let gameResults = {
    mode: 'single',
    player: {
        name: 'BananaKing',
        userId: 'USER-1708896000000-abc123',
        sessionId: 'SESSION-1708896000000-xyz789',
        score: 4,
        totalRounds: 5,
        apiUsed: 'banana'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('⚡ DOMContentLoaded fired');

    // DOM Elements
    const playAgainBtn = document.getElementById('playAgainBtn');
    const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const confettiContainer = document.getElementById('confettiContainer');
    const achievementContainer = document.getElementById('achievementContainer');

    // Initialize results
    loadGameResults();
    displayResults(gameResults);
    launchConfetti();
    saveToLeaderboard(gameResults);
    checkAchievements(gameResults);

    // Play Again Button
    playAgainBtn.addEventListener('click', () => {
        console.log('⚡ Play Again clicked');

        const newSessionId = generateSessionId();
        console.log('👤 New Session ID:', newSessionId);

        updateSessionId(newSessionId);

        alert(`New Session Started!\n\nSession ID: ${newSessionId}\n\nIn full game, navigate to Setup Screen`);
    });

    // View Leaderboard Button
    viewLeaderboardBtn.addEventListener('click', () => {
        console.log('⚡ View Leaderboard clicked');
        displayLeaderboard();
    });


    // Back to Home Button
    backToHomeBtn.addEventListener('click', () => {
        console.log('⚡ Back to Home clicked');
        alert('In full game, navigate to Home Screen');
    });


    // Load game results from localStorage
    function loadGameResults() {
        console.log('👤 Loading game results');
        const savedResults = localStorage.getItem('bananaBrain_lastGame');
        if (savedResults) {
            gameResults = JSON.parse(savedResults);
            console.log('✓ Loaded results from localStorage');
        } else {
            console.log('Using default demo results');
        }
    }

    // Save to leaderboard
    function saveToLeaderboard(results) {
        console.log('👤 Saving to leaderboard');

        let leaderboard = JSON.parse(localStorage.getItem('bananaBrain_leaderboard') || '[]');

        const entry = {
            userId: results.player.userId,
            username: results.player.name,
            score: results.player.score,
            totalRounds: results.player.totalRounds,
            accuracy: Math.round((results.player.score / results.player.totalRounds) * 100),
            apiUsed: results.player.apiUsed,
            sessionId: results.player.sessionId,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString()
        };

        leaderboard.push(entry);

        // Sort by score descending, then accuracy
        leaderboard.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);

        leaderboard = leaderboard.slice(0, 10); // top 10
        localStorage.setItem('bananaBrain_leaderboard', JSON.stringify(leaderboard));

        console.log('✓ Leaderboard updated');

        updateUserProfile(results);

        setTimeout(() => {
            const notification = document.getElementById('leaderboardNotification');
            if (notification) notification.style.display = 'block';
        }, 1000);
    }

    // Update user profile
    function updateUserProfile(results) {
        let profile = JSON.parse(localStorage.getItem('bananaBrain_currentUser') || 'null');
        if (profile) {
            profile.gamesPlayed = (profile.gamesPlayed || 0) + 1;
            if (results.player.score > (profile.highScore || 0)) {
                profile.highScore = results.player.score;
                console.log(`🎉 New High Score: ${profile.highScore}`);
            }
            profile.lastPlayed = new Date().toISOString();
            localStorage.setItem('bananaBrain_currentUser', JSON.stringify(profile));
        }
    }

    // Display results
    function displayResults(results) {
        document.getElementById('winnerName').textContent = results.player.name;
        document.getElementById('finalScore').textContent = `${results.player.score} / ${results.player.totalRounds}`;
        document.getElementById('accuracy').textContent = `${Math.round((results.player.score / results.player.totalRounds) * 100)}%`;
        document.getElementById('apiUsed').textContent = results.player.apiUsed === 'banana' ? '🍌 Banana API' : '😊 Emoji API';
        document.getElementById('resultUserId').textContent = results.player.userId;
        document.getElementById('resultSessionId').textContent = results.player.sessionId;
    }

    // Check achievements
    function checkAchievements(results) {
        const achievements = [];
        const score = results.player.score;
        const total = results.player.totalRounds;
        const accuracy = (score / total) * 100;

        if (score === total) achievements.push({ icon: '🌟', text: 'Perfect Score!' });
        if (accuracy >= 80) achievements.push({ icon: '🎯', text: 'Sharp Shooter' });
        if (score >= 3) achievements.push({ icon: '🧠', text: 'Brain Power' });

        achievementContainer.innerHTML = '';
        achievements.forEach((ach, i) => {
            const badge = document.createElement('div');
            badge.className = 'achievement-badge';
            badge.style.animationDelay = `${i * 0.2}s`;
            badge.innerHTML = `<span class="achievement-icon">${ach.icon}</span><span class="achievement-text">${ach.text}</span>`;
            achievementContainer.appendChild(badge);
        });
    }

    // Confetti
    function launchConfetti() {
        const colors = ['#FFD93D', '#FF6B35', '#6C63FF', '#FF6B9D', '#4CAF50'];
        confettiContainer.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const c = document.createElement('div');
            c.className = 'confetti-piece';
            c.style.left = Math.random() * 100 + '%';
            c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDelay = Math.random() * 3 + 's';
            c.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confettiContainer.appendChild(c);
        }
    }

    // Display Leaderboard
    function displayLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('bananaBrain_leaderboard') || '[]');
        if (!leaderboard.length) {
            alert('Leaderboard is empty!');
            return;
        }

        let msg = '🏆 BANANA BRAIN LEADERBOARD 🏆\n\n';
        leaderboard.forEach((e, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            msg += `${medal} ${e.username}\nScore: ${e.score}/${e.totalRounds} (${e.accuracy}%)\nAPI: ${e.apiUsed === 'banana' ? '🍌' : '😊'}\nDate: ${e.date}\n\n`;
        });
        alert(msg);
    }

    // Session ID helpers
    function generateSessionId() {
        return `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    function updateSessionId(newId) {
        const user = JSON.parse(localStorage.getItem('bananaBrain_currentUser') || '{}');
        if (user.userId) {
            user.sessionId = newId;
            localStorage.setItem('bananaBrain_currentUser', JSON.stringify(user));
        }
    }

    // Fix number input validation
    const submitBtn = document.getElementById('submitAnswerBtn');
    const answerInput = document.getElementById('answerInput');

    if (submitBtn && answerInput) {
        submitBtn.addEventListener('click', () => {
            const val = answerInput.value.trim();
            if (val === '') return alert('Please enter a number!');
            const num = Number(val);
            if (Number.isNaN(num)) return alert('Enter a valid number!');
            console.log('✅ User entered number:', num);
            // Call your game logic here
        });
    }
});