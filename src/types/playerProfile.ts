/**
 * FC 27 UT App - 5-Category Player Profile Schema & In-Game Sub-Stats
 * =================================================================
 * Calibrated strictly to official FC 27 console architecture,
 * 29 verified in-game sub-stats, 5-panel profile cards,
 * 3-state PlayStyles (Grey/White/Gold+), and FC IQ Roles (Standard/+/++).
 */

export type Foot = 'Left' | 'Right';

export type AccelerationType =
  | 'Lengthy'
  | 'Mostly Lengthy'
  | 'Controlled Lengthy'
  | 'Controlled'
  | 'Controlled Explosive'
  | 'Mostly Explosive'
  | 'Explosive';

export type TradeStatus = 'Tradable' | 'Untradable';

export type PlayStyleTier = 'grey' | 'white' | 'gold_plus'; // grey=none, white=standard, gold_plus=PlayStyle+

export type RoleMastery = 'standard' | 'plus' | 'plus_plus'; // standard (mastered), + (expert), ++ (world class)

/**
 * 1. Face Card & 6 High-Level Attributes
 */
export interface FaceCardStats {
  pac: number; // Pace
  sho: number; // Shooting
  pas: number; // Passing
  dri: number; // Dribbling
  def: number; // Defending
  phy: number; // Physicality
}

/**
 * 2. The 29 In-Game Sub-Stats
 * Breakdown:
 * - Pace: 2
 * - Shooting: 6
 * - Passing: 6
 * - Dribbling: 6
 * - Defending: 5
 * - Physicality: 4
 * Total = 29 verified in-game stats
 */
export interface InGameAttributes {
  // Pace (2)
  acceleration: number;
  sprintSpeed: number;

  // Shooting (6)
  attackingPositioning: number;
  finishing: number;
  shotPower: number;
  longShots: number;
  volleys: number;
  penalties: number;

  // Passing (6)
  vision: number;
  crossing: number;
  freeKickAccuracy: number;
  shortPassing: number;
  longPassing: number;
  curve: number;

  // Dribbling (6)
  agility: number;
  balance: number;
  reactions: number;
  ballControl: number;
  dribbling: number;
  composure: number;

  // Defending (5)
  interceptions: number;
  headingAccuracy: number;
  defensiveAwareness: number;
  standingTackle: number;
  slidingTackle: number;

  // Physical (4)
  jumping: number;
  stamina: number;
  strength: number;
  aggression: number;
}

/**
 * 3. Match Ledger (Matches, Goals, Assists, Cards with Club splits)
 */
export interface PlayerMatchLedger {
  boughtForPrice: number;
  averageMarketPrice: number;
  ownerCount: number;
  tradeStatus: TradeStatus;

  matchesPlayedTotal: number;
  matchesPlayedOtherClubs: number;
  matchesPlayedCurrentClub: number;

  goalsScoredTotal: number;
  goalsScoredOtherClubs: number;
  goalsScoredCurrentClub: number;

  assistsTotal: number;
  assistsOtherClubs: number;
  assistsCurrentClub: number;

  yellowCardsTotal: number;
  yellowCardsOtherClubs: number;
  yellowCardsCurrentClub: number;

  redCardsTotal: number;
  redCardsOtherClubs: number;
  redCardsCurrentClub: number;
}

/**
 * 4. PlayStyles Matrix across all 6 gameplay disciplines
 */
export interface PlayStyleEntry {
  id: string;
  name: string;
  category: 'Finishing' | 'Passing' | 'Defending' | 'Ball Control' | 'Physical' | 'Goalkeeping';
  tier: PlayStyleTier;
  description: string;
}

/**
 * 5. FC IQ Role Configuration
 */
export interface FCIQRoleAssignment {
  roleName: string; // e.g. "Defender", "Stopper", "Wide Back", "Ball Playing Defender"
  mastery: RoleMastery; // standard, +, ++
  isPreferred: boolean;
  positiveTraits: string[];
  drawbacks: string[];
}

/**
 * Master 5-Category Player Profile
 */
export interface FullPlayerProfile {
  id: string;

  // Panel 1: Player Bio
  bio: {
    fullName: string;
    knownAs?: string;
    dateOfBirth: string; // YYYY-MM-DD
    age: number;
    heightFeetInches: string; // e.g. "6'3\""
    heightCm: number;
    accelerationType: AccelerationType;
    skillMoves: number; // 1-5
    weakFoot: number; // 1-5
    preferredFoot: Foot;
    photoUrl?: string;
  };

  // Panel 2: Face Card & Chemistry Details
  cardDetails: {
    overall: number;
    rarity: 'Gold' | 'Silver' | 'Bronze' | 'Special' | 'Future Stars' | 'Active Evolution' | 'TOTW' | 'Icon' | 'Hero';
    primaryPosition: string;
    alternativePositions: string[];
    chemistryDiamonds: 0 | 1 | 2 | 3; // 0, 1, 2, or 3
    chemistryStyle: string; // e.g. "Backbone", "Shadow", "Hunter"
    club: string;
    league: string;
    nation: string;
    faceStats: FaceCardStats;
  };

  // Panel 3: Financial & Match Ledger
  ledger: PlayerMatchLedger;

  // Panel 4: Complete 29 In-Game Attributes
  attributes: InGameAttributes;

  // Panel 5: PlayStyles & Roles
  playstyles: PlayStyleEntry[];
  roles: FCIQRoleAssignment[];
}
