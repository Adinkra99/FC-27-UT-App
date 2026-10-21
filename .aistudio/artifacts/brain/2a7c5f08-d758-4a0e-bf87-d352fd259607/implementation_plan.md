# FC 27 UT App — Ultimate Team Assistant & Market Terminal

An all-in-one EA Sports FC 27 Ultimate Team console companion and market intelligence platform inspired by FUTBIN. Built with a responsive sidebar and mobile bottom-bar layout covering **Club Sync**, **Console Market**, **AI SBC Solver**, **Automated Investments**, **Squad Builder**, and a **Multi-Turn Gemini Voice & Search Assistant** with **Google Drive** cloud backup.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> This unified plan synthesizes all your requirements and feature integrations:

- **Navigation & Responsive Dashboard**: Dedicated sidebar navigation on desktop/ZenBook (**Club**, **Market**, **SBCs**, **Investments**, **Squad Builder**, **AI Coach**) paired with a thumb-friendly bottom navigation bar for mobile viewports.
- **Real-Time Game Data Synchronization (`Club`)**: Live synchronization of Coin balance, FC/FIFA Points, active in-game promotions, newly released console players, active Evolution pathways, club player inventory, and Gallery Grind upgrade loops.
- **AI-Driven SBC Recommendation Engine (`SBCs`)**: Analyzes your synced player inventory (prioritizing untradeables), live FC 27 console market prices, and SBC requirements to generate the lowest-cost 11-player combinations optimized for mobile and desktop viewing.
- **Automated Investment Tracking (`Investments` & `Market`)**: Uses `gemini-4-argon` (`ThinkingLevel.HIGH`) to analyze console market trends, recommend high-margin player flips, calculate 5% EA tax net profit, and trigger real-time buy/sell price alerts.
- **Google Drive Integration**: Authenticated via Google OAuth to save, browse, and sync Club Inventory snapshots, SBC solution dossiers, and Investment ledgers directly to your Google Drive (with explicit user confirmation dialogs prior to any file overwrite or deletion).
- **Gemini Multi-Turn Chatbot, Search Grounding & Voice Transcription**:
  - **High-Thinking Mode**: `gemini-4-argon` with `ThinkingLevel.HIGH` for complex SBC math and investment strategy.
  - **Google Search Grounding**: `gemini-3.8-flash` with `googleSearch` for up-to-date EA FC promo news, TOTW predictions, and content drops.
  - **Fast Responses**: `gemini-3.1-flash-lite` for instant player price checks and EA tax calculations.
  - **Microphone Audio Transcription**: `gemini-3.5-transcribe` allowing hands-free voice queries while gaming on your console.
- **Firebase Auth & Firestore Persistence**: Cloud persistence for your club state, squads, price alerts, and investment portfolio across mobile and desktop.

---

## 1. Overview & Core Concept

### What It Does
**FC 27 UT App** provides console Ultimate Team players with a unified command center:
1. **Club & Live Game Sync**: Real-time dashboard tracking your Coins, FIFA Points, untradeable/tradeable club roster, active Evolutions progress, active promos, and Google Drive cloud backups.
2. **Console Market & Price Radar**: Real-time PlayStation/Xbox/PC player database with 24h/7d price graphs, fodder index tickers, and custom price alert triggers.
3. **AI SBC Solver**: Evaluates active Squad Building Challenges against your club's existing player inventory and live market prices to minimize coin expenditure.
4. **Automated Investment Tracker**: Generates AI-backed buy/sell calls, tracks active flips in your portfolio, deducts 5% EA tax automatically, and fires alerts when target prices hit.
5. **33/33 Squad Builder & Voice AI Assistant**: Full formation pitch builder plus a multi-turn Gemini chat drawer with microphone transcription (`gemini-3.5-transcribe`) and live Google Search grounding.

---

## 2. User Experience & Visual Design

### Layout & Navigation Architecture
- **Desktop / Asus ZenBook UX482 Layout**:
  - **Left Sidebar (`256px` width)**: Clean navigation links for **Club & Sync**, **Market**, **SBCs**, **Investments**, **Squad Builder**, and **AI Chat & Drive**, plus live sync status and quick coin/points summary.
  - **Top Header Bar**: Strictly follows the 3-zone contract — Brand Wordmark (`FC 27 UT App`), contextual view breadcrumbs/quick stats, and Google Sign-In / Sync primary CTA.
  - **Main Content Area**: High-density FUTBIN-inspired data tables, interactive pitch grids, and real-time charts.
- **Mobile Viewport Optimization (`375px–430px`)**:
  - Collapses the desktop sidebar into a fixed **Bottom Tab Bar** (`Club`, `Market`, `SBCs`, `Investments`, `Squad/AI`) with $\ge 44\text{px}$ touch targets and $\le 15\%$ sticky viewport height.
  - Responsive cards and swipeable filter bars for one-handed thumb usage while playing on console.

### Visual Identity & Theme
- **Aesthetic Direction**: Sleek EA Sports FC 27 dark broadcast terminal paired with FUTBIN's high-contrast financial precision.
- **Color Tokens**:
  - Canvas Background: Deep Pitch Obsidian (`#090d16`)
  - Structural Surface: Dark Slate Card (`#111827` / `#161f33`) with `1px` border (`#23304c`)
  - Primary Accent: FC Hyper Emerald (`#00ff87`) for chemistry links, profit margins, and active states
  - Secondary Accent: Ultimate Gold (`#f59e0b`) for Icons, TOTW, and FIFA Points
  - Semantic Alert: Crimson (`#ef4444`) for market drops and 5% EA tax deductions
- **Typography**: Crisp geometric sans display headings paired with `font-mono tabular-nums` for all coin values, ratings, chemistry counters, and ROI percentages.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Multi-Model Gemini Routing (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-3.5-transcribe`)**:
  - *Chosen Approach*: Route complex SBC optimization and deep portfolio strategy to `gemini-4-argon` (`ThinkingLevel.HIGH`), live web/promo queries to `gemini-3.8-flash` with `googleSearch`, rapid UI lookups to `gemini-3.1-flash-lite`, and microphone voice recordings to `gemini-3.5-transcribe`.
  - *Why*: Balances deep analytical accuracy with low-latency interaction and hands-free voice control during console matches.
- **Decision 2: Client-Side Google Drive Sync with Safety Confirmation**:
  - *Chosen Approach*: Use Firebase Google Auth with Drive OAuth scopes (`drive.file`, `drive`) and in-memory access token caching to export/import JSON & CSV spreadsheets of club data and SBC solutions, guarded by a confirmation modal before any mutating/delete action.
  - *Why*: Complies with Workspace security rules and enables effortless documentation and cross-device pipeline management.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT FRONTEND (React 19 + Tailwind)                 │
│                                                                              │
│  ┌────────────────────┐  ┌────────────────────────────────────────────────┐  │
│  │ Responsive Sidebar │  │               Main Content Area                │  │
│  │ (Desktop) / Bottom │  │  • Club View (Live Sync, Coins/Points, Evos,   │  │
│  │  Tab Bar (Mobile)  │  │    Promos, Gallery Grind, Google Drive Sync)   │  │
│  │                    │  │  • Market View (Console Prices, 24h Trends,    │  │
│  │  - Club & Sync     │  │    Fodder Index, Squad Builder 33/33 Chem)     │  │
│  │  - Market & Squad  │──┼─►• SBCs View (AI Recommendation Engine, Club   │  │
│  │  - SBCs (AI Solver)│  │    Inventory Matcher, Lowest Coin Solver)      │  │
│  │  - Investments     │  │  • Investments View (Gemini High-Thinking      │  │
│  │  - AI Chat Drawer  │  │    Trade Signals, Portfolio ROI, Price Alerts) │  │
│  └────────────────────┘  └───────────────────────┬────────────────────────┘  │
│                                                  │                           │
│  ┌───────────────────────────────────────────────▼────────────────────────┐  │
│  │       Multi-Turn Gemini Chat & Microphone Voice Recorder (Web Audio)   │  │
│  └───────────────┬────────────────────────────────────────────┬───────────┘  │
└──────────────────┼────────────────────────────────────────────┼──────────────┘
                   │                                            │
                   ▼                                            ▼
┌─────────────────────────────────────────┐  ┌─────────────────────────────────┐
│       EXPRESS BACKEND (server.ts)       │  │   FIREBASE & GOOGLE WORKSPACE   │
│                                         │  │                                 │
│ • POST /api/gemini/sbc-solve            │  │ • Firebase Auth (Google Popup   │
│   (gemini-4-argon, ThinkingLevel.HIGH)  │  │   + In-Memory OAuth Token)      │
│ • POST /api/gemini/investments          │  │ • Firestore Collections:        │
│   (gemini-4-argon, ThinkingLevel.HIGH)  │  │   - /users/{uid}/profile        │
│ • POST /api/gemini/chat                 │  │   - /users/{uid}/clubPlayers    │
│   (gemini-4-argon / gemini-3.8-flash    │  │   - /users/{uid}/investments    │
│    with googleSearch / 3.1-flash-lite)  │  │   - /users/{uid}/squads         │
│ • POST /api/gemini/transcribe           │  │   - /users/{uid}/sbcSolutions   │
│   (gemini-3.5-transcribe)               │  │ • Google Drive REST API v3      │
└─────────────────────────────────────────┘  └─────────────────────────────────┘
```

---

## 5. Execution Sequence

1. **Step 1: OAuth, Firebase & Paid Model Setup**:
   - Finalize Google Workspace OAuth scopes via `set_up_oauth` (`userConfirmedInUI: true`).
   - Verify Firebase ToS via `GetFirebaseTos` and provision Firestore via `ProvisionFirebase` RPC.
   - Prompt paid API key flow via `show_aistudio_ui` (`paid_model_flow`) for `gemini-4-argon` support.
   - Create `firebase-blueprint.json` and hardened `firestore.rules` and deploy rules.
2. **Step 2: Full-Stack Express + Gemini API Server (`server.ts`)**:
   - Build server-side routes for High-Thinking SBC Solver (`gemini-4-argon` + `ThinkingLevel.HIGH`), Investment Analyzer (`gemini-4-argon` + `ThinkingLevel.HIGH`), Multi-Turn Chatbot with Model Selector & Google Search Grounding (`gemini-3.8-flash` + `googleSearch` and `gemini-3.1-flash-lite`), and Audio Transcription (`gemini-3.5-transcribe`).
3. **Step 3: FC 27 Console Database, Sync Engine & Google Drive Service**:
   - Create authentic FC 27 console player dataset, active promos, evolutions, and SBC challenges.
   - Build client-side Google Drive backup/restore service with mandatory confirmation modals for destructive/overwrite actions.
4. **Step 4: Responsive Sidebar Dashboard & Feature Views**:
   - Build the responsive Sidebar + Mobile Bottom Navigation shell and implement the **Club**, **Market & Squad Builder**, **SBCs**, **Investments**, and **AI Voice/Search Chatbot** views.
5. **Step 5: Build & Lint Verification**:
   - Run `compile_applet` and verify zero TypeScript or build errors.
