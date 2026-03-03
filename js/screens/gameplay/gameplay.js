        // Game state variables
        let currentPuzzle = null;
        let timerInterval = null;
        let timeRemaining = 30;
        let currentScore = 0;
        let currentRound = 1;
        const totalRounds = 5;
        let selectedApi = 'banana'; 
        let playerName = 'BananaKing';

        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded event fired');
            
            // DOM Elements
            const answerInput = document.getElementById('answerInput');
            const submitBtn = document.getElementById('submitAnswerBtn');
            const quitBtn = document.getElementById('quitGameBtn');
            const timerDisplay = document.getElementById('timerDisplay');
            const timerValue = document.getElementById('timerValue');
            const feedbackMessage = document.getElementById('feedbackMessage');
            const puzzleLoading = document.getElementById('puzzleLoading');
            const puzzleImageWrapper = document.getElementById('puzzleImageWrapper');
            const puzzleImage = document.getElementById('puzzleImage');

            // Load user data from localStorage 
            loadUserData();

            // Page load 
            console.log('Starting first puzzle round');
            loadNextPuzzle();

            //Submit answer button click
            submitBtn.addEventListener('click', () => {
                console.log('Submit Answer button clicked');
                handleAnswerSubmit();
            });

            //Enter key press 
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('⚡ EVENT: Enter key pressed');
                    handleAnswerSubmit();
                }
            });

            //Quit button
            quitBtn.addEventListener('click', () => {
                console.log('⚡ EVENT: Quit Game button clicked');
                if (confirm('Are you sure you want to quit?')) {
                    stopTimer();
                    console.log('Game quit by player');
                    alert(`Game Over!\n\nFinal Score: ${currentScore}/${totalRounds}\n\nIn full game, this would navigate to Screen 6 (Results)`);
                }
            });

            //Load user data
            function loadUserData() {
                console.log('👤 VIRTUAL IDENTITY: Loading user data from localStorage');
                const userData = localStorage.getItem('bananaBrain_currentUser');
                
                if (userData) {
                    const user = JSON.parse(userData);
                    playerName = user.username;
                    selectedApi = user.selectedApi || 'banana';
                    
                    document.getElementById('currentPlayerName').textContent = playerName;
                    
                    // Update API badge
                    const apiBadge = document.querySelector('.api-badge');
                    if (selectedApi === 'emoji') {
                        apiBadge.className = 'api-badge emoji-api';
                        apiBadge.textContent = '😊 Emoji API';
                    }
                    
                    console.log(`✓ User data loaded: ${playerName}, API: ${selectedApi}`);
                } else {
                    console.log('No saved user data found, using defaults');
                }
            }

            //Timer tick event 
            function startTimer() {
                console.log(' Timer started');
                timeRemaining = 30;
                updateTimerDisplay();

                timerInterval = setInterval(() => {
                    console.log(`⏱️ Timer tick: ${timeRemaining}s remaining`);
                    timeRemaining--;
                    updateTimerDisplay();

                    // Warning animation when time is low
                    if (timeRemaining <= 5) {
                        timerDisplay.classList.add('timer-warning');
                        console.log('⚠️ Timer warning: Less than 3 seconds!');
                    }

                    // Time expired event
                    if (timeRemaining <= 0) {
                        console.log('Timer expired');
                        stopTimer();
                        handleTimeExpired();
                    }
                }, 1000);
            }

            function stopTimer() {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    console.log('Timer stopped');
                }
                timerDisplay.classList.remove('timer-warning');
            }

            function updateTimerDisplay() {
                timerValue.textContent = timeRemaining;
            }

            //Fetch puzzle from external API
            async function loadNextPuzzle() {
                try {
                    // Show loading state
                    puzzleLoading.style.display = 'flex';
                    puzzleImageWrapper.style.display = 'none';
                    answerInput.disabled = true;
                    submitBtn.disabled = true;
                    answerInput.value = '';

                    // Determine which API to use
                    const apiUrl = selectedApi === 'banana' 
                        ? 'https://marcconrad.com/uob/banana/api.php'
                        : 'https://marcconrad.com/uob/emoji/api.php';

                    console.log(`Making HTTP request to ${apiUrl}`);

                    // Make API call 
                    const response = await fetch(apiUrl);
                    console.log(`✓ Response received from API (Status: ${response.status})`);
                    
                    const data = await response.json();
                    console.log('✓ JSON data parsed successfully');

                    currentPuzzle = {
                        imageUrl: data.question,
                        solution: data.solution
                    };

                    console.log('=== PUZZLE DATA RECEIVED ===');
                    console.log(`Image URL: ${currentPuzzle.imageUrl}`);
                    console.log(`Solution: ${currentPuzzle.solution}`);
                  

                    // Display puzzle image
                    puzzleImage.src = currentPuzzle.imageUrl;
                    puzzleImage.onload = () => {
                        puzzleLoading.style.display = 'none';
                        puzzleImageWrapper.style.display = 'block';
                        answerInput.disabled = false;
                        submitBtn.disabled = false;
                        answerInput.focus();
                    };

                    // Start countdown timer
                    startTimer();

                } catch (error) {
                    console.error('ERROR:', error);
                    console.error('Failed to fetch puzzle from API');
                    showFeedback('Failed to load puzzle. Check network connection.', 'error');
                    
                    // Retry after 3 seconds
                    setTimeout(() => {
                        console.log('Retrying API call...');
                        loadNextPuzzle();
                    }, 3000);
                }
            }

            // Answer submission logic
            function handleAnswerSubmit() {
                const userAnswer = parseInt(answerInput.value);

                if (isNaN(userAnswer)) {
                    showFeedback('Please enter a valid number!', 'warning');
                    return;
                }

                console.log(`User submitted answer: ${userAnswer}`);
                console.log(`Correct answer: ${currentPuzzle.solution}`);

                stopTimer();

                // Check if answer is correct
                if (userAnswer === currentPuzzle.solution) {
                    currentScore++;
                    document.getElementById('currentScore').textContent = currentScore;
                    showFeedback('🎉 Correct! Well done!', 'success');
                    playSound('correct');
                    console.log(`✓ Correct answer! Score: ${currentScore}/${currentRound}`);
                } else {
                    showFeedback(`❌ Wrong! The answer was ${currentPuzzle.solution}`, 'error');
                    playSound('wrong');
                    console.log(`✗ Wrong answer! Score: ${currentScore}/${currentRound}`);
                }

                // Clear input
                answerInput.value = '';

                // Move to next round after delay
                setTimeout(() => {
                    currentRound++;
                    document.getElementById('currentRound').textContent = currentRound;

                    if (currentRound <= totalRounds) {
                        console.log(`Moving to round ${currentRound}`);
                        loadNextPuzzle();
                    } else {
                        console.log('All rounds complete!');
                        endGame();
                    }
                }, 2000);
            }

            // Time expired event handler
            function handleTimeExpired() {
                console.log('⚡ EVENT: Time expired - moving to next round');
                showFeedback(`⏰ Time's up! The answer was ${currentPuzzle.solution}`, 'error');
                playSound('timeout');

                setTimeout(() => {
                    currentRound++;
                    document.getElementById('currentRound').textContent = currentRound;

                    if (currentRound <= totalRounds) {
                        loadNextPuzzle();
                    } else {
                        endGame();
                    }
                }, 2000);
            }

            function showFeedback(message, type) {
                feedbackMessage.textContent = message;
                feedbackMessage.className = `feedback-message ${type}`;
                feedbackMessage.style.display = 'block';

                setTimeout(() => {
                    feedbackMessage.style.display = 'none';
                }, 2000);
            }

            // Sound effects using Web Audio API
            function playSound(type) {
                console.log(`Playing ${type} sound`);
                
                try {
                    const audioContext = new (window.AudioContext || window.AudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    // Different frequencies for different sounds
                    switch(type) {
                        case 'correct':
                            oscillator.frequency.value = 523.25; 
                            break;
                        case 'wrong':
                            oscillator.frequency.value = 200; 
                            break;
                        case 'timeout':
                            oscillator.frequency.value = 150; 
                            break;
                    }

                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.3;

                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.2);
                } catch (error) {
                    console.log('Web Audio API not available');
                }
            }

            // End game - Navigate to results screen
            function endGame() {
                console.log('=== GAME OVER ===');
                console.log(`Final Score: ${currentScore}/${totalRounds}`);
                console.log(`Player: ${playerName}`);
                console.log(`API Used: ${selectedApi}`);
                
                // Update user stats in localStorage 
                updateUserStats();
                
                alert(`Game Complete!\n\nFinal Score: ${currentScore}/${totalRounds}\n\nIn full game, this would navigate to Screen 6 (Results)`);
            }

            //Update user statistics
            function updateUserStats() {
                console.log('👤 VIRTUAL IDENTITY: Updating user statistics');
                
                const userData = localStorage.getItem('bananaBrain_currentUser');
                if (userData) {
                    const user = JSON.parse(userData);
                    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
                    
                    if (currentScore > (user.highScore || 0)) {
                        user.highScore = currentScore;
                        console.log(`🎉 New high score: ${currentScore}`);
                    }
                    
                    user.lastPlayed = new Date().toISOString();
                    localStorage.setItem('bananaBrain_currentUser', JSON.stringify(user));
                    console.log('✓ User statistics updated');
                }
            }
        });