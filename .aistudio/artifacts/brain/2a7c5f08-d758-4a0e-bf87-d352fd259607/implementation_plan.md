# Google Search Grounding, Microphone Audio Transcription & Multi-Tier Gemini Chatbot Integration Plan

An end-to-end integration plan incorporating **Google Search live data grounding** (`gemini-3.8-flash`), **push-to-talk microphone audio transcription** (`gemini-3.5-transcribe`), and a **multi-turn Gemini Tactical Director chatbot** featuring tiered model routing (`gemini-4-argon`, `gemini-3.8-flash`, and `gemini-3.1-flash-lite`) into the EA Sports FC 27 Ultimate Team Console Assistant (Xbox Series S).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed User Decisions (Phase 1 Clarifications)**:
> 1. **Chatbot Placement**: Incorporated in **both the Dedicated Tactical Command tab and the collapsible assistant drawer**, providing full-screen tactical analysis as well as quick sliding access from any tab without losing context.
> 2. **Model Routing Strategy**: Implemented as **Smart auto-routing with an interactive manual model switcher**—automatically picking the optimal tier based on query complexity while letting the user explicitly lock into Frontier Reasoning (Argon), Grounded Live Meta (Flash + Search), or Lightning Speed (Flash Lite).

- **Confirmed Model Roster**:
  - `gemini-4-argon`: Complex multi-constraint tactical modeling, full squad chemistry rebuilds, and multi-scenario trade calculations (`ThinkingLevel.HIGH`).
  - `gemini-3.8-flash` (+ `googleSearch`): General conversational chat, real-time live promo/SBC grounding, Title Update #3.1 patch notes, and Xbox Series S market valuations.
  - `gemini-3.1-flash-lite`: Ultra-fast (~200–350ms) low-latency lookups, instant player chemistry deltas, and 5% EA tax audits.
  - `gemini-3.5-transcribe`: High-accuracy speech-to-text for microphone audio dictation across the chat input, investment logger, club sync, and Google Docs notes.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Google Search Grounded Intelligence**: Delivers up-to-the-minute FC 27 console data (October 2026 Ultimate Scream Team 1 drop, live 18:00 UK market swings, Title Update #3.1 notes, and FotMob verified 2026/27 rosters) with clickable web citations.
  2. **Hands-Free Audio Transcription**: Enables players to hold a push-to-talk microphone button on their console companion screen or laptop (ZenBook UX482) to dictate tactical queries, player trade entries, or club wallet changes directly into text.
  3. **Multi-Turn Tactical Director Chat**: Maintains conversational history across turns with role personas (Meta Analyst, Budget Architect, Gegenpress Coach), transparent telemetry receipts (latency ms, model tier, cost factor), and full context injection (current 35k coins, Starting XI, and investment ledger).
- **Target Audience**: Competitive FC 27 Ultimate Team console players who demand real-time transfer market accuracy and fast hands-free input.
- **Key Value**: Eliminates outdated training-data hallucinations through live Google Search grounding, accelerates interaction with microphone audio transcription, and optimizes performance and cost through 3-tier model routing.

---

## 2. User Experience & Visual Design

### A. Dedicated Tactical Command Tab & Collapsible Drawer
- **Dual Presentation**:
  - **Full-Screen Tab (`TACTICAL_COMMAND`)**: Expansive multi-turn chat feed with rich markdown tables, model receipts, quick-prompt chips, and role persona switchers.
  - **Collapsible Drawer (`AntigravityMcpAndChatDrawer`)**: Accessible from the bottom right or navigation bar on any view (Squad, Market, SBCs, Investments, Google Workspace Hub).
- **Control Bar**:
  - **Tier Selector Segmented Control**:
    - `AUTO` — Smart classifier dynamically selects the best tier based on query keywords and complexity.
    - `gemini-3.1-flash-lite` — *Lightning Speed (~250ms)*: Quick single-stat lookups and math checks.
    - `gemini-3.8-flash` (+ Search) — *Live Meta Grounding (~750ms)*: Real-time web search for current SBCs, market drops, and Title Updates.
    - `gemini-4-argon` — *Deep Tactical Reasoning (~3.2s)*: Multi-constraint chemistry optimization and branching evolution synthesis.
  - **Tactical Persona Switcher**: *Meta Analyst*, *Budget Architect (35k)*, *Counter-Press Specialist*.

### B. Push-to-Talk Microphone Audio Transcription Flow
- **Microphone Button (`PushToTalkButton`)**:
  - Sleek button with microphone icon, tactile click, and pulsating recording indicator.
  - Supports both click-to-toggle and press-and-hold recording modes.
  - Captures audio via browser `MediaRecorder` (`audio/webm` or `audio/wav`), encodes to base64, and dispatches to `/api/gemini/transcribe`.
  - Transcribes via `gemini-3.5-transcribe` and automatically inserts the text into the active chat input field or form input.
- **Available Entry Points**:
  - Chat input in Tactical Command & Drawer.
  - Investment Acquisition Logger.
  - Club Sync Onboarding Modal.
  - Google Docs Note Appender.

### C. Live Search Grounding Visual Citations
- **Source Badges**:
  - Below grounded model responses, a clean unboxed sources list displays verified web citations extracted from `groundingChunks` (e.g. *EA FC 27 Pitch Notes*, *FUTBIN Console Tracker*, *FotMob Transfers*).
  - Clicking any citation opens the official web source in a secure new tab.
  - Telemetry receipt displays model name, latency in milliseconds, and the search routing justification.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Chatbot Placement** | Full-screen Tactical Command tab + sliding drawer | Gives users deep focus for complex squad overhauls while allowing quick queries while browsing the market or squad. | Drawer only (too cramped for deep markdown tables) or Full-screen tab only (forces tab context switching). |
| **Model Tier Strategy** | Smart Auto-routing with manual pill override | Eliminates user hesitation for common queries while offering power users absolute control over deep reasoning vs. fast lookup. | Fixed single model (either too slow for simple queries or incapable of frontier reasoning). |
| **Search Grounding Trigger** | Automatic keyword detection + manual toggle | Ensures queries asking for live prices, promos, SBCs, or patch notes get live Google Search data without adding unnecessary latency to basic math lookups. | Always searching (adds 400-800ms to every query) or never searching (results in stale pre-training data). |
| **Audio Processing** | Server-side `gemini-3.5-transcribe` via Express endpoint | Complies strictly with zero client-side API key exposure; delivers fast, highly accurate transcription of soccer jargon and player names. | Browser Web Speech API (inconsistent browser support, poor recognition of player surnames and gaming terms). |

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                   CLIENT (React 19)                                   │
 │                                                                                       │
 │  ┌───────────────────────────────────┐       ┌─────────────────────────────────────┐  │
 │  │      Tactical Command View        │       │     Collapsible Drawer Widget       │  │
 │  │  • Multi-turn Message Thread      │       │  • Floating Quick-Access Drawer     │  │
 │  │  • Model Tier Selector Strip      │       │  • Shared Chat History State        │  │
 │  │  • Tactical Persona Switcher      │       │  • Push-to-Talk Mic Dictation       │  │
 │  │  • Push-to-Talk Mic Dictation     │       │  • Telemetry Receipts & Sources     │  │
 │  │  • Grounded Web Sources Display   │       └──────────────────┬──────────────────┘  │
 │  └─────────────────┬─────────────────┘                          │                     │
 └────────────────────┼────────────────────────────────────────────┼─────────────────────┘
                      │                                            │
                      ▼                                            ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                              SERVER PROXY (`server.ts`)                               │
 │                                                                                       │
 │  • POST /api/gemini/chat                                                              │
 │    ├─ gemini-3.1-flash-lite  (Fast checks, sub-350ms, ThinkingLevel.MINIMAL)          │
 │    ├─ gemini-3.8-flash       (General chat + { tools: [{ googleSearch: {} }] })       │
 │    └─ gemini-4-argon         (Deep reasoning, ThinkingLevel.HIGH)                     │
 │                                                                                       │
 │  • POST /api/gemini/transcribe                                                        │
 │    └─ gemini-3.5-transcribe  (Audio base64 input -> Text transcript)                  │
 │                                                                                       │
 │  • POST /api/gemini/discover-t0-versions & fetch-patch-notes                          │
 │    └─ gemini-3.8-flash       ({ tools: [{ googleSearch: {} }] } grounded at T=0)      │
 └────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                 EXTERNAL SERVICES                                     │
 │  • Google GenAI SDK (@google/genai) with server-side API key                          │
 │  • Google Search Grounding Index                                                      │
 │  • Firestore Database: ai-studio-fc27utapp-2a7c5f08-d758-4a0e-bf87-d352fd259607       │
 └───────────────────────────────────────────────────────────────────────────────────────┘
```

### Models Used & Specific Roles
1. **`gemini-4-argon`**: Frontier reasoning (`ThinkingLevel.HIGH`) for complex tactical chemistry rebuilds, multi-stage evolution paths, and portfolio risk calculations.
2. **`gemini-3.8-flash`**: General chat, multi-turn reasoning, and real-time live grounding via `googleSearch` tool for current Ultimate Scream Team 1 prices, Title Update #3.1 notes, and 18:00 UK supply swings.
3. **`gemini-3.1-flash-lite`**: Ultra-fast (~200–350ms) low-cost single-step queries, 5% EA tax verification, and instant chemistry delta checks.
4. **`gemini-3.5-transcribe`**: Dedicated audio speech-to-text model for all microphone inputs.

---

## 5. Planned Execution Steps

1. **Verify Server Endpoints in `server.ts`**:
   - Ensure `/api/gemini/chat` properly supports the model router with `gemini-3.1-flash-lite`, `gemini-3.8-flash` (with `{ tools: [{ googleSearch: {} }] }` and grounding metadata extraction), and `gemini-4-argon` (`ThinkingLevel.HIGH`).
   - Ensure `/api/gemini/transcribe` accurately routes base64 audio to `gemini-3.5-transcribe`.
2. **Synchronize Tactical Command Tab & Assistant Drawer**:
   - Update `TacticalChatTab.tsx` and `AntigravityMcpAndChatDrawer.tsx` to provide a unified experience: model switcher buttons (`gemini-3.1-flash-lite`, `gemini-3.8-flash + Search`, `gemini-4-argon`, and `AUTO`), role persona selection, and live token latency/source telemetry.
   - Wire push-to-talk microphone button (`gemini-3.5-transcribe`) directly to the chat input in both views.
   - Display grounded search citations cleanly with clickable web links.
3. **Audio Dictation across Key App Forms**:
   - Confirm `PushToTalkButton` works across the chat input, Investment Tracker, Club Sync Modal, and Google Docs note creator.
4. **Verification & Build Validation**:
   - Run `lint_applet` (`tsc --noEmit`) to verify zero type errors.
   - Run `compile_applet` to confirm the production build compiles cleanly.
