# Chess Tutor

A personal chess analysis tool that pulls your game archive from chess.com and runs Stockfish 18 analysis entirely in your browser — no backend, no API keys.

![Chess Tutor](https://img.shields.io/badge/Stockfish-18-green) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## How It Works

### 1. Chess.com Public API

Chess.com exposes a free, public REST API that requires no authentication. Enter any chess.com username and the app fetches:

```
GET https://api.chess.com/pub/player/{username}/games/archives
→ List of monthly archive URLs

GET https://api.chess.com/pub/player/{username}/games/{year}/{month}
→ All games for that month, each with full PGN, ratings, and result
```

The PGN (Portable Game Notation) contains the full move history for each game. This is parsed using **chess.js** to extract every board position (FEN string) in the game.

### 2. Stockfish 18 in the Browser (WebAssembly)

Stockfish 18 — the world's strongest open-source chess engine (ELO ~3644) — is compiled to WebAssembly and runs directly in the browser via a **Web Worker**. No server, no API calls to an engine.

```
npm install stockfish
↓
Copy stockfish-nnue-16-single.js + .wasm → public/stockfish/
↓
new Worker('/stockfish/stockfish-nnue-16-single.js')
↓
UCI protocol over postMessage / onmessage
```

The single-threaded WASM build is used to avoid the `SharedArrayBuffer` headers that the multi-threaded version requires.

Communication follows the **UCI (Universal Chess Interface)** protocol — plain text commands sent to the worker:

```
→ position fen <fen>
→ go depth 18
← info depth 18 score cp 45 pv e2e4 e7e5 ...
← bestmove e2e4
```

### 3. Move Analysis

After a game is loaded, every position is analyzed sequentially in the background at depth 18. For each move, the app compares:

- **Eval before the move** — what Stockfish says the position was worth (centipawns)
- **Eval after the move** — what the position became after your move

The difference is the **centipawn loss**, used to classify each move:

| CP Loss | Classification |
|---------|---------------|
| < 10    | Best          |
| 10–50   | Excellent     |
| 50–100  | Good          |
| 100–200 | Inaccuracy `?!` |
| 200–300 | Mistake `?`   |
| > 300   | Blunder `??`  |

The eval bar uses `50 + 50 × tanh(cp / 400)` to map centipawn scores to a 0–100% range, compressing extreme advantages so the bar stays readable.

## Stack

| Layer | Library |
|-------|---------|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Chess logic | chess.js v1 |
| Board rendering | react-chessboard v4 |
| Engine | Stockfish 18 (WASM) |

## Getting Started

```bash
git clone https://github.com/shanekoh/-chess-tutor.git
cd -chess-tutor
npm install
npm run dev
```

Open `http://localhost:5173`, enter a chess.com username, and select a game. Analysis runs automatically as you navigate through moves.

> **Note:** `npm run dev` copies the Stockfish WASM files from `node_modules` to `public/stockfish/` automatically before starting the server.
