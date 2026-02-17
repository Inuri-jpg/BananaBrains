class StorageManager{
    constructor(){
        this.KEYS = {
            user: 'bananaBrain_user',
            leaderboard: 'bananaBrain_leaderboard',
            settings: 'bananaBrain_settings'
        };
    }

    loadUser() {
        const saved = localStorage.getItem(this.KEYS.user);
        if (!saved) return null;
        return JSON.parse(saved);
    }

    makeSessionId() {
        return 'SESS-' + Date.now() + '-' + Math.floor(Math.random() * 900 + 100);
    }

}