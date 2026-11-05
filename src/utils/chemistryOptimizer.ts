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
 * Authentic Database Base Stats for Kit's Squad (Verified directly from FUTBIN / FUT.GG screenshot)
 * Connected FUTBIN Profile: FutbinUser443696828703506
 */
export const SQUAD_AUTHENTIC_BASE_STATS: Record<string, PlayerStats> = {
  // Starting XI (4-2-4 Verified Active Lineup)
  'Gregor Kobel': { pac: 88, sho: 85, pas: 64, dri: 88, def: 44, phy: 88 }, // DIV, HAN, KIC, REF, SPD, POS
  'Myles Lewis-Skelly': { pac: 71, sho: 60, pas: 75, dri: 77, def: 76, phy: 76 },
  'Nico Schlotterbeck': { pac: 81, sho: 60, pas: 77, dri: 74, def: 87, phy: 86 },
  'Maxence Lacroix': { pac: 87, sho: 47, pas: 64, dri: 70, def: 85, phy: 84 },
  'Djed Spence': { pac: 91, sho: 58, pas: 76, dri: 83, def: 81, phy: 79 },
  'Dominik Szoboszlai': { pac: 82, sho: 83, pas: 86, dri: 84, def: 74, phy: 77 },
  'Felix Nmecha': { pac: 83, sho: 78, pas: 84, dri: 82, def: 82, phy: 88 },
  'Christos Tzolis': { pac: 84, sho: 82, pas: 81, dri: 85, def: 41, phy: 74 },
  'Selina Cerci': { pac: 82, sho: 84, pas: 75, dri: 82, def: 53, phy: 80 },
  'Nicole Anyomi': { pac: 91, sho: 83, pas: 75, dri: 85, def: 56, phy: 84 },
  'Bradley Barcola': { pac: 92, sho: 76, pas: 78, dri: 84, def: 39, phy: 78 },

  // Confirmed 12 Bench & Reserve Cards (Verified from FUTBIN @Adinkra3399)
  'Keane Lewis-Potter': { pac: 81, sho: 74, pas: 78, dri: 82, def: 76, phy: 70 },
  'Alexander Isak': { pac: 81, sho: 87, pas: 72, dri: 82, def: 39, phy: 72 },
  'Hugo Ekitiké': { pac: 86, sho: 83, pas: 72, dri: 84, def: 33, phy: 73 },
  'Beth Mead': { pac: 83, sho: 84, pas: 82, dri: 84, def: 57, phy: 73 },
  'Fikayo Tomori': { pac: 85, sho: 48, pas: 66, dri: 68, def: 85, phy: 81 },
  'Carlos Espí': { pac: 85, sho: 85, pas: 73, dri: 82, def: 46, phy: 88 },
  'Jamal Musiala': { pac: 84, sho: 79, pas: 81, dri: 90, def: 62, phy: 65 },
  'Elliot Anderson': { pac: 81, sho: 74, pas: 82, dri: 84, def: 82, phy: 84 },
  'Bukayo Saka': { pac: 86, sho: 83, pas: 82, dri: 87, def: 65, phy: 76 },
  'Benjamin Pavard': { pac: 70, sho: 60, pas: 72, dri: 71, def: 82, phy: 78 },
  'Ryan Gravenberch': { pac: 76, sho: 76, pas: 81, dri: 83, def: 80, phy: 80 },
  'Jurriën Timber': { pac: 81, sho: 50, pas: 76, dri: 81, def: 83, phy: 80 },
};

/**
 * Curated tactical rationale for Kit's authentic roster (4-2-4 Formation)
 */
export const VERIFIED_PLAYER_RECOMMENDATIONS: Record<string, Partial<PlayerChemRecommendation>> = {
  'Gregor Kobel': {
    optimalStyle: 'GLOVE',
    alternativeStyle: 'WALL',
    whyOptimal:
      'Kobel (87 GK++) has 88 Diving and 88 Reflexes. Applying Glove gives +8 Diving (96), +8 Handling (93), and +8 Positioning (96). In FC 27, elite Handling prevents dangerous rebounds to oncoming poachers and secures contested high crosses.',
    whyAlternative:
      'Wall gives +8 Diving (96) and +8 Kicking (72) if you trigger direct over-the-top counter balls to Anyomi and Barcola.',
  },
  'Myles Lewis-Skelly': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'ANCHOR',
    whyOptimal:
      'Starting at LB in Kit’s 4-2-4, Lewis-Skelly possesses 71 Pace, 76 Defending, and 76 Physicality. Against 90+ Pace meta wingers, his base pace is the key area needing enhancement. Shadow accelerates his Pace to 79 and elevates Defending to 83, giving his Fullback++ role the recovery speed needed to track wing runs.',
    whyAlternative:
      'Anchor gives +4 Pace (75), +6 Defending (82), and +6 Physical (82), bolstering his shoulder duel rating against physical wingers.',
  },
  'Nico Schlotterbeck': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'ANCHOR',
    whyOptimal:
      'Schlotterbeck commands an imposing 87 Defending and 86 Physicality on his Gold 87 card. His 81 Pace is his only minor limitation. Shadow pushes Pace to 89 and Defending to an elite 94, making him virtually impossible to bypass in 1v1 ground duels for his Ball-Playing Defender++ role.',
    whyAlternative:
      'Anchor elevates Physicality from 86 to 92, providing maximum aerial supremacy on defensive corner kicks.',
  },
  'Maxence Lacroix': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'ANCHOR',
    whyOptimal:
      'Lacroix already possesses 87 Pace, 85 Defending, and 84 Physicality on his Special item. Applying Shadow elevates his Pace to a blistering 95 and Defending to 92. This creates an elite recovery center-back capable of hunting down breakaways without committing fouls.',
    whyAlternative:
      'Anchor boosts Defending to 91 and Physical to 90, if you prioritize max strength and aerial jump over pure 95 trackback pace.',
  },
  'Djed Spence': {
    optimalStyle: 'ANCHOR',
    alternativeStyle: 'SHADOW',
    whyOptimal:
      'Spence already boasts an explosive 91 base Pace! Applying Shadow wastes potential boost points against the 99 cap. Anchor gives +4 Pace (95), +6 Defending (87), and critically +6 Physical (79 -> 85), transforming him into an imposing physical fullback who bullies opposing wingers off the ball.',
    whyAlternative:
      'Shadow maxes out Pace to 99 and gives +7 Defending (88) for pure sprint trackbacks against 95+ Pace wingers.',
  },
  'Dominik Szoboszlai': {
    optimalStyle: 'ENGINE',
    alternativeStyle: 'HUNTER',
    whyOptimal:
      'Szoboszlai commands 83 Shooting and 86 Passing, but 84 Dribbling and 82 Pace. Engine grants +4 Pace (86), +6 Passing (92), and +6 Dribbling (90), drastically boosting his Agility and Balance. This allows his Box-to-Box role to turn fluidly away from high presses and spray cross-field diagonal balls to Barcola and Tzolis.',
    whyAlternative:
      'Hunter elevates Pace to 90 and Shooting to 89 if you prefer him surging into the penalty box for late finishing.',
  },
  'Felix Nmecha': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'POWERHOUSE',
    whyOptimal:
      'Nmecha (85 CM++, Dortmund) partners Szoboszlai in the 4-2-4 double pivot. He has 83 Pace, 82 Defending, and an immense 88 Physicality. Applying Shadow grants +8 Pace (91) and +7 Defending (89), turning him into a high-speed ball-winner and defensive powerhouse who shields the back four.',
    whyAlternative:
      'Powerhouse boosts Passing to 91 and Defending to 89, providing elite deep-lying playmaking if you build up patiently through the middle.',
  },
  'Christos Tzolis': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'ENGINE',
    whyOptimal:
      'Playing on the Left Wing for Arsenal with an 84-rated Special item (4* Skills, 4* Weak Foot), Tzolis has 84 Pace, 82 Shooting, 81 Passing, and 85 Dribbling. Hunter surges his Pace to 92 and Shooting to 88, allowing his Inside Forward++ role to cut inside from the left flank and finish with lethal accuracy into the far top corner.',
    whyAlternative:
      'Engine provides +4 Pace (88), +6 Passing (87), and +6 Dribbling (91) for maximum agility, left-stick responsiveness, and whipped crosses.',
  },
  'Selina Cerci': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'FINISHER',
    whyOptimal:
      'Cerci (84 ST++, Arsenal Women) has 82 Pace, 84 Shooting, and 80 Physicality. Hunter gives +8 Pace (90) and +6 Shooting (90 with 93+ finishing), giving her lethal poacher speed and clinical first-time finishes inside the 18-yard box.',
    whyAlternative:
      'Finisher elevates Shooting to 90 and Dribbling to 89, boosting tight-space composure and agility when evading physical center-backs.',
  },
  'Nicole Anyomi': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'HAWK',
    whyOptimal:
      'Anyomi already possesses 91 Pace, 83 Shooting, and 84 Physicality on her Special item (4* Skills, 4* Weak Foot). Hunter maxes her Pace to 99 and elevates Shooting to 89 (pushing Finishing and Shot Power past 92). This turns her into an unstoppable counter-attacking goal machine alongside Cerci.',
    whyAlternative:
      'Hawk balances +4 Pace (95), +5 Shooting (88), and +5 Physical (89), giving her extra jumping and strength to hold off burly center-backs.',
  },
  'Bradley Barcola': {
    optimalStyle: 'FINISHER',
    alternativeStyle: 'DEADEYE',
    whyOptimal:
      'Barcola (85 RW, PSG) has 92 base Pace! Applying Hunter wastes points against the 99 cap. Finisher gives +6 Shooting (76 -> 82) and +7 Dribbling (84 -> 91), directly solving his finishing while unlocking elite 91 dribbling and agility for cutting past left-backs.',
    whyAlternative:
      'Deadeye adds +6 Shooting (82) and +7 Passing (85) for pinpoint whipped crosses to Anyomi and Cerci.',
  },

  // Bench & Reserves Curated Recommendations
  'Keane Lewis-Potter': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'ANCHOR',
    whyOptimal:
      'His 81 Special LB item has 81 Pace and 76 Defending. Shadow surges his Pace to 89 and Defending to 83, making him a reliable defensive fullback replacement.',
    whyAlternative:
      'Anchor gives +4 Pace (85), +6 Defending (82), and +6 Physical (76) for stronger aerial presence.',
  },
  'Alexander Isak': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'ENGINE',
    whyOptimal:
      'Isak (86 ST, Newcastle) has 81 Pace and 87 Shooting with 5-star weak foot. Hunter accelerates his Pace to 89 and maxes his Finishing past 93.',
    whyAlternative:
      'Engine lifts Pace to 85, Passing to 78, and Dribbling to 88, boosting his balance and turning radius.',
  },
  'Hugo Ekitiké': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'FINISHER',
    whyOptimal:
      'Ekitiké (85 ST, Frankfurt) has 86 Pace and 83 Shooting. Hunter lifts Pace to 94 and Shooting to 89 for lethal counter-attacking runs.',
    whyAlternative:
      'Finisher pushes Shooting to 89 and Dribbling to 91 for tight-box maneuverability.',
  },
  'Jamal Musiala': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'DEADEYE',
    whyOptimal:
      'Musiala (87 CAM, Bayern Munich) commands 90 Dribbling and 5-star skills. Hunter boosts his 84 Pace to 92 and 79 Shooting to 85, transforming him into an elite attacking midfielder.',
    whyAlternative:
      'Deadeye elevates Shooting to 85 and Passing to 88 for surgical assists.',
  },
  'Fikayo Tomori': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'ANCHOR',
    whyOptimal:
      'Tomori (85 CB, AC Milan) has 85 Pace and 85 Defending. Shadow lifts his Pace to 93 and Defending to 92, creating an elite recovery defender.',
    whyAlternative:
      'Anchor provides +4 Pace (89), +6 Defending (91), and +6 Physical (87) for maximum shoulder duels.',
  },
  'Elliot Anderson': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'POWERHOUSE',
    whyOptimal:
      'Anderson (86 Special CDM, Nottingham Forest) has 81 Pace, 82 Defending, and 84 Physical. Shadow surges his Pace to 89 and Defending to 89, providing elite ball recovery.',
    whyAlternative:
      'Powerhouse elevates Passing to 89 and Defending to 89 for deep playmaking.',
  },
  'Bukayo Saka': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'CATALYST',
    whyOptimal:
      'Saka (87 RW, Arsenal) has 86 Pace, 83 Shooting, and 87 Dribbling. Hunter boosts Pace to 94 and Shooting to 89 for cutting inside and finishing into the top corner.',
    whyAlternative:
      'Catalyst boosts Pace to 94 and Passing to 89 for pinpoint crossing.',
  },
  'Carlos Espí': {
    optimalStyle: 'HUNTER',
    alternativeStyle: 'HAWK',
    whyOptimal:
      'Espí (85 Special ST, Levante) has 85 Pace, 85 Shooting, and 88 Physicality. Hunter pushes Pace to 93 and Shooting to 91, maximizing his target-man dominance.',
    whyAlternative:
      'Hawk boosts Pace to 89, Shooting to 90, and Physical to 93 for maximum aerial supremacy.',
  },
  'Ryan Gravenberch': {
    optimalStyle: 'SHADOW',
    alternativeStyle: 'POWERHOUSE',
    whyOptimal:
      'Gravenberch (85 CDM, Liverpool) has 76 Pace and 80 Defending. Shadow lifts his Pace to 84 and Defending to 87, solidifying his holding pivot presence.',
    whyAlternative:
      'Powerhouse lifts Passing to 88 and Defending to 87 for distributing from deep.',
  },
  'Jurriën Timber': {
    optimalStyle: 'ANCHOR',
    alternativeStyle: 'SHADOW',
    whyOptimal:
      'Timber (84 RB, Arsenal) has 81 Pace, 83 Defending, and 80 Physicality. Anchor boosts Pace to 85, Defending to 89, and Physical to 86 for robust containment.',
    whyAlternative:
      'Shadow pushes Pace to 89 and Defending to 90 for tracking pure sprint wingers.',
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
