window.loadingScreen = {
    async runLoading(view){
        const steps = [
           { pct: 15,  label: '🌟 Loading game assets...'       },
            { pct: 35,  label: '🌐 Connecting to Banana API...'   },
            { pct: 55,  label: '😊 Connecting to Emoji API...'    },
            { pct: 75,  label: '👤 Checking saved identity...'    },
            { pct: 90,  label: '🎮 Setting up game engine...'     },
            { pct: 100, label: '✅ Ready to play!'                } 
        ];

        for (const step of steps) {
            view.setProgress(step.pct, step.label);
            await this.pause(550);
        }
        await this.pause(400);
    },

    pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    buildStars(){
        const container = document.getElementById('starsLayer');
        if(!container) return;

        for(let i=0; i<80;i++) {
            const star = document.createElement('div');
            star.className = 'star-dot';

            star.style.left = Math.random() * 100 + 'vw';
            star.style.top = Math.random() * 100 + 'vh';

            const size = Math.random() * 2 + 1;
            star.style.width = size + 'px';
            star.style.height = size + 'px';

            star.style.animationDuration = (2 + Math.random() * 3) + 's';
            star.style.animationDelay = (Math.random() * 4) + 's';

            container.appendChild(star);
        }
    },

    buildParticles() {
        const emojis = ['🍌', '🧠', '⭐', '🔢', '🎯', '💡'];

        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className   = 'particle';
            p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            p.style.left = Math.random() * 100 + 'vw';

            p.style.animationDuration = (12 + Math.random() * 15) + 's';
            p.style.animationDelay    = '-' + (Math.random() * 15) + 's';

            p.style.fontSize = (1.2 + Math.random() * 1.5) + 'em';

            document.body.appendChild(p);
        }
    }
};