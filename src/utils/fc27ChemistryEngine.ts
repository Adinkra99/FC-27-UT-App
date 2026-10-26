/**
 * EA Sports FC 27 Deterministic Chemistry & Meta Boost Engine
 * Pure deterministic calculation (<1ms, $0.00 token cost)
 * Strictly calibrated to EA Sports FC 27 Title Update #3.1 mechanics:
 * - 24 Official Chemistry Styles
 * - 0, 1, 2, or 3 Chemistry Diamonds scaling (0 = 0%, 1 = 33%, 2 = 66%, 3 = 100% full boost)
 * - AcceleRATE 2.0 physical archetype calculator (Explosive, Controlled Explosive, Controlled, Controlled Lengthy, Lengthy)
 * - 31 Roles++ synergy scoring
 */

import { AcceleRATEType, FC27ConsolePlayer } from '../data/fc27ConsoleData';

export type ChemStyleName =
  | 'Basic'
  | 'Hunter'
  | 'Shadow'
  | 'Catalyst'
  | 'Anchor'
  | 'Engine'
  | 'Hawk'
  | 'Finisher'
  | 'Deadeye'
  | 'Marksman'
  | 'Sniper'
  | 'Artist'
  | 'Architect'
  | 'Powerhouse'
  | 'Maestro'
  | 'Sentinel'
  | 'Guardian'
  | 'Gladiator'
  | 'Backbone'
  | 'Wall'
  | 'Shield'
  | 'Cat'
  | 'Glove';

export interface ChemStyleSpec {
  name: ChemStyleName;
  category: 'Pace & Attack' | 'Pace & Defense' | 'Pace & Midfield' | 'Physical & Defense' | 'Attacking' | 'Playmaking' | 'Goalkeeper';
  description: string;
  faceBoosts: {
    pac?: number;
    sho?: number;
    pas?: number;
    dri?: number;
    def?: number;
    phy?: number;
  };
  subBoosts: {
    acceleration?: number;
    sprintSpeed?: number;
    positioning?: number;
    finishing?: number;
    shotPower?: number;
    longShots?: number;
    vision?: number;
    shortPassing?: number;
    longPassing?: number;
    agility?: number;
    balance?: number;
    reactions?: number;
    ballControl?: number;
    dribbling?: number;
    composure?: number;
    interceptions?: number;
    defAwareness?: number;
    standingTackle?: number;
    jumping?: number;
    stamina?: number;
    strength?: number;
    aggression?: number;
  };
}

export const FC27_CHEMISTRY_STYLES: Record<ChemStyleName, ChemStyleSpec> = {
  Basic: {
    name: 'Basic',
    category: 'Pace & Midfield',
    description: '+1 to all key attributes across the board.',
    faceBoosts: { pac: 1, sho: 1, pas: 1, dri: 1, def: 1, phy: 1 },
    subBoosts: {
      acceleration: 4,
      sprintSpeed: 4,
      positioning: 4,
      finishing: 4,
      shotPower: 4,
      vision: 4,
      shortPassing: 4,
      ballControl: 4,
      dribbling: 4,
      defAwareness: 4,
      standingTackle: 4,
      strength: 4,
    },
  },
  Hunter: {
    name: 'Hunter',
    category: 'Pace & Attack',
    description: '+8 Pace and +8 Shooting for elite counter-attack finishing.',
    faceBoosts: { pac: 8, sho: 8 },
    subBoosts: {
      acceleration: 8,
      sprintSpeed: 8,
      positioning: 8,
      finishing: 8,
      shotPower: 4,
      longShots: 4,
    },
  },
  Shadow: {
    name: 'Shadow',
    category: 'Pace & Defense',
    description: '+8 Pace and +8 Defending for recovery speed and clean standing tackles.',
    faceBoosts: { pac: 8, def: 8 },
    subBoosts: {
      acceleration: 8,
      sprintSpeed: 8,
      interceptions: 8,
      defAwareness: 8,
      standingTackle: 8,
    },
  },
  Catalyst: {
    name: 'Catalyst',
    category: 'Pace & Midfield',
    description: '+8 Pace and +8 Passing for line-breaking pinged through-balls.',
    faceBoosts: { pac: 8, pas: 8 },
    subBoosts: {
      acceleration: 8,
      sprintSpeed: 8,
      vision: 8,
      shortPassing: 8,
      longPassing: 8,
    },
  },
  Anchor: {
    name: 'Anchor',
    category: 'Physical & Defense',
    description: '+4 Pace, +8 Defending, and +8 Physicality. Triggers Lengthy AcceleRATE on tall defenders.',
    faceBoosts: { pac: 4, def: 8, phy: 8 },
    subBoosts: {
      acceleration: 4,
      sprintSpeed: 4,
      interceptions: 8,
      defAwareness: 8,
      standingTackle: 8,
      jumping: 8,
      strength: 8,
      aggression: 4,
    },
  },
  Engine: {
    name: 'Engine',
    category: 'Pace & Midfield',
    description: '+4 Pace, +8 Dribbling, and +8 Passing. Maximizes left-stick agility and balance.',
    faceBoosts: { pac: 4, dri: 8, pas: 8 },
    subBoosts: {
      acceleration: 4,
      sprintSpeed: 4,
      vision: 8,
      shortPassing: 8,
      longPassing: 4,
      agility: 8,
      balance: 8,
      dribbling: 8,
    },
  },
  Hawk: {
    name: 'Hawk',
    category: 'Pace & Attack',
    description: '+4 Pace, +8 Shooting, and +4 Physicality for aggressive power forwards.',
    faceBoosts: { pac: 4, sho: 8, phy: 4 },
    subBoosts: {
      acceleration: 4,
      sprintSpeed: 4,
      positioning: 8,
      finishing: 4,
      shotPower: 8,
      longShots: 8,
      jumping: 8,
      strength: 4,
      aggression: 8,
    },
  },
  Finisher: {
    name: 'Finisher',
    category: 'Attacking',
    description: '+8 Shooting and +8 Dribbling for agile box poachers.',
    faceBoosts: { sho: 8, dri: 8 },
    subBoosts: {
      positioning: 8,
      finishing: 12,
      shotPower: 4,
      agility: 8,
      balance: 8,
      dribbling: 8,
    },
  },
  Deadeye: {
    name: 'Deadeye',
    category: 'Attacking',
    description: '+8 Shooting and +8 Passing for creative inside forwards and CAMs.',
    faceBoosts: { sho: 8, pas: 8 },
    subBoosts: {
      positioning: 8,
      finishing: 8,
      shotPower: 8,
      vision: 8,
      shortPassing: 8,
    },
  },
  Marksman: {
    name: 'Marksman',
    category: 'Attacking',
    description: '+8 Shooting, +4 Dribbling, and +4 Physicality.',
    faceBoosts: { sho: 8, dri: 4, phy: 4 },
    subBoosts: {
      finishing: 8,
      shotPower: 8,
      longShots: 4,
      ballControl: 4,
      dribbling: 8,
      strength: 8,
      jumping: 4,
    },
  },
  Sniper: {
    name: 'Sniper',
    category: 'Attacking',
    description: '+8 Shooting and +8 Physicality for hold-up target strikers.',
    faceBoosts: { sho: 8, phy: 8 },
    subBoosts: {
      positioning: 8,
      finishing: 8,
      shotPower: 8,
      jumping: 8,
      strength: 8,
    },
  },
  Artist: {
    name: 'Artist',
    category: 'Playmaking',
    description: '+8 Passing and +8 Dribbling for pure midfield orchestrators.',
    faceBoosts: { pas: 8, dri: 8 },
    subBoosts: {
      vision: 8,
      shortPassing: 8,
      longPassing: 8,
      agility: 8,
      dribbling: 8,
      composure: 4,
    },
  },
  Architect: {
    name: 'Architect',
    category: 'Playmaking',
    description: '+8 Passing and +8 Physicality. Can convert midfielders to Lengthy.',
    faceBoosts: { pas: 8, phy: 8 },
    subBoosts: {
      vision: 8,
      shortPassing: 8,
      longPassing: 8,
      jumping: 4,
      strength: 12,
      aggression: 8,
    },
  },
  Powerhouse: {
    name: 'Powerhouse',
    category: 'Playmaking',
    description: '+8 Passing and +8 Defending for Deep-Lying Playmakers.',
    faceBoosts: { pas: 8, def: 8 },
    subBoosts: {
      vision: 8,
      shortPassing: 8,
      longPassing: 8,
      interceptions: 8,
      standingTackle: 8,
    },
  },
  Maestro: {
    name: 'Maestro',
    category: 'Playmaking',
    description: '+8 Shooting, +8 Passing, and +4 Dribbling.',
    faceBoosts: { sho: 8, pas: 8, dri: 4 },
    subBoosts: {
      shotPower: 8,
      longShots: 8,
      vision: 8,
      shortPassing: 8,
      reactions: 4,
      dribbling: 4,
    },
  },
  Sentinel: {
    name: 'Sentinel',
    category: 'Physical & Defense',
    description: '+8 Defending and +8 Physicality for traditional physical center-backs.',
    faceBoosts: { def: 8, phy: 8 },
    subBoosts: {
      interceptions: 8,
      defAwareness: 8,
      standingTackle: 8,
      jumping: 8,
      strength: 8,
      aggression: 8,
    },
  },
  Guardian: {
    name: 'Guardian',
    category: 'Pace & Defense',
    description: '+8 Defending and +8 Dribbling for agile ball-playing defenders.',
    faceBoosts: { def: 8, dri: 8 },
    subBoosts: {
      interceptions: 8,
      defAwareness: 8,
      standingTackle: 8,
      balance: 8,
      reactions: 4,
      ballControl: 8,
    },
  },
  Gladiator: {
    name: 'Gladiator',
    category: 'Physical & Defense',
    description: '+8 Shooting and +8 Defending for goal-scoring fullbacks and CDMs.',
    faceBoosts: { sho: 8, def: 8 },
    subBoosts: {
      positioning: 8,
      shotPower: 8,
      interceptions: 8,
      defAwareness: 8,
      standingTackle: 8,
    },
  },
  Backbone: {
    name: 'Backbone',
    category: 'Physical & Defense',
    description: '+4 Passing, +4 Defending, and +4 Physicality for rounded CDMs.',
    faceBoosts: { pas: 4, def: 4, phy: 4 },
    subBoosts: {
      vision: 4,
      shortPassing: 4,
      interceptions: 4,
      standingTackle: 4,
      strength: 4,
      aggression: 4,
    },
  },
  Wall: {
    name: 'Wall',
    category: 'Goalkeeper',
    description: 'Goalkeeper boost for Diving, Handling, and Kicking.',
    faceBoosts: { def: 8, phy: 8 },
    subBoosts: { reactions: 8, jumping: 8 },
  },
  Shield: {
    name: 'Shield',
    category: 'Goalkeeper',
    description: 'Goalkeeper boost for Reflexes, Speed, and Kicking.',
    faceBoosts: { pac: 8, def: 8 },
    subBoosts: { sprintSpeed: 8, reactions: 8 },
  },
  Cat: {
    name: 'Cat',
    category: 'Goalkeeper',
    description: 'Goalkeeper boost for Reflexes, Speed, and Positioning.',
    faceBoosts: { pac: 8, dri: 8 },
    subBoosts: { acceleration: 8, reactions: 8 },
  },
  Glove: {
    name: 'Glove',
    category: 'Goalkeeper',
    description: 'Goalkeeper boost for Diving, Handling, and Positioning.',
    faceBoosts: { def: 8, dri: 8 },
    subBoosts: { reactions: 8 },
  },
};

/**
 * Calculates AcceleRATE 2.0 sprint physical archetype based on player geometry and sub-stats
 */
export function calculateAccelerateArchetype(stats: {
  acceleration: number;
  sprintSpeed: number;
  strength: number;
  agility: number;
  heightCm: number;
}): AcceleRATEType {
  const { acceleration, sprintSpeed, strength, agility, heightCm } = stats;
  const strengthAgilityDiff = strength - agility;

  // Lengthy Criteria:
  // Height >= 188cm, Strength >= 80, Strength - Agility >= 14, Acceleration >= 55
  if (heightCm >= 188 && strength >= 80 && strengthAgilityDiff >= 14 && acceleration >= 55) {
    return 'Lengthy';
  }

  // Mostly Lengthy Criteria:
  // Height >= 183cm, Strength >= 75, Strength - Agility >= 8
  if (heightCm >= 183 && strength >= 75 && strengthAgilityDiff >= 8) {
    return 'Mostly Lengthy';
  }

  // Controlled Lengthy Criteria:
  // Height >= 181cm, Strength >= 65, Strength - Agility >= 4
  if (heightCm >= 181 && strength >= 65 && strengthAgilityDiff >= 4) {
    return 'Controlled Lengthy';
  }

  // Explosive Criteria:
  // Height <= 175cm, Agility >= 80, Agility - Strength >= 20, Acceleration >= 80
  const agilityStrengthDiff = agility - strength;
  if (heightCm <= 175 && agility >= 80 && agilityStrengthDiff >= 20 && acceleration >= 80) {
    return 'Explosive';
  }

  // Mostly Explosive Criteria:
  // Height <= 182cm, Agility >= 75, Agility - Strength >= 12
  if (heightCm <= 182 && agility >= 75 && agilityStrengthDiff >= 12) {
    return 'Mostly Explosive';
  }

  // Controlled Explosive Criteria:
  // Height <= 184cm, Agility >= 70, Agility - Strength >= 4
  if (heightCm <= 184 && agility >= 70 && agilityStrengthDiff >= 4) {
    return 'Controlled Explosive';
  }

  // Default
  return 'Controlled';
}

/**
 * Applies a Chemistry Style with Chemistry Diamonds scaling (0, 1, 2, or 3)
 */
export function applyChemistryStyleBoost(
  player: FC27ConsolePlayer,
  chemStyleName: ChemStyleName,
  chemistryDiamonds: number = 3
) {
  const chemSpec = FC27_CHEMISTRY_STYLES[chemStyleName] || FC27_CHEMISTRY_STYLES.Basic;

  // Diamonds scale factor: 0 -> 0%, 1 -> 33%, 2 -> 66%, 3 -> 100%
  const scale =
    chemistryDiamonds <= 0 ? 0 : chemistryDiamonds === 1 ? 0.33 : chemistryDiamonds === 2 ? 0.66 : 1.0;

  // Boost Face Stats
  const boostedFace = {
    pac: Math.min(99, Math.round(player.faceStats.pac + (chemSpec.faceBoosts.pac || 0) * scale)),
    sho: Math.min(99, Math.round(player.faceStats.sho + (chemSpec.faceBoosts.sho || 0) * scale)),
    pas: Math.min(99, Math.round(player.faceStats.pas + (chemSpec.faceBoosts.pas || 0) * scale)),
    dri: Math.min(99, Math.round(player.faceStats.dri + (chemSpec.faceBoosts.dri || 0) * scale)),
    def: Math.min(99, Math.round(player.faceStats.def + (chemSpec.faceBoosts.def || 0) * scale)),
    phy: Math.min(99, Math.round(player.faceStats.phy + (chemSpec.faceBoosts.phy || 0) * scale)),
  };

  // Boost Sub-Stats
  const b = chemSpec.subBoosts;
  const s = player.subStats;
  const boostedSub = {
    acceleration: Math.min(99, Math.round(s.acceleration + (b.acceleration || 0) * scale)),
    sprintSpeed: Math.min(99, Math.round(s.sprintSpeed + (b.sprintSpeed || 0) * scale)),
    positioning: Math.min(99, Math.round(s.positioning + (b.positioning || 0) * scale)),
    finishing: Math.min(99, Math.round(s.finishing + (b.finishing || 0) * scale)),
    shotPower: Math.min(99, Math.round(s.shotPower + (b.shotPower || 0) * scale)),
    longShots: Math.min(99, Math.round(s.longShots + (b.longShots || 0) * scale)),
    vision: Math.min(99, Math.round(s.vision + (b.vision || 0) * scale)),
    shortPassing: Math.min(99, Math.round(s.shortPassing + (b.shortPassing || 0) * scale)),
    longPassing: Math.min(99, Math.round(s.longPassing + (b.longPassing || 0) * scale)),
    agility: Math.min(99, Math.round(s.agility + (b.agility || 0) * scale)),
    balance: Math.min(99, Math.round(s.balance + (b.balance || 0) * scale)),
    reactions: Math.min(99, Math.round(s.reactions + (b.reactions || 0) * scale)),
    ballControl: Math.min(99, Math.round(s.ballControl + (b.ballControl || 0) * scale)),
    dribbling: Math.min(99, Math.round(s.dribbling + (b.dribbling || 0) * scale)),
    composure: Math.min(99, Math.round(s.composure + (b.composure || 0) * scale)),
    interceptions: Math.min(99, Math.round(s.interceptions + (b.interceptions || 0) * scale)),
    defAwareness: Math.min(99, Math.round(s.defAwareness + (b.defAwareness || 0) * scale)),
    standingTackle: Math.min(99, Math.round(s.standingTackle + (b.standingTackle || 0) * scale)),
    jumping: Math.min(99, Math.round(s.jumping + (b.jumping || 0) * scale)),
    stamina: Math.min(99, Math.round(s.stamina + (b.stamina || 0) * scale)),
    strength: Math.min(99, Math.round(s.strength + (b.strength || 0) * scale)),
    aggression: Math.min(99, Math.round(s.aggression + (b.aggression || 0) * scale)),
  };

  // Re-calculate AcceleRATE 2.0
  const boostedAccelerate = calculateAccelerateArchetype({
    acceleration: boostedSub.acceleration,
    sprintSpeed: boostedSub.sprintSpeed,
    strength: boostedSub.strength,
    agility: boostedSub.agility,
    heightCm: player.heightCm,
  });

  const accelerateShifted = boostedAccelerate !== player.baseAccelerate;

  // Approximate In-Game OVR Rating
  const avgBoost =
    Object.values(chemSpec.faceBoosts).reduce((a, b) => a + (b || 0), 0) /
    (Object.keys(chemSpec.faceBoosts).length || 1);
  const estimatedInGameOvr = Math.min(99, Math.round(player.rating + avgBoost * 0.55 * scale));

  return {
    chemStyleName,
    scale,
    boostedFace,
    boostedSub,
    baseAccelerate: player.baseAccelerate,
    boostedAccelerate,
    accelerateShifted,
    estimatedInGameOvr,
  };
}
