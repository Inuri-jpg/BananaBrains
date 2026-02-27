class StorageManager{
    constructor(){
        this.KEYS = {
            user: 'bananaBrain_user',
            leaderboard: 'bananaBrain_leaderboard',
            settings: 'bananaBrain_settings'
        };
    }

    saveUser(userObj){
        localStorage.setItem(this.KEYS.user, JSON.stringify(userObj));
        console.log('StorageManager: User saved > ', userObj.username);
    }

    loadUser() {
        const saved = localStorage.getItem(this.KEYS.user);
        if (!saved) return null;
        return JSON.parse(saved);
    }

    hasUser(){
        return localStorage.getItem(this.KEYS.user) !== null;
    }

    deleteUser(){
        localStorage.removeItem(this.KEYS.user);
        console.log('StorageManager: User Deleted');
    }

    addScore(name, userId, score, api){
        const board = this.loadLeaderboard();

        board.push({name, userId, score, api, date: new Date().toLocaleDateString()});

        board.sort((a,b) => b.score - a.score);

        const top10 = board.slice(0, 10);
        localStorage.setItem(this.KEYS.leaderboard, JSON.stringify(top10));
    }

    loadLeaderboard(){
        const saved = localStorage.getItem(this.KEYS.leaderboard);
        return saved ? JSON.parse(saved) : [];
    }

    loadSettings(){
        const saved = localStorage.getItem(this.KEYS.settings);
        if (saved) return JSON.parse(saved);
        return {sound: true, timeSeconds:10}; 
    }

    saveSettings(obj){
        localStorage.setItem(this.KEYS.settings, JSON.stringify(obj));
    }

    clearAll(){
        Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
        console.log('StorageManager: All data cleared');
    }

    makeUserId(){
        return 'USER-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
    }

    makeSessionId() {
        return 'SESS-' + Date.now() + '-' + Math.floor(Math.random() * 900 + 100);
    }
    
}