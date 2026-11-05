export interface Player {
  id: string;
  name: string;
  rating: number;
  position: string;
  altPositions?: string[];
  club: string;
  league: string;
  nation: string;
  cardType?: 'gold' | 'totw' | 'icon' | 'hero' | 'promo' | string;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  xboxBin?: number;
  playstyles?: string[];
  rolesPlus?: string[];
  photoUrl?: string;
  clubBadgeUrl?: string;
  nationFlagUrl?: string;
  heightCm?: number;
  acceleration?: number;
  sprintSpeed?: number;
  strength?: number;
  agility?: number;
}

export interface Manager {
  name: string;
  nation: string;
  league: string;
}

export interface SquadSlot {
  slotIndex: number;
  slotPosition: string; // e.g. 'ST', 'GK', 'CB'
  player: Player | null;
}

export interface PlayerChemistryBreakdown {
  playerId: string;
  inPosition: boolean;
  clubPoints: number;
  nationPoints: number;
  leaguePoints: number;
  totalPoints: number; // 0..3
  isSpecialLock: boolean; // Icons & Heroes get 3 if in position
}

export interface ChemistryResult {
  totalChemistry: number; // 0..33
  playerBreakdown: Record<string, PlayerChemistryBreakdown>;
  squadRating: number;
  exactSquadRating: number;
  clubCounts: Record<string, number>;
  nationCounts: Record<string, number>;
  leagueCounts: Record<string, number>;
}

/**
 * Checks if a player can play in the given slot position.
 */
export function isPlayerInPosition(player: Player, slotPosition: string): boolean {
  if (player.position.toUpperCase() === slotPosition.toUpperCase()) {
    return true;
  }
  if (player.altPositions && player.altPositions.some(p => p.toUpperCase() === slotPosition.toUpperCase())) {
    return true;
  }
  return false;
}

/**
 * Deterministic FC 27 Chemistry Engine
 * Calibrated strictly to official FC 27 thresholds:
 * Club: 2 -> +1, 4 -> +2, 7 -> +3
 * Nation: 2 -> +1, 5 -> +2, 8 -> +3
 * League: 3 -> +1, 5 -> +2, 8 -> +3
 * Icons: 3 chem if in position, +2 nation to squad members, +1 league to all represented leagues
 * Heroes: 3 chem if in position, +2 league to their league, +1 nation to their nation
 * Manager: +1 nation, +1 league across squad
 */
export function calculateSquadChemistry(
  slots: SquadSlot[],
  manager?: Manager | null
): ChemistryResult {
  const activePlayers: { slot: SquadSlot; player: Player; inPos: boolean }[] = [];

  for (const slot of slots) {
    if (slot.player) {
      const inPos = isPlayerInPosition(slot.player, slot.slotPosition);
      activePlayers.push({ slot, player: slot.player, inPos });
    }
  }

  // Count synergies among in-position players
  const clubCounts: Record<string, number> = {};
  const nationCounts: Record<string, number> = {};
  const leagueCounts: Record<string, number> = {};

  // First pass: tally contributions
  let iconCount = 0;

  for (const { player, inPos } of activePlayers) {
    if (!inPos) continue;

    const isIcon = player.cardType?.toLowerCase() === 'icon';
    const isHero = player.cardType?.toLowerCase() === 'hero';

    // Club count
    if (!isIcon) {
      clubCounts[player.club] = (clubCounts[player.club] || 0) + 1;
    }

    // Nation count
    if (isIcon) {
      // Icon contributes +2 nation count to players sharing their nation
      nationCounts[player.nation] = (nationCounts[player.nation] || 0) + 2;
      iconCount++;
    } else if (isHero) {
      // Hero contributes +1 nation count
      nationCounts[player.nation] = (nationCounts[player.nation] || 0) + 1;
    } else {
      nationCounts[player.nation] = (nationCounts[player.nation] || 0) + 1;
    }

    // League count
    if (isHero) {
      // Hero gives +2 league count to their league
      leagueCounts[player.league] = (leagueCounts[player.league] || 0) + 2;
    } else if (!isIcon) {
      leagueCounts[player.league] = (leagueCounts[player.league] || 0) + 1;
    }
  }

  // Icons give +1 to every league represented in the squad per icon
  if (iconCount > 0) {
    for (const league of Object.keys(leagueCounts)) {
      leagueCounts[league] += iconCount;
    }
  }

  // Manager contributions
  if (manager) {
    if (manager.nation) {
      nationCounts[manager.nation] = (nationCounts[manager.nation] || 0) + 1;
    }
    if (manager.league) {
      leagueCounts[manager.league] = (leagueCounts[manager.league] || 0) + 1;
    }
  }

  // Threshold point calculators
  const getClubPoints = (count: number): number => {
    if (count >= 7) return 3;
    if (count >= 4) return 2;
    if (count >= 2) return 1;
    return 0;
  };

  const getNationPoints = (count: number): number => {
    if (count >= 8) return 3;
    if (count >= 5) return 2;
    if (count >= 2) return 1;
    return 0;
  };

  const getLeaguePoints = (count: number): number => {
    if (count >= 8) return 3;
    if (count >= 5) return 2;
    if (count >= 3) return 1;
    return 0;
  };

  let totalChemistry = 0;
  const playerBreakdown: Record<string, PlayerChemistryBreakdown> = {};

  for (const { player, inPos } of activePlayers) {
    if (!inPos) {
      playerBreakdown[player.id] = {
        playerId: player.id,
        inPosition: false,
        clubPoints: 0,
        nationPoints: 0,
        leaguePoints: 0,
        totalPoints: 0,
        isSpecialLock: false,
      };
      continue;
    }

    const isIcon = player.cardType?.toLowerCase() === 'icon';
    const isHero = player.cardType?.toLowerCase() === 'hero';

    if (isIcon || isHero) {
      // Icons and Heroes always receive full 3 chemistry when played in position
      playerBreakdown[player.id] = {
        playerId: player.id,
        inPosition: true,
        clubPoints: 0,
        nationPoints: 0,
        leaguePoints: 0,
        totalPoints: 3,
        isSpecialLock: true,
      };
      totalChemistry += 3;
      continue;
    }

    const cPoints = getClubPoints(clubCounts[player.club] || 0);
    const nPoints = getNationPoints(nationCounts[player.nation] || 0);
    const lPoints = getLeaguePoints(leagueCounts[player.league] || 0);

    const total = Math.min(3, cPoints + nPoints + lPoints);
    totalChemistry += total;

    playerBreakdown[player.id] = {
      playerId: player.id,
      inPosition: true,
      clubPoints: cPoints,
      nationPoints: nPoints,
      leaguePoints: lPoints,
      totalPoints: total,
      isSpecialLock: false,
    };
  }

  // Calculate EA Sports FC Non-Linear Squad Rating
  const ratingData = calculateSquadRating(slots.map(s => s.player?.rating || 0).filter(r => r > 0));

  return {
    totalChemistry: Math.min(33, totalChemistry),
    playerBreakdown,
    squadRating: ratingData.squadRating,
    exactSquadRating: ratingData.exactRating,
    clubCounts,
    nationCounts,
    leagueCounts,
  };
}

/**
 * EA Sports FC Non-Linear Squad Rating Formula
 * 1. Arithmetic mean r_bar = sum(r_i) / N
 * 2. Excess E = sum(max(0, r_i - r_bar))
 * 3. Final Rating = floor((sum(r_i) + E) / N)
 */
export function calculateSquadRating(ratings: number[]): { squadRating: number; exactRating: number } {
  if (ratings.length === 0) {
    return { squadRating: 0, exactRating: 0 };
  }

  const sumRatings = ratings.reduce((acc, curr) => acc + curr, 0);
  const count = ratings.length;
  const mean = sumRatings / count;

  let excess = 0;
  for (const r of ratings) {
    if (r > mean) {
      excess += (r - mean);
    }
  }

  const exactRating = (sumRatings + excess) / count;
  const squadRating = Math.floor(exactRating);

  return {
    squadRating,
    exactRating: Math.round(exactRating * 100) / 100,
  };
}
