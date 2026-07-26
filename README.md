# 🧠 Decode The Tech — Tournament Engine

> A high-performance, real-time multiplayer tournament engine built for large-scale tech events. 
> Built with **Next.js 14**, **Node.js/Express**, **MongoDB Atlas**, and **Socket.IO**.

Decode The Tech is a highly customizable trivia/puzzle platform designed to run in-person tech events where dozens of teams compete simultaneously. It features a completely dynamic Tournament Wizard, allowing hosts to generate multiple unique "quiz codes," define up to 5 custom phases on the fly, and project a gorgeous Cyber-themed live leaderboard.

---

## ✨ Core Features

| Feature | Details |
|---|---|
| **Multi-Tournament Support** | Create multiple isolated tournaments simultaneously using unique 6-character `quizCode` session identifiers. |
| **Dynamic Phase Designer** | Configure up to 5 custom rounds (Phases) per tournament. Mix and match question types: Multiple Choice (Jargon), Emoji Decoding, and Real/Fake. |
| **Real-time Telemetry** | High-performance Socket.IO architecture syncs scores, bans, phase transitions, and timer states instantly to all clients. |
| **Advanced Anti-Cheat** | Enforces fullscreen mode, detects tab-switching, prevents right-clicks, and disables DevTools. Violations are broadcast to the Admin dashboard. |
| **Host Setup Wizard** | A sleek, guided UI (`/host`) to set up tournament metadata, security parameters, and round configurations visually. |
| **Master Leaderboard** | Live, auto-refreshing admin dashboard showing real-time average phase scores, node connectivity, and instant CSV exports. |
| **Arena Display Mode** | A specialized public projector view (`/quiz/[quizCode]/display`) designed to be shown on big screens at live events. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB Atlas** URI (or local MongoDB)

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file based on .env.example
cp .env.example .env

# Start the server (runs on port 4000)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the Next.js development server (runs on port 3001)
npm run dev
```

### 4. Create a Tournament
1. Navigate to the Host Setup Wizard: `http://localhost:3001/host`
2. Follow the 5-step wizard to configure your tournament name, phases, and anti-cheat settings.
3. Upon completion, you will be given a unique **6-character Quiz Code** (e.g. `ABCDEF`).
4. Share the URL `http://localhost:3001/quiz/ABCDEF` with your players.

---

## 🗺 Application Architecture

The platform uses a heavily dynamic routing system based on the generated `[quizCode]`.

### Player Routes
| Route | Purpose |
|---|---|
| `/` | Landing page — Enter a Quiz Code manually |
| `/quiz/[quizCode]` | Team Portal — Waiting room and team registration |
| `/quiz/[quizCode]/play/[teamId]` | Active Quiz Arena (Fullscreen locked) |

### Admin & Host Routes
| Route | Purpose |
|---|---|
| `/host` | Tournament Setup Wizard (Create a new game) |
| `/host/[quizCode]/admin` | Root Center (Main Admin Dashboard) |
| `/host/[quizCode]/admin/teams` | Manage teams, monitor connection status, and unban players |
| `/host/[quizCode]/admin/questions` | Question validation and management |
| `/host/[quizCode]/admin/game-control` | Mission Control: Trigger phase transitions and timers |
| `/host/[quizCode]/admin/leaderboard` | Live Master Leaderboard with CSV exporting |
| `/host/[quizCode]/admin/arena` | Arena Preview: Review all questions and answers |

### Display Routes
| Route | Purpose |
|---|---|
| `/quiz/[quizCode]/display` | Public Projector View (Leaderboards & Idle Screens) |

---

## 🏆 Default Question Types

While phases are fully customizable via the wizard, the engine natively supports these mechanics:
1. **Decode the Jargon (MCQ)**: Players must match definitions to the correct technical jargon.
2. **Emoji Pattern Analysis**: Players must decipher app/platform names from emoji clues (e.g., 📱☁️🎧).
3. **Reverse Logic Gate (Real/Fake)**: Players must identify if a tech fact is Real or Fake—but they must intentionally select the **OPPOSITE** to score points!

---

## 🔒 Security & Data

- **Admin Authentication**: Handled via secure server-side JWTs. Passwords are set during the Host Setup Wizard and verified by the backend.
- **Data Isolation**: All questions, teams, and scores are tightly coupled to their specific `quizCode` session, meaning multiple events can run concurrently without data bleeding.
- **Script Cleanup**: Unused temporary scripts (like manual database indexing or hardcoded unbans) have been completely removed in favor of robust in-app Admin UI controls and automated Mongoose schemas.
