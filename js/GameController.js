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

        this.view.alert(
            'Identity cretaed! \n\n' +
            'User ID ' + this.model.user.userId + '\n' +
            'Session: ' + this.model.user.sessionId + '\n' +
            'API: ' + api + '\n\n' +
            'Gameplay screen coming next! s'
        );

    }
}