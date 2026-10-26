import React, { useState } from 'react';
import {
  FC27ConsolePlayer,
  FC27_ACTIVE_SBCS,
  FC27_BRANCHING_EVOLUTIONS,
} from '../data/fc27ConsoleData';
import { TemporalAnchor } from '../utils/timeGrounding';
import { ThreePitchVisualizer } from './ThreePitchVisualizer';
import {
  Shield,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Coins,
  ChevronRight,
  Plus,
  Sliders,
  Layers,
  Award,
  Camera,
  Box,
} from 'lucide-react';

export interface SquadPlayerCard {
  id: string;
  name: string;
  rating: number;
  club: string;
  league: string;
  nation: string;
  position: string;
  rarity: string;
  consolePrice: number;
  itemScore: number;
}

export interface SquadPosition {
  slot: string; // 'GK' | 'LB' | 'LCB' | 'RCB' | 'RB' | 'LDM' | 'RDM' | 'CAM' | 'LW' | 'ST' | 'RW'
  label: string;
  rolePlusPlus: string;
  player: SquadPlayerCard;
  chemPoints: number; // 0..3
}

interface SquadTrackerViewProps {
  t0Anchor: TemporalAnchor;
  userCoins: number | null;
  onUpdateCoins: (newCoins: number) => void;
  clubPlayers: FC27ConsolePlayer[];
  onNavigateToTab: (tabId: string) => void;
  onSimulateInTactics: (title: string, prompt: string) => void;
  simulatedTargetName?: string | null;
}

export const SquadTrackerView: React.FC<SquadTrackerViewProps> = ({
  t0Anchor,
  userCoins,
  onUpdateCoins,
  clubPlayers,
  onNavigateToTab,
  onSimulateInTactics,
  simulatedTargetName,
}) => {
  // Default verified starting XI (4-2-1-3 formation grounded in 2026/27 stars)
  const [squad, setSquad] = useState<SquadPosition[]>([
    {
      slot: 'GK',
      label: 'GK',
      rolePlusPlus: 'Goalkeeper (Defend++)',
      player: {
        id: 'gk-alisson',
        name: 'Alisson',
        rating: 89,
        club: 'Liverpool',
        league: 'Premier League',
        nation: 'Brazil',
        position: 'GK',
        rarity: 'Pristine Holographic',
        consolePrice: 19500,
        itemScore: 133.5,
      },
      chemPoints: 3,
    },
    {
      slot: 'LB',
      label: 'Left Back',
      rolePlusPlus: 'Falseback (Support++)',
      player: {
        id: 'lb-davies',
        name: 'A. Davies',
        rating: 84,
        club: 'FC Bayern München',
        league: 'Bundesliga',
        nation: 'Canada',
        position: 'LB',
        rarity: 'Gold',
        consolePrice: 11000,
        itemScore: 84,
      },
      chemPoints: 3,
    },
    {
      slot: 'LCB',
      label: 'Left Centre-Back',
      rolePlusPlus: 'Defender (Defend++)',
      player: {
        id: 'lcb-gomez',
        name: 'J. Gomez',
        rating: 79,
        club: 'Liverpool',
        league: 'Premier League',
        nation: 'England',
        position: 'CB',
        rarity: 'Gold',
        consolePrice: 1400,
        itemScore: 79,
      },
      chemPoints: 3,
    },
    {
      slot: 'RCB',
      label: 'Right Centre-Back',
      rolePlusPlus: 'Stopper (Defend++)',
      player: {
        id: 'rcb-martinez',
        name: 'Iñigo Martínez',
        rating: 80,
        club: 'FC Barcelona',
        league: 'La Liga',
        nation: 'Spain',
        position: 'CB',
        rarity: 'Gold',
        consolePrice: 1100,
        itemScore: 80,
      },
      chemPoints: 3,
    },
    {
      slot: 'RB',
      label: 'Right Back',
      rolePlusPlus: 'Fullback (Defend++)',
      player: {
        id: 'rb-kounde',
        name: 'J. Koundé',
        rating: 85,
        club: 'FC Barcelona',
        league: 'La Liga',
        nation: 'France',
        position: 'RB',
        rarity: 'Regular Holographic',
        consolePrice: 14000,
        itemScore: 106.25,
      },
      chemPoints: 3,
    },
    {
      slot: 'LDM',
      label: 'Left CDM',
      rolePlusPlus: 'Holding (Defend++)',
      player: {
        id: 'ldm-rodri',
        name: 'Rodri',
        rating: 91,
        club: 'FC Barcelona',
        league: 'La Liga',
        nation: 'Spain',
        position: 'CDM',
        rarity: 'Pristine Holographic',
        consolePrice: 42000,
        itemScore: 136.5,
      },
      chemPoints: 3,
    },
    {
      slot: 'RDM',
      label: 'Right CDM',
      rolePlusPlus: 'Deep-Lying Playmaker (Build-Up++)',
      player: {
        id: 'rdm-szoboszlai',
        name: 'Szoboszlai (Scream)',
        rating: 88,
        club: 'Liverpool',
        league: 'Premier League',
        nation: 'Hungary',
        position: 'CM',
        rarity: 'Ultimate Scream',
        consolePrice: 110000,
        itemScore: 132,
      },
      chemPoints: 3,
    },
    {
      slot: 'CAM',
      label: 'Attacking Midfielder',
      rolePlusPlus: 'Shadow Striker (Attack++)',
      player: {
        id: 'cam-pedri',
        name: 'Pedri',
        rating: 87,
        club: 'FC Barcelona',
        league: 'La Liga',
        nation: 'Spain',
        position: 'CM',
        rarity: 'Regular Holographic',
        consolePrice: 13500,
        itemScore: 108.75,
      },
      chemPoints: 3,
    },
    {
      slot: 'LW',
      label: 'Left Winger',
      rolePlusPlus: 'Inside Forward (Attack++)',
      player: {
        id: 'lw-leao',
        name: 'Rafael Leão',
        rating: 86,
        club: 'AC Milan',
        league: 'Serie A Enilive',
        nation: 'Portugal',
        position: 'LW',
        rarity: 'Gold',
        consolePrice: 16000,
        itemScore: 86,
      },
      chemPoints: 3,
    },
    {
      slot: 'ST',
      label: 'Striker',
      rolePlusPlus: 'Poacher (Attack++)',
      player: {
        id: 'st-mbappe',
        name: 'Kylian Mbappé',
        rating: 91,
        club: 'Real Madrid',
        league: 'La Liga',
        nation: 'France',
        position: 'ST',
        rarity: 'Pristine Holographic',
        consolePrice: 850000,
        itemScore: 136.5,
      },
      chemPoints: 3,
    },
    {
      slot: 'RW',
      label: 'Right Winger',
      rolePlusPlus: 'Winger (Attack++)',
      player: {
        id: 'rw-raphinha',
        name: 'Raphinha (Scream)',
        rating: 90,
        club: 'FC Barcelona',
        league: 'La Liga',
        nation: 'Brazil',
        position: 'RW',
        rarity: 'Ultimate Scream',
        consolePrice: 420000,
        itemScore: 135,
      },
      chemPoints: 3,
    },
  ]);

  // Selected player slot to inspect or swap
  const [selectedSlot, setSelectedSlot] = useState<string>('LCB');
  const [pitchViewMode, setPitchViewMode] = useState<'2D_TACTICAL' | '3D_STADIUM'>('2D_TACTICAL');

  // Simulation test upgrade candidates:
  const simulationCandidates = [
    {
      id: 'sim-otamendi',
      name: '85 Nicolás Otamendi (SBC)',
      type: 'PLAYER_SBC',
      slotTarget: 'LCB',
      rating: 85,
      cost: 24500,
      rolePlusPlus: 'Stopper (Defend++)',
      pros: 'Elite +6 rating leap over 79 Gomez, cheap 24.5k cost, strong La Liga/Argentine links',
      newEffectiveScore: 88,
    },
    {
      id: 'sim-speedbump-pavard',
      name: '85 Benjamin Pavard (Speed Bump Evo)',
      type: 'EVOLUTION',
      slotTarget: 'LCB',
      rating: 85,
      cost: 0,
      rolePlusPlus: 'Ball-Playing Defender (Defend++)',
      pros: 'Zero coin cost, boosts 80 Pavard to 85 OVR with Slide Tackle+ & Stop Sign PlayStyle+',
      newEffectiveScore: 89,
    },
    {
      id: 'sim-jill-scott',
      name: '87 Jill Scott (Free Objective)',
      type: 'FREE_OBJECTIVE',
      slotTarget: 'LCB',
      rating: 87,
      cost: 0,
      rolePlusPlus: 'Holding (Defend++) / Defender++',
      pros: 'Free card in Squad Battles/Rivals, fits CB/CDM/CM, massive physical aerial presence',
      newEffectiveScore: 90,
    },
    {
      id: 'sim-bobby-moore',
      name: '85 Bobby Moore (SBC)',
      type: 'PLAYER_SBC',
      slotTarget: 'LCB',
      rating: 85,
      cost: 48000,
      rolePlusPlus: 'Ball-Playing Defender (Defend++)',
      pros: '90 defending, Anticipate+ Icon links, but costs 48k (requires saving 13k more coins)',
      newEffectiveScore: 88,
    },
  ];

  const [activeSimulationId, setActiveSimulationId] = useState<string>(
    simulatedTargetName && simulatedTargetName.includes('Pavard')
      ? 'sim-speedbump-pavard'
      : 'sim-otamendi'
  );

  const selectedSlotData = squad.find((s) => s.slot === selectedSlot);
  const activeSim = simulationCandidates.find((c) => c.id === activeSimulationId);

  // Overall squad rating
  const totalRating = Math.round(
    squad.reduce((sum, item) => sum + item.player.rating, 0) / squad.length
  );
  const totalChem = squad.reduce((sum, item) => sum + item.chemPoints, 0);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION: SQUAD OVERVIEW & WALLET */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[#00ff87] font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
            Active Starting XI & Live Upgrade Simulator · Formation 4-2-1-3
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">
            Dynamic Squad Tracker & Role++ Chemistry Pitch
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track your current 11, audit your weakest positions, and simulate the exact tactical &
            chemistry impact of active SBCs (85 Otamendi, 85 Moore) and live Evolutions (Speed Bump Pavard).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-right">
            <div className="text-[11px] text-slate-400">Total Squad Chemistry</div>
            <div className="text-lg font-bold font-mono text-[#00ff87]">
              {totalChem} / 33 Chem (Max)
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-right">
            <div className="text-[11px] text-slate-400">Starting XI OVR</div>
            <div className="text-lg font-bold font-mono text-white">
              {totalRating} OVR
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-right">
            <div className="text-[11px] text-slate-400">Xbox Series S Coins</div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {userCoins !== null ? `${userCoins.toLocaleString()}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN GRID: 4-2-1-3 PITCH BOARD (LEFT) & SIMULATION / WEAK LINK AUDIT (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PITCH VISUALIZER (COL-SPAN 7) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* View Mode Switcher Header */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00ff87]" />
              Formation 4-2-1-3 Pitch Viewport
            </span>

            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setPitchViewMode('2D_TACTICAL')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  pitchViewMode === '2D_TACTICAL'
                    ? 'bg-[#00ff87] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2D Tactical Board
              </button>
              <button
                type="button"
                onClick={() => setPitchViewMode('3D_STADIUM')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  pitchViewMode === '3D_STADIUM'
                    ? 'bg-[#00ff87] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-[#00ff87]" />
                <span>3D Stadium (Three.js)</span>
              </button>
            </div>
          </div>

          {pitchViewMode === '3D_STADIUM' ? (
            <ThreePitchVisualizer
              squad={squad}
              selectedSlot={selectedSlot}
              weakestSlot="LCB"
              onSelectPlayer={(slot) => setSelectedSlot(slot)}
              onRunTacticalAdvice={(p) =>
                onSimulateInTactics(
                  '3D Tactical Card Upgrade Analysis',
                  `Analyze Xbox Series S upgrade options for ${p} in my Starting XI.`
                )
              }
            />
          ) : (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[640px]">
              {/* Pitch Markings Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-full" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2" />
                {/* Penalty boxes */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 border-b-2 border-x-2 border-white rounded-b-lg" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-32 border-t-2 border-x-2 border-white rounded-t-lg" />
              </div>

              <div className="relative z-10 flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#00ff87]" />
                  4-2-1-3 Competitive Setup
                </span>
                <span className="text-[11px] font-mono text-amber-400">
                  Click any slot to inspect or simulate upgrade
                </span>
              </div>

          {/* SQUAD POSITIONS RENDERED BY TACTICAL ROWS */}
          <div className="relative z-10 flex-1 flex flex-col justify-between py-2 space-y-6">
            {/* ROW 1: ATTACKERS (LW, ST, RW) */}
            <div className="grid grid-cols-3 gap-3">
              {['LW', 'ST', 'RW'].map((slotKey) => {
                const pos = squad.find((s) => s.slot === slotKey)!;
                const isSelected = selectedSlot === slotKey;
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => setSelectedSlot(slotKey)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg shadow-[#00ff87]/20 scale-105'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-slate-400">{pos.label}</div>
                    <div className="flex items-center justify-center gap-1.5 my-1">
                      <span className="text-base font-extrabold text-white">
                        {pos.player.rating}
                      </span>
                      <span className="text-xs font-bold text-[#00ff87] truncate max-w-[90px]">
                        {pos.player.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{pos.player.club}</div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-mono text-amber-400">
                      {'●'.repeat(pos.chemPoints)} Chem
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ROW 2: ATTACKING MIDFIELDER (CAM) */}
            <div className="flex justify-center">
              {['CAM'].map((slotKey) => {
                const pos = squad.find((s) => s.slot === slotKey)!;
                const isSelected = selectedSlot === slotKey;
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => setSelectedSlot(slotKey)}
                    className={`w-48 p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg shadow-[#00ff87]/20 scale-105'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-slate-400">{pos.label}</div>
                    <div className="flex items-center justify-center gap-1.5 my-1">
                      <span className="text-base font-extrabold text-white">
                        {pos.player.rating}
                      </span>
                      <span className="text-xs font-bold text-[#00ff87] truncate">
                        {pos.player.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{pos.player.club}</div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-mono text-amber-400">
                      {'●'.repeat(pos.chemPoints)} Chem · {pos.rolePlusPlus.split(' ')[0]}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ROW 3: DOUBLE PIVOT CDMs (LDM, RDM) */}
            <div className="grid grid-cols-2 gap-8 px-12">
              {['LDM', 'RDM'].map((slotKey) => {
                const pos = squad.find((s) => s.slot === slotKey)!;
                const isSelected = selectedSlot === slotKey;
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => setSelectedSlot(slotKey)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg shadow-[#00ff87]/20 scale-105'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-slate-400">{pos.label}</div>
                    <div className="flex items-center justify-center gap-1.5 my-1">
                      <span className="text-base font-extrabold text-white">
                        {pos.player.rating}
                      </span>
                      <span className="text-xs font-bold text-[#00ff87] truncate max-w-[100px]">
                        {pos.player.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{pos.player.club}</div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-mono text-amber-400">
                      {'●'.repeat(pos.chemPoints)} Chem · Role++
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ROW 4: BACK FOUR (LB, LCB, RCB, RB) */}
            <div className="grid grid-cols-4 gap-2">
              {['LB', 'LCB', 'RCB', 'RB'].map((slotKey) => {
                const pos = squad.find((s) => s.slot === slotKey)!;
                const isSelected = selectedSlot === slotKey;
                const isWeakest = slotKey === 'LCB'; // Gomez 79 is lowest rated in XI
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => setSelectedSlot(slotKey)}
                    className={`p-2 rounded-xl border text-center transition-all relative ${
                      isSelected
                        ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg shadow-[#00ff87]/20 scale-105'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isWeakest && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                        Weakest Link
                      </span>
                    )}
                    <div className="text-[9px] font-mono text-slate-400">{pos.slot}</div>
                    <div className="flex items-center justify-center gap-1 my-0.5">
                      <span className="text-sm font-extrabold text-white">
                        {pos.player.rating}
                      </span>
                      <span className="text-[11px] font-bold text-[#00ff87] truncate max-w-[65px]">
                        {pos.player.name}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">{pos.player.club}</div>
                    <div className="mt-0.5 text-[8px] font-mono text-amber-400">
                      {'●'.repeat(pos.chemPoints)} Chem
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ROW 5: GOALKEEPER (GK) */}
            <div className="flex justify-center">
              {['GK'].map((slotKey) => {
                const pos = squad.find((s) => s.slot === slotKey)!;
                const isSelected = selectedSlot === slotKey;
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => setSelectedSlot(slotKey)}
                    className={`w-40 p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg shadow-[#00ff87]/20 scale-105'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[9px] font-mono text-slate-400">{pos.label}</div>
                    <div className="flex items-center justify-center gap-1.5 my-0.5">
                      <span className="text-sm font-extrabold text-white">
                        {pos.player.rating}
                      </span>
                      <span className="text-xs font-bold text-[#00ff87]">
                        {pos.player.name}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">{pos.player.club}</div>
                    <div className="mt-0.5 text-[8px] font-mono text-amber-400">
                      {'●'.repeat(pos.chemPoints)} Chem
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>

        {/* RIGHT COLUMN: SLOT AUDIT + LIVE SBC/EVO SIMULATION BENCH (COL-SPAN 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* INSPECTED SLOT CARD */}
          {selectedSlotData && (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-mono text-[#00ff87]">INSPECTED STARTING SLOT</div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedSlotData.label} ({selectedSlotData.slot})
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-amber-400 font-bold">
                  {selectedSlotData.chemPoints}/3 Chem
                </span>
              </div>

              {/* Current Player in Slot */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-white mr-2">
                      {selectedSlotData.player.rating}
                    </span>
                    <span className="text-base font-bold text-white">
                      {selectedSlotData.player.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#00ff87]">
                    Item Score: {selectedSlotData.player.itemScore} pts
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  {selectedSlotData.player.club} · {selectedSlotData.player.league} ·{' '}
                  {selectedSlotData.player.nation}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-semibold">
                    {selectedSlotData.rolePlusPlus}
                  </span>
                  <span className="text-slate-400">
                    Console: {selectedSlotData.player.consolePrice.toLocaleString()} Coins
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION TEST-SWAP BENCH */}
          <div className="bg-[#111827] border border-[#00ff87]/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-mono text-[#00ff87] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00ff87]" />
                  LIVE UPGRADE SIMULATION ENGINE
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Simulate Replacement for {selectedSlot}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">T=0 Live Targets</span>
            </div>

            {/* Candidate Selector */}
            <div className="space-y-2.5">
              {simulationCandidates.map((cand) => {
                const isActive = cand.id === activeSimulationId;
                const canAfford = userCoins !== null && cand.cost <= userCoins;
                return (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => setActiveSimulationId(cand.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all space-y-1.5 ${
                      isActive
                        ? 'bg-slate-900 border-[#00ff87] ring-1 ring-[#00ff87]/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                            cand.type === 'EVOLUTION'
                              ? 'bg-purple-500/20 text-purple-300'
                              : cand.type === 'FREE_OBJECTIVE'
                              ? 'bg-[#00ff87]/20 text-[#00ff87]'
                              : 'bg-amber-400/20 text-amber-300'
                          }`}
                        >
                          {cand.type.replace('_', ' ')}
                        </span>
                        {cand.name}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          cand.cost === 0
                            ? 'text-[#00ff87]'
                            : canAfford
                            ? 'text-[#00ff87]'
                            : 'text-amber-400'
                        }`}
                      >
                        {cand.cost === 0 ? '0 Coins (Free)' : `${cand.cost.toLocaleString()} Coins`}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed">{cand.pros}</div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Role: {cand.rolePlusPlus}</span>
                      <span className="text-[#00ff87] font-bold">
                        Simulated OVR: {cand.rating}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* LIVE DELTA COMPARISON SUMMARY */}
            {activeSim && selectedSlotData && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Simulation Verdict for {selectedSlotData.player.name}</span>
                  <span className="text-[#00ff87] font-mono">
                    +{activeSim.rating - selectedSlotData.player.rating} OVR Delta
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">Current OVR</div>
                    <div className="text-base font-bold text-slate-300">
                      {selectedSlotData.player.rating} OVR
                    </div>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded border border-[#00ff87]/40">
                    <div className="text-[10px] text-[#00ff87]">Simulated OVR</div>
                    <div className="text-base font-bold text-[#00ff87]">
                      {activeSim.rating} OVR
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeSim.type === 'EVOLUTION') {
                        onNavigateToTab('EVOLUTIONS');
                      } else {
                        onNavigateToTab('DUAL_SBCS');
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg transition-colors text-center"
                  >
                    Open in {activeSim.type === 'EVOLUTION' ? 'Live Evolutions' : 'SBC Hub'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSimulateInTactics(
                        `Squad Upgrade Simulation: ${activeSim.name}`,
                        `Audit swapping ${selectedSlotData.player.name} (${selectedSlotData.player.rating} OVR) with ${activeSim.name} in slot ${selectedSlot}. My verified budget is 35,000 Xbox Series S coins. Calculate exact chemistry delta, 5% EA tax break-even if selling the replaced player, and Role++ tactical compatibility with Rodri in 4-2-1-3.`
                      )
                    }
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Ask Tactical AI
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
