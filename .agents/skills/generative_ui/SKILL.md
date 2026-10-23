---
name: "generative_ui"
description: >
  Antigravity 2.25 Built-In Skill (C:\Users\Kit\.gemini\antigravity\builtin\skills\generative_ui\SKILL.md).
  Transforms natural-language prompts into dynamic, stateful, interactive Generative UI (GenUI)
  surfaces and micro-tools at T=0 instead of static text responses. Grounded for EA Sports FC 27
  Ultimate Team Console (MENUS & GAMEPLAY domains, British Time Europe/London T=0, 2026-27 Season).
---

# Antigravity 2.25 Built-In Skill: Generative UI (`generative_ui`)

**Host Path**: `C:\Users\Kit\.gemini\antigravity\builtin\skills\generative_ui\SKILL.md`  
**Orchestrator**: Google Antigravity 2.0 Desktop App (`v2.25` Jetski / OrionFire Core)  
**Temporal Anchor**: Dynamic $T = 0$ (`Europe/London` BST/GMT, `2026-27` Season)

---

## 1. Core Mandate: Interactive Micro-Tools Over Static Prose

Whenever a user query involves tunable parameters, multi-branch trade-offs, financial thresholds, or tactical comparisons, do **not** reply with a wall of static text. Instead, emit a structured **Generative UI (`GenUIPayload`)** specification that the client runtime mounts as a live, interactive component with sliders, segmented switches, and direct state-mutation callbacks.

## 2. Supported FC 27 Ultimate Team GenUI Widget Archetypes

1. **`SBC_SCORE_SIMULATOR` (Domain 1: MENUS)**
   - Renders an interactive **Streamlined SBC Item Score** builder with live sliders for **Duplicate Storage (`0 Coins`)**, **Regular Holographic ($\le 87$ OVR, `1.25x` Multiplier)**, and **Pristine Holographic ($\ge 88$ OVR, `1.50x` Multiplier)** cards.
   - Dynamically recalculates cumulative Item Score, Net Coins Spent, and Coins/Point efficiency as the user drags sliders.

2. **`ROLE_SYNTHESIS_COMPARATOR` (Domain 2: GAMEPLAY)**
   - Renders an interactive side-by-side **Additive Gameplay Synthesis** comparator for any 2026/27 verified players (e.g., **91 Rodri at FC Barcelona** vs. **91 Jude Bellingham at Real Madrid**) or **Branching Evolution (`Branch A` vs. `Branch B`)** pathways.
   - Includes interactive toggles for Chemistry Style, Chemistry Diamonds (`0/3`–`3/3`), **AcceleRATE 2.0** curve shifts, **PlayStyles+ (3 PS+ Hard Cap)**, and **31 Player Roles (`Role`, `Role+`, `Role++`)** under **Title Update `#3.1`**.

3. **`HOLO_ARBITRAGE_CALCULATOR` (Domain 1: MENUS — 5G Market)**
   - Renders an interactive **5G Mass-Bid & Gallery "Rent-and-Flip"** calculator with a live Bid Price slider, Target Sale Price slider, automatic **5% EA Transfer Tax** deduction, Quick Sell floor guard, and a 1-click **"Commit Flip to Ledger"** action button.

4. **`TACTICAL_PITCH_BOARD` (Domain 2: GAMEPLAY — FC IQ Tactics)**
   - Renders an interactive **FC IQ Formation & Role++ Pitch Matrix** (e.g., `4-2-1-3` or `4-4-2 Holding`) with an interactive Defensive Line Height slider (`1–100`), Build-Up Style selector, and clickable `Role++` nodes with instant **FC IQ Share Code** copy.

## 3. Strict Invariants Enforced by `generative_ui`

- **Temporal & Roster Grounding ($T = 0$)**: Every generated UI widget displays its exact `Europe/London` $T=0$ creation timestamp and enforces `2026-27` FotMob/FUTBIN Console roster truth (e.g., Rodri at FC Barcelona).
- **Zero Dead Controls**: Every slider, toggle, and button inside a generated widget is bound to deterministic `<2ms` state math or direct club/ledger actions.
- **Dual-Viewport Ergonomics**: All generated widgets adapt cleanly across the **Asus ZenBook UX482** primary display, **ScreenPad Plus (1920x515)** secondary touch strip, and mobile (`375px–430px`) viewports.
