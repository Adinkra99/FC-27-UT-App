import React, { useState } from 'react';
import { FullPlayerProfile } from '../types/playerProfile';
import {
  getDetailedPlayerProfile,
} from '../data/squadPlayerDetailedProfiles';
import {
  CHEMISTRY_STYLES,
  applyChemistryBoost,
  VERIFIED_PLAYER_RECOMMENDATIONS,
} from '../utils/chemistryOptimizer';
import {
  X,
  Sparkles,
  Zap,
  Shield,
  Activity,
  Award,
  ExternalLink,
  RefreshCw,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface PlayerDetailModalProps {
  playerIdentifier: string | null; // ID or player name
  onClose: () => void;
  onSwapRequest?: (playerName: string) => void;
  swapTargetSlot?: string | null;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  playerIdentifier,
  onClose,
  onSwapRequest,
  swapTargetSlot,
}) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'PLAYSTYLES' | 'ROLES' | 'CHEMISTRY'>('STATS');
  const [showBoostedStats, setShowBoostedStats] = useState<boolean>(true);

  if (!playerIdentifier) return null;

  const profile = getDetailedPlayerProfile(playerIdentifier);

  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center space-y-4">
          <Info className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Player Details Loading</h3>
          <p className="text-xs text-slate-400">
            Player profile for <span className="text-[#00ff87] font-semibold">{playerIdentifier}</span> is syncing with the FC 27 console database.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { bio, cardDetails, attributes, playstyles, roles, ledger } = profile;
  const chemRec = VERIFIED_PLAYER_RECOMMENDATIONS[bio.fullName] || VERIFIED_PLAYER_RECOMMENDATIONS[bio.knownAs || ''];

  const optimalStyle = chemRec?.optimalStyle || 'HUNTER';
  const chemBoost = CHEMISTRY_STYLES[optimalStyle] || CHEMISTRY_STYLES.BASIC;

  // Stat color helper
  const getStatColor = (val: number) => {
    if (val >= 90) return 'text-[#00ff87] bg-[#00ff87]/10 border-[#00ff87]/30';
    if (val >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val >= 70) return 'text-amber-300 bg-amber-400/10 border-amber-400/30';
    if (val >= 60) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getBarColor = (val: number) => {
    if (val >= 90) return 'bg-[#00ff87]';
    if (val >= 80) return 'bg-emerald-400';
    if (val >= 70) return 'bg-amber-400';
    if (val >= 60) return 'bg-orange-400';
    return 'bg-rose-500';
  };

  // External database URLs
  const futbinSlug = encodeURIComponent(bio.fullName.toLowerCase().replace(/\s+/g, '-'));
  const futbinUrl = `https://www.futbin.com/27/players?page=1&search=${futbinSlug}`;
  const futggUrl = `https://www.fut.gg/players/?name=${futbinSlug}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-4xl w-full my-auto overflow-hidden shadow-2xl shadow-emerald-500/10 flex flex-col max-h-[92vh]">
        
        {/* HEADER BAR */}
        <div className="bg-[#111827] border-b border-slate-800/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff87] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
              FC 27 Player Intelligence Dossier · {cardDetails.league}
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
              (FUTBIN & FUT.GG Grounded)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onSwapRequest && (
              <button
                type="button"
                onClick={() => onSwapRequest(bio.fullName)}
                className="px-3 py-1 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-black text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#00ff87]/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Swap into {swapTargetSlot || 'Starting XI'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HERO CARD & BIO BANNER */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-[#111827] to-slate-950 border-b border-slate-800/80 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* CARD BADGE DISPLAY */}
          <div className="relative group shrink-0">
            <div className="w-28 h-40 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 rounded-xl p-2.5 text-slate-950 flex flex-col justify-between shadow-xl shadow-amber-500/20 border-2 border-amber-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-black leading-none">{cardDetails.overall}</div>
                  <div className="text-xs font-black uppercase mt-0.5">{cardDetails.primaryPosition}</div>
                </div>
                <div className="text-[9px] font-mono font-bold bg-slate-950 text-amber-300 px-1 py-0.5 rounded">
                  {cardDetails.rarity}
                </div>
              </div>

              <div className="text-center my-auto">
                <div className="text-sm font-black truncate">{bio.knownAs || bio.fullName}</div>
                <div className="text-[10px] font-bold opacity-80 truncate">{cardDetails.club}</div>
              </div>

              <div className="grid grid-cols-3 gap-0.5 text-[8px] font-black border-t border-slate-950/30 pt-1 text-center">
                <div>{cardDetails.faceStats.pac} <span className="opacity-70">PAC</span></div>
                <div>{cardDetails.faceStats.sho} <span className="opacity-70">SHO</span></div>
                <div>{cardDetails.faceStats.pas} <span className="opacity-70">PAS</span></div>
                <div>{cardDetails.faceStats.dri} <span className="opacity-70">DRI</span></div>
                <div>{cardDetails.faceStats.def} <span className="opacity-70">DEF</span></div>
                <div>{cardDetails.faceStats.phy} <span className="opacity-70">PHY</span></div>
              </div>
            </div>
          </div>

          {/* BIO DETAILS & IDENTITY PILLARS */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  {bio.fullName}
                  {bio.knownAs && bio.knownAs !== bio.fullName && (
                    <span className="text-sm font-normal text-slate-400">({bio.knownAs})</span>
                  )}
                </h2>
                <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                  <span className="text-white font-semibold">{cardDetails.club}</span>
                  <span className="text-slate-500">·</span>
                  <span>{cardDetails.league}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-400 font-medium">{cardDetails.nation}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={futbinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-[#00ff87] text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>FUTBIN</span>
                  <ExternalLink className="w-3 h-3 text-[#00ff87]" />
                </a>
                <a
                  href={futggUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-[#00ff87] text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>FUT.GG</span>
                  <ExternalLink className="w-3 h-3 text-[#00ff87]" />
                </a>
              </div>
            </div>

            {/* IDENTITY METADATA PILLS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Age / DOB</div>
                <div className="font-bold text-white mt-0.5">{bio.age} yrs <span className="text-[10px] text-slate-400">({bio.dateOfBirth})</span></div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Height</div>
                <div className="font-bold text-white mt-0.5">{bio.heightFeetInches} <span className="text-[10px] text-slate-400">({bio.heightCm} cm)</span></div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Foot</div>
                <div className="font-bold text-white mt-0.5">{bio.preferredFoot} Foot</div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Weak Foot</div>
                <div className="font-bold text-amber-400 mt-0.5">{'★'.repeat(bio.weakFoot)}{'☆'.repeat(5 - bio.weakFoot)}</div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Skill Moves</div>
                <div className="font-bold text-[#00ff87] mt-0.5">{'★'.repeat(bio.skillMoves)}{'☆'.repeat(5 - bio.skillMoves)}</div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">AcceleRATE 2.0</div>
                <div className="font-bold text-cyan-400 truncate mt-0.5">{bio.accelerationType}</div>
              </div>
            </div>

            {/* SECONDARY POSITIONS */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-mono text-slate-400">Alternative Positions:</span>
              {cardDetails.alternativePositions.length > 0 ? (
                cardDetails.alternativePositions.map((pos) => (
                  <span
                    key={pos}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-white font-bold"
                  >
                    {pos}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic text-[11px]">Primary position only ({cardDetails.primaryPosition})</span>
              )}
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-[#0f172a] border-b border-slate-800 px-5 flex items-center justify-between">
          <div className="flex space-x-2">
            {[
              { id: 'STATS', label: '29 In-Game Stats' },
              { id: 'CHEMISTRY', label: 'Chemistry Optimizer' },
              { id: 'PLAYSTYLES', label: `PlayStyles (${playstyles.length})` },
              { id: 'ROLES', label: `FC IQ Roles (${roles.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#00ff87] text-[#00ff87]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'STATS' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">Boost Projection:</span>
              <button
                type="button"
                onClick={() => setShowBoostedStats(!showBoostedStats)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  showBoostedStats
                    ? 'bg-[#00ff87] text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {showBoostedStats ? `+${optimalStyle} Active` : 'Base Stats'}
              </button>
            </div>
          )}
        </div>

        {/* TAB PANELS */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* 1. 29 IN-GAME ATTRIBUTES */}
          {activeTab === 'STATS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* PACE (2 STATS) */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Pace Breakdown (2)
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {cardDetails.faceStats.pac} Face
                    {showBoostedStats && chemBoost.boosts.pac > 0 && ` (+${chemBoost.boosts.pac})`}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Acceleration</span>
                      <span className="font-mono font-bold">
                        {attributes.acceleration}
                        {showBoostedStats && chemBoost.boosts.pac > 0 && (
                          <span className="text-[#00ff87] ml-1">➔ {Math.min(99, attributes.acceleration + chemBoost.boosts.pac)}</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${getBarColor(attributes.acceleration)}`} style={{ width: `${attributes.acceleration}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300">
                      <span>Sprint Speed</span>
                      <span className="font-mono font-bold">
                        {attributes.sprintSpeed}
                        {showBoostedStats && chemBoost.boosts.pac > 0 && (
                          <span className="text-[#00ff87] ml-1">➔ {Math.min(99, attributes.sprintSpeed + chemBoost.boosts.pac)}</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${getBarColor(attributes.sprintSpeed)}`} style={{ width: `${attributes.sprintSpeed}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* SHOOTING (6 STATS) */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    Shooting Breakdown (6)
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {cardDetails.faceStats.sho} Face
                    {showBoostedStats && chemBoost.boosts.sho > 0 && ` (+${chemBoost.boosts.sho})`}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Attacking Positioning', val: attributes.attackingPositioning },
                    { label: 'Finishing', val: attributes.finishing },
                    { label: 'Shot Power', val: attributes.shotPower },
                    { label: 'Long Shots', val: attributes.longShots },
                    { label: 'Volleys', val: attributes.volleys },
                    { label: 'Penalties', val: attributes.penalties },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-slate-300">
                        <span>{s.label}</span>
                        <span className="font-mono font-bold">
                          {s.val}
                          {showBoostedStats && chemBoost.boosts.sho > 0 && (
                            <span className="text-[#00ff87] ml-1">➔ {Math.min(99, s.val + chemBoost.boosts.sho)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full mt-0.5 overflow-hidden">
                        <div className={`h-full ${getBarColor(s.val)}`} style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PASSING (6 STATS) */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Passing Breakdown (6)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {cardDetails.faceStats.pas} Face
                    {showBoostedStats && chemBoost.boosts.pas > 0 && ` (+${chemBoost.boosts.pas})`}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Vision', val: attributes.vision },
                    { label: 'Crossing', val: attributes.crossing },
                    { label: 'Free Kick Accuracy', val: attributes.freeKickAccuracy },
                    { label: 'Short Passing', val: attributes.shortPassing },
                    { label: 'Long Passing', val: attributes.longPassing },
                    { label: 'Curve', val: attributes.curve },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-slate-300">
                        <span>{s.label}</span>
                        <span className="font-mono font-bold">
                          {s.val}
                          {showBoostedStats && chemBoost.boosts.pas > 0 && (
                            <span className="text-[#00ff87] ml-1">➔ {Math.min(99, s.val + chemBoost.boosts.pas)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full mt-0.5 overflow-hidden">
                        <div className={`h-full ${getBarColor(s.val)}`} style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DRIBBLING (6 STATS) */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Dribbling Breakdown (6)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {cardDetails.faceStats.dri} Face
                    {showBoostedStats && chemBoost.boosts.dri > 0 && ` (+${chemBoost.boosts.dri})`}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Agility', val: attributes.agility },
                    { label: 'Balance', val: attributes.balance },
                    { label: 'Reactions', val: attributes.reactions },
                    { label: 'Ball Control', val: attributes.ballControl },
                    { label: 'Dribbling', val: attributes.dribbling },
                    { label: 'Composure', val: attributes.composure },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-slate-300">
                        <span>{s.label}</span>
                        <span className="font-mono font-bold">
                          {s.val}
                          {showBoostedStats && chemBoost.boosts.dri > 0 && (
                            <span className="text-[#00ff87] ml-1">➔ {Math.min(99, s.val + chemBoost.boosts.dri)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full mt-0.5 overflow-hidden">
                        <div className={`h-full ${getBarColor(s.val)}`} style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DEFENDING (5 STATS) */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Defending Breakdown (5)
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {cardDetails.faceStats.def} Face
                    {showBoostedStats && chemBoost.boosts.def > 0 && ` (+${chemBoost.boosts.def})`}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Interceptions', val: attributes.interceptions },
                    { label: 'Heading Accuracy', val: attributes.headingAccuracy },
                    { label: 'Defensive Awareness', val: attributes.defensiveAwareness },
                    { label: 'Standing Tackle', val: attributes.standingTackle },
                    { label: 'Sliding Tackle', val: attributes.slidingTackle },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-slate-300">
                        <span>{s.label}</span>
                        <span className="font-mono font-bold">
                          {s.val}
                          {showBoostedStats && chemBoost.boosts.def > 0 && (
                            <span className="text-[#00ff87] ml-1">➔ {Math.min(99, s.val + chemBoost.boosts.def)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full mt-0.5 overflow-hidden">
                        <div className={`h-full ${getBarColor(s.val)}`} style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PHYSICALITY (4 STATS) */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Physicality Breakdown (4)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    {cardDetails.faceStats.phy} Face
                    {showBoostedStats && chemBoost.boosts.phy > 0 && ` (+${chemBoost.boosts.phy})`}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Jumping', val: attributes.jumping },
                    { label: 'Stamina', val: attributes.stamina },
                    { label: 'Strength', val: attributes.strength },
                    { label: 'Aggression', val: attributes.aggression },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-slate-300">
                        <span>{s.label}</span>
                        <span className="font-mono font-bold">
                          {s.val}
                          {showBoostedStats && chemBoost.boosts.phy > 0 && (
                            <span className="text-[#00ff87] ml-1">➔ {Math.min(99, s.val + chemBoost.boosts.phy)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full mt-0.5 overflow-hidden">
                        <div className={`h-full ${getBarColor(s.val)}`} style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. CHEMISTRY STYLE OPTIMIZER */}
          {activeTab === 'CHEMISTRY' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-[#00ff87]/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00ff87]" />
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      Recommended Chemistry Style: {optimalStyle}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40">
                    Optimal Synergy
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {chemRec?.whyOptimal || `${optimalStyle} maximizes key pace and finishing attributes to elevate in-game performance.`}
                </p>

                {chemRec?.alternativeStyle && (
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-amber-400">
                      Alternative Option: {chemRec.alternativeStyle}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {chemRec.whyAlternative}
                    </p>
                  </div>
                )}
              </div>

              {/* BOOST COMPARISON TABLE */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-mono font-bold text-slate-300 mb-3">
                  Stat Boost Projections with {optimalStyle} (3/3 Chemistry):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                  {[
                    { key: 'Pace', base: cardDetails.faceStats.pac, boost: chemBoost.boosts.pac },
                    { key: 'Shooting', base: cardDetails.faceStats.sho, boost: chemBoost.boosts.sho },
                    { key: 'Passing', base: cardDetails.faceStats.pas, boost: chemBoost.boosts.pas },
                    { key: 'Dribbling', base: cardDetails.faceStats.dri, boost: chemBoost.boosts.dri },
                    { key: 'Defending', base: cardDetails.faceStats.def, boost: chemBoost.boosts.def },
                    { key: 'Physical', base: cardDetails.faceStats.phy, boost: chemBoost.boosts.phy },
                  ].map((stat) => (
                    <div key={stat.key} className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{stat.key}</div>
                      <div className="text-base font-extrabold text-white mt-1">
                        {stat.base}
                        {stat.boost > 0 && (
                          <span className="text-[#00ff87] text-xs font-mono ml-1">
                            +{stat.boost}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#00ff87]">
                        = {Math.min(99, stat.base + stat.boost)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. PLAYSTYLES TAB */}
          {activeTab === 'PLAYSTYLES' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playstyles.map((ps) => (
                <div
                  key={ps.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between space-y-1.5 ${
                    ps.tier === 'gold_plus'
                      ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {ps.tier === 'gold_plus' ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                          PlayStyle+
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                          Standard
                        </span>
                      )}
                      {ps.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{ps.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{ps.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* 4. FC IQ 27 ROLES TAB */}
          {activeTab === 'ROLES' && (
            <div className="space-y-3">
              {roles.map((r) => (
                <div key={r.roleName} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{r.roleName}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          r.mastery === 'plus_plus'
                            ? 'bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40'
                            : r.mastery === 'plus'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {r.mastery === 'plus_plus' ? 'Role++ (World Class)' : r.mastery === 'plus' ? 'Role+ (Expert)' : 'Role (Standard)'}
                      </span>
                    </div>
                    {r.isPreferred && (
                      <span className="text-[10px] font-mono text-[#00ff87] bg-[#00ff87]/10 px-2 py-0.5 rounded-full border border-[#00ff87]/20">
                        Kit’s Preferred
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      <div className="text-[10px] text-emerald-400 font-mono font-semibold mb-1">Key Advantages:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {r.positiveTraits.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      <div className="text-[10px] text-amber-400 font-mono font-semibold mb-1">Tactical Considerations:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                        {r.drawbacks.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="bg-[#111827] border-t border-slate-800/80 px-5 py-3 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Item Score: <span className="text-white font-bold">{cardDetails.overall * 1.25} pts</span> · Tradable Market Floor: <span className="text-amber-400 font-bold">{ledger.averageMarketPrice.toLocaleString()} Coins</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
