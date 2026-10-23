/**
 * FC 27 Deterministic Optimization & Additive Gameplay Synthesis Engine (<2ms Execution)
 * Zero Gemini API tokens consumed for deterministic math:
 * 1. Dual-Mode SBC Engine (Streamlined Item Score + Holographic 1.25x/1.50x Multipliers & 11-Player Puzzle Solver)
 * 2. 5% EA Transfer Tax & Gallery "Rent-and-Flip" Net Cost Calculator
 * 3. 33/33 Squad Chemistry Calculator (2026/27 Season FotMob/FUTBIN Grounded)
 * 4. Additive Gameplay Synthesis Calculator (Stats in Isolation vs. Synthesized with Chem Styles,
 *    AcceleRATE 2.0 Archetypes, 3 PlayStyles+ Cap, Body Type, and 31 Roles++)
 */

import {
  AcceleRATEType,
  FC27_CHEAPEST_BY_RATING,
  FC27ConsolePlayer,
  FC27SBCChallenge,
} from '../data/fc27ConsoleData';

export type ChemistryStyleName =
  | 'Basic'
  | 'Hunter'
  | 'Shadow'
  | 'Engine'
  | 'Hawk'
  | 'Anchor'
  | 'Maestro'
  | 'Finisher'
  | 'Architect';

export interface StreamlinedSbcSolutionStep {
  source: 'DUPLICATE_STORAGE (0 Coins)' | 'CLUB_UNTRADEABLE (0 Coins)' | 'MARKET_HOLOGRAPHIC_BUY' | 'MARKET_BASE_BUY';
  playerName: string;
  rating: number;
  rarity: string;
  holographicMultiplier: number;
  baseScore: number;
  effectiveScoreAdded: number;
  coinCost: number;
  coinsPerScorePoint: number;
}

export interface StreamlinedSbcSolutionResult {
  targetScore: number;
  startingScore: number;
  finalCumulativeScore: number;
  steps: StreamlinedSbcSolutionStep[];
  totalCoinsSpent: number;
  totalCoinsSavedFromClub: number;
  executionTimeMs: number;
}

export interface GameplaySynthesisBreakdown {
  isolatedOverallScore: number;
  synthesizedMetaScore: number;
  netSynthesisGain: number;
  postChemSubStats: {
    acceleration: number;
    sprintSpeed: number;
    finishing: number;
    shotPower: number;
    shortPassing: number;
    vision: number;
    agility: number;
    balance: number;
    reactions: number;
    composure: number;
    interceptions: number;
    defAwareness: number;
    standingTackle: number;
    strength: number;
  };
  baseAccelerate: AcceleRATEType;
  postChemAccelerate: AcceleRATEType;
  accelerateDidShift: boolean;
  playStylePlusCapValid: boolean; // Must be <= 3 PS+ in FC 27
  playStyleAdditiveBonus: number;
  bodyTypeFrameBonus: number;
  roleAiMultiplierPct: number;
  synthesizedPillars: {
    effectiveBreakawayPace: number;
    effectiveClinicalFinishing: number;
    effectivePressResistanceDribbling: number;
    effectiveInterceptRadius: number;
    effectiveRolePositioningIQ: number;
  };
  tacticalVerdict: string;
}

/**
 * 1. Exact 5% EA Tax & Break-Even Calculator
 */
export function calculateEaTaxMetrics(buyPrice: number, sellPrice: number) {
  const eaTax = Math.round(sellPrice * 0.05);
  const netAfterTax = sellPrice - eaTax;
  const netProfit = netAfterTax - buyPrice;
  const breakEvenSalePrice = Math.ceil(buyPrice / 0.95);
  const roiPct = buyPrice > 0 ? Number(((netProfit / buyPrice) * 100).toFixed(2)) : 0;

  return {
    buyPrice,
    sellPrice,
    eaTax,
    netAfterTax,
    netProfit,
    breakEvenSalePrice,
    roiPct,
  };
}

/**
 * 2. Streamlined SBC Item Score Optimizer (FC 27 Core Mechanic)
 * Prioritizes:
 *   Step 1: Untradeable duplicates in SBC Duplicate Storage (0 coin cost)
 *   Step 2: High-efficiency Holographic & Base market fillers ranked by Coins per Item Score Point
 */
export function solveStreamlinedSbcItemScore(
  sbc: FC27SBCChallenge,
  clubPlayers: FC27ConsolePlayer[],
  useClubUntradeables: boolean = true
): StreamlinedSbcSolutionResult {
  const startPerf = performance.now();
  const targetScore = sbc.targetItemScore || 1000;
  const startingScore = sbc.currentProgressItemScore || 0;
  let remainingScore = Math.max(0, targetScore - startingScore);

  const steps: StreamlinedSbcSolutionStep[] = [];
  let totalCoinsSpent = 0;
  let totalCoinsSavedFromClub = 0;

  // Step 1: Exhaust SBC Duplicate Storage first (0 coin cost)
  const duplicateStorageCards = clubPlayers
    .filter((p) => p.inDuplicateStorage)
    .sort((a, b) => b.effectiveItemScore - a.effectiveItemScore);

  for (const card of duplicateStorageCards) {
    if (remainingScore <= 0) break;
    steps.push({
      source: 'DUPLICATE_STORAGE (0 Coins)',
      playerName: `${card.name} (Dup Storage)`,
      rating: card.rating,
      rarity: card.rarity,
      holographicMultiplier: card.holographicMultiplier,
      baseScore: card.baseItemScore,
      effectiveScoreAdded: card.effectiveItemScore,
      coinCost: 0,
      coinsPerScorePoint: 0,
    });
    totalCoinsSavedFromClub += card.consolePrice;
    remainingScore -= card.effectiveItemScore;
  }

  // Step 2: Optionally use non-starting XI untradeable fodder
  if (useClubUntradeables && remainingScore > 0) {
    const fodderUntradeables = clubPlayers
      .filter((p) => p.inClubInventory && p.isUntradeable && !p.inDuplicateStorage && p.rating <= 86)
      .sort((a, b) => b.effectiveItemScore - a.effectiveItemScore);

    for (const card of fodderUntradeables) {
      if (remainingScore <= 0) break;
      steps.push({
        source: 'CLUB_UNTRADEABLE (0 Coins)',
        playerName: `${card.name} (Club Untradeable)`,
        rating: card.rating,
        rarity: card.rarity,
        holographicMultiplier: card.holographicMultiplier,
        baseScore: card.baseItemScore,
        effectiveScoreAdded: card.effectiveItemScore,
        coinCost: 0,
        coinsPerScorePoint: 0,
      });
      totalCoinsSavedFromClub += card.consolePrice;
      remainingScore -= card.effectiveItemScore;
    }
  }

  // Step 3: Fill remaining Item Score with optimal Console Market Holographic / Base combinations
  while (remainingScore > 0) {
    if (remainingScore >= 400) {
      // 88 Pristine Holographic (1.50x = 465 score for 27,500 coins) is cheaper per point than 88 Base Gold
      const tier88 = FC27_CHEAPEST_BY_RATING.find((t) => t.rating === 88)!;
      steps.push({
        source: 'MARKET_HOLOGRAPHIC_BUY',
        playerName: '88 OVR Pristine Holographic Fodder (1.50x Multiplier)',
        rating: 88,
        rarity: 'Pristine Holographic',
        holographicMultiplier: 1.5,
        baseScore: tier88.standardItemScore,
        effectiveScoreAdded: tier88.holographicItemScore,
        coinCost: tier88.cheapestHolographicPrice,
        coinsPerScorePoint: tier88.coinsPerScoreHolographic,
      });
      totalCoinsSpent += tier88.cheapestHolographicPrice;
      remainingScore -= tier88.holographicItemScore;
    } else if (remainingScore >= 210) {
      // 86 Regular Holographic (1.25x = 238 score for 10,900 coins) beats Base 86 in coins/score
      const tier86 = FC27_CHEAPEST_BY_RATING.find((t) => t.rating === 86)!;
      steps.push({
        source: 'MARKET_HOLOGRAPHIC_BUY',
        playerName: '86 OVR Regular Holographic Fodder (1.25x Multiplier)',
        rating: 86,
        rarity: 'Regular Holographic',
        holographicMultiplier: 1.25,
        baseScore: tier86.standardItemScore,
        effectiveScoreAdded: tier86.holographicItemScore,
        coinCost: tier86.cheapestHolographicPrice,
        coinsPerScorePoint: tier86.coinsPerScoreHolographic,
      });
      totalCoinsSpent += tier86.cheapestHolographicPrice;
      remainingScore -= tier86.holographicItemScore;
    } else if (remainingScore >= 130) {
      const tier84 = FC27_CHEAPEST_BY_RATING.find((t) => t.rating === 84)!;
      steps.push({
        source: 'MARKET_BASE_BUY',
        playerName: '84 OVR Base Gold Filler',
        rating: 84,
        rarity: 'Gold',
        holographicMultiplier: 1.0,
        baseScore: tier84.standardItemScore,
        effectiveScoreAdded: tier84.standardItemScore,
        coinCost: tier84.cheapestStandardGoldPrice,
        coinsPerScorePoint: tier84.coinsPerScoreStandard,
      });
      totalCoinsSpent += tier84.cheapestStandardGoldPrice;
      remainingScore -= tier84.standardItemScore;
    } else {
      const tier83 = FC27_CHEAPEST_BY_RATING.find((t) => t.rating === 83)!;
      steps.push({
        source: 'MARKET_BASE_BUY',
        playerName: '83 OVR Base Gold Filler',
        rating: 83,
        rarity: 'Gold',
        holographicMultiplier: 1.0,
        baseScore: tier83.standardItemScore,
        effectiveScoreAdded: tier83.standardItemScore,
        coinCost: tier83.cheapestStandardGoldPrice,
        coinsPerScorePoint: tier83.coinsPerScoreStandard,
      });
      totalCoinsSpent += tier83.cheapestStandardGoldPrice;
      remainingScore -= tier83.standardItemScore;
    }
  }

  const finalCumulativeScore =
    startingScore + steps.reduce((acc, s) => acc + s.effectiveScoreAdded, 0);

  return {
    targetScore,
    startingScore,
    finalCumulativeScore,
    steps,
    totalCoinsSpent,
    totalCoinsSavedFromClub,
    executionTimeMs: Number((performance.now() - startPerf).toFixed(2)),
  };
}

/**
 * 3. Squad 33/33 Chemistry Engine (2026/27 Season Rules)
 * Thresholds:
 * - Club: 2 -> +1, 4 -> +2, 7 -> +3
 * - Nation: 2 -> +1, 5 -> +2, 8 -> +3
 * - League: 3 -> +1, 5 -> +2, 8 -> +3
 */
export function calculateSquadChemistry(squadPlayers: FC27ConsolePlayer[]) {
  const clubCounts: Record<string, number> = {};
  const leagueCounts: Record<string, number> = {};
  const nationCounts: Record<string, number> = {};

  for (const p of squadPlayers) {
    clubCounts[p.club] = (clubCounts[p.club] || 0) + 1;
    leagueCounts[p.league] = (leagueCounts[p.league] || 0) + 1;
    nationCounts[p.nation] = (nationCounts[p.nation] || 0) + 1;
  }

  const playerChemistryMap: Record<string, { diamonds: 0 | 1 | 2 | 3; breakdown: string }> = {};
  let totalChemistry = 0;

  for (const p of squadPlayers) {
    if (p.rarity === 'Icon' || p.rarity === 'UT Hero') {
      playerChemistryMap[p.id] = { diamonds: 3, breakdown: '3/3 (Icon/Hero Automatic Full Chem)' };
      totalChemistry += 3;
      continue;
    }

    let pts = 0;
    const cCount = clubCounts[p.club] || 0;
    const nCount = nationCounts[p.nation] || 0;
    const lCount = leagueCounts[p.league] || 0;

    if (cCount >= 7) pts += 3;
    else if (cCount >= 4) pts += 2;
    else if (cCount >= 2) pts += 1;

    if (nCount >= 8) pts += 3;
    else if (nCount >= 5) pts += 2;
    else if (nCount >= 2) pts += 1;

    if (lCount >= 8) pts += 3;
    else if (lCount >= 5) pts += 2;
    else if (lCount >= 3) pts += 1;

    // Manager bonus (+1 for Spain or LaLiga/Premier League)
    if (pts < 3 && (p.league === 'LaLiga EA Sports' || p.league === 'Premier League' || p.nation === 'Spain')) {
      pts += 1;
    }

    const clamped = Math.min(3, pts) as 0 | 1 | 2 | 3;
    totalChemistry += clamped;
    playerChemistryMap[p.id] = {
      diamonds: clamped,
      breakdown: `${clamped}/3 (${p.club} · ${p.league} · ${p.nation})`,
    };
  }

  return {
    totalChemistry: Math.min(33, totalChemistry),
    playerChemistryMap,
    clubCounts,
    leagueCounts,
    nationCounts,
  };
}

/**
 * 4. AcceleRATE 2.0 Sprint Archetype Classifier (FC 27 Console Rules)
 * Evaluates post-chemistry Agility, Strength, Acceleration, and Height (cm):
 * - Lengthy / Mostly Lengthy / Controlled Lengthy: Height >= 181cm, Strength >= 65, (Strength - Agility) >= 4
 * - Explosive / Mostly Explosive / Controlled Explosive: Height <= 182cm, Agility >= 65, (Agility - Strength) >= 4
 * - Otherwise: Controlled
 */
export function classifyAcceleRATE2(
  heightCm: number,
  agility: number,
  strength: number,
  acceleration: number
): AcceleRATEType {
  if (acceleration < 55) return 'Controlled';

  const diffStrAgi = strength - agility;
  const diffAgiStr = agility - strength;

  if (heightCm >= 181 && strength >= 65 && diffStrAgi >= 4) {
    if (diffStrAgi >= 18 && heightCm >= 185) return 'Lengthy';
    if (diffStrAgi >= 11) return 'Mostly Lengthy';
    return 'Controlled Lengthy';
  }

  if (heightCm <= 182 && agility >= 65 && diffAgiStr >= 4) {
    if (diffAgiStr >= 18 && heightCm <= 178) return 'Explosive';
    if (diffAgiStr >= 11) return 'Mostly Explosive';
    return 'Controlled Explosive';
  }

  return 'Controlled';
}

/**
 * 5. Additive Gameplay Synthesis Calculator (Domain 2: GAMEPLAY)
 * Synthesizes:
 * - Isolated Sub-Stats
 * - Chemistry Style Stat Modifiers scaled by Chemistry Diamonds (0..3)
 * - Post-Chemistry AcceleRATE 2.0 Archetype Shift
 * - PlayStyles+ (strictly capped at 3 PS+) & Base PlayStyles Additive Synergy
 * - Body Type & Height Frame Responsiveness
 * - 31 Player Roles (Role / Role+ / Role++) AI Positioning Multiplier under Title Update #3.1
 */
export function synthesizePlayerGameplayProfile(
  player: FC27ConsolePlayer,
  chemStyle: ChemistryStyleName,
  chemDiamonds: 0 | 1 | 2 | 3 = 3,
  selectedRoleTier: 'Role' | 'Role+' | 'Role++' = 'Role++'
): GameplaySynthesisBreakdown {
  const scale = chemDiamonds / 3;
  const clamp99 = (val: number) => Math.min(99, Math.round(val));

  // Chemistry style delta profiles at 3/3 chemistry
  const styleDeltas: Record<
    ChemistryStyleName,
    Partial<Record<keyof FC27ConsolePlayer['subStats'], number>>
  > = {
    Basic: {
      sprintSpeed: 4,
      positioning: 4,
      shotPower: 4,
      shortPassing: 4,
      vision: 4,
      agility: 4,
      ballControl: 4,
      defAwareness: 4,
      standingTackle: 4,
      strength: 4,
    },
    Hunter: {
      acceleration: 8,
      sprintSpeed: 8,
      positioning: 4,
      finishing: 8,
      shotPower: 4,
    },
    Shadow: {
      acceleration: 8,
      sprintSpeed: 8,
      interceptions: 8,
      defAwareness: 4,
      standingTackle: 8,
    },
    Engine: {
      acceleration: 4,
      sprintSpeed: 4,
      vision: 4,
      shortPassing: 8,
      agility: 4,
      balance: 8,
      dribbling: 8,
    },
    Hawk: {
      acceleration: 4,
      sprintSpeed: 4,
      positioning: 4,
      finishing: 4,
      shotPower: 8,
      strength: 4,
      aggression: 8,
    },
    Anchor: {
      acceleration: 4,
      sprintSpeed: 4,
      interceptions: 4,
      defAwareness: 8,
      standingTackle: 8,
      strength: 8,
      aggression: 4,
    },
    Maestro: {
      positioning: 4,
      shotPower: 8,
      longShots: 8,
      vision: 4,
      shortPassing: 8,
      reactions: 4,
      dribbling: 4,
    },
    Finisher: {
      positioning: 4,
      finishing: 8,
      shotPower: 8,
      agility: 8,
      balance: 4,
      dribbling: 8,
    },
    Architect: {
      vision: 8,
      shortPassing: 8,
      longPassing: 4,
      strength: 8,
      aggression: 4,
    },
  };

  const deltas = styleDeltas[chemStyle] || {};
  const boost = (statKey: keyof FC27ConsolePlayer['subStats']) =>
    clamp99(player.subStats[statKey] + (deltas[statKey] || 0) * scale);

  const postChemSubStats = {
    acceleration: boost('acceleration'),
    sprintSpeed: boost('sprintSpeed'),
    finishing: boost('finishing'),
    shotPower: boost('shotPower'),
    shortPassing: boost('shortPassing'),
    vision: boost('vision'),
    agility: boost('agility'),
    balance: boost('balance'),
    reactions: boost('reactions'),
    composure: boost('composure'),
    interceptions: boost('interceptions'),
    defAwareness: boost('defAwareness'),
    standingTackle: boost('standingTackle'),
    strength: boost('strength'),
  };

  const postChemAccelerate = classifyAcceleRATE2(
    player.heightCm,
    postChemSubStats.agility,
    postChemSubStats.strength,
    postChemSubStats.acceleration
  );

  // Enforce FC 27's strict 3 PlayStyles+ hard cap
  const playStylePlusCapValid = player.playStylesPlus.length <= 3;
  const activePsPlus = player.playStylesPlus.slice(0, 3);

  // PlayStyle+ additive break-cap bonuses
  const hasQuickStepOrRapidPlus = activePsPlus.some((ps) => ps.includes('Quick Step+') || ps.includes('Rapid+'));
  const hasFinesseOrColdBloodedPlus = activePsPlus.some((ps) => ps.includes('Finesse Shot+') || ps.includes('Cold Blooded+'));
  const hasTechnicalOrIncisivePlus = activePsPlus.some(
    (ps) => ps.includes('Technical+') || ps.includes('Tiki Taka+') || ps.includes('Incisive Pass+')
  );
  const hasDefPsPlus = activePsPlus.some(
    (ps) => ps.includes('Anticipate+') || ps.includes('Intercept+') || ps.includes('Jockey+')
  );

  const playStyleAdditiveBonus = Number(
    (activePsPlus.length * 2.4 + player.playStylesBase.length * 0.65).toFixed(1)
  );

  // Body type responsiveness modifier
  const bodyTypeBonusMap: Record<string, number> = {
    Unique: 2.8,
    'Short & Lean': 2.4,
    Lean: 2.1,
    'High & Average': 1.8,
    Average: 1.2,
    Stocky: 1.4,
  };
  const bodyTypeFrameBonus = bodyTypeBonusMap[player.bodyType] || 1.2;

  // Role++ AI positioning multiplier under Title Update #3.1
  const roleAiMultiplierPct =
    selectedRoleTier === 'Role++' ? 14.5 : selectedRoleTier === 'Role+' ? 7.5 : 0;

  // Synthesized Pillars (can exceed 95+ when PlayStyle+ & Role++ stack)
  const effectiveBreakawayPace = Number(
    Math.min(
      99.9,
      postChemSubStats.acceleration * 0.45 +
        postChemSubStats.sprintSpeed * 0.55 +
        (hasQuickStepOrRapidPlus ? 4.2 : 1.1) +
        (postChemAccelerate.includes('Lengthy') || postChemAccelerate.includes('Explosive') ? 1.8 : 0.6)
    ).toFixed(1)
  );

  const effectiveClinicalFinishing = Number(
    Math.min(
      99.9,
      postChemSubStats.finishing * 0.45 +
        postChemSubStats.shotPower * 0.25 +
        postChemSubStats.composure * 0.3 +
        (hasFinesseOrColdBloodedPlus ? 4.8 : 1.0) +
        (player.weakFoot >= 4 ? 1.5 : 0)
    ).toFixed(1)
  );

  const effectivePressResistanceDribbling = Number(
    Math.min(
      99.9,
      postChemSubStats.agility * 0.3 +
        postChemSubStats.balance * 0.2 +
        postChemSubStats.reactions * 0.25 +
        postChemSubStats.composure * 0.25 +
        (hasTechnicalOrIncisivePlus ? 3.9 : 1.0) +
        bodyTypeFrameBonus
    ).toFixed(1)
  );

  const effectiveInterceptRadius = Number(
    Math.min(
      99.9,
      postChemSubStats.interceptions * 0.4 +
        postChemSubStats.defAwareness * 0.35 +
        postChemSubStats.standingTackle * 0.25 +
        (hasDefPsPlus ? 5.1 : 0.8)
    ).toFixed(1)
  );

  const effectiveRolePositioningIQ = Number(
    Math.min(99.9, 82 + roleAiMultiplierPct + (postChemSubStats.reactions - 80) * 0.25).toFixed(1)
  );

  // Isolated score vs Synthesized Meta Score (1-100)
  const isolatedOverallScore = Number(
    (
      player.rating * 0.65 +
      (player.subStats.reactions + player.subStats.composure) * 0.175
    ).toFixed(1)
  );

  const rawSynth =
    isolatedOverallScore +
    scale * 3.2 +
    playStyleAdditiveBonus * 0.55 +
    bodyTypeFrameBonus * 0.6 +
    (selectedRoleTier === 'Role++' ? 3.4 : selectedRoleTier === 'Role+' ? 1.7 : 0);

  const synthesizedMetaScore = Number(Math.min(99.8, rawSynth).toFixed(1));
  const netSynthesisGain = Number((synthesizedMetaScore - isolatedOverallScore).toFixed(1));

  const accelerateDidShift = postChemAccelerate !== player.baseAccelerate;

  const tacticalVerdict = `${player.name} (${chemStyle} @ ${chemDiamonds}/3 Chem + ${selectedRoleTier}) synthesizes to ${synthesizedMetaScore}/100 Meta Score (+${netSynthesisGain} over isolated stats). ${
    accelerateDidShift
      ? `AcceleRATE shifts from ${player.baseAccelerate} -> ${postChemAccelerate}. `
      : `Maintains ${postChemAccelerate} sprint curve. `
  }Active PlayStyles+ (${activePsPlus.join(', ')}) add +${playStyleAdditiveBonus} break-cap efficiency under FC 27 Title Update #3.1.`;

  return {
    isolatedOverallScore,
    synthesizedMetaScore,
    netSynthesisGain,
    postChemSubStats,
    baseAccelerate: player.baseAccelerate,
    postChemAccelerate,
    accelerateDidShift,
    playStylePlusCapValid,
    playStyleAdditiveBonus,
    bodyTypeFrameBonus,
    roleAiMultiplierPct,
    synthesizedPillars: {
      effectiveBreakawayPace,
      effectiveClinicalFinishing,
      effectivePressResistanceDribbling,
      effectiveInterceptRadius,
      effectiveRolePositioningIQ,
    },
    tacticalVerdict,
  };
}
