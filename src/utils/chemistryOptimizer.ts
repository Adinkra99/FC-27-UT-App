/**
 * Chemistry Style Auto-Optimizer for EA Sports FC 27 Ultimate Team
 *
 * Implements mathematical stat cap optimization (up to 99) and tactical synergy
 * based on player position, base attributes, and FC 27 Role++ profiles.
 */

export type ChemistryStyleName =
  | 'BASIC'
  | 'SHADOW'
  | 'HUNTER'
  | 'ANCHOR'
  | 'ENGINE'
  | 'CATALYST'
  | 'HAWK'
  | 'FINISHER'
  | 'DEADEYE'
  | 'MARKSMAN'
  | 'POWERHOUSE'
  | 'SENTINEL'
  | 'GUARDIAN'
  | 'GLOVE'
  | 'WALL';

export interface ChemBoostMap {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface ChemistryStyleDetails {
  name: ChemistryStyleName;
  displayName: string;
  category: 'DEFENSIVE' | 'ATTACKING' | 'MIDFIELD' | 'PHYSICAL' | 'GOALKEEPER' | 'BALANCED';
  summary: string;
  boosts: ChemBoostMap;
}

export const CHEMISTRY_STYLES: Record<ChemistryStyleName, ChemistryStyleDetails> = {
  BASIC: {
    name: 'BASIC',
    displayName: 'Basic',
    category: 'BALANCED',
    summary: '+1 to all face attributes',
    boosts: { pac: 1, sho: 1, pas: 1, dri: 1, def: 1, phy: 1 },
  },
  SHADOW: {
    name: 'SHADOW',
    displayName: 'Shadow',
    category: 'DEFENSIVE',
    summary: '+8 Pace, +7 Defending',
    boosts: { pac: 8, sho: 0, pas: 0, dri: 0, def: 7, phy: 0 },
  },
  HUNTER: {
    name: 'HUNTER',
    displayName: 'Hunter',
    category: 'ATTACKING',
    summary: '+8 Pace, +6 Shooting',
    boosts: { pac: 8, sho: 6, pas: 0, dri: 0, def: 0, phy: 0 },
  },
  ANCHOR: {
    name: 'ANCHOR',
    displayName: 'Anchor',
    category: 'DEFENSIVE',
    summary: '+4 Pace, +6 Defending, +6 Physical',
    boosts: { pac: 4, sho: 0, pas: 0, dri: 0, def: 6, phy: 6 },
  },
  ENGINE: {
    name: 'ENGINE',
    displayName: 'Engine',
    category: 'MIDFIELD',
    summary: '+4 Pace, +6 Passing, +6 Dribbling',
    boosts: { pac: 4, sho: 0, pas: 6, dri: 6, def: 0, phy: 0 },
  },
  CATALYST: {
    name: 'CATALYST',
    displayName: 'Catalyst',
    category: 'MIDFIELD',
    summary: '+8 Pace, +7 Passing',
    boosts: { pac: 8, sho: 0, pas: 7, dri: 0, def: 0, phy: 0 },
  },
  HAWK: {
    name: 'HAWK',
    displayName: 'Hawk',
    category: 'ATTACKING',
    summary: '+4 Pace, +5 Shooting, +5 Physical',
    boosts: { pac: 4, sho: 5, pas: 0, dri: 0, def: 0, phy: 5 },
  },
  FINISHER: {
    name: 'FINISHER',
    displayName: 'Finisher',
    category: 'ATTACKING',
    summary: '+6 Shooting, +7 Dribbling',
    boosts: { pac: 0, sho: 6, pas: 0, dri: 7, def: 0, phy: 0 },
  },
  DEADEYE: {
    name: 'DEADEYE',
    displayName: 'Deadeye',
    category: 'ATTACKING',
    summary: '+6 Shooting, +7 Passing',
    boosts: { pac: 0, sho: 6, pas: 7, dri: 0, def: 0, phy: 0 },
  },
  MARKSMAN: {
    name: 'MARKSMAN',
    displayName: 'Marksman',
    category: 'ATTACKING',
    summary: '+5 Shooting, +5 Dribbling, +5 Physical',
    boosts: { pac: 0, sho: 5, pas: 0, dri: 5, def: 0, phy: 5 },
  },
  POWERHOUSE: {
    name: 'POWERHOUSE',
    displayName: 'Powerhouse',
    category: 'MIDFIELD',
    summary: '+7 Passing, +7 Defending',
    boosts: { pac: 0, sho: 0, pas: 7, dri: 0, def: 7, phy: 0 },
  },
  SENTINEL: {
    name: 'SENTINEL',
    displayName: 'Sentinel',
    category: 'DEFENSIVE',
    summary: '+7 Defending, +7 Physical',
    boosts: { pac: 0, sho: 0, pas: 0, dri: 0, def: 7, phy: 7 },
  },
  GUARDIAN: {
    name: 'GUARDIAN',
    displayName: 'Guardian',
    category: 'DEFENSIVE',
    summary: '+6 Dribbling, +7 Defending',
    boosts: { pac: 0, sho: 0, pas: 0, dri: 6, def: 7, phy: 0 },
  },
  GLOVE: {
    name: 'GLOVE',
    displayName: 'Glove (GK)',
    category: 'GOALKEEPER',
    summary: '+8 Diving, +8 Handling, +8 Positioning',
    boosts: { pac: 8, sho: 8, pas: 0, dri: 0, def: 8, phy: 0 },
  },
  WALL: {
    name: 'WALL',
    displayName: 'Wall (GK)',
    category: 'GOALKEEPER',
    summary: '+8 Diving, +8 Kicking, +8 Handling',
    boosts: { pac: 8, sho: 0, pas: 8, dri: 0, def: 8, phy: 0 },
  },
};

export interface PlayerStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface PlayerChemRecommendation {
  playerName: string;
  slot: string;
  rating: number;
  rolePlusPlus: string;
  baseStats: PlayerStats;
  optimalStyle: ChemistryStyleName;
  alternativeStyle: ChemistryStyleName;
  whyOptimal: string;
  whyAlternative: string;
  projectedStats: PlayerStats;
  statGainsSummary: string;
}

/**
 * Authentic Database Base Stats for Kit's Squad (from FUTBIN / FUT.GG)
 */
export const SQUAD_AUTHENTIC_BASE_STATS: Record<string, PlayerStats> = {
  // Starting XI
  'Gregor Kobel': { pac: 88, sho: 88, pas: 84, dri: 86, def: 44, phy: 86 }, // DIV, HAN, KIC, REF, SPD, POS
  'Keane Lewis-Potter': { pac: 83, sho: 74, pas: 78, dri: 82, def: 80, phy: 73 },
  'Nico Schlotterbeck': { pac: 81, sho: 60, pas: 76, dri: 74, def: 86, phy: 84 },
  'Maxence Lacroix': { pac: 87, sho: 47, pas: 64, dri: 70, def: 85, phy: 84 },
  'Djed Spence': { pac: 91, sho: 58, pas: 76, dri: 83, def: 81, phy: 79 },
  'Ryan Gravenberch': { pac: 76, sho: 76, pas: 81, dri: 83, def: 80, phy: 80 },
  'Dominik Szoboszlai': { pac: 82, sho: 83, pas: 86, dri: 84, def: 74, phy: 77 },
  'Christos Tzolis': { pac: 84, sho: 82, pas: 81, dri: 85, def: 41, phy: 74 },
  'Kristoffer Solis': { pac: 84, sho: 82, pas: 81, dri: 85, def: 41, phy: 74 },
  'Bradley Barcola': { pac: 92, sho: 76, pas: 78, dri: 84, def: 39, phy: 67 },
  'Nicole Anyomi': { pac: 91, sho: 83, pas: 75, dri: 85, def: 56, phy: 84 },
  'Bukayo Saka': { pac: 85, sho: 82, pas: 85, dri: 87, def: 60, phy: 70 },

  // Bench
  'Selina Cerci': { pac: 82, sho: 84, pas: 75, dri: 82, def: 53, phy: 80 },
  'Carlos Espí': { pac: 85, sho: 85, pas: 73, dri: 82, def: 46, phy: 88 },
  'Hugo Ekitiké': { pac: 86, sho: 83, pas: 72, dri: 84, def: 33, phy: 73 },
  'Alexander Isak': { pac: 81, sho: 87, pas: 72, dri: 82, def: 39, phy: 72 },
  'Myles Lewis-Skelly': { pac: 77, sho: 64, pas: 81, dri: 78, def: 81, phy: 85 },
  'Benjamin Pavard': { pac: 78, sho: 66, pas: 75, dri: 71, def: 82, phy: 81 },
  'Jurriën Timber': { pac: 76, sho: 48, pas: 76, dri: 78, def: 83, phy: 78 },
  'Beth Mead': { pac: 83, sho: 84, pas: 82, dri: 84, def: 67, phy: 73 },
  'Ferran Torres': { pac: 84, sho: 84, pas: 78, dri: 82, def: 44, phy: 74 },
};

/**
 * Curated tactical rationale for Kit's authentic roster
 */
export const VERIFIED_PLAYER_RECOMMENDATIONS: Record<string, Partial<PlayerChemRecommendation>> = {
  'Gregor Kobel': {
    optimalStyle: 'GLOVE',
    alternativeStyle: 'WALL',
    whyOptimal:
      'Kobel already possesses elite natural reflexes (86) and an 88 diving base. Glove directly pushes his Diving to 96, Handling to 96, and Positioning to 94. In FC 27, +8 Handling is essential to prevent parried rebounds and secure contested crosses.',
    whyAlternative:
      'Wall boosts Diving (96) and Kicking (92) for counter-attacking distribution if you trigger rapid through-passes off defensive saves.',
  },
  'Keane Lewis-Potter': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'ANCHOR',
    whyOptimal:
      'With 83 Pace and 80 Defending, Lewis-Potter is the squad’s most vulnerable defensive link against meta wingers (e.g. 90+ Pace). Shadow surges his Pace to 91 and Defending to 87, ensuring his Fullback++ role can track sprint bursts and recover on the counter.',
    whyAlternative:
      'Anchor gives +4 Pace (87), +6 Defending (86), and +6 Physical (79), improving his shoulder-to-shoulder strength if you face bulky wingers.',
  },
  'Nico Schlotterbeck': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'ANCHOR',
    whyOptimal:
      'Schlotterbeck already commands 86 Defending and 84 Physicality. His 81 Pace is his single bottleneck. Shadow raises his Pace to 89 and Defending to 93, making him virtually impossible to bypass in 1v1 ground duels for his Ball-Playing Defender++ role.',
    whyAlternative:
      'Anchor elevates Physicality from 84 to 90, creating a brick-wall presence on corner headers and contested set-pieces.',
  },
  'Maxence Lacroix': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'ANCHOR',
    whyOptimal:
      'Lacroix already has 87 Pace and 84 Physicality. Applying Shadow pushes his Pace to an extraordinary 95 and Defending from 85 to 92. This creates an elite recovery center-back capable of tracking down breakaways without committing fouls.',
    whyAlternative:
      'Anchor pushes Defending to 91 and Physical to 90, if you prefer max aerial and shoulder strength over 95 sprint speed.',
  },
  'Djed Spence': {
    optimalStyle: 'ANCHOR',
    alternativeStyle: 'SHADOW',
    whyOptimal:
      'Spence already boasts blazing 91 Pace. Using Shadow wastes potential since Pace caps at 99. Anchor gives him +4 Pace (95), +6 Defending (87), and critically +6 Physical (79 -> 85), transforming him into an imposing physical fullback who bullies opposing wingers.',
    whyAlternative:
      'Shadow maxes out Pace to 99 and gives +7 Defending (88) for pure trackback speed against 95+ Pace wingers.',
  },
  'Ryan Gravenberch': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'POWERHOUSE',
    whyOptimal:
      'In a 4-2-1-3 double pivot, Gravenberch operates as the defensive anchor (Holding++). His 76 Pace requires enhancement. Shadow lifts his Pace to 84 and Defending from 80 to 87, ensuring rapid ball recovery and intercept radius.',
    whyAlternative:
      'Powerhouse boosts Passing to 88 and Defending to 87 if you prefer him as a deep-lying playmaker distributing from deep.',
  },
  'Dominik Szoboszlai': {
    optimalStyle: 'ENGINE',
    alternativeStyle: 'HUNTER',
    whyOptimal:
      'Szoboszlai has heavy long-shot power (83) and passing (86), but 84 Dribbling and 82 Pace. Engine grants +4 Pace (86), +6 Passing (92), and +6 Dribbling (90), drastically boosting his Agility and Balance. This allows his Box-to-Box role to evade high-pressing midfielders smoothly.',
    whyAlternative:
      'Hunter elevates Pace to 90 and Shooting to 89 if you deploy him as an attacking central midfielder arriving late in the box to finish.',
  },
  'Christos Tzolis': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'ENGINE',
    whyOptimal:
      'As the creative spark on the left / CAM, Tzolis has 84 Pace, 82 Shooting, and 85 Dribbling. Hunter boosts Pace to 92 and Shooting to 88 (Finishing 90+), making his edge-of-the-box finesses and cutting inside into the box lethal.',
    whyAlternative:
      'Engine provides +6 Passing (87) and +6 Dribbling (91) for silky tight-space agility and pinpoint through-balls.',
  },
  'Kristoffer Solis': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'ENGINE',
    whyOptimal:
      'Playing on the Left Wing in Kit\'s 4-2-4 system for Arsenal (signed this summer from Club Brugge), Solis has 84 Pace, 82 Shooting, 81 Passing, and 85 Dribbling. Hunter surges his Pace to 92 and Shooting to 88, allowing his Inside Forward++ role to cut in from the left flank and finish with clinical accuracy into the far top corner.',
    whyAlternative:
      'Engine boosts Pace to 88, Passing to 87, and Dribbling to 91, maximizing his crossing delivery to Nicole Anyomi and Alexander Isak.',
  },
  'Bradley Barcola': {
    optimalStyle: 'FINISHER',
    alternativeStyle: 'DEADEYE',
    whyOptimal:
      'Barcola already possesses exceptional 92 base Pace! Applying Hunter or Catalyst wastes stat points against the 99 cap. Finisher provides +6 Shooting (76 -> 82) and +7 Dribbling (84 -> 91), addressing his low finishing while unlocking elite left-stick responsiveness.',
    whyAlternative:
      'Deadeye adds +6 Shooting (82) and +7 Passing (85) for cross-field whipped deliveries and cutback assists.',
  },
  'Nicole Anyomi': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'HAWK',
    whyOptimal:
      'Anyomi already has 91 Pace and 84 Physicality, but 83 Shooting. Hunter maxes her Pace to 99 and elevates Shooting to 89 (pushing Finishing and Shot Power past 92). This turns her Advanced Forward++ into an unstoppable counter-attacking goal machine.',
    whyAlternative:
      'Hawk balances +4 Pace (95), +5 Shooting (88), and +5 Physical (89), giving her extra jumping and strength to hold off burly center-backs.',
  },
  'Bukayo Saka': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'CATALYST',
    whyOptimal:
      'Saka has 85 Pace, 82 Shooting, 85 Passing, and 87 Dribbling. Hunter boosts his Pace to 93 and Shooting to 88. In the 4-2-1-3 formation, this enables his Inside Forward+ role to cut inside from the right and finish into the far corner with conviction.',
    whyAlternative:
      'Catalyst boosts Pace to 93 and Passing to 92 for a pure creator style whipping crosses to Anyomi and Barcola.',
  },
};

/**
 * Calculates boosted stats respecting the 99 maximum attribute cap
 */
export function applyChemistryBoost(
  base: PlayerStats,
  style: ChemistryStyleName,
  chemPoints: number = 3
): PlayerStats {
  const chemDef = CHEMISTRY_STYLES[style] || CHEMISTRY_STYLES.BASIC;
  const factor = chemPoints / 3; // 1.0 for 3 chem, 0.66 for 2 chem, 0.33 for 1 chem

  const cap = (val: number, boost: number) => {
    const raw = Math.round(val + boost * factor);
    return Math.min(99, Math.max(1, raw));
  };

  return {
    pac: cap(base.pac, chemDef.boosts.pac),
    sho: cap(base.sho, chemDef.boosts.sho),
    pas: cap(base.pas, chemDef.boosts.pas),
    dri: cap(base.dri, chemDef.boosts.dri),
    def: cap(base.def, chemDef.boosts.def),
    phy: cap(base.phy, chemDef.boosts.phy),
  };
}

/**
 * Recommends the optimal Chemistry Style and explains why
 */
export function getChemistryOptimization(
  playerName: string,
  slot: string,
  rating: number,
  rolePlusPlus: string,
  overrideStats?: PlayerStats
): PlayerChemRecommendation {
  const base = overrideStats || SQUAD_AUTHENTIC_BASE_STATS[playerName] || {
    pac: 75,
    sho: 70,
    pas: 72,
    dri: 74,
    def: 70,
    phy: 72,
  };

  const verified = VERIFIED_PLAYER_RECOMMENDATIONS[playerName];

  let optimalStyle: ChemistryStyleName = verified?.optimalStyle || 'BASIC';
  let alternativeStyle: ChemistryStyleName = verified?.alternativeStyle || 'ENGINE';
  let whyOptimal = verified?.whyOptimal || '';
  let whyAlternative = verified?.whyAlternative || '';

  // Algorithmic fallback if not in curated list
  if (!verified) {
    const pos = slot.toUpperCase();
    if (pos === 'GK') {
      optimalStyle = 'GLOVE';
      alternativeStyle = 'WALL';
      whyOptimal = `Glove boosts Diving, Handling, and Positioning by +8, eliminating loose rebounds.`;
      whyAlternative = `Wall improves Kicking and Diving for fast distributions.`;
    } else if (['CB', 'LCB', 'RCB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) {
      if (base.pac >= 90) {
        optimalStyle = 'ANCHOR';
        alternativeStyle = 'GUARDIAN';
        whyOptimal = `With base Pace already at ${base.pac}, Anchor caps out Pace while boosting Defending (+6) and Physical (+6) without wasting stat points against the 99 cap.`;
        whyAlternative = `Guardian adds +6 Dribbling and +7 Defending for press resistance under pressure.`;
      } else {
        optimalStyle = 'SHADOW';
        alternativeStyle = 'ANCHOR';
        whyOptimal = `Provides maximum +8 Pace and +7 Defending boost to reach meta sprint and tackle thresholds for ${rolePlusPlus}.`;
        whyAlternative = `Anchor provides +6 Physicality if you face heavy physical strikers.`;
      }
    } else if (['CDM', 'LDM', 'RDM'].includes(pos)) {
      if (base.pac <= 80) {
        optimalStyle = 'SHADOW';
        alternativeStyle = 'POWERHOUSE';
        whyOptimal = `Boosts ${base.pac} Pace by +8 and Defending by +7, allowing the CDM to patrol the backline and break up counters.`;
        whyAlternative = `Powerhouse boosts Passing and Defending by +7 for playmaking from deep.`;
      } else {
        optimalStyle = 'POWERHOUSE';
        alternativeStyle = 'SHADOW';
        whyOptimal = `Enhances Passing (+7) and Defending (+7) for balanced double-pivot control.`;
        whyAlternative = `Shadow maximizes sprint speed and tackle success.`;
      }
    } else if (['CM', 'CAM'].includes(pos)) {
      optimalStyle = 'ENGINE';
      alternativeStyle = 'HUNTER';
      whyOptimal = `Engine enhances Pace (+4), Passing (+6), and Dribbling (+6), raising Agility and Vision to unlock high-tempo transitions.`;
      whyAlternative = `Hunter adds +8 Pace and +6 Shooting if you want direct long shots and box penetration.`;
    } else {
      // Attackers (ST, CF, LW, RW)
      if (base.pac >= 90) {
        optimalStyle = 'FINISHER';
        alternativeStyle = 'DEADEYE';
        whyOptimal = `With base Pace at ${base.pac}, Finisher boosts Shooting (+6) and Dribbling (+7) without wasting pace points against the 99 cap.`;
        whyAlternative = `Deadeye boosts Shooting (+6) and Passing (+7) for cutbacks and crossing.`;
      } else {
        optimalStyle = 'HUNTER';
        alternativeStyle = 'HAWK';
        whyOptimal = `Hunter grants +8 Pace and +6 Shooting to achieve maximum separation and clinical finishing for ${rolePlusPlus}.`;
        whyAlternative = `Hawk adds +4 Pace, +5 Shooting, and +5 Physical for aerial dominance.`;
      }
    }
  }

  const projectedStats = applyChemistryBoost(base, optimalStyle, 3);

  const statDiffs: string[] = [];
  const chemDef = CHEMISTRY_STYLES[optimalStyle];
  if (chemDef.boosts.pac > 0) statDiffs.push(`PAC ${base.pac} → ${projectedStats.pac} (+${chemDef.boosts.pac})`);
  if (chemDef.boosts.sho > 0) statDiffs.push(`SHO ${base.sho} → ${projectedStats.sho} (+${chemDef.boosts.sho})`);
  if (chemDef.boosts.pas > 0) statDiffs.push(`PAS ${base.pas} → ${projectedStats.pas} (+${chemDef.boosts.pas})`);
  if (chemDef.boosts.dri > 0) statDiffs.push(`DRI ${base.dri} → ${projectedStats.dri} (+${chemDef.boosts.dri})`);
  if (chemDef.boosts.def > 0) statDiffs.push(`DEF ${base.def} → ${projectedStats.def} (+${chemDef.boosts.def})`);
  if (chemDef.boosts.phy > 0) statDiffs.push(`PHY ${base.phy} → ${projectedStats.phy} (+${chemDef.boosts.phy})`);

  return {
    playerName,
    slot,
    rating,
    rolePlusPlus,
    baseStats: base,
    optimalStyle,
    alternativeStyle,
    whyOptimal,
    whyAlternative,
    projectedStats,
    statGainsSummary: statDiffs.join(' · '),
  };
}
