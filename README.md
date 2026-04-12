# 🍌 Banana Brains — CIS046-3 Software for Enterprise

A browser-based math puzzle game built with vanilla JavaScript using an MVC architecture.  
Puzzles are fetched live from an external REST API.

## Architecture

index.html
├── css/
│   └── globals.css               — CSS variables and shared styles
└── js/
    ├── EventBus.js               — Observer/Pub-Sub event system
    ├── StorageManager.js         — localStorage abstraction layer
    ├── GameModel.js              — Game state, API calls, business logic (Model)
    ├── GameView.js               — DOM manipulation only (View)
    ├── GameController.js         — Event handlers, game loop (Controller)
    └── screens/
        ├── loading/              — Loading screen
        ├── home/                 — Main menu
        ├── setup/                — Single player setup
        ├── multiplayer/          — Two-player setup
        ├── gameplay/             — Active game + EventBus observers
        ├── results/              — End-of-game results
        ├── leaderboard/          — Top scores
        └── settings/             — Game configuration
```

## Four Themes

### 1. Version Control 
- Code is organised into modular components (one responsibility per file)
- MVC separation means Model, View, and Controller can be committed and reviewed independently
- Each screen is a self-contained module in its own folder
- Git branching strategy: `main` (stable), `feature/multiplayer`, `feature/auth`, etc.

### 2. Event-Driven Programming 
- Custom `EventBus` implements the Observer pattern (publish/subscribe)
- All user interactions handled with `addEventListener` (not inline HTML events)
- Events: `puzzle:loaded`, `answer:submitted`, `game:over`
- Timer uses `setInterval` — a time-based event, not user-triggered
- `_answerLocked` guard prevents double-submission race conditions

### 3. Interoperability 
- `GameModel.fetchPuzzle()` calls an external REST API (`marcconrad.com`) over HTTPS
- Protocol: HTTP GET — chosen over SOAP for its lightweight, stateless nature
- Data format: JSON — deserialized with `response.json()` (syntactic interoperability)
- Two APIs available: Banana API and Emoji API — each on a different server (PHP backend)
- Multiplayer: Player 1 and Player 2 can call *different* APIs simultaneously

### 4. Virtual Identity 
- New users: username + password → `createUser()` → unique `userId` + `sessionId` generated
- Returning users: password verified against stored `djb2` hash → new `sessionId` issued
- Passwords never stored in plain text (hashed with djb2; production would use bcrypt/SHA-256)
- Identity persisted in `localStorage`; `sessionId` regenerated on every login
- `userId` and `sessionId` are displayed on the setup and results screens

## External APIs
- **Banana API**: `https://marcconrad.com/uob/banana/api.php` — returns a math puzzle image + solution in JSON
- **Smiley API**: `https://marcconrad.com/uob/smile/api.php` — alternate puzzle set

## How to Run
Open `index.html` in a web browser. No build step required.  
> Note: The game fetches puzzles from an external API, so an internet connection is required.

## References
- Banana API: https://marcconrad.com/uob/banana/doc.php
- GitHub example code: https://github.com/marcconrad/comparativeintegratedsystems
- MDN Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- MDN localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- djb2 hash algorithm: http://www.cse.yorku.ca/~oz/hash.html
