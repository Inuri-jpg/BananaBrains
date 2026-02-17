class GameModel {
    constructor(storage){
        this.storage = storage;
        
    }

    loadUser() {
        const saved = this.storage.loadUser();
        if (saved) {
            this.user = saved;
            this.user.sessionId = this.storage.makeSessionId();
            console.log('GameModel: Returning user >', saved.username);
        }
        return saved;
    }
}