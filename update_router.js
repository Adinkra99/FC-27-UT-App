import fs from 'fs';

const filePath = 'server.ts';
let code = fs.readFileSync(filePath, 'utf8');

const oldRouter = `interface ResolvedRouteDecision {
  model: 'gemini-3.1-flash-lite' | 'gemini-3.8-flash';
  tierLabel: string;
  useSearch: boolean;
  useHighThinking: boolean;
  routingReason: string;
  costBenchmarkSummary: string;
}

function resolveSmartModelRoute(
  queryText: string,
  overrideMode: string = 'AUTO',
  useSearchGroundingPref: boolean = true
): ResolvedRouteDecision {
  // EXPLICIT COST GUARDRAIL: Intercept any attempt to invoke gemini-4-argon or TIER_3_ARGON_HIGH
  if (
    overrideMode === 'TIER_3_ARGON_HIGH' ||
    overrideMode.includes('ARGON') ||
    overrideMode.includes('gemini-4')
  ) {
    return {
      model: 'gemini-3.8-flash',
      tierLabel: 'Cost Guardrail · Routed to gemini-3.8-flash (Argon 4 Blocked)',
      useSearch: useSearchGroundingPref,
      useHighThinking: false,
      routingReason:
        'Cost Guardrail Active: Gemini 4 Argon is explicitly forbidden to prevent high API token costs. Successfully routed to cost-efficient Gemini 3.8 Flash.',
      costBenchmarkSummary: 'Cost Protected · High-Efficiency Gemini 3.8 Flash',
    };
  }

  if (overrideMode === 'TIER_1_LITE') {
    return {
      model: 'gemini-3.1-flash-lite',
      tierLabel: 'Tier 1 · gemini-3.1-flash-lite (Manual Override)',
      useSearch: false,
      useHighThinking: false,
      routingReason:
        'Manual override to Tier 1 Ultra-Fast/Ultra-Cheap model (~150-300ms TTFT, lowest token cost).',
      costBenchmarkSummary: 'Lowest Cost (1x) · Sub-300ms Latency',
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

  // AUTO Mode: Use gemini-3.8-flash (with search if needed) or gemini-3.1-flash-lite
  const lower = queryText.toLowerCase();
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

  if (needsLiveWebVerification && useSearchGroundingPref) {
    return {
      model: 'gemini-3.8-flash',
      tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search (Auto-Routed)',
      useSearch: true,
      useHighThinking: false,
      routingReason:
        'Auto-routed to Tier 2 (Gemini 3.8 Flash + Google Search): Grounded live web verification needed.',
      costBenchmarkSummary: 'Cost Protected · Live Web Search Grounded',
    };
  }

  return {
    model: 'gemini-3.8-flash',
    tierLabel: 'Tier 2 · gemini-3.8-flash (Auto-Routed)',
    useSearch: false,
    useHighThinking: false,
    routingReason:
      'Auto-routed to Gemini 3.8 Flash for fast, cost-effective reasoning with zero high-cost model invocation.',
    costBenchmarkSummary: 'Cost Protected · Gemini 3.8 Flash',
  };
}`;

const newRouter = `interface ResolvedRouteDecision {
  model: 'gemini-3.5-flash-lite' | 'gemini-3.8-flash';
  tierLabel: string;
  useSearch: boolean;
  useHighThinking: boolean;
  routingReason: string;
  costBenchmarkSummary: string;
}

function resolveSmartModelRoute(
  queryText: string,
  overrideMode: string = 'AUTO',
  useSearchGroundingPref: boolean = true
): ResolvedRouteDecision {
  // EXPLICIT COST GUARDRAIL: Intercept any attempt to invoke gemini-4-argon or TIER_3_ARGON_HIGH
  if (
    overrideMode === 'TIER_3_ARGON_HIGH' ||
    overrideMode.includes('ARGON') ||
    overrideMode.includes('gemini-4')
  ) {
    return {
      model: 'gemini-3.8-flash',
      tierLabel: 'Cost Guardrail · Routed to gemini-3.8-flash (Argon 4 Blocked)',
      useSearch: useSearchGroundingPref,
      useHighThinking: false,
      routingReason:
        'Cost Guardrail Active: Gemini 4 Argon is explicitly forbidden for cost preservation. Successfully shifted to Gemini 3.8 Flash.',
      costBenchmarkSummary: 'Cost Protected · High-Efficiency Gemini 3.8 Flash',
    };
  }

  if (overrideMode === 'TIER_1_LITE') {
    return {
      model: 'gemini-3.5-flash-lite',
      tierLabel: 'Tier 1 · gemini-3.5-flash-lite (Manual Override)',
      useSearch: false,
      useHighThinking: false,
      routingReason:
        'Manual override to Tier 1 Ultra-Fast/Ultra-Cheap model (~150-280ms TTFT, lowest token cost).',
      costBenchmarkSummary: 'Lowest Cost (1x) · Sub-300ms Latency',
    };
  }

  if (overrideMode === 'TIER_2_FLASH_SEARCH') {
    return {
      model: 'gemini-3.8-flash',
      tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search (Manual Override)',
      useSearch: useSearchGroundingPref,
      useHighThinking: false,
      routingReason:
        'Manual override to Tier 2 Intelligence & Web Grounding model (~450-850ms TTFT, ~3x baseline cost).',
      costBenchmarkSummary: 'Low-Moderate Cost (3x) · Live Web Search Grounded',
    };
  }

  // AUTO ESCALATION MODE:
  // Default to gemini-3.5-flash-lite; shift to gemini-3.8-flash if higher intelligence or live web search is required
  const lower = queryText.toLowerCase();

  // Criteria for requiring higher intelligence (complex math, multi-constraint puzzles, deep tactical analysis)
  const requiresHighIntelligence =
    lower.includes('synthesize') ||
    lower.includes('synthesis') ||
    lower.includes('optimize') ||
    lower.includes('arbitrage') ||
    lower.includes('quad-action') ||
    lower.includes('evolution chain') ||
    lower.includes('branching') ||
    lower.includes('tactical breakdown') ||
    lower.includes('chemistry puzzle') ||
    lower.includes('121 rule') ||
    lower.includes('item score') ||
    lower.includes('acceleRATE') ||
    lower.includes('role++') ||
    queryText.length > 150;

  // Criteria for requiring live web grounding (real-time Xbox market, FUTBIN, FotMob, patch notes)
  const requiresWebGrounding =
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

  if (requiresWebGrounding && useSearchGroundingPref) {
    return {
      model: 'gemini-3.8-flash',
      tierLabel: 'Tier 2 · gemini-3.8-flash + Google Search (Shifted for Live Data)',
      useSearch: true,
      useHighThinking: false,
      routingReason:
        'Shifted to Gemini 3.8 Flash with Google Search: Real-time Xbox Series S / FUTBIN / FotMob data grounding required.',
      costBenchmarkSummary: 'High Intelligence · Live Web Grounded',
    };
  }

  if (requiresHighIntelligence) {
    return {
      model: 'gemini-3.8-flash',
      tierLabel: 'Tier 2 · gemini-3.8-flash (Shifted for Higher Intelligence)',
      useSearch: false,
      useHighThinking: false,
      routingReason:
        'Shifted to Gemini 3.8 Flash: High-complexity tactical calculation or multi-constraint reasoning detected.',
      costBenchmarkSummary: 'High Intelligence · Multi-Constraint Reasoning',
    };
  }

  // Baseline default for routine questions, lookups, and fast interactions
  return {
    model: 'gemini-3.5-flash-lite',
    tierLabel: 'Tier 1 · gemini-3.5-flash-lite (Default Fast Baseline)',
    useSearch: false,
    useHighThinking: false,
    routingReason:
      'Standard prompt handled by gemini-3.5-flash-lite for instant response and minimal token cost.',
    costBenchmarkSummary: 'Ultra-Low Cost (1x) · High Speed Baseline',
  };
}`;

const oldCRLF = oldRouter.replace(/\n/g, '\r\n');
const newCRLF = newRouter.replace(/\n/g, '\r\n');

if (code.includes(oldCRLF)) {
  code = code.replace(oldCRLF, newCRLF);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully updated router with Flash-Lite default and Flash escalation!');
} else if (code.includes(oldRouter)) {
  code = code.replace(oldRouter, newRouter);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully updated router (LF)!');
} else {
  console.error('Could not match oldRouter in server.ts');
}
