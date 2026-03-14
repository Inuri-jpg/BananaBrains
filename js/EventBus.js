class EventBus {
    constructor() {
        this._listeners = {};
        console.log('EventBus: Initialized');
    }

    // Subscribe to an event (Observer registers itself)
    on(event, fn) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(fn);
        console.log(`EventBus: Listener registered for "${event}"`);
    }

    // Publish an event (notify all observers)
    emit(event, data) {
        console.log(`EventBus: Emitting "${event}"`, data);
        const listeners = this._listeners[event] || [];
        listeners.forEach(fn => fn(data));
    }

    // Unsubscribe from an event
    off(event, fn) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(l => l !== fn);
        console.log(`EventBus: Listener removed for "${event}"`);
    }
}

// Global instance of EventBus for the entire application
window.eventBus = new EventBus();