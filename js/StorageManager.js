/**
 * StorageManager.js
 * Handles all persistence using the browser's localStorage API.
 *
 * Virtual Identity :
 *   - Saves and loads user objects (userId, sessionId, passwordHash)
 *   - hashPassword() uses the djb2 algorithm a fast non-cryptographic hash.
 *     NOTE: djb2 is used here for demonstration purposes. In a production system,
 *     a cryptographic hash such as bcrypt or SHA-256 via the Web Crypto API
 *     would be required to properly protect user passwords.
 *
 * Interoperability:
 *   - Data is serialised to JSON (JSON.stringify) before storage and
 *     deserialised (JSON.parse) on retrieval demonstrating syntactic
 *     interoperability within the application layer.
 *
 * All localStorage keys are namespaced under 'bananaBrain_' to avoid
 * collisions with other applications sharing the same origin.
 */
class StorageManager {
    constructor() {
        this.KEYS = {
            user:        'bananaBrain_user',
            leaderboard: 'bananaBrain_leaderboard',
            settings:    'bananaBrain_settings'
        };
    }

    /**
     * djb2 hash algorithm converts a plaintext password to a hex string.
     * Trade-off: fast and dependency-free, but not cryptographically secure.
     * A production app would use bcrypt (server-side) or Web Crypto SHA-256.
     * @param {string} password
     * @returns {string} 'HASH-<hex>'
     */
    hashPassword(password) {
        let hash = 5381;
        for (let i = 0; i < password.length; i++) {
            hash = ((hash << 5) + hash) ^ password.charCodeAt(i);
            hash = hash & hash; // keep within 32-bit integer
        }
        return 'HASH-' + (hash >>> 0).toString(16).toUpperCase();
    }

    /**
     * Verify a plaintext password against its stored hash.
     * Re-hashes the plaintext and compares â€” passwords are never stored in plain text.
     * @param {string} plaintext
     * @param {string} storedHash
     * @returns {boolean}
     */
    verifyPassword(plaintext, storedHash) {
        return this.hashPassword(plaintext) === storedHash;
    }

    /**
     * Serialise user object to JSON and save in localStorage.
     * JSON serialisation = syntactic interoperability.
     */
    saveUser(userObj) {
        localStorage.setItem(this.KEYS.user, JSON.stringify(userObj));
        console.log('StorageManager: User saved >', userObj.username);
    }

    /** Deserialise and return the stored user, or null if none exists. */
    loadUser() {
        const saved = localStorage.getItem(this.KEYS.user);
        if (!saved) return null;
        return JSON.parse(saved);
    }

    hasUser() {
        return localStorage.getItem(this.KEYS.user) !== null;
    }

    deleteUser() {
        localStorage.removeItem(this.KEYS.user);
        console.log('StorageManager: User deleted');
    }

    addScore(name, userId, score, api) {
        const board = this.loadLeaderboard();
        board.push({ name, userId, score, api, date: new Date().toLocaleDateString() });
        board.sort((a, b) => b.score - a.score);
        const top10 = board.slice(0, 10);
        localStorage.setItem(this.KEYS.leaderboard, JSON.stringify(top10));
    }

    loadLeaderboard() {
        const saved = localStorage.getItem(this.KEYS.leaderboard);
        return saved ? JSON.parse(saved) : [];
    }

    loadSettings() {
        const saved = localStorage.getItem(this.KEYS.settings);
        if (saved) return JSON.parse(saved);
        return { sound: true, timerSeconds: 10, difficulty: 'medium', volume: 70 };
    }

    saveSettings(obj) {
        localStorage.setItem(this.KEYS.settings, JSON.stringify(obj));
    }

    clearAll() {
        Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
        console.log('StorageManager: All data cleared');
    }

    /**
     * Generate a unique User ID combining a timestamp and random number.
     * This forms the persistent virtual identity for the player.
     *
     * Alternative approaches considered:
     *  - UUID v4 (crypto.randomUUID): more collision-resistant but requires
     *    the Web Crypto API (not available in all older browsers)
     *  - Server-generated IDs: safer as the server controls uniqueness,
     *    but would require a backend, unnecessary for this client-side game
     *  - Incrementing integers: simple but reveals user count and not suitable
     *    for a distributed system
     * Chosen approach: timestamp + random suffix gives sufficient uniqueness
     * for a single-device game without any dependencies.
     */
    makeUserId() {
        return 'USER-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
    }

    /**
     * Generate a Session ID regenerated on every login.
     * Sessions expire when the browser tab closes (no persistent session cookie).
     *
     * Alternative approaches considered:
     *  - JWT (JSON Web Tokens): stateless, cryptographically signed tokens
     *    that carry claims (userId, expiry). Used in production REST APIs.
     *    Would be ideal here but requires a server to sign and verify.
     *  - OAuth 2.0: delegates authentication to a trusted provider (Google, etc.)
     *    Removes the need to manage passwords entirely â€” most secure option.
     *  - HttpOnly session cookies: server sets a cookie the JS cannot read,
     *    protecting against XSS attacks. Not possible without a backend.
     * Chosen approach: localStorage sessionId is appropriate for a
     * client-only game, with the trade-off that it is less secure than
     * server-managed sessions.
     */
    makeSessionId() {
        return 'SESS-' + Date.now() + '-' + Math.floor(Math.random() * 900 + 100);
    }
}