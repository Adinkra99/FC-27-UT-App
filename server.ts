import 'dotenv/config';
import express from 'express';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Generates the exact T = 0 British Time (Europe/London) anchor & 2026-27 Season Truth
 * at the millisecond any server request is processed.
 */
function buildServerT0Context() {
  const now = new Date();
  const londonFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });

  const parts = londonFormatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const year = parseInt(map.year || '2026', 10);
  const month = parseInt(map.month || '10', 10);
  const seasonCode =
    month >= 8
      ? `${year}-${String(year + 1).slice(-2)} (1st Half of Season)`
      : month <= 5
      ? `${year - 1}-${String(year).slice(-2)} (2nd Half of Season)`
      : `${year}-${String(year + 1).slice(-2)} (Summer Transfer Window)`;

  const formattedUk = londonFormatter.format(now);

  return {
    t0Iso: now.toISOString(),
    formattedUk,
    seasonCode,
    consolePlatform: 'Xbox Series S (Console Cross-Play Market Only)',
    antigravityVersion: '2.25',
    fc27Patch: 'EA Sports FC 27 Title Update #3.1 / Live Tuning #4',
  };
}

function getCoreSystemInstruction(clientT0Override?: string) {
  const t0 = buildServerT0Context();
  return `You are the EA SPORTS FC 27 ULTIMATE TEAM STRATEGIC ENGINE (XBOX SERIES S CONSOLE EDITION), orchestrated via Google Antigravity 2.0 Desktop App (Firmware v${t0.antigravityVersion}) with the built-in generative_ui skill (C:\\Users\\Kit\\.gemini\\antigravity\\builtin\\skills\\generative_ui\\SKILL.md).

STRICT TEMPORAL, CONSOLE & ZERO-HALLUCINATION GROUNDING (T = 0):
1. Live British Time Anchor (Europe/London): ${clientT0Override || t0.formattedUk} (ISO: ${t0.t0Iso}).
2. Active Football Season: ${t0.seasonCode}. Daily Content Drop Anchor: 18:00 UK Time.
3. XBOX SERIES S CONSOLE MARKET ONLY: Only the Xbox Series S (Console Cross-Play) transfer market matters. NEVER use PC or Nintendo Switch prices.
4. ZERO-GUESSING PERSONAL CLUB LAW:
   - Never hallucinate, predict, or fill in gaps about the user's personal Ultimate Team (such as Gallery Level, cards they own, SBC Duplicate Storage, FIFA Points, Rivals Division, Daily SP, or Club Name).
   - If a personal club field is null, empty ([]), or marked "BLANK", treat it strictly as unknown/blank ("—"). Do NOT assume the user owns any card unless it is explicitly listed in their synced clubContext.
   - Respect the user's exact confirmed Xbox Series S Coin balance (currently 35,000 Coins unless updated by the user).
5. ANTI-AUTOREGRESSIVE TRANSFER & EDITION LAW (FC 27 ONLY):
   - Override historical pre-training frequency bias completely. Ground strictly in EA Sports FC 27 Ultimate Team (2026/27 season) verified via FotMob and FUTBIN FC 27 Console.
   - For example, in 2026/27, Rodri plays for FC Barcelona (LaLiga EA Sports, Spain), Kylian Mbappé plays for Real Madrid, etc.
   - NEVER reference or fall back to FC 24, FC 25, or FC 26 ratings, stats, or prices. If a datum cannot be verified for EA Sports FC 27 on Xbox Series S, leave it blank ("— [Unverified for FC 27 Xbox Series S]").

FC 27 CORE MECHANICS:
- Dual-Mode SBCs: Streamlined SBCs use cumulative "Item Score" (Base Bronze/Silver/Gold with no Common/Rare split; Regular Holographic <=87 = 1.25x Score; Pristine Holographic >=88 = 1.50x Score). Puzzle SBCs require 11 players and up to 33/33 chemistry.
- FUT Gallery: Permanent collection system (100+ Sets, Set Grades, Tag Bonuses). Cards stay registered even after being sold ("Rent-and-Flip" near Quick Sell floor minus 5% EA tax).
- Gameplay Synthesis & Branching Evolutions: Strictly enforce the 3 PlayStyles+ hard cap in FC 27, 31 Player Roles (Role, Role+, Role++), Chemistry Style boosts (0-3 diamonds), AcceleRATE 2.0 sprint curves, and Body Type responsiveness under ${t0.fc27Patch}.
- 5% EA Tax Enforcement: Net Sale = Sale Price * 0.95. Always state exact break-even sale price.

OUTPUT FORMAT:
- Executive Summary (1-2 crisp sentences).
- Tactical Solution / Math Breakdown (clean bulleted breakdown with tabular numbers, respecting 35,000 Coins and keeping unknown club fields blank).
- Direct Action Items (1, 2, 3...).
- Net Financials (Xbox Series S Coins spent, 5% EA tax accounted for).`;
}

/**
 * 5-Tier Smart Model Router Classifier
 * Factors in task complexity, required live web grounding, latency, benchmarks, and token cost.
 */
export type RoutingOverrideMode =
  | 'AUTO'
  | 'TIER_1_LITE'
  | 'TIER_2_FLASH_SEARCH'
  | 'TIER_3_ARGON_HIGH';

interface ResolvedRouteDecision {
  model: 'gemini-3.5-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon';
  tierLabel: string;
  useSearch: boolean;
  useHighThinking: boolean;
  routingReason: string;
  costBenchmarkSummary: string;
}

function resolveSmartModelRoute(
  queryText: string,
  overrideMode: RoutingOverrideMode = 'AUTO',
  useSearchGroundingPref: boolean = true
): ResolvedRouteDecision {
  if (overrideMode === 'TIER_1_LITE') {
    return {
      model: 'gemini-3.5-flash-lite',
      tierLabel: 'Tier 1 · gemini-3.5-flash-lite (Manual Override)',
      useSearch: false,
      useHighThinking: false,
      routingReason:
        'Manual override to Tier 1 Ultra-Fast/Ultra-Cheap model (~200-350ms TTFT, 1x baseline cost).',
      costBenchmarkSummary: 'Lowest Cost (1x) · Sub-350ms Latency',
    };
  }

  if (overrideMode === 'TIER_2_FLASH_SEARCH') {
    return {
      model: 'gemini-3.8-flash',
      tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search (Manual Override)',
      useSearch: useSearchGroundingPref,
      useHighThinking: false,
      routingReason:
        'Manual override to Tier 2 Live Web Grounding model (~450-950ms TTFT, ~3x baseline cost).',
      costBenchmarkSummary: 'Low-Moderate Cost (3x) · Live Web Search Grounded',
    };
  }

  if (overrideMode === 'TIER_3_ARGON_HIGH') {
    return {
      model: 'gemini-4-argon',
      tierLabel: 'Tier 3 · gemini-4-argon [ThinkingLevel.HIGH] (Manual Override)',
      useSearch: false,
      useHighThinking: true,
      routingReason:
        'Manual override to Tier 3 Frontier Multi-Constraint Reasoning (~2.5s-5.5s, 15x cost, top STEM/strategy benchmark).',
      costBenchmarkSummary: 'Premium Reasoning (15x) · ThinkingLevel.HIGH',
    };
  }

  // AUTO Mode: Classify query complexity, need for live T=0 search, vs multi-branch reasoning
  const lower = queryText.toLowerCase();

  const needsDeepMultiConstraintReasoning =
    lower.includes('branch a') ||
    lower.includes('branch b') ||
    lower.includes('evolution chain') ||
    lower.includes('synthesize') ||
    lower.includes('synthesis') ||
    lower.includes('optimize') ||
    lower.includes('quad-action') ||
    lower.includes('portfolio') ||
    lower.includes('arbitrage') ||
    queryText.length > 180;

  const needsLiveWebVerification =
    lower.includes('price') ||
    lower.includes('xbox') ||
    lower.includes('futbin') ||
    lower.includes('fotmob') ||
    lower.includes('transfer') ||
    lower.includes('18:00') ||
    lower.includes('drop') ||
    lower.includes('patch') ||
    lower.includes('title update') ||
    lower.includes('ultimate scream') ||
    lower.includes('scream') ||
    lower.includes('sbc') ||
    lower.includes('objective') ||
    lower.includes('verify') ||
    lower.includes('current') ||
    lower.includes('live');

  if (needsDeepMultiConstraintReasoning && !lower.includes('verify price only')) {
    return {
      model: 'gemini-4-argon',
      tierLabel: 'Tier 3 · gemini-4-argon (Auto-Routed · ThinkingLevel.HIGH)',
      useSearch: false,
      useHighThinking: true,
      routingReason:
        'Auto-routed to Tier 3 (Gemini 4 Argon HIGH): Multi-constraint tactical/financial optimization detected (35k Xbox Series S budget / Evolution branching / Role++ synthesis).',
      costBenchmarkSummary: 'Tier 3 Frontier Reasoning · ThinkingLevel.HIGH',
    };
  }

  if (needsLiveWebVerification && useSearchGroundingPref) {
    return {
      model: 'gemini-3.8-flash',
      tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search (Auto-Routed)',
      useSearch: true,
      useHighThinking: false,
      routingReason:
        'Auto-routed to Tier 2 (Gemini 3.8 Flash + Search): Live T=0 FC 27 Xbox Series S market/Ultimate Scream/SBC verification required.',
      costBenchmarkSummary: 'Tier 2 Balanced (~3x Cost) · Live Search Grounded',
    };
  }

  return {
    model: 'gemini-3.5-flash-lite',
    tierLabel: 'Tier 1 · gemini-3.5-flash-lite (Auto-Routed · Ultra-Fast)',
    useSearch: false,
    useHighThinking: false,
    routingReason:
      'Auto-routed to Tier 1 (Gemini 3.5 Flash Lite): Single-step FC 27 mechanics lookup or structured parsing. Delivers sub-350ms latency at ~1/15th the cost of Tier 3 Argon.',
    costBenchmarkSummary: 'Tier 1 Ultra-Low Cost (1x) · Sub-350ms Target',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Attach dynamic T=0 header to every API response
  app.use('/api', (_req, res, next) => {
    const t0 = buildServerT0Context();
    res.setHeader('X-FC27-T0-Anchor', t0.t0Iso);
    res.setHeader('X-Antigravity-Firmware', t0.antigravityVersion);
    res.setHeader('X-Console-Market', 'Xbox-Series-S');
    next();
  });

  /**
   * 1. Dynamic T=0 Firmware, Patch & Live FC 27 Xbox Series S Discovery Endpoint
   * Uses Tier 2 (gemini-3.8-flash + googleSearch) grounded at T=0.
   */
  app.post('/api/gemini/discover-t0-versions', async (req, res) => {
    const startMs = performance.now();
    try {
      const { clientT0, focusTopic } = req.body || {};
      const t0 = buildServerT0Context();
      const prompt = `At exact British Time T=0 (${clientT0 || t0.formattedUk}, Season: ${t0.seasonCode}):
Verify and summarize the current live state across our 4 pillars for ${focusTopic || 'EA Sports FC 27 Xbox Series S'}:
1. Google Antigravity 2.0 Desktop App Firmware (v2.25 capabilities including built-in generative_ui skill at C:\\Users\\Kit\\.gemini\\antigravity\\builtin\\skills\\generative_ui\\SKILL.md, /browser + Chrome DevTools MCP, /schedule cron hooks).
2. EA Sports FC 27 Xbox Series S Title Update #3.1 & Live Tuning #4 meta impact on 31 Roles++, PlayStyles+ (3 cap), and AcceleRATE 2.0.
3. FUTBIN FC 27 Console (Xbox Series S) 18:00 UK Content Drop, Holographic arbitrage (1.25x Regular <=87 / 1.50x Pristine >=88), and Streamlined SBCs under a 35,000 Coin budget.
4. FotMob 2026/27 Season verified squad transfers (e.g., Rodri at FC Barcelona). Never reference FC 24/25/26.`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: getCoreSystemInstruction(clientT0),
          tools: [{ googleSearch: {} }],
        },
      });

      const latencyMs = Math.round(performance.now() - startMs);
      res.json({
        text: response.text || 'T=0 Temporal Discovery completed.',
        t0Anchor: t0,
        routingTelemetry: {
          tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search',
          modelUsed: 'gemini-3.8-flash',
          latencyMs,
          routingReason:
            'Auto-routed to Tier 2 for live T=0 web verification of FC 27 Xbox Series S patch & firmware state.',
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/discover-t0-versions:', error);
      res.status(500).json({
        error: error?.message || 'Failed to run T=0 discovery.',
      });
    }
  });

  /**
   * 1b. Dedicated Game Mechanics & Patch Notes Tracker Endpoint
   * Uses gemini-3.8-flash with googleSearch tool to fetch the latest EA Sports FC 27
   * Title Updates and Live Tuning notes with special emphasis on gameplay mechanics:
   * passing accuracy, sprint speed, goalie behavior, AcceleRATE 2.0 sprint sustain, and Roles++.
   * Also extracts grounding metadata links per skill rules.
   */
  app.post('/api/gemini/fetch-patch-notes', async (req, res) => {
    const startMs = performance.now();
    try {
      const { clientT0, mechanicFocus } = req.body || {};
      const t0 = buildServerT0Context();
      const prompt = `At British Time T=0 (${clientT0 || t0.formattedUk}, Season: ${t0.seasonCode}):
Search and compile the latest EA Sports FC 27 Ultimate Team Title Update and Live Tuning Pitch Notes for Console (Xbox Series S / PS5).
Focus topic: ${mechanicFocus || 'all gameplay mechanics'}.

You must explicitly analyze and highlight changes to these critical gameplay mechanics:
1. Passing Accuracy & Ground Through Balls (pinged passes, vision curve, pass receiver lock-on, first-touch error).
2. Sprint Speed & AcceleRATE 2.0 (breakaway acceleration, sprint sustain, Controlled Lengthy vs. Explosive curve adjustments).
3. Goalie Behavior (1v1 reaction time, near-post shot stopping, cross-claiming radius, Sweeper Keeper++ responsiveness).
4. Defensive Recovery & Tackling (standing tackle stun time, jockey speed, Intercept+ animation speed).
5. 31 Roles & Focuses (Inside Forward++, Deep-Lying Playmaker++, Shadow Striker++ AI runs under Title Update #3.1).

Format your response cleanly:
- Title Update / Live Tuning version and effective date
- Executive Summary of the gameplay patch meta
- Detailed section for:
  * Passing Accuracy Changes
  * Sprint Speed & AcceleRATE 2.0 Changes
  * Goalie Behavior & Reactions
  * Defending & Player Roles Changes
- Competitive Pro Console (Xbox Series S) Takeaways`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: getCoreSystemInstruction(clientT0),
          tools: [{ googleSearch: {} }],
        },
      });

      const latencyMs = Math.round(performance.now() - startMs);
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { title: string; uri: string }[] = [];
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          if (c.web?.uri && c.web?.title) {
            sources.push({ title: c.web.title, uri: c.web.uri });
          }
        }
      }

      res.json({
        patchNotesText: response.text || 'No patch notes retrieved.',
        sources,
        t0Anchor: t0,
        routingTelemetry: {
          tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search Grounding',
          modelUsed: 'gemini-3.8-flash',
          latencyMs,
          routingReason:
            'Grounded live web search for EA Sports FC 27 Title Updates and mechanics tuning.',
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/fetch-patch-notes:', error);
      res.status(500).json({
        error: error?.message || 'Failed to fetch FC 27 patch notes.',
      });
    }
  });

  /**
   * 1c. Dynamic Live Evolutions Discovery & Scouter Endpoint (/api/gemini/fetch-live-evolutions)
   * Uses gemini-3.8-flash with googleSearch tool grounded at British Time T=0 to search
   * for currently active EA Sports FC 27 Ultimate Team Evolutions on Console (Xbox Series S),
   * evaluating Free vs. Paid (against user's 35,000 Coin budget), branching pathways,
   * 3 PlayStyles+ hard cap compliance, and 31 Roles++ additions.
   */
  app.post('/api/gemini/fetch-live-evolutions', async (req, res) => {
    const startMs = performance.now();
    try {
      const { clientT0, budgetCoins, categoryFilter } = req.body || {};
      const t0 = buildServerT0Context();
      const resolvedBudget = typeof budgetCoins === 'number' ? budgetCoins : 35000;

      const prompt = `At British Time T=0 (${clientT0 || t0.formattedUk}, Season: ${t0.seasonCode}, Content Drop Grounding 18:00 UK):
Search and compile all currently active EA SPORTS FC 27 ULTIMATE TEAM EVOLUTIONS on Console (Xbox Series S / PS5).
Focus Filter: ${categoryFilter || 'all active evolutions'}.
User Confirmed Budget: ${resolvedBudget.toLocaleString()} Xbox Series S Coins.

CRITICAL FC 27 CONSTRAINTS:
- Strictly ground in EA SPORTS FC 27 (2026/27 Season). Zero FC 24/25/26 data.
- Enforce FC 27's 3 PlayStyles+ (PS+) hard cap.
- Highlight 31 Roles++ granted (e.g. Inside Forward++, Holding++, Box-to-Box++, Falseback++, Attacking Wingback++, Shadow Striker++).
- Categorize each active Evolution:
  * Name and promotional theme (e.g. Titan Wingback, Midfield Catalyst, Inside Forward Unleashed, Power Surge, Centurions Striker, Box-to-Box Engine)
  * Cost: Free (0 Coins) vs Paid (Coins & FP) — explicitly mark whether it fits the user's ${resolvedBudget.toLocaleString()} Coin budget.
  * Time Remaining / Expiry relative to T=0.
  * Entry Eligibility (Max OVR, Position, Max Pace, Max PS+ <= 2).
  * Stat Upgrades & Added PlayStyles+.
  * Branching Choices: Branch A vs Branch B differences and tactical priorities.
  * Recommended tradeable base cards on Xbox Series S under ${resolvedBudget.toLocaleString()} coins (e.g., 83 Balde, 84 Camavinga, 83 Mainoo, 84 Wharton, 83 Tel) with chemistry links.

Format clearly with an Executive Evolution Summary, Per-Evolution Deep Dive with Branching Pathways, and Pro Console (Xbox Series S) 35k Action Plan.`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: getCoreSystemInstruction(clientT0),
          tools: [{ googleSearch: {} }],
        },
      });

      const latencyMs = Math.round(performance.now() - startMs);
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { title: string; uri: string }[] = [];
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          if (c.web?.uri && c.web?.title) {
            sources.push({ title: c.web.title, uri: c.web.uri });
          }
        }
      }

      res.json({
        evolutionsReportText: response.text || 'No live evolutions report generated.',
        sources,
        t0Anchor: t0,
        routingTelemetry: {
          tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search Grounding',
          modelUsed: 'gemini-3.8-flash',
          latencyMs,
          routingReason:
            'Grounded live search for active EA Sports FC 27 Ultimate Team Evolutions at T=0.',
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/fetch-live-evolutions:', error);
      res.status(500).json({
        error: error?.message || 'Failed to fetch live FC 27 evolutions.',
      });
    }
  });

  /**
   * 2. Live FC 27 Xbox Series S Card & Market Price Verification Gate
   * Verifies a specific player's FC 27 (2026/27) club, rating, and Xbox Series S price.
   * Leaves any unverified field strictly null/blank rather than guessing or using FC 24/25/26 data.
   */
  app.post('/api/gemini/verify-fc27-xbox', async (req, res) => {
    const startMs = performance.now();
    try {
      const { playerName, rarity, clientT0 } = req.body || {};
      if (!playerName) {
        res.status(400).json({ error: 'playerName is required for FC 27 Xbox Series S verification.' });
        return;
      }

      const prompt = `Verify player "${playerName}" (${rarity || 'Base/Special'}) strictly for EA SPORTS FC 27 ULTIMATE TEAM on the XBOX SERIES S (Console Cross-Play) Market during the 2026/27 football season at T=0 (${clientT0 || 'Now'}).
CRITICAL RULES:
- Do NOT use data from FC 24, FC 25, or FC 26.
- Do NOT use PC or Switch prices.
- Verify their 2026/27 club via FotMob (e.g., Rodri plays for FC Barcelona in 2026/27).
- If you cannot 100% verify their exact live Xbox Series S price or a specific stat for EA Sports FC 27, explicitly state "BLANK (Unverified for FC 27 Xbox Series S)" for that field rather than guessing.`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: getCoreSystemInstruction(clientT0),
          tools: [{ googleSearch: {} }],
        },
      });

      const latencyMs = Math.round(performance.now() - startMs);
      res.json({
        text: response.text || 'Verification check completed.',
        routingTelemetry: {
          tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search',
          modelUsed: 'gemini-3.8-flash',
          latencyMs,
          routingReason:
            'Auto-routed to Tier 2 (Gemini 3.8 Flash + Google Search) to verify live FC 27 Xbox Series S market & 2026/27 FotMob club data without legacy hallucination.',
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/verify-fc27-xbox:', error);
      res.status(500).json({
        error: error?.message || 'Failed to verify FC 27 Xbox Series S data.',
      });
    }
  });

  /**
   * 3. Smart-Routed Strategic Advisor (/api/gemini/high-thinking-advisor)
   * Respects the 5-Tier Smart Router (defaults to AUTO or honors manual override)
   * and enforces the Zero-Guessing Personal Club Policy (35,000 Coins confirmed; nulls stay blank).
   */
  app.post('/api/gemini/high-thinking-advisor', async (req, res) => {
    const startMs = performance.now();
    try {
      const {
        mode,
        taskType,
        query,
        userQuery,
        clubContext,
        clientT0,
        routingOverride,
      } = req.body || {};

      const resolvedMode = taskType || mode || 'STRATEGIC_ANALYSIS';
      const resolvedQuery =
        userQuery ||
        query ||
        'Provide an optimal FC 27 Xbox Series S tactical and financial action plan grounded at T=0.';

      const route = resolveSmartModelRoute(
        `${resolvedMode} ${resolvedQuery}`,
        routingOverride || 'AUTO',
        true
      );

      const fullPrompt = `[T=0 MODE: ${resolvedMode}]
[CONSOLE PLATFORM LOCK: XBOX SERIES S MARKET ONLY]
[USER PERSONAL CLUB CONTEXT (DO NOT GUESS OR FILL IN ANY NULL/EMPTY FIELDS!)]:
${JSON.stringify(clubContext || { coins: 35000, allOtherFields: 'BLANK' }, null, 2)}

[TACTICAL QUERY]:
${resolvedQuery}`;

      const config: Record<string, any> = {
        systemInstruction: getCoreSystemInstruction(clientT0),
      };

      if (route.useHighThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (route.useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: route.model,
        contents: fullPrompt,
        config,
      });

      const latencyMs = Math.round(performance.now() - startMs);
      res.json({
        text: response.text || 'Strategic analysis complete.',
        modelUsed: route.model,
        t0Anchor: buildServerT0Context(),
        routingTelemetry: {
          tierLabel: route.tierLabel,
          modelUsed: route.model,
          latencyMs,
          routingReason: route.routingReason,
          costBenchmarkSummary: route.costBenchmarkSummary,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/high-thinking-advisor:', error);
      res.status(500).json({
        error: error?.message || 'Strategic Advisor encountered an error.',
      });
    }
  });

  /**
   * 4. Multi-Turn Gemini Chatbot with 5-Tier Smart Model Router & Telemetry
   */
  app.post('/api/gemini/chat', async (req, res) => {
    const startMs = performance.now();
    try {
      const {
        messages,
        routingMode,
        selectedModel,
        useSearchGrounding,
        rolePersonaInstruction,
        clubContext,
        clientT0,
      } = req.body || {};

      const lastUserMessage = Array.isArray(messages) && messages.length > 0
        ? String(messages[messages.length - 1]?.text || '')
        : String(messages || '');

      // Support both new routingMode ('AUTO' | 'TIER_1_LITE' | 'TIER_2_FLASH_SEARCH' | 'TIER_3_ARGON_HIGH')
      // and direct model selection
      let effectiveOverride: RoutingOverrideMode = routingMode || 'AUTO';
      if (!routingMode && selectedModel) {
        if (selectedModel === 'gemini-3.5-flash-lite' || selectedModel === 'gemini-3.1-flash-lite')
          effectiveOverride = 'TIER_1_LITE';
        else if (selectedModel === 'gemini-3.8-flash') effectiveOverride = 'TIER_2_FLASH_SEARCH';
        else if (selectedModel === 'gemini-4-argon') effectiveOverride = 'TIER_3_ARGON_HIGH';
      }

      const route = resolveSmartModelRoute(
        lastUserMessage,
        effectiveOverride,
        useSearchGrounding !== false
      );

      const clubContextPrefix = clubContext
        ? `[USER XBOX SERIES S CLUB STATE (NEVER GUESS BLANK/NULL FIELDS): ${JSON.stringify(clubContext)}]\n\n`
        : '';

      const formattedContents = Array.isArray(messages)
        ? messages.map((m: { role: string; text: string }, idx: number) => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [
              {
                text:
                  idx === messages.length - 1 && m.role !== 'model'
                    ? `${clubContextPrefix}${m.text}`
                    : m.text,
              },
            ],
          }))
        : [{ role: 'user', parts: [{ text: `${clubContextPrefix}${lastUserMessage}` }] }];

      const baseSys = getCoreSystemInstruction(clientT0);
      const config: Record<string, any> = {
        systemInstruction: rolePersonaInstruction
          ? `${baseSys}\n\nACTIVE SPECIALIST ROLE PERSONA:\n${rolePersonaInstruction}`
          : baseSys,
      };

      if (route.useHighThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (route.useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: route.model,
        contents: formattedContents,
        config,
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { title: string; uri: string }[] = [];
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          if (c.web?.uri && c.web?.title) {
            sources.push({ title: c.web.title, uri: c.web.uri });
          }
        }
      }

      const latencyMs = Math.round(performance.now() - startMs);
      res.json({
        text: response.text || 'No response generated.',
        modelUsed: route.model,
        sources,
        t0Anchor: buildServerT0Context(),
        routingTelemetry: {
          tierLabel: route.tierLabel,
          modelUsed: route.model,
          latencyMs,
          routingReason: route.routingReason,
          costBenchmarkSummary: route.costBenchmarkSummary,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/chat:', error);
      res.status(500).json({
        error: error?.message || 'Chat request failed.',
      });
    }
  });

  /**
   * 4b. Intelligent Console Market Trend & Transfer Alert Endpoint (/api/gemini/market-analysis)
   * Analyzes Xbox Series S market trends, Ultimate Scream Team 1 price swings, and user investments.
   */
  app.post('/api/gemini/market-analysis', async (req, res) => {
    const startMs = performance.now();
    try {
      const { clientT0, userCoins, activeInvestments, analysisTier, clubContext } = req.body || {};
      const resolvedCoins = typeof userCoins === 'number' ? userCoins : 35000;
      const ai = getAiClient();

      let modelToUse: 'gemini-3.5-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon' =
        'gemini-3.8-flash';
      let tierLabel = 'Tier 2 · gemini-3.8-flash + Google Search';
      let routingReason =
        'Grounded live search for EA Sports FC 27 Ultimate Scream Team 1 & Xbox Series S fodder price swings.';
      const config: Record<string, any> = {
        systemInstruction: getCoreSystemInstruction(clientT0),
      };

      if (analysisTier === 'ARGON_DEEP') {
        modelToUse = 'gemini-4-argon';
        tierLabel = 'Tier 3 · gemini-4-argon (ThinkingLevel.HIGH)';
        routingReason =
          'Deep multi-constraint portfolio risk & exit window forecast with 5% EA Tax protection.';
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (analysisTier === 'LITE_FAST') {
        modelToUse = 'gemini-3.5-flash-lite';
        tierLabel = 'Tier 1 · gemini-3.5-flash-lite (Fast Check)';
        routingReason = 'Sub-350ms fast market & 5% EA tax audit.';
      } else {
        config.tools = [{ googleSearch: {} }];
      }

      const prompt = `At British Time T=0 (${clientT0 || 'October 2026 — Ultimate Scream Team 1'}):
Analyze the EA Sports FC 27 Ultimate Team XBOX SERIES S Console Market for a trader with ${resolvedCoins.toLocaleString()} liquid Coins.
User Logged Investments: ${JSON.stringify(activeInvestments || [])}
User Club Context: ${JSON.stringify(clubContext || { coins: resolvedCoins })}

Active Promo Context: Ultimate Scream Team 1 (90 Raphinha, 89 Cristiano Ronaldo, 89 Zola, 88 Szoboszlai, 88 Jaap Stam, 87 Palmer, 87 Fabinho, 87 Mandžukić, 86 Kondogbia, 86 Çalhanoğlu, 86 Vobian, 86 Tolisso, 86 Le Fée, 85 Alonso, 85 Chong, 85 Lukeba, 85 Flint, 85 El Mala, 83 Tverskov; Player SBCs: 85 Otamendi & 85 Bobby Moore; Free Objectives: 87 Jill Scott CB/CDM/CM & 87 Verón CM).

Provide:
1. Executive Market Trend Summary (how 18:00 UK supply and Ultimate Scream SBCs affect Xbox Series S prices today).
2. Top 3 Profitable Trading Opportunities under ${resolvedCoins.toLocaleString()} Coins (exact Xbox Series S buy price, target sell price, and net profit after 5% EA tax).
3. Actionable Transfer Alerts for any logged investments (BUY OPPORTUNITY, HOLD, TAKE PROFIT, or PANIC DROP WARNING).`;

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config,
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { title: string; uri: string }[] = [];
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          if (c.web?.uri && c.web?.title) {
            sources.push({ title: c.web.title, uri: c.web.uri });
          }
        }
      }

      const latencyMs = Math.round(performance.now() - startMs);
      res.json({
        marketSummary: response.text || 'Market trend scan complete.',
        sources,
        routingTelemetry: {
          tierLabel,
          modelUsed: modelToUse,
          latencyMs,
          routingReason,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/market-analysis:', error);
      res.status(500).json({
        error: error?.message || 'Market trend analysis failed.',
      });
    }
  });

  /**
   * 4c. Dynamic Live SBC & Objectives Ranking Endpoint (/api/gemini/fetch-live-sbcs)
   * Uses gemini-3.8-flash + googleSearch to rank the Top 5 Player SBCs vs Top 5 Upgrade SBCs & Live Objectives at T=0.
   */
  app.post('/api/gemini/fetch-live-sbcs', async (req, res) => {
    const startMs = performance.now();
    try {
      const { clientT0, userCoins, clubContext } = req.body || {};
      const resolvedCoins = typeof userCoins === 'number' ? userCoins : 35000;
      const ai = getAiClient();

      const prompt = `At British Time T=0 (${clientT0 || 'October 2026 — Ultimate Scream Team 1'}):
Search and rank the currently available EA Sports FC 27 Ultimate Team SBCs and Objectives on Xbox Series S for a player with ${resolvedCoins.toLocaleString()} Coins.
User Club Context: ${JSON.stringify(clubContext || { coins: resolvedCoins })}

Split your analysis into:
1. TOP 5 CURRENTLY AVAILABLE PLAYER SBCs (Ranked #1 to #5 by Worth-It Value Score, including 85 Nicolás Otamendi Ultimate Scream SBC, 85 Bobby Moore Ultimate Scream Icon SBC, etc. State exact Xbox Series S cost, time remaining, and whether to complete or skip).
2. TOP 5 CURRENTLY AVAILABLE UPGRADE SBCs (Ranked #1 to #5 by ROI & Duplicate Storage Fodder efficiency, including 81+ Player Pick, 83+ Double Upgrade, Party Bag Guarantee, etc.).
3. MUST-GRIND FREE OBJECTIVES (Highlighting 87 Jill Scott CB/CDM/CM Objective and 87 Juan Sebastián Verón CM Objective).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: getCoreSystemInstruction(clientT0),
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { title: string; uri: string }[] = [];
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          if (c.web?.uri && c.web?.title) {
            sources.push({ title: c.web.title, uri: c.web.uri });
          }
        }
      }

      const latencyMs = Math.round(performance.now() - startMs);
      res.json({
        sbcReportText: response.text || 'Live SBC & Objectives ranking completed.',
        sources,
        routingTelemetry: {
          tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search Grounding',
          modelUsed: 'gemini-3.8-flash',
          latencyMs,
          routingReason:
            'Grounded live check of Top 5 Player SBCs vs Top 5 Upgrade SBCs and Ultimate Scream Objectives at T=0.',
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/fetch-live-sbcs:', error);
      res.status(500).json({
        error: error?.message || 'Failed to fetch live SBC rankings.',
      });
    }
  });

  /**
   * 5. Antigravity v2.25 Built-In Generative UI Skill Endpoint (/api/gemini/generative-ui)
   * Host Skill: C:\Users\Kit\.gemini\antigravity\builtin\skills\generative_ui\SKILL.md
   * Emits structured interactive GenUI micro-tool specifications calibrated to the user's 35,000 Xbox Series S Coins.
   */
  app.post('/api/gemini/generative-ui', async (req, res) => {
    const startMs = performance.now();
    try {
      const { prompt, clubContext, clientT0 } = req.body || {};
      const ai = getAiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: `[ANTIGRAVITY v2.25 GENERATIVE_UI SKILL INVOCATION]
Skill Path: C:\\Users\\Kit\\.gemini\\antigravity\\builtin\\skills\\generative_ui\\SKILL.md
User Xbox Series S Club Context (DO NOT GUESS BLANK/NULL FIELDS): ${JSON.stringify(
          clubContext || { coins: 35000 }
        )}
User Prompt: ${
          prompt ||
          'Generate an interactive Xbox Series S 35,000 Coin Holographic Arbitrage & Streamlined SBC micro-tool.'
        }`,
        config: {
          systemInstruction: getCoreSystemInstruction(clientT0),
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              widgetType: {
                type: Type.STRING,
                enum: [
                  'SBC_SCORE_SIMULATOR',
                  'HOLO_ARBITRAGE_CALCULATOR',
                  'ROLE_SYNTHESIS_COMPARATOR',
                  'TACTICAL_PITCH_BOARD',
                ],
              },
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              executiveSummary: { type: Type.STRING },
              defaultTargetScore: { type: Type.INTEGER },
              recommendedBuyPriceXbox: { type: Type.INTEGER },
              recommendedSellPriceXbox: { type: Type.INTEGER },
              featuredPlayerName: { type: Type.STRING },
              featuredPlayerClub2627: { type: Type.STRING },
              featuredRolePlusPlus: { type: Type.STRING },
              actionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'widgetType',
              'title',
              'subtitle',
              'executiveSummary',
              'defaultTargetScore',
              'recommendedBuyPriceXbox',
              'recommendedSellPriceXbox',
              'featuredPlayerName',
              'featuredPlayerClub2627',
              'featuredRolePlusPlus',
              'actionItems',
            ],
          },
        },
      });

      const latencyMs = Math.round(performance.now() - startMs);
      let parsedWidget = null;
      try {
        parsedWidget = JSON.parse(response.text || '{}');
      } catch {
        parsedWidget = null;
      }

      res.json({
        widget: parsedWidget,
        rawText: response.text,
        routingTelemetry: {
          tierLabel: 'Tier 3 · gemini-4-argon (Generative UI Skill · Thinking HIGH)',
          modelUsed: 'gemini-4-argon',
          latencyMs,
          routingReason:
            'Routed to Tier 3 (Gemini 4 Argon + JSON Schema) to synthesize an interactive Antigravity v2.25 generative_ui widget.',
          costBenchmarkSummary: 'Tier 3 Structured GenUI Synthesis',
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/generative-ui:', error);
      res.status(500).json({
        error: error?.message || 'Generative UI synthesis failed.',
      });
    }
  });

  /**
   * 6. Hands-Free Controller Voice Transcription Endpoint (gemini-3.5-transcribe)
   */
  app.post('/api/gemini/transcribe', async (req, res) => {
    const startMs = performance.now();
    try {
      const { audioBase64, mimeType } = req.body || {};
      if (!audioBase64) {
        res.status(400).json({ error: 'Missing audioBase64 payload.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe this EA Sports FC 27 Ultimate Team (Xbox Series S) voice command or club update accurately.',
            },
          ],
        },
      });

      const latencyMs = Math.round(performance.now() - startMs);
      res.json({
        transcript: response.text || '',
        t0Anchor: buildServerT0Context(),
        routingTelemetry: {
          tierLabel: 'Audio Tier · gemini-3.5-transcribe',
          modelUsed: 'gemini-3.5-transcribe',
          latencyMs,
          routingReason: 'Dedicated speech-to-text model for hands-free Xbox controller voice dictation.',
        },
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/transcribe:', error);
      res.status(500).json({
        error: error?.message || 'Voice transcription failed.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = createHttpServer(app);

  // 7. Real-Time Voice Conversation Bridge via Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  wss.on('connection', async (clientWs) => {
    let sessionPromise: Promise<any> | null = null;
    try {
      const ai = getAiClient();
      sessionPromise = ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: getCoreSystemInstruction(),
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                if (part.inlineData?.data && clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                }
                if (part.text && clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ transcript: `AI: ${part.text}` }));
                }
              }
            }
            if (message.serverContent?.interrupted && clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (err: any) => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(
                JSON.stringify({ error: err?.message || 'Gemini Live stream error.' })
              );
            }
          },
        },
      });

      clientWs.on('message', (rawData) => {
        if (!sessionPromise) return;
        sessionPromise
          .then((session) => {
            try {
              const parsed = JSON.parse(rawData.toString());
              if (parsed.audio) {
                session.sendRealtimeInput({
                  audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
                });
              } else if (parsed.text) {
                session.sendRealtimeInput({
                  text: parsed.text,
                });
              }
            } catch (e) {
              console.error('Error forwarding message to Live session:', e);
            }
          })
          .catch((e) => {
            console.error('Live session connection error:', e);
          });
      });

      clientWs.on('close', () => {
        if (sessionPromise) {
          sessionPromise
            .then((session) => {
              try {
                session.close();
              } catch {
                // ignore
              }
            })
            .catch(() => {});
        }
      });
    } catch (err: any) {
      console.error('Failed to initialize gemini-3.8-live session:', err);
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ error: err?.message || 'Live API failed to connect.' }));
      }
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`FC 27 UT App (Xbox Series S Console Edition) listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
