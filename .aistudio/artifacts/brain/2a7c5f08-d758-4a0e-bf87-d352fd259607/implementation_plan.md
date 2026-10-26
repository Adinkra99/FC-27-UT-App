# FC 27 UT App — Club Sync JSON Backup Export, AI Tactical Director & Photorealistic 3D Stadium Pitch Prototype Plan

An integrated capability prototype and architectural upgrade for the EA Sports FC 27 Ultimate Team Console Assistant (Xbox Series S). This update adds an **instant browser-based JSON backup export** in the Club Sync Modal (generating a timestamped `.json` file via client-side `Blob` with `application/json` MIME type), introduces an interactive **Three.js photorealistic 3D stadium pitch visualizer** with procedural player card totems, and showcases the **AI Tactical Director** prototype with transparent tiered model routing (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.5-transcribe`, and `gemini-3.8-live`).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed User Decisions (Phase 1 Clarifications)**:
> 1. **AI Tactical Director Presentation**: Configured as a **Dedicated Tactical Director tab with model selector**, providing full-screen tactical analysis, live audio coaching, role persona selection, and explicit routing between speed, grounded search, and deep reasoning models.
> 2. **Club Data JSON Export Behavior**: Triggered via an **instant one-click download with formatted timestamped filename** (`fc27_club_backup_YYYY-MM-DD_HHmmss.json`) directly inside the Club Sync Modal, wrapping the verified club state (coins, club name, division, custom players, squad cards, duplicate inventory, and investment ledger) in a typed `application/json` `Blob`.
> 3. **Three.js 3D Pitch Visualization**: Prioritized with **photorealistic stadium turf and procedural 3D card pedestals**, featuring procedural grass shear, touchline markings, PBR stadium floodlighting, studio reflection (`RoomEnvironment`), and a non-occluding collapsible bottom dock HUD.

- **Confirmed Model Roster**:
  - `gemini-4-argon`: Complex tactical modeling, full squad chemistry rebuilds, and multi-scenario trade calculations (`ThinkingLevel.HIGH`).
  - `gemini-3.8-flash`: General chat, tactical director multi-turn dialogue, and real-time live promo/SBC grounding via `googleSearch`.
  - `gemini-3.5-flash-lite`: Low-latency instant queries, quick squad delta checks, and rapid card-swap evaluations.
  - `gemini-3.5-transcribe`: Push-to-talk microphone audio transcription across all input fields.
  - `gemini-3.8-live`: Real-time bidirectional voice coaching session with live waveform visualizer in the top HUD.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Club Data Portability & Backup**: Enables users to back up their entire verified Xbox Series S Ultimate Team profile (35,000 Coins, logged squad, custom player cards, untradeables, duplicate storage, and active flips) with a single click, downloading a clean, schema-validated JSON file.
  2. **Tactical Director Prototype**: An AI tactical command suite where users can select model tiers, query tactical directors with specialized FC 27 personas (e.g. Pep Gegenpress, Ancelotti Pragmatic, Modern Patch Meta), and inspect live token/latency telemetry.
  3. **Photorealistic 3D Pitch Lab**: An interactive Three.js 3D stadium pitch rendering player cards on procedural physical totems with illuminated Role++ beacons, custom camera angles, and smooth damping.
- **Target Audience**: Competitive FC 27 Ultimate Team console players who demand strict data ownership (offline JSON backups) and advanced tactical simulation tools.
- **Key Value**: Zero data loss with immediate offline recovery, high-fidelity spatial squad visualization, and predictable model selection tailored to task complexity.

---

## 2. User Experience & Visual Design

### A. Club Sync Modal JSON Export Flow
- **Visual Location**: Placed in the action row of the **Club Sync Modal** alongside existing import/sync buttons.
- **Visual Appearance**: Clean obsidian button with a download icon, green hairline border (`border-[#00ff87]/40 hover:border-[#00ff87]`), and clear label: **"Export Club State JSON"**.
- **Interaction**:
  1. Clicking immediately serializes the current club state:
     - `version: "1.0.0"`
     - `exportedAt: ISO timestamp`
     - `coins: 35000` (or user modified value)
     - `clubName`, `fifaPoints`, `rivalsDivision`, `dailySp`, `galleryLevel`
     - `squad`: Active 11-player formation, card IDs, ratings, positions, and chemistry
     - `clubInventory`: Owned catalog players and custom unverified players
     - `duplicateStorage`: Untradeable duplicate cards held for SBCs
     - `investmentLedger`: Active 5% tax flip positions
  2. Creates a `Blob` with `type: "application/json;charset=utf-8"`.
  3. Generates a download URL via `URL.createObjectURL(blob)`, sets filename `fc27_club_state_YYYYMMDD_HHMMSS.json`, programmatic click, and cleans up with `URL.revokeObjectURL`.
  4. Displays a non-intrusive success toast: *"Club state exported successfully (35,000 Coins & active squad logged)"*.

### B. Dedicated AI Tactical Director Tab (`TACTICAL COMMAND`)
- **Top Control Bar**:
  - **Model Selector Pill Strip**:
    - `gemini-3.5-flash-lite` — *Lightning Speed (~250ms)*: Rapid tactical tips, quick squad delta checks.
    - `gemini-3.8-flash` (+ Search) — *Grounded Meta (~800ms)*: Live Ultimate Scream Team 1 drop updates, patch notes.
    - `gemini-4-argon` — *Deep Tactical Reasoning (~2.8s)*: Exhaustive squad chemistry synthesis, Role++ optimization.
  - **Tactical Persona Switcher**: *Meta Optimizer*, *Counter-Press Specialist*, *Low-Budget Architect (35k Budget)*.
- **Chat Feed & Interaction**:
  - Clear message bubbles with role avatars, model response receipts (showing model name, token latency, and routing justification).
  - Push-to-talk mic button powered by `gemini-3.5-transcribe` for voice dictation.
  - Quick tactical prompts: *"Analyze my Starting XI weakest link"*, *"Best Ultimate Scream upgrade under 35k coins"*, *"Evaluate 85 Otamendi SBC vs 87 Jill Scott Objective"*.

### C. Photorealistic Three.js 3D Pitch Prototype
- **3D Pitch Visuals**:
  - Procedural turf with alternating mown grass stripes (procedural canvas texture, `SRGBColorSpace`, maximum anisotropy).
  - White touchlines, penalty boxes, center circle, and goal nets using procedural geometry.
  - 11 procedural card pedestals arranged in the active formation (4-2-1-3 or 4-3-3), featuring:
    - Primary card totem: Beveled extruded polygon with holographic trim.
    - Secondary Read: Floating position ring and rating badge.
    - Accent: Glowing Role++ light pillar indicating active playstyle bonuses.
- **Lighting & Atmosphere**:
  - Three-point stadium floodlight rig: 4 corner directional spot panels with soft shadows, subtle cool blue ambient fill (`THREE.HemisphereLight`), and procedural studio reflection via `RoomEnvironment`.
  - Atmospheric stadium night fog (`THREE.FogExp2`).
- **Collapsible Bottom Dock HUD**:
  - Zero viewport occlusion: All 3D controls (Camera Presets: *Broadcast High*, *Tactical Top-Down*, *Behind Goal*; Lighting Moods: *Night Match*, *Golden Hour*; Pedestal Elevation slider) grouped into a sleek glassmorphic bottom bar.
  - "Cinema Mode" toggle collapses the dock completely for full-screen inspection.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **JSON Export Engine** | Client-side `Blob` with `application/json` and `URL.createObjectURL` | Instant zero-latency download without server roundtrips; works completely offline; adheres strictly to privacy. | Server-side file generation via Express route (unnecessary network overhead and potential data leakage). |
| **3D Rendering Approach** | Pure procedural geometry & textures via Three.js (r160+) | Zero broken image 404s, hermetic execution, crisp grazing angles with procedural canvas textures and `RoomEnvironment`. | Loading external `.gltf` or `.obj` models (fragile, subject to network blocks and missing assets). |
| **Tactical Director Integration** | Dedicated full-screen tab with explicit model selector | Gives ample screen real estate for complex multi-turn chats, formatted code generation, and model telemetry without crowding the squad pitch. | Small floating modal or sidebar drawer (too narrow for deep tactical tables and multi-turn dialogue). |
| **Model Tier Assignment** | Strict task-based routing (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`) | Maximizes speed for frequent queries while reserving deep thinking models for comprehensive squad overhauls. | Single model for all queries (either too slow for simple queries or insufficiently capable for complex tactical reasoning). |

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                   CLIENT (React 19)                                   │
 │                                                                                       │
 │  ┌─────────────────────┐   ┌───────────────────────┐   ┌───────────────────────────┐  │
 │  │   Club Sync Modal   │   │ Tactical Director Tab │   │     3D Pitch Viewport     │  │
 │  │ ┌─────────────────┐ │   │ ┌───────────────────┐ │   │ ┌───────────────────────┐ │  │
 │  │ │ JSON Export Btn │ │   │ │ Model Selector    │ │   │ │ Three.js Canvas       │ │  │
 │  │ │ (Blob download) │ │   │ │ - gemini-4-argon  │ │   │ │ - PBR Turf & Lighting │ │  │
 │  │ └─────────────────┘ │   │ │ - gemini-3.8-flash│ │   │ │ - 11 Card Totems      │ │  │
 │  └──────────┬──────────┘   │ │ - 3.5-flash-lite  │ │   │ │ - Collapsible HUD     │ │  │
 │             │              │ └───────────────────┘ │   │ └───────────────────────┘ │  │
 │             ▼              │ ┌───────────────────┐ │   └───────────────────────────┘  │
 │   Browser Download Trigger │ │ Push-to-Talk Mic  │ │                                  │
 │   fc27_club_state.json     │ └───────────────────┘ │   ┌───────────────────────────┐  │
 │   (application/json)       └───────────┬───────────┘   │ Live Audio HUD            │  │
 │                                        │               │ - gemini-3.8-live session │  │
 └────────────────────────────────────────┼───────────────┴─────────────┬─────────────┘  │
                                          │                             │                │
                                          ▼                             ▼                │
 ┌────────────────────────────────────────────────────────────────────────────────────┐  │
 │                              SERVER PROXY (`server.ts`)                            │  │
 │                                                                                    │  │
 │   • POST /api/gemini/chat-stream  ──> GoogleGenAI SDK (modelRouter: argon/flash)   │  │
 │   • POST /api/gemini/transcribe   ──> gemini-3.5-transcribe                        │  │
 │   • WS   /live                    ──> ai.live.connect(model: "gemini-3.8-live")    │  │
 └────────────────────────────────────────────────────────────────────────────────────┘  │
                                          │                                              │
                                          ▼                                              │
 ┌────────────────────────────────────────────────────────────────────────────────────┐  │
 │                            PERSISTENCE & VERIFIED DATA                             │  │
 │   • Firestore Database: ai-studio-fc27utapp-2a7c5f08-d758-4a0e-bf87-d352fd259607  │  │
 │   • Local Storage Fallback & Offline JSON State                                    │  │
 └────────────────────────────────────────────────────────────────────────────────────┘  │
```

### Models Used & Specific Roles
1. **`gemini-4-argon`**: High-complexity tactical modeling (`ThinkingLevel.HIGH`), squad chemistry overhauls, and deep multi-variable SBC/Evolution cost-benefit solvers.
2. **`gemini-3.8-flash`**: General tactical queries, conversational chat feed, and live grounding via `googleSearch` for current Ultimate Scream Team 1 market values.
3. **`gemini-3.5-flash-lite`**: High-frequency, sub-300ms calculations (e.g. quick single-player chemistry deltas, immediate tax verifications).
4. **`gemini-3.5-transcribe`**: Unary and streaming speech-to-text for all push-to-talk mic buttons.
5. **`gemini-3.8-live`**: Bidirectional real-time voice streaming over WebSocket for the Live Audio HUD coach.

### Data Format for JSON Backup Export
```json
{
  "exportMetadata": {
    "app": "FC 27 UT App",
    "version": "1.0.0",
    "platform": "Xbox Series S",
    "timestamp": "2026-10-25T18:00:00.000Z"
  },
  "clubState": {
    "coins": 35000,
    "clubName": null,
    "fifaPoints": null,
    "rivalsDivision": null,
    "dailySp": null,
    "galleryLevel": null
  },
  "squad": {
    "formation": "4-2-1-3",
    "startingXI": [],
    "chemistryScore": 33
  },
  "inventory": {
    "ownedCatalogPlayers": [],
    "customPlayers": [],
    "duplicateStorage": []
  },
  "investmentPortfolio": []
}
```

---

## 5. Planned Execution Steps

1. **Install Dependencies**: Install `three` and `@types/three` using `install_applet_package`.
2. **Club Sync Modal JSON Export Feature**:
   - Implement `handleExportClubDataJson` in `App.tsx` / `ClubSyncModal`: create a formatted JSON string, generate a Blob with `type: 'application/json'`, trigger browser download with timestamped filename `fc27_club_state_<YYYYMMDD_HHMMSS>.json`, and show visual feedback.
   - Add the "Export Club Backup JSON" button to both the Launch Sync Modal and the standalone Club Sync view.
3. **Three.js 3D Pitch Component (`src/components/ThreePitchVisualizer.tsx`)**:
   - Build a procedural 3D soccer pitch with PBR turf, grass shear stripes, white pitch markings, and 4-corner floodlights.
   - Assemble 11 procedural card pedestals positioned according to the active formation (4-2-1-3), with illuminated Role++ beacons.
   - Add `RoomEnvironment` studio lighting, smooth damping controls (`OrbitControls` + lerping), software-WebGL fallback guards, and a collapsible bottom dock HUD.
   - Add a 3D Pitch toggle button to the `MY_SQUAD` view allowing seamless switching between the 2D tactical board and the 3D stadium view.
4. **AI Tactical Director Tab Prototype (`src/components/TacticalChatTab.tsx`)**:
   - Enhance the Tactical Command Tab with an explicit **Model Selector** (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`), tactical persona filters, and live token latency/routing telemetry.
   - Verify push-to-talk integration with `gemini-3.5-transcribe` and Live Audio HUD integration with `gemini-3.8-live`.
5. **Verification & Build Validation**:
   - Run `lint_applet` (`tsc --noEmit`) to verify strict type correctness.
   - Run `compile_applet` to confirm the production bundle compiles with 0 errors.
