import React, { useState, useMemo } from 'react';
import { SquadPosition, SquadPlayerCard } from './SquadTrackerView';
import {
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
  Sliders,
  Search,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Award,
  Flame,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export interface FutbinUpgradeCandidate {
  id: string;
  name: string;
  rating: number;
  position: string;
  altPositions: string[];
  club: string;
  league: string;
  nation: string;
  rarity: string;
  consolePrice: number;
  rolePlusPlus: string;
  playStylePlus: string[];
  playStylesRegular: string[];
  acceleRate: string;
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  recommendedChemStyle: string;
  futbinUrl: string;
  isBenchOption?: boolean;
  upgradeReason: string;
}

export type ChemistryStyle =
  | 'BASIC'
  | 'SHADOW'
  | 'HUNTER'
  | 'ANCHOR'
  | 'ENGINE'
  | 'CATALYST'
  | 'HAWK'
  | 'FINISHER'
  | 'GUARDIAN'
  | 'SENTINEL';

const CHEM_STYLE_BOOSTS: Record<
  ChemistryStyle,
  { label: string; boostSummary: string; boosts: { pac: number; sho: number; pas: number; dri: number; def: number; phy: number } }
> = {
  BASIC: {
    label: 'Basic',
    boostSummary: '+1 to all face attributes',
    boosts: { pac: 1, sho: 1, pas: 1, dri: 1, def: 1, phy: 1 },
  },
  SHADOW: {
    label: 'Shadow (Meta Defender)',
    boostSummary: '+8 Pace, +7 Defending',
    boosts: { pac: 8, sho: 0, pas: 0, dri: 0, def: 7, phy: 0 },
  },
  HUNTER: {
    label: 'Hunter (Meta Attacker)',
    boostSummary: '+8 Pace, +6 Shooting',
    boosts: { pac: 8, sho: 6, pas: 0, dri: 0, def: 0, phy: 0 },
  },
  ANCHOR: {
    label: 'Anchor (Physical Defender)',
    boostSummary: '+4 Pace, +6 Defending, +6 Physical',
    boosts: { pac: 4, sho: 0, pas: 0, dri: 0, def: 6, phy: 6 },
  },
  ENGINE: {
    label: 'Engine (Playmaker / Winger)',
    boostSummary: '+4 Pace, +6 Passing, +6 Dribbling',
    boosts: { pac: 4, sho: 0, pas: 6, dri: 6, def: 0, phy: 0 },
  },
  CATALYST: {
    label: 'Catalyst (Pacing Passer)',
    boostSummary: '+8 Pace, +7 Passing',
    boosts: { pac: 8, sho: 0, pas: 7, dri: 0, def: 0, phy: 0 },
  },
  HAWK: {
    label: 'Hawk (Power Forward)',
    boostSummary: '+4 Pace, +5 Shooting, +5 Physical',
    boosts: { pac: 4, sho: 5, pas: 0, dri: 0, def: 0, phy: 5 },
  },
  FINISHER: {
    label: 'Finisher (Close-Range Dribbler)',
    boostSummary: '+6 Shooting, +7 Dribbling',
    boosts: { pac: 0, sho: 6, pas: 0, dri: 7, def: 0, phy: 0 },
  },
  GUARDIAN: {
    label: 'Guardian (Technical Defender)',
    boostSummary: '+6 Dribbling, +7 Defending',
    boosts: { pac: 0, sho: 0, pas: 0, dri: 6, def: 7, phy: 0 },
  },
  SENTINEL: {
    label: 'Sentinel (Rock Solid Defense)',
    boostSummary: '+7 Defending, +7 Physical',
    boosts: { pac: 0, sho: 0, pas: 0, dri: 0, def: 7, phy: 7 },
  },
};

// Curated 2026/27 FUTBIN Meta Upgrade Targets for Kit's Squad
const FUTBIN_UPGRADE_DATABASE: Record<string, FutbinUpgradeCandidate[]> = {
  LB: [
    {
      id: 'theo-hernandez-87',
      name: 'Theo Hernández',
      rating: 87,
      position: 'LB',
      altPositions: ['LWB', 'LM'],
      club: 'AC Milan',
      league: 'Serie A Enilive',
      nation: 'France',
      rarity: 'Regular Holographic',
      consolePrice: 78000,
      rolePlusPlus: 'Falseback (Support++)',
      playStylePlus: ['Quick Step+'],
      playStylesRegular: ['Rapid', 'Whipped Cross', 'Bruiser', 'Relentless'],
      acceleRate: 'Controlled Lengthy',
      stats: { pace: 95, shooting: 73, passing: 77, dribbling: 84, defending: 81, physical: 89 },
      recommendedChemStyle: 'ANCHOR',
      futbinUrl: 'https://www.futbin.com/27/player/theo-hernandez',
      upgradeReason: '+12 Pace and massive +16 Physical presence over Keane Lewis-Potter. Links with French stars Lacroix & Barcola.',
    },
    {
      id: 'bench-lewis-skelly-85',
      name: 'Myles Lewis-Skelly',
      rating: 85,
      position: 'LB',
      altPositions: ['CDM', 'CM'],
      club: 'Arsenal',
      league: 'Premier League',
      nation: 'England',
      rarity: 'Regular Holographic',
      consolePrice: 15000,
      rolePlusPlus: 'Falseback (Build-Up++)',
      playStylePlus: ['Incisive Pass+'],
      playStylesRegular: ['Tiki Taka', 'Intercept', 'Press Proven', 'Relentless'],
      acceleRate: 'Mostly Explosive',
      stats: { pace: 84, shooting: 68, passing: 83, dribbling: 84, defending: 83, physical: 86 },
      recommendedChemStyle: 'SHADOW',
      futbinUrl: 'https://www.futbin.com/27/player/lewis-skelly',
      isBenchOption: true,
      upgradeReason: 'FREE INTERNAL UPGRADE! Already on your bench. Gives +3 Defending and +13 Physical over Lewis-Potter, with elite Arsenal links to Saka.',
    },
    {
      id: 'mendy-83',
      name: 'Ferland Mendy',
      rating: 83,
      position: 'LB',
      altPositions: ['LWB'],
      club: 'Real Madrid',
      league: 'La Liga',
      nation: 'France',
      rarity: 'Gold',
      consolePrice: 32000,
      rolePlusPlus: 'Fullback (Defend++)',
      playStylePlus: ['Anticipate+'],
      playStylesRegular: ['Quick Step', 'Intercept', 'Bruiser'],
      acceleRate: 'Mostly Lengthy',
      stats: { pace: 92, shooting: 64, passing: 77, dribbling: 80, defending: 84, physical: 86 },
      recommendedChemStyle: 'ANCHOR',
      futbinUrl: 'https://www.futbin.com/27/player/ferland-mendy',
      upgradeReason: '5-star Weak Foot lockdown fullback with Anticipate+ tackle animations. Strong link to Barcola and Lacroix.',
    },
  ],
  RCB: [
    {
      id: 'saliba-87',
      name: 'William Saliba',
      rating: 87,
      position: 'CB',
      altPositions: [],
      club: 'Arsenal',
      league: 'Premier League',
      nation: 'France',
      rarity: 'Regular Holographic',
      consolePrice: 85000,
      rolePlusPlus: 'Defender (Defend++)',
      playStylePlus: ['Anticipate+'],
      playStylesRegular: ['Intercept', 'Slide Tackle', 'Aerial', 'Bruiser'],
      acceleRate: 'Mostly Lengthy',
      stats: { pace: 82, shooting: 39, passing: 72, dribbling: 74, defending: 88, physical: 84 },
      recommendedChemStyle: 'SHADOW',
      futbinUrl: 'https://www.futbin.com/27/player/william-saliba',
      upgradeReason: '+4 Defending upgrade over Lacroix with elite Anticipate+ playstyle. Perfect Premier League link with Saka and France link with Barcola.',
    },
    {
      id: 'bench-pavard-evo-85',
      name: 'Benjamin Pavard (Speed Bump Evo)',
      rating: 85,
      position: 'CB',
      altPositions: ['RB'],
      club: 'Inter Milan',
      league: 'Serie A',
      nation: 'France',
      rarity: 'Evolution',
      consolePrice: 0,
      rolePlusPlus: 'Ball-Playing Defender (Defend++)',
      playStylePlus: ['Slide Tackle+'],
      playStylesRegular: ['Intercept', 'Block', 'Anticipate', 'Relentless'],
      acceleRate: 'Controlled Lengthy',
      stats: { pace: 83, shooting: 70, passing: 81, dribbling: 76, defending: 87, physical: 85 },
      recommendedChemStyle: 'SHADOW',
      futbinUrl: 'https://www.futbin.com/27/player/benjamin-pavard',
      isBenchOption: true,
      upgradeReason: 'FREE EVOLUTION UPGRADE! Boosts your bench 83 Pavard into an 85 monster with 87 Defending and 81 Passing.',
    },
    {
      id: 'sbc-otamendi-85',
      name: 'Nicolás Otamendi (Player SBC)',
      rating: 85,
      position: 'CB',
      altPositions: [],
      club: 'Benfica',
      league: 'Liga Portugal',
      nation: 'Argentina',
      rarity: 'SBC Premium',
      consolePrice: 24500,
      rolePlusPlus: 'Stopper (Defend++)',
      playStylePlus: ['Bruiser+'],
      playStylesRegular: ['Block', 'Aerial', 'Slide Tackle'],
      acceleRate: 'Lengthy',
      stats: { pace: 78, shooting: 54, passing: 68, dribbling: 66, defending: 87, physical: 88 },
      recommendedChemStyle: 'SHADOW',
      futbinUrl: 'https://www.futbin.com/27/sbc/nicolas-otamendi',
      upgradeReason: 'Aggressive ball-winner with 88 Physical and Bruiser+. Easy 24.5k SBC completion within your 35k wallet.',
    },
  ],
  RB: [
    {
      id: 'frimpong-86',
      name: 'Jeremie Frimpong',
      rating: 86,
      position: 'RB',
      altPositions: ['RWB', 'RM'],
      club: 'Bayer 04 Leverkusen',
      league: 'Bundesliga',
      nation: 'Netherlands',
      rarity: 'Regular Holographic',
      consolePrice: 48000,
      rolePlusPlus: 'Fullback (Attack++)',
      playStylePlus: ['Rapid+'],
      playStylesRegular: ['Quick Step', 'Relentless', 'Whipped Cross'],
      acceleRate: 'Mostly Explosive',
      stats: { pace: 96, shooting: 71, passing: 79, dribbling: 87, defending: 79, physical: 74 },
      recommendedChemStyle: 'ANCHOR',
      futbinUrl: 'https://www.futbin.com/27/player/jeremie-frimpong',
      upgradeReason: 'Fastest fullback in FC 27 (96 Pace) with Rapid+. Strong Bundesliga connection with Schlotterbeck & Kobel.',
    },
    {
      id: 'bench-timber-84',
      name: 'Jurriën Timber',
      rating: 84,
      position: 'RB',
      altPositions: ['CB', 'LB'],
      club: 'Arsenal',
      league: 'Premier League',
      nation: 'Netherlands',
      rarity: 'Gold',
      consolePrice: 6500,
      rolePlusPlus: 'Fullback (Defend++)',
      playStylePlus: ['Intercept+'],
      playStylesRegular: ['Block', 'Slide Tackle', 'Relentless'],
      acceleRate: 'Controlled Lengthy',
      stats: { pace: 83, shooting: 52, passing: 78, dribbling: 80, defending: 85, physical: 82 },
      recommendedChemStyle: 'SHADOW',
      futbinUrl: 'https://www.futbin.com/27/player/jurrien-timber',
      isBenchOption: true,
      upgradeReason: 'FREE BENCH OPTION! Superior defensive awareness (+4 Defending over Spence) and Arsenal chemistry link with Saka.',
    },
  ],
  CAM: [
    {
      id: 'odegaard-89',
      name: 'Martin Ødegaard',
      rating: 89,
      position: 'CAM',
      altPositions: ['CM'],
      club: 'Arsenal',
      league: 'Premier League',
      nation: 'Norway',
      rarity: 'Pristine Holographic',
      consolePrice: 42000,
      rolePlusPlus: 'Wide Playmaker (Attack++)',
      playStylePlus: ['Incisive Pass+'],
      playStylesRegular: ['Dead Ball', 'Technical', 'Flair', 'Tiki Taka'],
      acceleRate: 'Controlled',
      stats: { pace: 76, shooting: 82, passing: 90, dribbling: 89, defending: 66, physical: 67 },
      recommendedChemStyle: 'HUNTER',
      futbinUrl: 'https://www.futbin.com/27/player/martin-odegaard',
      upgradeReason: '+5 OVR jump over Tzolis with world-class 90 Passing and Incisive Pass+. Perfect chemistry link with Bukayo Saka.',
    },
    {
      id: 'musiala-88',
      name: 'Jamal Musiala',
      rating: 88,
      position: 'CAM',
      altPositions: ['CM', 'LM'],
      club: 'FC Bayern München',
      league: 'Bundesliga',
      nation: 'Germany',
      rarity: 'Pristine Holographic',
      consolePrice: 38000,
      rolePlusPlus: 'Shadow Striker (Attack++)',
      playStylePlus: ['Technical+'],
      playStylesRegular: ['First Touch', 'Trickster', 'Relentless'],
      acceleRate: 'Mostly Explosive',
      stats: { pace: 85, shooting: 82, passing: 83, dribbling: 91, defending: 65, physical: 70 },
      recommendedChemStyle: 'HUNTER',
      futbinUrl: 'https://www.futbin.com/27/player/jamal-musiala',
      upgradeReason: 'Elite 91 Dribbling with Technical+ for tight-box skill dribbling. German link with Schlotterbeck & Anyomi.',
    },
  ],
  ST: [
    {
      id: 'bench-isak-86',
      name: 'Alexander Isak',
      rating: 86,
      position: 'ST',
      altPositions: ['CF'],
      club: 'Newcastle United',
      league: 'Premier League',
      nation: 'Sweden',
      rarity: 'Regular Holographic',
      consolePrice: 22000,
      rolePlusPlus: 'Advanced Forward (Attack++)',
      playStylePlus: ['Finesse Shot+'],
      playStylesRegular: ['Quick Step', 'Rapid', 'Technical', 'Flair'],
      acceleRate: 'Controlled Lengthy',
      stats: { pace: 85, shooting: 87, passing: 78, dribbling: 84, defending: 41, physical: 78 },
      recommendedChemStyle: 'HUNTER',
      futbinUrl: 'https://www.futbin.com/27/player/alexander-isak',
      isBenchOption: true,
      upgradeReason: 'FREE BENCH OPTION! 5-star Weak Foot finisher with Finesse Shot+ trait. Taller 6ft 4in frame for aerial dominance.',
    },
    {
      id: 'bench-cerci-84',
      name: 'Selina Cerci',
      rating: 84,
      position: 'ST',
      altPositions: ['CF', 'CAM'],
      club: 'TSG Hoffenheim',
      league: 'Google Pixel Frauen-Bundesliga',
      nation: 'Germany',
      rarity: 'Gold',
      consolePrice: 4000,
      rolePlusPlus: 'False 9 (Support++)',
      playStylePlus: ['First Touch+'],
      playStylesRegular: ['Finesse Shot', 'Technical', 'Relentless'],
      acceleRate: 'Mostly Explosive',
      stats: { pace: 87, shooting: 85, passing: 78, dribbling: 86, defending: 40, physical: 75 },
      recommendedChemStyle: 'HUNTER',
      futbinUrl: 'https://www.futbin.com/27/player/selina-cerci',
      isBenchOption: true,
      upgradeReason: 'FREE BENCH OPTION! Deep-dropping False 9++ striker that creates space for Barcola & Saka cutting in.',
    },
  ],
  LDM: [
    {
      id: 'rodri-91',
      name: 'Rodri',
      rating: 91,
      position: 'CDM',
      altPositions: ['CM'],
      club: 'FC Barcelona',
      league: 'La Liga',
      nation: 'Spain',
      rarity: 'Pristine Holographic',
      consolePrice: 42000,
      rolePlusPlus: 'Holding (Defend++)',
      playStylePlus: ['Anticipate+'],
      playStylesRegular: ['Incisive Pass', 'Long Ball Pass', 'Intercept', 'Bruiser'],
      acceleRate: 'Controlled Lengthy',
      stats: { pace: 68, shooting: 78, passing: 87, dribbling: 84, defending: 88, physical: 86 },
      recommendedChemStyle: 'SHADOW',
      futbinUrl: 'https://www.futbin.com/27/player/rodri',
      upgradeReason: 'Ultimate midfield general with 88 Defending, 87 Passing, and Anticipate+. 2026/27 FC Barcelona star.',
    },
    {
      id: 'scott-87',
      name: 'Jill Scott (Free Objective)',
      rating: 87,
      position: 'CDM',
      altPositions: ['CB', 'CM'],
      club: 'Manchester City',
      league: "Barclays Women's Super League",
      nation: 'England',
      rarity: 'Objective Reward',
      consolePrice: 0,
      rolePlusPlus: 'Holding (Defend++)',
      playStylePlus: ['Bruiser+'],
      playStylesRegular: ['Intercept', 'Aerial', 'Relentless'],
      acceleRate: 'Lengthy',
      stats: { pace: 79, shooting: 74, passing: 82, dribbling: 81, defending: 87, physical: 88 },
      recommendedChemStyle: 'SHADOW',
      futbinUrl: 'https://www.futbin.com/27/objectives/jill-scott',
      upgradeReason: '100% FREE OBJECTIVE in Rivals/Squad Battles. Physical 88 powerhouse with Bruiser+ and English links to Saka & Lewis-Potter.',
    },
  ],
};

interface FutbinUpgradeExplorerProps {
  squad: SquadPosition[];
  bench: SquadPlayerCard[];
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  onSwapPlayer: (slot: string, player: SquadPlayerCard) => void;
  onAskTacticalAi: (query: string) => void;
}

export const FutbinUpgradeExplorer: React.FC<FutbinUpgradeExplorerProps> = ({
  squad,
  bench,
  selectedSlot,
  onSelectSlot,
  onSwapPlayer,
  onAskTacticalAi,
}) => {
  const [selectedChemStyle, setSelectedChemStyle] = useState<ChemistryStyle>('SHADOW');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');

  const currentStarter = squad.find((s) => s.slot === selectedSlot);
  const availableCandidates = FUTBIN_UPGRADE_DATABASE[selectedSlot] || [];

  const activeCandidate = useMemo(() => {
    if (selectedCandidateId) {
      const found = availableCandidates.find((c) => c.id === selectedCandidateId);
      if (found) return found;
    }
    return availableCandidates[0] || null;
  }, [availableCandidates, selectedCandidateId]);

  // Compute projected face stats under active Chemistry Style
  const boost = CHEM_STYLE_BOOSTS[selectedChemStyle].boosts;

  const boostedCandidateStats = useMemo(() => {
    if (!activeCandidate) return null;
    return {
      pace: Math.min(99, activeCandidate.stats.pace + boost.pac),
      shooting: Math.min(99, activeCandidate.stats.shooting + boost.sho),
      passing: Math.min(99, activeCandidate.stats.passing + boost.pas),
      dribbling: Math.min(99, activeCandidate.stats.dribbling + boost.dri),
      defending: Math.min(99, activeCandidate.stats.defending + boost.def),
      physical: Math.min(99, activeCandidate.stats.physical + boost.phy),
    };
  }, [activeCandidate, boost]);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="text-xs text-[#00ff87] font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00ff87]" />
            <span>FUTBIN Tactical Upgrade &amp; Chemistry Lab</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            Explore PlayStyles, Roles &amp; Upgrades for Slot: {selectedSlot}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit high-synergy replacements for your starting XI, test projected Chemistry Style stat boosts, and explore meta PlayStyles+ on FUTBIN.
          </p>
        </div>

        {/* Slot Selection Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['LB', 'RCB', 'RB', 'LDM', 'CAM', 'ST'].map((slotKey) => {
            const pos = squad.find((s) => s.slot === slotKey);
            const isSelected = selectedSlot === slotKey;
            return (
              <button
                key={slotKey}
                type="button"
                onClick={() => {
                  onSelectSlot(slotKey);
                  setSelectedCandidateId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {slotKey} · {pos?.player.name.split(' ').pop()}
              </button>
            );
          })}
        </div>
      </div>

      {/* TWO-COLUMN EXPLORER: CURRENT VS UPGRADE (LEFT) & CANDIDATE SELECTOR + CHEM LAB (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: HEAD-TO-HEAD COMPARISON & PROJECTED STATS (COL-SPAN 7) */}
        <div className="lg:col-span-7 space-y-4">
          {currentStarter && activeCandidate ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
              {/* Card Header Comparison */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
                {/* Current Starter */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Current Starting {selectedSlot}</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-white">{currentStarter.player.name}</span>
                    <span className="text-lg font-black text-slate-300">{currentStarter.player.rating}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {currentStarter.player.club} · {currentStarter.player.league}
                  </div>
                  <div className="text-[11px] font-mono text-amber-400 pt-1">
                    Role: {currentStarter.rolePlusPlus}
                  </div>
                </div>

                {/* Candidate Upgrade */}
                <div className="bg-slate-900/90 border border-[#00ff87]/40 rounded-lg p-3 space-y-1 relative overflow-hidden">
                  {activeCandidate.isBenchOption && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold">
                      Club Bench Option
                    </span>
                  )}
                  <div className="text-[10px] font-mono text-[#00ff87] uppercase">FUTBIN Upgrade Target</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-white">{activeCandidate.name}</span>
                    <span className="text-lg font-black text-[#00ff87]">
                      {activeCandidate.rating} OVR
                      <span className="text-xs font-mono ml-1 text-[#00ff87]">
                        (+{activeCandidate.rating - currentStarter.player.rating})
                      </span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {activeCandidate.club} · {activeCandidate.league} · {activeCandidate.nation}
                  </div>
                  <div className="text-[11px] font-mono text-[#00ff87] pt-1">
                    Role: {activeCandidate.rolePlusPlus}
                  </div>
                </div>
              </div>

              {/* TACTICAL PLAYSTYLES & ROLES BREAKDOWN */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>PlayStyles &amp; Sprint Mechanics</span>
                  <span className="text-slate-500">Max 3 PS+ Cap Verified</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* PlayStyles+ */}
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>PlayStyles+ (Signature Abilities)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCandidate.playStylePlus.map((ps) => (
                        <span
                          key={ps}
                          className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold text-[10px]"
                        >
                          {ps}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Regular PlayStyles & AcceleRATE */}
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-400" />
                      <span>Sprint Profile &amp; Regular Traits</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      AcceleRATE: <span className="font-mono text-white font-semibold">{activeCandidate.acceleRate}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeCandidate.playStylesRegular.map((ps) => (
                        <span
                          key={ps}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                        >
                          {ps}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE CHEMISTRY STYLE TESTER */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-[#00ff87] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Projected Stats Under Chemistry Style</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {CHEM_STYLE_BOOSTS[selectedChemStyle].boostSummary}
                  </span>
                </div>

                {/* Chemistry Style Selector Bar */}
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(CHEM_STYLE_BOOSTS) as ChemistryStyle[]).map((csKey) => {
                    const isSelected = selectedChemStyle === csKey;
                    return (
                      <button
                        key={csKey}
                        type="button"
                        onClick={() => setSelectedChemStyle(csKey)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#00ff87] text-slate-950 font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {CHEM_STYLE_BOOSTS[csKey].label.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>

                {/* Boosted Stats Grid */}
                {boostedCandidateStats && (
                  <div className="grid grid-cols-6 gap-2 text-center pt-2">
                    {[
                      { label: 'PAC', base: activeCandidate.stats.pace, boosted: boostedCandidateStats.pace, boost: boost.pac },
                      { label: 'SHO', base: activeCandidate.stats.shooting, boosted: boostedCandidateStats.shooting, boost: boost.sho },
                      { label: 'PAS', base: activeCandidate.stats.passing, boosted: boostedCandidateStats.passing, boost: boost.pas },
                      { label: 'DRI', base: activeCandidate.stats.dribbling, boosted: boostedCandidateStats.dribbling, boost: boost.dri },
                      { label: 'DEF', base: activeCandidate.stats.defending, boosted: boostedCandidateStats.defending, boost: boost.def },
                      { label: 'PHY', base: activeCandidate.stats.physical, boosted: boostedCandidateStats.physical, boost: boost.phy },
                    ].map((st) => (
                      <div
                        key={st.label}
                        className={`p-2 rounded-lg border ${
                          st.boost > 0
                            ? 'bg-emerald-950/30 border-emerald-500/40'
                            : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <div className="text-[10px] font-mono text-slate-400">{st.label}</div>
                        <div className="text-base font-extrabold text-white mt-0.5">
                          {st.boosted}
                        </div>
                        {st.boost > 0 && (
                          <div className="text-[10px] font-mono text-[#00ff87] font-bold">
                            +{st.boost}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TACTICAL UPGRADE REASONING & ACTIONS */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-[#00ff87] mr-1.5">Tactical Verdict:</span>
                  {activeCandidate.upgradeReason}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeCandidate.isBenchOption && (
                    <button
                      type="button"
                      onClick={() => {
                        const benchCard = bench.find((b) => b.name.includes(activeCandidate.name.split(' ').pop() || ''));
                        if (benchCard) {
                          onSwapPlayer(selectedSlot, benchCard);
                        }
                      }}
                      className="py-2 px-3 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Swap {activeCandidate.name} into XI</span>
                    </button>
                  )}

                  <a
                    href={activeCandidate.futbinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>View on FUTBIN</span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      onAskTacticalAi(
                        `Tactical Upgrade Evaluation for ${selectedSlot}: Compare my current ${currentStarter.player.name} (${currentStarter.player.rating} OVR) with ${activeCandidate.name} (${activeCandidate.rating} OVR). How does ${activeCandidate.playStylePlus.join(', ')} fit my 4-2-1-3 formation under FC 27 Title Update #3.1?`
                      )
                    }
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Tactical AI</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs">
              Select a position above to explore tactical upgrades.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CANDIDATE SELECTOR & AI CUSTOM SCOUTER (COL-SPAN 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Candidate Card Picker */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Top Meta Candidates for {selectedSlot}</span>
              <span className="text-[#00ff87]">{availableCandidates.length} Targets</span>
            </div>

            {availableCandidates.map((cand) => {
              const isSelected = activeCandidate?.id === cand.id;
              return (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-900 border-[#00ff87] ring-1 ring-[#00ff87]/50 shadow-md shadow-[#00ff87]/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {cand.name}
                      {cand.isBenchOption && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                          In Bench
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-black text-[#00ff87] text-sm">
                      {cand.rating} OVR
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate">
                    {cand.club} · {cand.rolePlusPlus}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 pt-1 border-t border-slate-800/60">
                    <span>PS+: {cand.playStylePlus.join(', ')}</span>
                    <span className="text-slate-400">Rec Chem: {cand.recommendedChemStyle}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CUSTOM TACTICAL SCOUTER SEARCH */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-mono text-[#00ff87] flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Ask Tactical AI to Scout Custom Upgrades</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Looking for a specific profile (e.g. <i>"French CB with Bruiser+ and mostly lengthy sprint"</i>)? Describe it and AI will search FUTBIN for optimal links.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customSearchQuery.trim()) {
                    onAskTacticalAi(
                      `Scout FC 27 Ultimate Team upgrades on FUTBIN for slot ${selectedSlot}: ${customSearchQuery}. Current starter is ${currentStarter?.player.name}. Focus on PlayStyles+, Roles++, Chemistry Styles, and links for 4-2-1-3.`
                    );
                  }
                }}
                placeholder="e.g. Fast Spanish playmaker with Incisive Pass+..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff87]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customSearchQuery.trim()) {
                    onAskTacticalAi(
                      `Scout FC 27 Ultimate Team upgrades on FUTBIN for slot ${selectedSlot}: ${customSearchQuery}. Current starter is ${currentStarter?.player.name}. Focus on PlayStyles+, Roles++, Chemistry Styles, and links for 4-2-1-3.`
                    );
                  }
                }}
                className="px-3 py-2 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Scout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
