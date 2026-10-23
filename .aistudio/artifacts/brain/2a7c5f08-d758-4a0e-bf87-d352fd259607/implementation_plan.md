# FC 27 UT App — Dual-Domain Terminal (`MENUS` & `GAMEPLAY`) with $T=0$ Temporal Firmware & Capability Discovery Engine

An EA Sports FC 27 Ultimate Team (Console) strategic platform built around a **Dynamic $T=0$ Temporal Anchoring & Version Discovery Engine**. Every user prompt, UI interaction, and runtime task first resolves the exact **British Time (`Europe/London` BST/GMT) timestamp at $T=0$** (e.g., `Friday, 23 October 2026, 07:37 BST`) and uses that anchor to **dynamically discover the latest software/firmware version and capabilities** of the **Google Antigravity 2.0 Desktop App** (currently **`v2.25`** at $T=0$), the **active EA Sports FC 27 Title Update / Live Tuning Patch**, **FUTBIN FC 27 Console Market/Content**, and **FotMob `2026–27` Squad Transfers**—automatically adapting and unlocking new features in the app as software updates roll out.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan institutionalizes the **$T=0$ Temporal Version & Capability Discovery Loop** across every runtime layer:

1. **Dynamic $T=0$ Temporal Firmware & Feature Discovery (Never Static)**:
   - Every time you open the app, click a tool, or send a prompt, the runtime executes `resolveTemporalEnvironment(new Date())` anchored to `Europe/London` ($T=0$).
   - Instead of hardcoding a fixed version forever, the app uses the **$T=0$ Timestamp + Live Search Grounding (`gemini-3.8-flash` + `googleSearch` / MCP Fetch)** to resolve the **current software/firmware release and newly added capabilities** as of that exact moment:
     - **At current $T=0$ (`23 Oct 2026, 07:37 BST`)**: Resolves **Antigravity Desktop App `v2.25`** as the latest release and automatically enables `v2.25`-specific app capabilities (Native `/browser` Subagent + Chrome DevTools MCP bridge, `/schedule` autonomous cron hooks, Dynamic Parallel Subagents, `.agents/mcp_config.json` workspace scaling, and Jetski CoT verification).
     - **At any future $T=0$ (`t > 23 Oct 2026`)**: Automatically queries release channels as of the new $T=0$ date/time to detect if Antigravity (`v2.26+`) or EA Sports FC 27 (`Title Update #4+`) has shipped new features, dynamically adding those capabilities and patch weights to the app's orchestrator and Gameplay Synthesis Lab without manual rewrites.
2. **Four-Pillar $T=0$ Live State Resolution on Every Runtime**:
   - **Pillar A — Antigravity 2.0 Desktop App Firmware Resolver**: Checks latest version & changelog as of $T=0$ (`v2.25` today) and configures the active MCP & Subagent orchestration bar.
   - **Pillar B — EA Sports FC 27 Title Update & Live Tuning Patch Resolver**: Checks the latest FC 27 game patch as of $T=0$ and updates **Domain 2 (`GAMEPLAY`)** formation meta, PlayStyle+ multipliers, and AcceleRATE sprint curves.
   - **Pillar C — FUTBIN FC 27 Console Content & Market Resolver**: Checks active UT Season (`Season 2` as of 23 Oct 2026), 18:00 BST daily drop countdown, newly added promo/TOTW/Holographic cards, SBC expiries, and Gallery Sets in **Domain 1 (`MENUS`)**.
   - **Pillar D — FotMob `2026–27` Anti-Autoregressive Transfer Resolver**: Computes the active football season from $T=0$ (Aug–Dec 2026 = **1st Half of `2026–27` Season**) and verifies real-world club registrations (e.g., Rodri at **FC Barcelona**) to defeat LLM historical frequency bias.

---

## 1. How the $T=0$ Temporal Version & Capability Discovery Engine Works

```
┌────────────────────────────────────────────────────────────────────────────────┐
│        1. RUNTIME INITIATION / USER PROMPT / UI INTERACTION (T = 0)            │
│        Evaluates Live UK Clock: e.g., Friday, 23 October 2026 · 07:37 BST      │
└───────────────────────────────────────┬────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│        2. T=0 TEMPORAL VERSION & CAPABILITY DISCOVERY ENGINE                   │
│                                                                                │
│  ┌────────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │ A. Antigravity 2.0 Firmware Probe  │  │ B. EA FC 27 Patch & Meta Probe   │  │
│  │ • Queries latest release @ T=0     │  │ • Queries latest Title Update &  │  │
│  │ • Current @ 23 Oct 2026: v2.25     │  │   Live Tuning Pitch Notes @ T=0  │  │
│  │ • Unlocks v2.25 Capabilities:      │  │ • Dynamically recalibrates       │  │
│  │   - /browser + Chrome DevTools MCP │  │   PlayStyle+, Role++ & AcceleRATE│  │
│  │   - /schedule 18:00 BST Cron Hook  │  │   weights in Gameplay Lab        │  │
│  │   - Dynamic Parallel Subagents     │  └──────────────────────────────────┘  │
│  │   - Jetski CoT Safety Verification │                                        │
│  └────────────────────────────────────┘  ┌──────────────────────────────────┐  │
│                                          │ C. FUTBIN 27 + FotMob 26-27 Probe│  │
│                                          │ • Season Math: 2026-27 (1st Half)│  │
│                                          │ • Verifies 26-27 Transfers       │  │
│                                          │   (Rodri -> FC Barcelona)        │  │
│                                          │ • Pulls Live Console Prices,     │  │
│                                          │   New Items, SBCs & Gallery Sets │  │
│                                          └──────────────────────────────────┘  │
└───────────────────────────────────────┬────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│        3. DYNAMICALLY ADAPTED DUAL-DOMAIN APP (`MENUS` & `GAMEPLAY`)           │
│  • Header Badge: [T=0: 23 Oct 2026 07:37 BST | Antigravity v2.25 | FC 27 TU]   │
│  • Domain 1 (MENUS): Live Console Price Charts, Dual-Mode SBC, FUT Gallery     │
│  • Domain 2 (GAMEPLAY): Additive Synthesis Calculator (Stats + Chem + PS+ +    │
│    AcceleRATE + Body Type + 31 Roles++ weighted by active T=0 Patch)           │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dual-Domain Feature Breakdown (`MENUS` & `GAMEPLAY`)

### Domain 1: `MENUS` (Market Visualization, SBCs, FUT Gallery, Club Sync & Antigravity `v2.25` MCP Hub)
1. **Instantaneous Price & New Item Tracker + Interactive Mobile Charts**:
   - Interactive SVG/Canvas charts for **24h Hourly Console Prices**, **7d Trends**, **FUTBIN Market Index 100**, **Cheapest by Rating (81–91)**, and **Regular ($\le 87$) / Pristine ($\ge 88$) Holographic Arbitrage**, stamped with the exact $T=0$ fetch millisecond.
2. **Dual-Mode SBC Recommendation Engine**:
   - **Streamlined SBC Mode**: Deterministic `<2ms` calculation of Cheapest **Item Score** per coin using Rating, Rarity, Holographic 1.25x/1.50x multipliers, and SBC Duplicate Storage.
   - **11-Player Puzzle SBC Mode**: Deterministic rating + 33/33 chemistry solver prioritizing your synced club untradeables, paired with `gemini-4-argon` (`ThinkingLevel.HIGH`) link advice.
3. **Authentic FUT Gallery Set, Tag & "Rent-and-Flip" Optimizer**:
   - Tracks 100+ permanent Gallery Sets, Set Grades, Tag Bonuses, and calculates discard-floor "Buy, Register in Set, Resell" flips after the 5% EA tax.
4. **Frictionless Club Sync & 850 SP Match Stacker**:
   - Syncs Coins, FIFA Points, untradeables, Evolutions, and SBCs via **Antigravity `v2.25` `/browser` Chrome DevTools MCP**, **1-Click Web App JSON**, **Google Drive**, or **Voice (`gemini-3.5-transcribe`)**.

### Domain 2: `GAMEPLAY` (Patch-Grounded Tactics, 31 Roles++ & Additive Synthesis Engine)
1. **Stats in Isolation vs. Synthesized Additive Calculator**:
   - Computes and visualizes how **Base Sub-Attributes** combine additively and multiplicatively with **Chemistry Styles (0–3 Diamonds)**, **AcceleRATE 2.0 Sprint Archetypes**, **PlayStyles & PlayStyles+ (3 PS+ Cap)**, **Player Body Type**, and **31 Player Roles (`Role`, `Role+`, `Role++`)**.
2. **Live $T=0$ Patch & Firmware Meta Tracker**:
   - Queries and displays the active EA Sports FC 27 Title Update & Live Tuning changes as of $T=0$, showing which formations, Roles++, and PlayStyles+ were buffed or nerfed in the latest patch.
3. **33/33 Squad Builder & Branching Evolution Simulator**:
   - Full pitch builder verifying `2026–27` club chemistry links via FotMob + FUTBIN 27 (e.g., Rodri at FC Barcelona) and simulating Branch A vs. Branch B of active Evolutions.

---

## 3. Execution Sequence

1. **Step 1: OAuth, Firebase & Paid Model Provisioning**:
   - Finalize Google Drive OAuth via `set_up_oauth` (`userConfirmedInUI: true`).
   - Verify Firebase ToS (`GetFirebaseTos`) and provision Firestore (`ProvisionFirebase`).
   - Trigger `show_aistudio_ui` (`paid_model_flow`) for `gemini-4-argon`.
   - Create `firebase-blueprint.json` and hardened `firestore.rules`.
2. **Step 2: $T=0$ Temporal Anchor & Firmware Discovery Utility + Deterministic Engine**:
   - Build `src/utils/timeGrounding.ts` with `createTemporalAnchor()` (`Europe/London` live clock, `2026–27` season math, 18:00 UK drop timer, and $T=0$ Antigravity & FC 27 patch version resolver).
   - Build `src/utils/fc27DeterministicEngine.ts` covering both **Menus Math** (Streamlined SBC Item Score + Holographics, 11-player puzzle solver, 5% tax, Gallery Rent-and-Flip) and **Gameplay Synthesis Math** (Stats in Isolation vs. Synthesized with Chemistry Styles, AcceleRATE 2.0, PlayStyles+ 3-cap, Body Type, and 31 Roles++).
   - Build `src/data/fc27ConsoleData.ts` with `2026–27` verified console players, 24h/7d interactive price series, active SBCs, Branching Evolutions, FUT Gallery Sets, Live Patch Meta formations, and the **Antigravity `v2.25` `.agents/mcp_config.json` & Firmware Capability Registry**.
3. **Step 3: Express Backend with Dynamic $T=0$ Firmware & Patch Discovery (`server.ts`)**:
   - Attach server middleware that binds a live $T=0$ `TemporalAnchor` to every request.
   - Implement `/api/gemini/discover-t0-versions` (`gemini-3.8-flash` + `googleSearch` grounded at $T=0$ to check the latest Antigravity Desktop App firmware version & capabilities and latest EA FC 27 Title Update patch notes), `/api/gemini/market-trend-analysis` (`gemini-4-argon` + `ThinkingLevel.HIGH`), `/api/gemini/gameplay-synthesis` (`gemini-4-argon` + `ThinkingLevel.HIGH`), `/api/gemini/sbc-And-evo-advisor`, and `/api/gemini/transcribe` (`gemini-3.5-transcribe`).
4. **Step 4: Dual-Domain Responsive Dashboard (`MENUS` & `GAMEPLAY`)**:
   - Build the Header with the live $T=0$ British Time clock, active **Antigravity Firmware Badge (`v2.25` @ $T=0$)** with 1-click **"Check for New Firmware/Patch Capabilities at $T=0$"**, Domain Switcher (`MENUS` vs. `GAMEPLAY`), and ZenBook ScreenPad Plus Ticker toggle.
   - Build all interactive views across both domains and verify responsive mobile (`375px–430px`) and desktop layouts.
5. **Step 5: Compilation & Verification**:
   - Run `compile_applet` and verify zero errors.
