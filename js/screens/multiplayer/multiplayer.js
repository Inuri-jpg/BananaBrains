window.multiplayerScreen = {
    init() {
        console.log('✓ Multiplayer screen initialized');
        this.registerEvents();
    },

    registerEvents() {
        // Player 1 name input - generate ID on typing
        const p1Input = document.getElementById('player1Name');
        if (p1Input) {
            p1Input.addEventListener('input', () => {
                const p1Id = 'P1-' + Date.now();
                document.getElementById('p1-id').textContent = p1Id;
                console.log('⚡ Player 1 ID generated:', p1Id);
            });
        }

        // Player 2 name input - generate ID on typing
        const p2Input = document.getElementById('player2Name');
        if (p2Input) {
            p2Input.addEventListener('input', () => {
                const p2Id = 'P2-' + Date.now();
                document.getElementById('p2-id').textContent = p2Id;
                console.log('⚡ Player 2 ID generated:', p2Id);
            });
        }

        // Player 1 API selection
        document.querySelectorAll('.api-option[data-player="1"]').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('⚡ Player 1 selected API:', btn.dataset.api);
                document.querySelectorAll('.api-option[data-player="1"]')
                    .forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Player 2 API selection
        document.querySelectorAll('.api-option[data-player="2"]').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('⚡ Player 2 selected API:', btn.dataset.api);
                document.querySelectorAll('.api-option[data-player="2"]')
                    .forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        console.log('✓ Multiplayer events registered');
    },

    // Generate initial IDs when screen is shown
    generateInitialIds() {
        const p1Id = 'P1-' + Date.now();
        const p2Id = 'P2-' + (Date.now() + 1);
        
        document.getElementById('p1-id').textContent = p1Id;
        document.getElementById('p2-id').textContent = p2Id;
        
        console.log('👤 Initial IDs generated:', { p1Id, p2Id });
    }
};