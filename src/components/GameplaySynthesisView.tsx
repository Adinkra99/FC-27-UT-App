import React, { useState } from 'react';
import {
  FC27_BRANCHING_EVOLUTIONS,
  FC27_CONSOLE_PLAYERS,
  FC27_META_FORMATIONS,
  FC27ConsolePlayer,
} from '../data/fc27ConsoleData';
import {
  ChemistryStyleName,
  calculateSquadChemistry,
  synthesizePlayerGameplayProfile,
} from '../utils/fc27DeterministicEngine';
import { TemporalAnchor } from '../utils/timeGrounding';
import { Shield, Zap, GitBranch, Sparkles, CheckCircle2, Layers } from 'lucide-react';
import { GameMechanicsPatchTracker } from './GameMechanicsPatchTracker';

interface GameplaySynthesisViewProps {
  t0Anchor: TemporalAnchor;
  players: FC27ConsolePlayer[];
  onRunHighThinkingGameplay: (title: string, prompt: string) => void;
  isThinking: boolean;
}

const CHEM_STYLES: ChemistryStyleName[] = [
  'Hunter',
  'Shadow',
  'Engine',
  'Hawk',
  'Anchor',
  'Maestro',
  'Finisher',
  'Architect',
  'Basic',
];

export const GameplaySynthesisView: React.FC<GameplaySynthesisViewProps> = ({
  t0Anchor,
  players,
  onRunHighThinkingGameplay,
  isThinking,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || 'fc27-rodri-91-pristine');
  const [selectedChemStyle, setSelectedChemStyle] = useState<ChemistryStyleName>('Shadow');
  const [chemDiamonds, setChemDiamonds] = useState<0 | 1 | 2 | 3>(3);
  const [selectedRoleTier, setSelectedRoleTier] = useState<'Role' | 'Role+' | 'Role++'>('Role++');
  const [selectedEvoBranch, setSelectedEvoBranch] = useState<'Branch A' | 'Branch B'>('Branch B');

  const activePlayer =
    players.find((p) => p.id === selectedPlayerId) || players[0];

  const synthesis = synthesizePlayerGameplayProfile(
    activePlayer,
    selectedChemStyle,
    chemDiamonds,
    selectedRoleTier
  );

  const squadChem = calculateSquadChemistry(players.slice(0, 8));

  return (
    <div className="space-y-6">
      {/* Live Title Update #3.1 & Patch Meta Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="text-[#00ff87] font-semibold">
              {t0Anchor.fc27PatchState.titleUpdateVersion}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t0Anchor.fc27PatchState.liveTuningVersion}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Grounded at T=0: {t0Anchor.britishFullFormatted}</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Domain 2: GAMEPLAY — Additive Stat, PlayStyle+, AcceleRATE 2.0 & 31 Roles++ Synthesis Lab
          </h2>
          <p className="text-sm text-slate-300">
            {t0Anchor.fc27PatchState.summary}
          </p>
        </div>

        <button
          type="button"
          disabled={isThinking}
          onClick={() =>
            onRunHighThinkingGameplay(
              `Gameplay Synthesis Audit: ${activePlayer.name}`,
              `Evaluate ${activePlayer.rating} OVR ${activePlayer.name} (${activePlayer.club}, ${activePlayer.seasonVerified}) with ${selectedChemStyle} (${chemDiamonds}/3 Chem) and ${selectedRoleTier}. Isolated Score: ${synthesis.isolatedOverallScore} vs Synthesized Meta Score: ${synthesis.synthesizedMetaScore} (${synthesis.postChemAccelerate}). Recommend the optimal formation and Role++ pair under ${t0Anchor.fc27PatchState.titleUpdateVersion}.`
            )
          }
          className="px-4 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[42px] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isThinking ? 'Synthesizing with Argon HIGH...' : 'Deep Gameplay Audit (Gemini 4 Argon)'}
          </span>
        </button>
      </div>

      {/* Dedicated Game Mechanics & Patch Notes Tracker */}
      <GameMechanicsPatchTracker t0Anchor={t0Anchor} />

      {/* Interactive Additive Synthesis Calculator: Stats in Isolation vs. Synthesized */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00ff87]" />
            <span>1. Select Player, Chemistry Style & Role++</span>
          </h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              FC 27 Console Player (FotMob 2026/27 Verified)
            </label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#00ff87]"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.rating} {p.name} ({p.position} · {p.club} · {p.rarity})
                </option>
              ))}
            </select>
          </div>

          {/* Chemistry Style Selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Chemistry Style Modifier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHEM_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedChemStyle(style)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                    selectedChemStyle === style
                      ? 'bg-[#00ff87]/15 border-[#00ff87] text-[#00ff87]'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Chemistry Diamonds & Role++ Tier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Chemistry Diamonds (0–3)
              </label>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {([0, 1, 2, 3] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setChemDiamonds(d)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-md transition-colors min-h-[34px] ${
                      chemDiamonds === d
                        ? 'bg-[#00ff87] text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}/3
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                FC IQ Player Role Tier
              </label>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['Role', 'Role+', 'Role++'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedRoleTier(tier)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                      selectedRoleTier === tier
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Player Physical, PlayStyle+ Cap & Role++ Profile */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Body Type & Height:</span>
              <span className="font-semibold text-white font-mono">
                {activePlayer.bodyType} · {activePlayer.heightCm}cm ({activePlayer.skillMoves}★ SM / {activePlayer.weakFoot}★ WF)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">PlayStyles+ (Max 3 Cap):</span>
              <span className="font-semibold text-[#00ff87]">
                {activePlayer.playStylesPlus.join(' · ')} ({activePlayer.playStylesPlus.length}/3)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Verified 26–27 Club:</span>
              <span className="font-semibold text-amber-300">
                {activePlayer.club} ({activePlayer.league})
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800 text-slate-300">
              <span className="text-slate-400">Assigned Roles: </span>
              {activePlayer.roles.map((r) => `${r.roleName} (${r.tier})`).join(' · ')}
            </div>
          </div>
        </div>

        {/* Right Synthesis Results Column */}
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs text-slate-400">
                Additive Synthesis Output (Stats + {selectedChemStyle} + {selectedRoleTier} + PlayStyles+)
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Isolated Stats vs. Synthesized In-Game Performance
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-400">Isolated Score</div>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-300">
                  {synthesis.isolatedOverallScore}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#00ff87]">Synthesized Meta Score</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#00ff87]">
                  {synthesis.synthesizedMetaScore}
                  <span className="text-xs ml-1 text-amber-400">
                    (+{synthesis.netSynthesisGain})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AcceleRATE 2.0 & Additive Modifiers Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-slate-400">AcceleRATE 2.0 Curve</div>
              <div className="font-bold text-white mt-1">
                {synthesis.postChemAccelerate}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {synthesis.accelerateDidShift
                  ? `Shifted from ${synthesis.baseAccelerate}`
                  : `Base: ${synthesis.baseAccelerate}`}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-slate-400">PlayStyle+ Synergy</div>
              <div className="font-bold font-mono tabular-nums text-[#00ff87] mt-1">
                +{synthesis.playStyleAdditiveBonus} Break-Cap
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                3 PS+ Hard Cap Verified
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-slate-400">Body Type Frame</div>
              <div className="font-bold font-mono tabular-nums text-white mt-1">
                +{synthesis.bodyTypeFrameBonus} Agility Auth
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {activePlayer.bodyType} Frame
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-slate-400">{selectedRoleTier} AI Boost</div>
              <div className="font-bold font-mono tabular-nums text-amber-400 mt-1">
                +{synthesis.roleAiMultiplierPct}% Positioning
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Title Update #3.1 Tuned
              </div>
            </div>
          </div>

          {/* Side-by-Side Isolated Sub-Stats vs Synthesized Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1.5">
                Sub-Attributes: Isolated Base → Post-{selectedChemStyle} ({chemDiamonds}/3)
              </div>
              {[
                { label: 'Acceleration', base: activePlayer.subStats.acceleration, post: synthesis.postChemSubStats.acceleration },
                { label: 'Sprint Speed', base: activePlayer.subStats.sprintSpeed, post: synthesis.postChemSubStats.sprintSpeed },
                { label: 'Finishing', base: activePlayer.subStats.finishing, post: synthesis.postChemSubStats.finishing },
                { label: 'Short Passing', base: activePlayer.subStats.shortPassing, post: synthesis.postChemSubStats.shortPassing },
                { label: 'Agility', base: activePlayer.subStats.agility, post: synthesis.postChemSubStats.agility },
                { label: 'Reactions & Composure', base: activePlayer.subStats.composure, post: synthesis.postChemSubStats.composure },
                { label: 'Interceptions & Def Aware', base: activePlayer.subStats.interceptions, post: synthesis.postChemSubStats.interceptions },
                { label: 'Strength', base: activePlayer.subStats.strength, post: synthesis.postChemSubStats.strength },
              ].map((row) => {
                const diff = row.post - row.base;
                return (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="font-mono tabular-nums text-white">
                      {row.base} → <strong className="text-[#00ff87]">{row.post}</strong>
                      {diff > 0 && <span className="text-amber-400 ml-1">(+{diff})</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1.5">
                Synthesized In-Game Output (Stats + PlayStyles+ + Role++)
              </div>
              {[
                {
                  label: 'Effective Breakaway Pace',
                  val: synthesis.synthesizedPillars.effectiveBreakawayPace,
                },
                {
                  label: 'Effective Clinical Finishing',
                  val: synthesis.synthesizedPillars.effectiveClinicalFinishing,
                },
                {
                  label: 'Press-Resistant Left-Stick Dribbling',
                  val: synthesis.synthesizedPillars.effectivePressResistanceDribbling,
                },
                {
                  label: 'Defensive Intercept & Tackle Radius',
                  val: synthesis.synthesizedPillars.effectiveInterceptRadius,
                },
                {
                  label: `FC IQ ${selectedRoleTier} Off-Ball Positioning`,
                  val: synthesis.synthesizedPillars.effectiveRolePositioningIQ,
                },
              ].map((pillar) => (
                <div key={pillar.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{pillar.label}</span>
                    <span className="font-mono tabular-nums font-bold text-[#00ff87]">
                      {pillar.val} / 100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00ff87]"
                      style={{ width: `${Math.min(100, pillar.val)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed">
            <strong className="text-[#00ff87]">Synthesis Verdict: </strong>
            {synthesis.tacticalVerdict}
          </div>
        </div>
      </div>

      {/* Branching Evolution Simulator & 33/33 Chemistry Fit Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs text-slate-400">
                FC 27 Branching Evolution Pathways & PlayStyles Lab (3 PS+ Hard Cap)
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <GitBranch className="w-4 h-4 text-[#00ff87]" />
                <span>{FC27_BRANCHING_EVOLUTIONS[0].title}</span>
              </h3>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              {(['Branch A', 'Branch B'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedEvoBranch(b)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                    selectedEvoBranch === b
                      ? 'bg-[#00ff87] text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const evo = FC27_BRANCHING_EVOLUTIONS[0];
            const branch = selectedEvoBranch === 'Branch A' ? evo.branchA : evo.branchB;
            return (
              <div className="space-y-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#00ff87]">{branch.branchName}</span>
                    <span className="text-xs font-mono text-amber-400">
                      Projected Role++ Meta Score: {branch.projectedMetaScore} / 100
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{branch.focusSummary}</p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-200">
                    <span>Added PS+: <strong className="text-[#00ff87]">{branch.addedPlayStylePlus}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Added Role++: <strong className="text-amber-300">{branch.addedRolePlusPlus}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Cost: {evo.costCoins.toLocaleString()} Coins / {evo.costFifaPoints} FP</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">
                    Club & External Market Evolution Chain Recommendations (Matched to Your Squad Links)
                  </div>
                  {evo.recommendedClubFits.map((fit) => (
                    <div
                      key={fit.playerName}
                      className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-white text-sm">
                            {fit.playerName} ({fit.currentOvr} → {fit.finalOvr} OVR)
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className={fit.inUserClub ? 'text-[#00ff87] font-semibold' : 'text-amber-400 font-semibold'}>
                            {fit.inUserClub ? 'In Your Club (0 Coins)' : `Market Target: ${fit.marketPrice.toLocaleString()} Coins`}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400">Optimal: {fit.recommendedBranch}</span>
                        </div>
                        <p className="text-xs text-slate-300">{fit.chemistryLinkReason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Meta Formations & 33/33 Chemistry Status */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Post-Patch Pro Console Meta</div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <Shield className="w-4 h-4 text-[#00ff87]" />
                <span>Meta Formations & 33/33 Chem Matrix</span>
              </h3>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs text-slate-400">Active Squad Chem</div>
              <div className="text-lg font-bold text-[#00ff87]">{squadChem.totalChemistry} / 33</div>
            </div>
          </div>

          <div className="space-y-3">
            {FC27_META_FORMATIONS.map((f) => (
              <div
                key={f.id}
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{f.formation}</span>
                    <span className="text-xs text-[#00ff87] font-semibold">· {f.tier}</span>
                  </div>
                  <span className="text-xs font-mono text-amber-400">
                    Code: {f.fcIqShareCode}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Build-Up: {f.buildUpStyle} · Defensive Line Height: {f.defensiveApproachHeight} · {f.patchStatus}
                </div>
                <p className="text-xs text-slate-300">{f.tacticalSummary}</p>
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  {f.keyRolesRequired.map((kr) => (
                    <div key={kr.position} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff87] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">{kr.position} ({kr.rolePlusPlus}):</strong> {kr.whyItWorks}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
