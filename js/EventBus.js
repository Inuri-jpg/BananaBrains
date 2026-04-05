/**
 * EventBus.js
 * Implements the Observer / Publish-Subscribe pattern.
 *
 * This is the central event system for the entire application.
 * Components register listeners with .on() and fire events with .emit().
 * This decouples producers (e.g. GameController) from consumers (e.g. GameView, gameplay.js),
 * so neither side needs a direct reference to the other — a key benefit of Event-Driven design.
 *
 * Design pattern: Observer Pattern (Week 4 — Event-Driven Programming)
 * Interoperability note: EventBus acts as internal middleware between components,
 * analogous to how message brokers like RabbitMQ route messages between services.
 */
class EventBus {
    constructor() {
        // _listeners holds arrays of callback functions keyed by event name
        this._listeners = {};
        console.log('EventBus: Initialized');
    }

    /**
     * Subscribe to an event (an Observer registers itself).
     * @param {string}   event - The event name (e.g. 'puzzle:loaded')
     * @param {Function} fn    - The callback to invoke when the event fires
     */
    on(event, fn) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(fn);
        console.log(`EventBus: Listener registered for "${event}"`);
    }

    /**
     * Publish an event — notify all registered observers.
     * @param {string} event - The event name
     * @param {*}      data  - Payload passed to every listener
     */
    emit(event, data) {
        console.log(`EventBus: Emitting "${event}"`, data);
        const listeners = this._listeners[event] || [];
        listeners.forEach(fn => fn(data));
    }

    /**
     * Unsubscribe a specific listener from an event.
     * Important for memory management — unused listeners are removed
     * to prevent memory leaks (best practice from Week 4).
     * @param {string}   event - The event name
     * @param {Function} fn    - The exact function reference to remove
     */
    off(event, fn) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(l => l !== fn);
        console.log(`EventBus: Listener removed for "${event}"`);
    }
}

// Global instance of EventBus for the entire application
window.eventBus = new EventBus();