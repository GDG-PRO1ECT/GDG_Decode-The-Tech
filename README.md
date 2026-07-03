# 🧠 Quiz Platform — Quiz Platform

> Full-featured real-time quiz platform for 50+ teams. Built with **Next.js 14** + **MongoDB**.
> Cyber aesthetic UI · Fullscreen anti-cheat · Fastest-fingers bonus · 3 rounds · Live projector display.

---

## ✨ Feature List

| Feature | Details |
|---|---|
| 50+ Teams | Unique shuffled question order per team |
| 3 Players / Team | One player per round, rotating each round |
| 3 Unique Rounds | Jargon MCQ · Emoji App Guessing · Real or Fake |
| Fullscreen Anti-Cheat | Exit detection, tab-switch warning, DevTools block |
| Fastest Fingers First | +5 bonus for first correct on each question |
| Time Bonus | Up to +5 extra for quick answers |
| Live Leaderboard | 5s auto-refresh; podium, full table, stats |
| Projector Display | /display — 3 rotating big screen views |
| Admin Control | Full game master dashboard |
| CSV Export | Download final scores per team per round |

---

## 🚀 Quick Setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# Edit: MONGODB_URI and ADMIN_PASSWORD

# 3. Seed questions (20 per round = 60 total)
npm run seed

# 4. Run
npm run dev
# → Frontend: http://localhost:3001 | Backend: http://localhost:4000
```

---

## 🗺 Page Routes

| URL | Who | Purpose |
|---|---|---|
| `/` | Everyone | Landing — enter team ID |
| `/team/[teamId]` | Teams | Portal — scores, player rotation, game status |
| `/play/[teamId]` | Active player | Fullscreen quiz |
| `/leaderboard` | Everyone | Live public leaderboard |
| `/display` | Projector | Big screen — 3 rotating views |
| `/finished` | Everyone | Winner reveal + final scores |
| `/admin` | Host | Dashboard + checklist |
| `/admin/teams` | Host | Add / bulk import teams |
| `/admin/questions` | Host | CRUD questions per round |
| `/admin/game-control` | Host | Start/end rounds, timer, live standings |
| `/admin/leaderboard` | Host | Full table + CSV export |
| `/admin/share` | Host | Copy/export team portal links |

---

## 🎮 Round Rules

### Round 1 — Tech Word Decoder (15 min · Player 1)
- Question = definition/meaning shown
- Options = 4 tech jargon terms
- Pick the correct jargon

### Round 2 — Guess The Tech (20 min · Player 2)
- Emoji clue displayed (e.g. 📱☁️🎧)
- Options = 4 app/platform names
- Identify the app

### Round 3 — Real or Fake? (15 min · Player 3)
- Tech fact statement shown
- Options = Real / Fake
- ⚠️ Must choose the **OPPOSITE** of the truth!
  - TRUE fact → answer "Fake" to score
  - FALSE fact → answer "Real" to score

---

## 🏆 Scoring

| Event | Points |
|---|---|
| Correct answer (R1, R3) | 10 pts |
| Correct answer (R2) | 15 pts |
| First correct on a question | +5 fastest-finger bonus |
| Answer within 30 seconds | +0–5 time bonus |
| Wrong answer | 0 pts |

---

## 👤 Event Host Flow

1. `npm run seed` → questions loaded
2. `/admin/teams` → register all teams
3. `/admin/share` → distribute portal links
4. Open `/display` on projector
5. `/admin/game-control` → **▶ START ROUND 1**
6. Teams answer; switch players between rounds
7. **🏁 FINISH GAME** → open `/finished` for winner reveal

---

## 🌐 Deploy (Vercel + Atlas)

```bash
# Push to GitHub, import to Vercel
# Add env vars in Vercel dashboard:
MONGODB_URI=mongodb+srv://...
ADMIN_PASSWORD=securepassword123
```

---

## ⚠️ Anti-Cheat

- Fullscreen enforced; overlay blocks quiz if exited
- Tab-switch triggers warning
- Right-click + DevTools shortcuts disabled
- Correct answers validated server-side only
- Per-team question shuffle

---

## 📁 Structure

```
app/
  page.js                   Landing
  team/[teamId]/page.js     Team portal
  play/[teamId]/page.js     Quiz interface
  leaderboard/page.js       Public leaderboard
  display/page.js           Projector mode
  finished/page.js          Winner reveal
  admin/...                 All admin pages
  api/...                   All API routes
lib/
  mongodb.js                DB connection
  models/                   Team · Question · GameSession
scripts/
  seed.js                   60 questions seeder
```
