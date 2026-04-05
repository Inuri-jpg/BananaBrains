/**
 * setup.js
 * Setup screen module — behaviour is handled by GameController.
 * The setup screen's events (nameInput, api selection, btn-start-single)
 * are all registered centrally in GameController.registerEvents().
 */
window.SetupScreen = {
    init() {
        console.log('SetupScreen: Ready (events managed by GameController)');
    }
};