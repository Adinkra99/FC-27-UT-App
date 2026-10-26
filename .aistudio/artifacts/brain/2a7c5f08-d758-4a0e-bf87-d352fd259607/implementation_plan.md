# Cannons n Pecks — FC 27 Dynamic Club Sync & Multi-Model Commander Overhaul

A comprehensive grounding and sync overhaul for **Cannons n Pecks** (Est. September 2009, 17 years old) on EA Sports FC 27. Replaces speculative placeholders with strict verified-or-blank values (`—`), introduces a multi-channel sync terminal for the FC Companion Web App (via Browser DevTools & local helper extension bridge) alongside FUTBIN and FUT.GG account sync, and replaces outdated legacy model telemetry with a dynamic **Gemini Multi-Model Intelligence Commander** (powered by Gemini 3.8 Flash, 3.5 Flash-Lite, 3.5 Transcribe, 3.8 Live, and Python code execution for complex math).

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Phase 1:**
> - **Club Identity & Grounding**: Club Name set to **Cannons n Pecks** (Est. Sep 2009, 17 years old). All unverified metrics (Rivals Division, Champs Finals, Fodder count) start strictly blank (`—`) until entered or imported.
> - **Club Metric Card Refactoring**: In the club banner, "Club Value" is transformed directly into live **Coins** with direct inline editing and quick presets.
> - **FC Companion App Sync Method**: Browser DevTools console scraper script & local helper extension bridge, with one-tap JSON/Clipboard import and step-by-step guidance.
> - **Third-Party Tracker Sync**: Dedicated FUTBIN & FUT.GG profile sync drawer to keep squads and club status reflecting the user's actual accounts.
> - **AI Architecture**: Replaced legacy "Gemini 1.5 Pro" with a dynamic **Gemini Multi-Model Commander** auto-routing between `gemini-3.8-flash` (primary workhorse), `gemini-3.1-flash-lite` (low-latency, zero-cost fast checks), `gemini-3.5-transcribe` (voice input), `gemini-3.8-live` (two-way voice stream), and Python code execution for complex SBC and market math.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms the FC NEXUS 27 terminal into an accurate, grounded command center for **Cannons n Pecks**. Gives the user three reliable channels to feed dynamic club changes:
  1. Direct inline typing for coins, divisions, and squad changes.
  2. Browser DevTools console snippet or helper extension bridge to extract real-time data from the EA FC 27 Companion Web App without manual re-entry.
  3. FUTBIN and FUT.GG account sync to pull external squad builds and market watchlists.
  4. Dynamic Multi-Model Commander that selects the optimal Gemini model based on speed, context size, math rigor, and cost.
- **Target Persona**: Ultimate Team veteran managing a 17-year-old club profile who needs real-time tactical advice, precise SBC mathematical solutions, and instant coin tracking without AI hallucinations.
- **Key Value**: Zero guessing. Real numbers. Modern Gemini 3.8 / 3.5 Flash-Lite speed and cost efficiency.

---

### 2. User Experience & Visual Design

#### A. Grounded Club Meta Banner (Cannons n Pecks)
- **Title**: `CANNONS N PECKS` (Clean bold display typography).
- **Club Longevity Badge**: `EST. SEP 2009 · 17 YRS` (Honoring the 17-year legacy since age 10).
- **Primary Metric Replacement**: The previous "Club Value" card is replaced with direct **Club Coins**, displaying exact figures or blank (`—`) with an inline quick-tuner.
- **Strict Blank-State Policy**: Any unverified metric (such as Weekend League Champs record, Rivals Division, or duplicate queue count) displays clean unboxed `—` with a subtle tap-to-verify affordance, eliminating fabricated stats.

#### B. Dynamic Sync Hub Drawer & Walkthrough Modal
- **Companion App DevTools Bridge**:
  - Provides a 1-click copyable DevTools snippet (`extract-fc-club.js`) that runs in the Companion Web App console to instantly export club coins, active squad roster, transfer list, and unassigned duplicate count as clean JSON.
  - One-tap paste and live import parser.
- **FUTBIN & FUT.GG Account Linker**:
  - Input fields for FUTBIN and FUT.GG club/squad share URLs and profile usernames.
  - Automatically fetches public squad formations, chemistry ratings, and target investments.
- **Manual Quick-Entry Form**: Fast inline updates for coins, division, and squad players.

#### C. Gemini Multi-Model Intelligence Commander
- Replaces obsolete legacy telemetry with the **Gemini 3.8 Flash / 3.5 Flash-Lite Engine**:
  - **Dynamic Task Auto-Selector**:
    - *Simple Telemetry & SBC Score Lookups*: `gemini-3.1-flash-lite` (sub-100ms, ultra-low cost).
    - *Tactical Chat & Squad Synergy Advice*: `gemini-3.8-flash` (balanced reasoning and speed).
    - *Voice Transcription*: `gemini-3.5-transcribe` (fast speech-to-text for push-to-talk).
    - *Two-Way Live Voice Stream*: `gemini-3.8-live` via WebSocket.
    - *Complex Market Math & Rating Formulations*: Code execution / `gemini-4-argon` for multi-variable optimization.
  - **Live Model HUD**: Displays current active model name, real-time latency (ms), input/output token count, and calculated micro-cost ($0.000X).

---

### 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale & Trade-Offs |
| :--- | :--- | :--- |
| **Club Identity** | Set to `Cannons n Pecks`, `EST. SEP 2009` (17 Yrs) | Respects user's actual 17-year UT club profile. |
| **Unverified Metrics** | Display strictly blank `—` until imported | Eradicates hallucinated game stats, matching user's explicit law of accuracy. |
| **Club Value vs Coins** | Replace "Club Value" with live "Coins" | Reflects user's direct request; coins are the primary actionable currency. |
| **Companion App Sync** | Browser DevTools snippet + Local Extension Bridge | Safe, zero-ban, browser-native extraction without exposing EA credentials to third parties. |
| **FUTBIN & FUT.GG** | Profile URL & Public Squad Sync | Seamless integration with tools the user actively uses to manage their club state. |
| **Model Selection** | Dynamic Auto-Router (`gemini-3.8-flash` & `3.5-flash-lite`) | Maximizes speed and reduces cost while retaining deep reasoning for complex tactical queries. |

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FC NEXUS 27 — CANNONS N PECKS HUB                   │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar: Cannons n Pecks (Est. Sep 2009) · Coins: [Live / —] · 2.4k FP│
├───────────────────┬────────────────────────────────┬───────────────────┤
│ 1. Dynamic Sync   │ 2. Grounded Views              │ 3. AI Commander   │
│ ┌───────────────┐ │ ┌────────────────────────────┐ │ ┌───────────────┐ │
│ │DevTools Script│ │ │Hub (Grounded Coins/Div)    │ │ │Gemini 3.8     │ │
│ │Extension Port │ │ │Squad Builder (4-2-1-3)     │ │ │Flash (Chat)   │ │
│ │FUTBIN / FUT.GG│ │ │Market & Sniper Radar       │ │ │Gemini 3.5     │ │
│ │Inline Inputs  │ │ │SBC Solver (Score Matrix)   │ │ │Lite (Fast)    │ │
│ └───────┬───────┘ │ └─────────────┬──────────────┘ │ └───────┬───────┘ │
└─────────┼─────────────────────────┼──────────────────────────┼─────────┘
          │                         │                          │
          ▼                         ▼                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Server Backend (server.ts) & Firebase Firestore Persistence            │
│  - /api/gemini/model-commander (Auto-routes by task complexity)        │
│  - /api/companion/parse-export (Validates DevTools JSON payloads)      │
│  - /api/tracker/sync-futbin (Extracts public FUTBIN/FUT.GG squads)     │
│  - Firestore DB: ai-studio-fc27utapp-2a7c5f08-d758-4a0e-bf87-d352fd259607│
└────────────────────────────────────────────────────────────────────────┘
```

### Component & State Mutation Flow

1. **State Store (`src/App.tsx`)**:
   - `clubName`: `'Cannons n Pecks'`
   - `clubEst`: `'September 2009'` (17 Years Old)
   - `coins`: Verified number or `null` (`—`)
   - `rivalsDivision`: Verified string or `null` (`—`)
   - `champsRecord`: Verified string or `null` (`—`)
   - `inventoryCount`: Verified number or `null` (`—`)
   - `activeModelRoute`: `'AUTO' | '3.8-FLASH' | '3.5-LITE' | 'ARGON-MATH'`
2. **Companion App Sync Flow**:
   - User opens the Sync Drawer -> clicks "Copy DevTools Script" -> pastes into console at `ea.com/ea-sports-fc/ultimate-team/web-app` -> copies output -> pastes into FC Nexus terminal -> state updates instantly with verified coins, cards, and duplicate count.
3. **FUTBIN / FUT.GG Sync Flow**:
   - User inputs their squad share URL or account username -> server fetches squad composition and imports player cards into personal club inventory.
4. **Multi-Model Commander Execution**:
   - Front-end query triggers `/api/gemini/model-commander`.
   - Router evaluates complexity:
     - Math / SBC Rating Solver -> Python execution / deep reasoning.
     - General chat / tactical questions -> `gemini-3.8-flash`.
     - Price check / quick lookups -> `gemini-3.1-flash-lite`.
     - Audio -> `gemini-3.5-transcribe` or `gemini-3.8-live`.
   - Telemetry returned with latency ms, tokens, and cost.
