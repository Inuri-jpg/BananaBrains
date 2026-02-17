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

    }

    onSinglePlayerClick() {
        console.log('EVENT: Single Player clicked');
        this.view.show('setup');
    }
}