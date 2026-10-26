# Live FUTBIN & FUT.GG Dynamic Database Search & Interactive Chemistry Style Meta Boost Tool Plan

An integrated enhancement plan introducing a **Live FUTBIN & FUT.GG Dynamic Database Search Engine with lowest Xbox Series S BIN synchronization** and an **Interactive Chemistry Style & Meta Boost Comparison Tool** calibrated to EA Sports FC 27 AcceleRATE 2.0 physics, 33/33 chemistry diamonds, and 31 Roles++.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed User Decisions (Phase 1 Clarifications)**:
> 1. **Next Primary Feature**: **Live FUTBIN and FUT.GG database search with lowest BIN sync**—enabling instant search across the verified FC 27 catalog and live Google Search grounding against FUTBIN and FUT.GG console cross-play market indices.
> 2. **Core Prioritized Capability**: **Interactive chemistry style and meta boost comparison tool**—allowing players to simulate stat deltas (0–3 chemistry diamonds), test AcceleRATE 2.0 sprint curve transitions (e.g., Controlled to Controlled Lengthy), evaluate Role++ synergies, and compare styles side-by-side (e.g., Shadow vs. Anchor vs. Hunter).

- **Confirmed Architecture Additions**:
  - **Live Database Sync Endpoint (`/api/database/sync-lowest-bin`)**: Powered by `gemini-3.8-flash` with `googleSearch` to verify real-time Xbox Series S lowest BINs, 24h market trends, and direct links to FUTBIN and FUT.GG card pages.
  - **Deterministic Chemistry Boost Matrix Engine (`src/utils/fc27ChemistryEngine.ts`)**: Pure deterministic local calculation ($0.00 cost, <1ms) applying official FC 27 chemistry style stat multipliers (Hunter, Shadow, Anchor, Catalyst, Engine, Hawk, etc.) across 0, 1, 2, and 3 chemistry points.
  - **Dynamic Database & Meta Lab View**: Integrated into the app navigation, featuring instant autocomplete, budget filtering (under 35,000 Coins), live BIN tickers, and the side-by-side comparison lab.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Dynamic FUTBIN & FUT.GG Player Search**: Search any FC 27 player card by name, rating, position, club (2026/27 verified), or Role++, with real-time lowest BIN price verification on the Xbox Series S console market.
  2. **Interactive Chemistry Style Comparison Lab**: Compare how different Chemistry Styles (Shadow, Hunter, Anchor, Engine, Catalyst, Hawk, etc.) modify a player's in-game stats across Pace, Shooting, Passing, Dribbling, Defending, and Physicality based on their active chemistry points (0–3 diamonds).
  3. **AcceleRATE 2.0 & Role++ Dynamic Analysis**: Automatically computes whether adding a chemistry style shifts the player's sprint archetype (e.g., boosting Strength to push a Controlled player into Controlled Lengthy) and evaluates whether their assigned Role++ (e.g., Inside Forward++, Box-to-Box++, Deep-Lying Playmaker++) receives optimal stat scaling.
  4. **Direct Workflow Integration**: One-click actions to "Add to Starting XI", "Log to Investment Tracker", "Export to Google Sheets Master Workbook", or "Analyze in Tactical Command".
- **Target Audience**: Competitive FC 27 Ultimate Team console players optimizing player performance and transfer spending under a strict coin budget.
- **Key Value**: Zero guessing on card stats and prices; instant mathematical visibility into optimal chemistry styles before committing coins on the transfer market.

---

## 2. User Experience & Visual Design

### A. Dynamic Database Search & Live BIN Radar
- **Search Bar & Filter Strip**:
  - Instant client-side search with debounced live web sync trigger.
  - Filters: *Position* (ATT, MID, DEF, GK), *Rating Range* (80–94), *Xbox Price Budget* (All, Under 35k Coins, Discard Floor), and *Roles++*.
  - Live Sync Status Header: Displays current T=0 British Time, connected databases (*FUTBIN Console + FUT.GG*), and a 1-click "Refresh Market BINs" button.
- **Player Card Grid & Data Badges**:
  - High-density cards displaying OVR, 2026/27 club, 3 PlayStyles+ badges, and lowest Xbox BIN with green/red 24h price swing indicators.
  - Direct external link icons to view the card on FUTBIN and FUT.GG.

### B. Interactive Chemistry Style & Meta Boost Comparison Tool
- **Chemistry Diamond Controller**:
  - Segmented selector for 0, 1, 2, or 3 Chemistry Diamonds, dynamically adjusting the boost intensity (0 = base stats; 1 = 33% boost; 2 = 66% boost; 3 = 100% full boost).
- **Dual Comparison Columns (Style A vs. Style B)**:
  - Select two chemistry styles side-by-side (e.g., **Shadow** vs. **Anchor** on Alejandro Balde, or **Hunter** vs. **Engine** on Lamine Yamal).
  - Clean visual diff bars: Green `+8` badges and visual progress bars showing modified face and sub-stats (Acceleration, Sprint Speed, Interceptions, Defensive Awareness, Physical Strength).
  - Net In-Game Rating (IG Rating) recalculation (e.g., 83 Balde -> 88 LB with Shadow vs. 87 LWB with Anchor).
- **AcceleRATE 2.0 Shift Radar**:
  - Badges displaying base archetype vs. boosted archetype (e.g., *Controlled -> Controlled Lengthy*).
  - Explicit physical formula readout: `(Strength ${str} - Agility ${agi} = ${diff} >= 14, Height ${height}cm >= 181cm)`.
- **Role++ Synergy Verdict**:
  - Direct assessment of the player's 31 Role++ assignment under Title Update #3.1 (e.g., *"Shadow grants maximum +8 sprint speed and +8 tackle recovery, elevating Falseback++ recovery runs by +14%"*).

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Chemistry Math Engine** | Deterministic local TypeScript calculator (`fc27ChemistryEngine.ts`) | Sub-millisecond calculation speed, zero token cost, 100% mathematical precision without LLM hallucinations. | Querying Gemini for every chemistry style change (unnecessary 800ms latency and token cost for static formulas). |
| **Live BIN Verification** | Hybrid cached database + on-demand `gemini-3.8-flash` Google Search sync | Delivers instant UI responsiveness on search while providing verified, up-to-the-minute Xbox Series S prices on click. | Scraping without search grounding (blocked by anti-bot measures / CORS) or pure mock data (lacks real market fidelity). |
| **Comparison Presentation** | Side-by-side dual style selector (Style A vs. Style B) | Allows competitive players to instantly resolve the most common dilemma in Ultimate Team (e.g. "Do I give Camavinga a Shadow or an Engine?"). | Single style preview only (requires toggling back and forth and memorizing numbers). |

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                   CLIENT (React 19)                                   │
 │                                                                                       │
 │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
 │  │               Dynamic Database & Meta Lab View (`DynamicDatabaseView`)          │  │
 │  │                                                                                 │  │
 │  │  ┌────────────────────────────────────┐  ┌───────────────────────────────────┐  │  │
 │  │  │ Search & Live BIN Radar            │  │ Chemistry Style Comparison Lab    │  │  │
 │  │  │ • Instant Catalog & Web Filter     │  │ • 0–3 Chemistry Diamonds Selector │  │  │
 │  │  │ • Under 35k Coins Filter           │  │ • Dual Style Diff (A vs B)        │  │  │
 │  │  │ • FUTBIN & FUT.GG Direct Links     │  │ • AcceleRATE 2.0 Transition Check │  │  │
 │  │  │ • Lowest Xbox BIN Live Badge       │  │ • Role++ Synergy Evaluation       │  │  │
 │  │  └─────────────────┬──────────────────┘  └─────────────────┬─────────────────┘  │  │
 │  └────────────────────┼───────────────────────────────────────┼────────────────────┘  │
 └───────────────────────┼───────────────────────────────────────┼───────────────────────┘
                         │                                       │
                         ▼                                       ▼
 ┌──────────────────────────────────────────────────┐  ┌─────────────────────────────────┐
 │            SERVER PROXY (`server.ts`)            │  │   LOCAL DETERMINISTIC ENGINE    │
 │  POST /api/database/sync-lowest-bin              │  │   `fc27ChemistryEngine.ts`      │
 │  • gemini-3.8-flash + googleSearch               │  │   • 24 Official Chem Styles     │
 │  • Real-time Xbox Series S Lowest BIN Extraction │  │   • Sub-stat calculation (<1ms) │
 │  • FUTBIN & FUT.GG Page Links                    │  │   • AcceleRATE 2.0 Shift Math   │
 └──────────────────────────────────────────────────┘  └─────────────────────────────────┘
```

### Chemistry Styles Implemented
- **Pace + Shot**: Hunter (+8 PAC, +8 SHO), Catalyst (+8 PAC, +8 PAS), Shadow (+8 PAC, +8 DEF), Hawk (+4 PAC, +8 SHO, +4 PHY), Engine (+4 PAC, +8 DRI, +8 PAS), Anchor (+4 PAC, +8 DEF, +8 PHY).
- **Finishing & Attacking**: Sniper, Finisher, Deadeye, Marksman.
- **Midfield & Defense**: Artist, Architect, Powerhouse, Maestro, Sentinel, Guardian, Gladiator, Backbone.
- **Goalkeeper**: Glove, Shield, Cat, Wall.

---

## 5. Planned Execution Steps

1. **Build Deterministic Chemistry & Meta Engine (`src/utils/fc27ChemistryEngine.ts`)**:
   - Define exact official FC 27 stat deltas for all 24 Chemistry Styles across 0, 1, 2, and 3 chemistry points.
   - Implement AcceleRATE 2.0 physical archetype calculator (Explosive, Controlled Explosive, Controlled, Controlled Lengthy, Lengthy) based on Acceleration, Sprint Speed, Strength, Agility, and Height.
   - Implement Role++ synergy scorer evaluating in-game rating boosts for each player's active role.
2. **Implement Server-Side Live BIN Sync Endpoint (`server.ts`)**:
   - Add `POST /api/database/sync-lowest-bin` using `gemini-3.8-flash` with `googleSearch` to verify real-time Xbox Series S prices and FUTBIN/FUT.GG URLs.
3. **Build Dynamic Database & Meta Lab Component (`src/components/DynamicDatabaseView.tsx`)**:
   - Fast responsive search bar with 35k budget filter and instant player card list.
   - Dual-column Chemistry Style Comparison interface with live visual diff bars, AcceleRATE 2.0 badges, and Role++ synergy feedback.
   - Action buttons: "Add to Starting XI", "Log to Investment Ledger", "Sync to Google Sheet", and "Open on FUTBIN / FUT.GG".
4. **Integrate into Main App Navigation (`src/App.tsx`)**:
   - Add "Dynamic Database & Chem Lab" to the desktop sidebar navigation and mobile pill bar.
5. **Verification & Build Validation**:
   - Run `lint_applet` (`tsc --noEmit`) to verify strict type safety.
   - Run `compile_applet` to confirm the production build compiles cleanly with zero errors.
