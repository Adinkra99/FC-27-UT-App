# FC 27 UT App — Live Ultimate Scream Content Engine, Ranked Top-5 Player vs. Upgrade SBCs, Squad-Linked Tracker & `gemini-3.5-flash-lite` Router Plan

An authoritative **EA Sports FC 27 Ultimate Team (Xbox Series S Console Market)** tactical, squad, and market intelligence terminal anchored dynamically to **British Time (`Europe/London` BST/GMT at $T=0$, October 2026 — Ultimate Scream Team 1)**. This revision upgrades the fast model tier from `gemini-3.1-flash-lite` to **`gemini-3.5-flash-lite`**, centers the entire workspace around **dynamically tracking your Squad & Club Inventory against live expiring content**, splits the **SBC Hub into Ranked Top 5 Player SBCs vs. Top 5 Upgrade SBCs** (with live countdown timers, exact Xbox Series S coin costs, and "Worth-It" value scores), integrates the complete **Ultimate Scream Team 1 Promo Roster, SBCs (`85 Moore`, `85 Otamendi`) & Live Objectives (`87 Jill Scott CB/CDM/CM`, `87 Verón CM`)**, and unifies the **Console Investment Tracker**, **Standalone Tactical Command Chatbot**, **Live Audio HUD (`gemini-3.8-live`)**, and **Push-to-Talk Transcription (`gemini-3.5-transcribe`)**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed User Revisions & Architectural Alignment**:
> 1. **Model Router Upgrade (`gemini-3.5-flash-lite`)**:
>    - Replaces `gemini-3.1-flash-lite` with **`gemini-3.5-flash-lite`** across the Smart Model Router, Tactical Command Chatbot, and fast club/SBC evaluation endpoints for lower latency and stronger structured reasoning per token.
> 2. **Split & Ranked SBC Hub (Top 5 Player SBCs vs. Top 5 Upgrade SBCs)**:
>    - The SBC view is divided into two side-by-side / toggleable leaderboards: **Top 5 Currently Available Player SBCs** and **Top 5 Currently Available Upgrade SBCs**, plus a **Live Objectives Tracker**.
>    - Every SBC and Objective displays: **Rank (`#1`–`#5` by Worth-It Value Score)**, **Exact Time Remaining Countdown** (anchored to $T=0$ 18:00 UK expiry), **Xbox Series S Coin Cost**, **Fodder Burn Fit** (against your logged club/duplicate storage), and a clear **Verdict (`MUST DO`, `FODDER ONLY`, `SKIP`)**.
> 3. **Live October 2026 Grounding — Ultimate Scream Team 1 Promo, SBCs & Objectives**:
>    - Pre-loaded and live-updatable with the exact active **Ultimate Scream Team 1** release:
>      - **Promo Pack Roster**: `90 Raphinha`, `89 Cristiano Ronaldo`, `89 Gianfranco Zola`, `88 Dominik Szoboszlai`, `88 Jaap Stam`, `87 Fabinho`, `87 Cole Palmer`, `87 Mario Mandžukić`, `86 Geoffrey Kondogbia`, `86 Hakan Çalhanoğlu`, `86 Vobian`, `86 Corentin Tolisso`, `86 Enzo Le Fée`, `86 Fabinho`, `85 Marcos Alonso`, `85 Tahith Chong`, `85 Castello Lukeba`, `85 Aden Flint`, `85 Said El Mala`, `83 Jeppe Tverskov`.
>      - **Active Ultimate Scream Player SBCs**: `85 Bobby Moore (Ultimate Scream SBC)`, `85 Nicolás Otamendi (Ultimate Scream SBC)`, alongside active meta Player SBCs ranked #1–#5.
>      - **Active Ultimate Scream Objectives (Free Grind)**: `87 Jill Scott (Ultimate Scream Objective — CB / CDM / CM)` and `87 Juan Sebastián Verón (Ultimate Scream Objective — CM)`.
> 4. **Squad-Centric Dynamic Sync & Zero-Guessing Invariant**:
>    - Keeps your confirmed **`35,000` Xbox Series S Coin balance** as the baseline budget while keeping unconfirmed personal club slots blank (`—`) until you log or sync your Starting XI and Club Inventory. Once a position or card is logged in your squad, every SBC, Evolution, Objective, and Market card dynamically calculates its **Net Upgrade Delta** over your current starter.

---

## 1. Overview & Core Concept

- **What It Does**: Acts as a live, clock-synchronized Director of Football that tracks your exact **Starting XI & Club Inventory** against **what is live right now in EA Sports FC 27 Ultimate Team** (Ultimate Scream Team 1 promo cards, Ranked Top 5 Player SBCs, Ranked Top 5 Upgrade SBCs, Live Objectives, and Active Evolutions)—showing exactly **how much time is left**, **what each costs on Xbox Series S**, and **which ones are the best value to complete today**.
- **Target Audience / Persona**: Competitive **Xbox Series S** Ultimate Team player managing a `35,000` Coin liquid budget across console and dual-screen **Asus ZenBook UX482** displays.
- **Key Value**: Eliminates FOMO and wasted fodder by ranking every live SBC, Evolution, and Objective by true value-for-coins and direct fit for your squad before the 18:00 UK timer expires.

---

## 2. 5-Tier Smart Model Routing Matrix (`gemini-3.5-flash-lite` Upgraded)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          UPGRADED 5-TIER SMART MODEL ROUTING MATRIX                             │
├──────────────┬─────────────────────────┬──────────────┬───────────────┬─────────────────────────┤
│ Tier         │ Model / Engine          │ Latency      │ Token Cost    │ Target Workload         │
├──────────────┼─────────────────────────┼──────────────┼───────────────┼─────────────────────────┤
│ Tier 0       │ Local Deterministic TS  │ < 2 ms       │ $0.00         │ 5% EA Tax, SBC Score    │
│              │ Engine                  │              │ (0 Tokens)    │ Math, Live Countdowns   │
├──────────────┼─────────────────────────┼──────────────┼───────────────┼─────────────────────────┤
│ Tier 1 (Fast)│ gemini-3.5-flash-lite   │ ~200–380 ms  │ Lowest (~1x)  │ Fast SBC Worth-It Check,│
│              │                         │              │               │ Quick Squad Delta & Q&A │
├──────────────┼─────────────────────────┼──────────────┼───────────────┼─────────────────────────┤
│ Tier 2       │ gemini-3.8-flash        │ ~750–1300 ms │ Moderate (~3x)│ Live Promo/SBC/Evo Sync │
│ (Grounded)   │ (+ googleSearch)        │              │               │ & Xbox Price Grounding  │
├──────────────┼─────────────────────────┼──────────────┼───────────────┼─────────────────────────┤
│ Tier 3       │ gemini-4-argon          │ ~2.2–4.8 s   │ Premium (~15x)│ Full Squad Rebuild,     │
│ (Deep)       │ (ThinkingLevel.HIGH)    │              │               │ Multi-Card Investment AI│
├──────────────┼─────────────────────────┼──────────────┼───────────────┼─────────────────────────┤
│ Audio / Live │ gemini-3.5-transcribe   │ ~300–550 ms  │ Audio / Stream│ Push-to-Talk Dictation  │
│ Voice Tiers  │ & gemini-3.8-live       │ Sub-second   │ Rate          │ & Real-Time Voice HUD   │
└──────────────┴─────────────────────────┴──────────────┴───────────────┴─────────────────────────┘
```

---

## 3. User Experience & Visual Design

### A. My Squad & Club Tracker (`CLUB & SQUAD`)
- **Interactive Starting XI Pitch & Club Roster**:
  - Slot your owned cards into your active formation (or dictate them quickly via **`gemini-3.5-transcribe`** Push-to-Talk). Unfilled slots remain cleanly blank (`—`) with zero guessing.
  - Instantly flags your **Weakest Squad Links** and highlights which live **Ultimate Scream SBC (`85 Moore`, `85 Otamendi`)**, **Objective (`87 Jill Scott CB/CDM/CM`, `87 Verón CM`)**, **Evolution**, or **Market Buy ($\le 35,000$ Coins)** provides the highest Meta Score upgrade.

### B. Split & Ranked SBC + Objectives Hub (`DUAL SBCS`)
- **View Switcher & Live Sync Bar**:
  - Button to **"Sync Live FC 27 SBCs & Objectives @ T=0 (`gemini-3.8-flash` + Search)"** so the board always reflects the exact day's 18:00 UK content drop.
- **Column 1: Top 5 Ranked Player SBCs (Ranked `#1` to `#5` by Worth-It Score)**:
  - Features active **Ultimate Scream Team 1 Player SBCs** (`85 Bobby Moore`, `85 Nicolás Otamendi`, plus live promo Player SBCs).
  - Each card row displays:
    - **Rank & Worth-It Score (`0–100`)**: Calculated from Xbox Series S coin price vs. meta performance, Role++ quality, and chemistry links.
    - **Live Expiry Countdown**: Exact `Days : Hours : Minutes` remaining.
    - **Xbox Series S Cost & Club Fodder Offset**: Shows full market cost alongside your net coin cost after applying your logged untradeable fodder / duplicate storage.
    - **Squad Fit Verdict**: Shows whether the player improves your Starting XI (`STARTER UPGRADE`, `SUPER SUB`, or `SKIP`).
- **Column 2: Top 5 Ranked Upgrade & Gamble SBCs (Ranked `#1` to `#5` by ROI)**:
  - Ranks repeatable and limited upgrade SBCs (e.g., *Ultimate Scream 83+ Double Upgrade*, *80+ Player Pick (1 of 3)*, *Max 87 Hero/Promo Upgrade*, *Daily Gold Upgrade*, *84+ x5 Upgrade*).
  - Evaluates **Pack Weight / Expected Return vs. Cost** and highlights **Zero-Coin Duplicate Storage Burns** utilizing `1.25x` / `1.50x` Holographic score multipliers.
- **Column 3: Live Free Objectives Tracker (`87 Jill Scott` & `87 Verón`)**:
  - Tracks live playable Objectives (`87 Jill Scott` with `CB / CDM / CM` versatility, `87 Juan Sebastián Verón CM`), showing XP/task requirements, time remaining, and why they save you liquid coins over paid SBCs.

### C. Ultimate Scream Team 1 Live Promo & Console Investment Tracker (`INVESTMENTS & MARKET`)
- **Ultimate Scream Team 1 Live Roster Catalog**:
  - Filterable by budget (`All Ultimate Scream` vs. `Affordable Under 35,000 Coins` vs. `High-Tier Meta`):
    - **Headliners**: `90 Raphinha`, `89 Cristiano Ronaldo`, `89 Gianfranco Zola`, `88 Szoboszlai`, `88 Jaap Stam`, `87 Fabinho`, `87 Cole Palmer`, `87 Mandžukić`.
    - **Mid-Tier & Budget Beasts (35k Coin Target Zone)**: `86 Kondogbia`, `86 Çalhanoğlu`, `86 Vobian`, `86 Tolisso`, `86 Le Fée`, `86 Fabinho`, `85 Alonso`, `85 Chong`, `85 Lukeba`, `85 Flint`, `85 El Mala`, `83 Tverskov`.
- **Console Investment Logger & Gemini Transfer Alerts**:
  - Log player acquisitions with automatic **5% EA Tax Break-Even (`Buy / 0.95`)**, quantity, and target sell price.
  - Run **Gemini Market Trend Analysis** to receive actionable `BUY WINDOW`, `HOLD`, or `SELL BEFORE 18:00 DROP` transfer alerts.

### D. Standalone Tactical Command Tab, Live Audio HUD & Push-to-Talk
- **Standalone `TACTICAL COMMAND` Tab**: Multi-turn chat interface with scrollable history, tactical role personas, and complexity routing across **`gemini-3.5-flash-lite`**, **`gemini-3.8-flash` (+ Search)**, and **`gemini-4-argon`**.
- **Interactive Live Audio HUD (`gemini-3.8-live`)**: Top-bar real-time voice coaching session with live waveform visualizer.
- **Push-to-Talk Mic Buttons (`gemini-3.5-transcribe`)**: Embedded in all search bars, squad slot inputs, investment forms, and the Club Sync modal.

---

## 4. Technical Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│        LIVE TEMPORAL & PROMO ENGINE (T = 0 · Oct 2026 · Ultimate Scream Team 1)        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  • Active Promo Catalog: 90 Raphinha, 89 CR7, 89 Zola, 88 Szoboszlai, 88 Stam,         │
│    87 Palmer, 87 Fabinho, 87 Mandžukić, 86 Kondogbia, 86 Çalhanoğlu, 86 Vobian,        │
│    86 Tolisso, 86 Le Fée, 85 Alonso, 85 Chong, 85 Lukeba, 85 Flint, 85 El Mala,        │
│    83 Tverskov                                                                         │
│  • Active Player SBCs: 85 Moore, 85 Otamendi + Top 5 Ranked Player SBCs                │
│  • Active Upgrade SBCs: Top 5 Ranked Repeatable/Upgrade SBCs                           │
│  • Active Objectives: 87 Jill Scott (CB/CDM/CM), 87 Verón (CM)                         │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│           5-TIER GEMINI SERVER ROUTER (`server.ts` + `@google/genai` SDK)              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  • Tier 1 Fast: `gemini-3.5-flash-lite` (Replaces 3.1-flash-lite across all routes)    │
│  • Tier 2 Grounded: `gemini-3.8-flash` + `googleSearch` (Live SBC/Promo/Price sync)    │
│  • Tier 3 Deep: `gemini-4-argon` (`ThinkingLevel.HIGH` for Squad & Portfolio AI)       │
│  • Audio Transcription: `gemini-3.5-transcribe` (`/api/gemini/transcribe`)             │
│  • Live Voice API: `gemini-3.8-live` (`/api/gemini/live-session` + Web Audio HUD)      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Planned Execution Steps:
1. **Model Router Upgrade (`gemini-3.5-flash-lite`)**: Update `modelRouter.ts` and `server.ts` so Tier 1 uses `gemini-3.5-flash-lite` everywhere.
2. **Ultimate Scream Team 1 Catalog, Ranked SBCs & Objectives Data (`fc27ConsoleData.ts`)**:
   - Add all Ultimate Scream Team 1 players, `85 Moore` & `85 Otamendi` Player SBCs, Top 5 Player SBCs vs. Top 5 Upgrade SBCs with live countdown timers and Worth-It scores, and `87 Jill Scott (CB/CDM/CM)` & `87 Verón (CM)` Objectives.
3. **Split Ranked SBC & Objectives View + Live Squad Tracker**:
   - Upgrade the SBC tab to split **Top 5 Player SBCs**, **Top 5 Upgrade SBCs**, and **Live Objectives**, ranked by Worth-It Score and linked to your Starting XI & `35,000` Coin budget.
4. **Investment Tracker, Standalone Tactical Command Tab, Live Audio HUD & Push-to-Talk**:
   - Implement the full Console Investment Tracker with 5% tax math and Gemini transfer alerts, the standalone `TACTICAL COMMAND` multi-turn chat tab, the `LiveAudioHud`, and reusable `PushToTalkButton` components.
5. **Verification**: Run `lint_applet` and `compile_applet` to verify zero errors.
