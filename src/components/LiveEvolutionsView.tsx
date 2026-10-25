import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Radio,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { TemporalAnchor } from '../utils/timeGrounding';
import {
  BranchingEvolution,
  FC27_BRANCHING_EVOLUTIONS,
  FC27ConsolePlayer,
} from '../data/fc27ConsoleData';

interface RoutingTelemetry {
  tierLabel: string;
  modelUsed: string;
  latencyMs: number;
  routingReason: string;
  costBenchmarkSummary?: string;
}

interface GroundingSource {
  title: string;
  uri: string;
}

interface LiveEvolutionsViewProps {
  t0Anchor: TemporalAnchor;
  userCoins: number | null;
  players: FC27ConsolePlayer[];
  onRunHighThinkingAudit: (title: string, prompt: string) => void;
  isThinking: boolean;
}

export const LiveEvolutionsView: React.FC<LiveEvolutionsViewProps> = ({
  t0Anchor,
  userCoins,
  players,
  onRunHighThinkingAudit,
  isThinking,
}) => {
  const confirmedBudget = userCoins ?? 35000;
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FREE' | 'AFFORDABLE_35K' | 'PAID'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranches, setSelectedBranches] = useState<Record<string, 'Branch A' | 'Branch B'>>(
    () => ({
      'evo-inside-forward-unleashed': 'Branch A',
      'evo-box-to-box-engine': 'Branch A',
      'evo-la-masia-catalyst-branching': 'Branch B',
      'evo-power-surge-defender': 'Branch A',
    })
  );

  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [liveReportText, setLiveReportText] = useState<string | null>(null);
  const [liveSources, setLiveSources] = useState<GroundingSource[]>([]);
  const [telemetry, setTelemetry] = useState<RoutingTelemetry | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'CARDS' | 'LIVE_SEARCH_REPORT'>('CARDS');

  // Trigger live web search grounding for active evolutions at T=0
  const handleFetchLiveEvolutions = async () => {
    setIsFetchingLive(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/gemini/fetch-live-evolutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientT0: t0Anchor.britishFullFormatted,
          budgetCoins: confirmedBudget,
          categoryFilter: activeFilter,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setLiveReportText(data.evolutionsReportText || 'No report generated.');
      setLiveSources(Array.isArray(data.sources) ? data.sources : []);
      if (data.routingTelemetry) {
        setTelemetry(data.routingTelemetry);
      }
      setViewMode('LIVE_SEARCH_REPORT');
    } catch (err: any) {
      console.error('Failed to fetch live evolutions:', err);
      setFetchError(err.message || 'Unable to fetch live FC 27 evolutions.');
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleToggleBranch = (evoId: string, branch: 'Branch A' | 'Branch B') => {
    setSelectedBranches((prev) => ({ ...prev, [evoId]: branch }));
  };

  const filteredEvolutions = useMemo(() => {
    return FC27_BRANCHING_EVOLUTIONS.filter((evo) => {
      if (activeFilter === 'FREE' && evo.costCoins > 0) return false;
      if (activeFilter === 'AFFORDABLE_35K' && evo.costCoins > confirmedBudget) return false;
      if (activeFilter === 'PAID' && evo.costCoins === 0) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evo.title.toLowerCase().includes(q);
        const matchesPositions = evo.eligibility.positions.some((pos) =>
          pos.toLowerCase().includes(q)
        );
        const matchesCandidates = evo.recommendedClubFits.some(
          (c) =>
            c.playerName.toLowerCase().includes(q) ||
            c.club.toLowerCase().includes(q) ||
            c.league.toLowerCase().includes(q)
        );
        return matchesTitle || matchesPositions || matchesCandidates;
      }

      return true;
    });
  }, [activeFilter, searchQuery, confirmedBudget]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner Anchored to T=0 British Time */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-[#00ff87]/15 text-[#00ff87] font-mono font-bold flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" />
              DYNAMIC EVOLUTIONS HUB
            </span>
            <span className="text-slate-400 font-mono">·</span>
            <span className="text-white font-semibold">
              {t0Anchor.fc27PatchState.titleUpdateVersion}
            </span>
            <span className="text-slate-400 font-mono">·</span>
            <span className="text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              T=0 Anchor: {t0Anchor.britishTimeFormatted}
            </span>
            <span className="text-slate-400 font-mono">·</span>
            <span className="text-amber-400 font-mono">
              Next 18:00 Drop in: {t0Anchor.countdownTo1800Drop.formatted}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white flex items-center gap-2 pt-1">
            <GitBranch className="w-5 h-5 text-[#00ff87]" />
            <span>EA Sports FC 27 Live Dynamic Evolutions Hub & Branching Scouter</span>
          </h2>

          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Real-time scouter evaluating active FC 27 branching Evolutions against your{' '}
            <strong className="text-white font-mono">
              {confirmedBudget.toLocaleString()} Xbox Series S Coin budget
            </strong>
            , enforcing the <strong className="text-[#00ff87]">3 PlayStyles+ hard cap</strong>, and
            unlocking meta Role++ upgrades (e.g. Inside Forward++, Holding++, Box-to-Box++).
          </p>
        </div>

        {/* View Switcher & Live Fetch Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                viewMode === 'CARDS'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Evos Grid
            </button>
            <button
              type="button"
              onClick={() => {
                if (!liveReportText && !isFetchingLive) {
                  handleFetchLiveEvolutions();
                } else {
                  setViewMode('LIVE_SEARCH_REPORT');
                }
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === 'LIVE_SEARCH_REPORT'
                  ? 'bg-[#00ff87] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Search Intelligence</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isFetchingLive}
            onClick={() => handleFetchLiveEvolutions()}
            className="px-4 py-2 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-[#00ff87]/20 disabled:opacity-50 min-h-[38px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin' : ''}`} />
            <span>
              {isFetchingLive ? 'Searching Active Evolutions...' : 'Sync Live Evolutions @ T=0'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Routing Telemetry & Sources Bar */}
      {telemetry && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
              {telemetry.tierLabel}
            </span>
            <span className="text-slate-400 font-mono">
              Latency: <strong className="text-white">{telemetry.latencyMs} ms</strong>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300 italic">{telemetry.routingReason}</span>
          </div>

          {liveSources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-medium">Grounding Sources:</span>
              {liveSources.slice(0, 3).map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-[11px] font-mono transition-colors border border-slate-700 max-w-[200px] truncate"
                  title={s.title}
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{s.title || 'EA Evolutions Source'}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error state if fetch failed */}
      {fetchError && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-lg p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Error retrieving live evolutions: {fetchError}. Displaying verified FC 27 catalog.</span>
        </div>
      )}

      {/* 3. Filter and Search Bar */}
      {viewMode === 'CARDS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'ALL', label: 'All Live Evolutions' },
                { key: 'FREE', label: 'Free (0 Coins)' },
                {
                  key: 'AFFORDABLE_35K',
                  label: `Within My Budget (≤ ${confirmedBudget.toLocaleString()} Coins)`,
                },
                { key: 'PAID', label: 'Paid Premium (Coins / FP)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap min-h-[34px] ${
                    activeFilter === tab.key
                      ? 'bg-[#00ff87]/15 border-[#00ff87] text-[#00ff87]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Keyword / Position Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search position (e.g. CB, RW, CM) or player..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff87]"
              />
            </div>
          </div>

          {/* 4. Active Evolutions Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredEvolutions.map((evo) => {
              const selectedBranchKey = selectedBranches[evo.id] || 'Branch A';
              const activeBranch =
                selectedBranchKey === 'Branch A' ? evo.branchA : evo.branchB;
              const isFree = evo.costCoins === 0;
              const fitsBudget = evo.costCoins <= confirmedBudget;

              return (
                <div
                  key={evo.id}
                  className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Top Row: Promo Badge, Title & Cost Status */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {evo.promoName && (
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              {evo.promoName}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                              isFree
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : fitsBudget
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {isFree ? 'FREE (0 COINS)' : fitsBudget ? 'FITS 35K BUDGET' : 'PREMIUM'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white pt-0.5">{evo.title}</h3>
                      </div>

                      {/* Cost & Countdown */}
                      <div className="text-right font-mono text-xs space-y-0.5">
                        <div
                          className={`font-bold ${
                            isFree ? 'text-[#00ff87]' : fitsBudget ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          {isFree
                            ? 'Free / 0 Coins'
                            : `${evo.costCoins.toLocaleString()} Coins / ${evo.costFifaPoints} FP`}
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{evo.expiresInDays} Days Remaining</span>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Pill Matrix */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Slot Eligibility & Hard Caps
                      </div>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          Max OVR: <strong className="text-white">{evo.eligibility.maxOvr}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          Positions: <strong className="text-[#00ff87]">{evo.eligibility.positions.join(', ')}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">
                          Max PS+: {evo.eligibility.maxPlayStylesPlus} (FC 27 3 PS+ Cap Enforced)
                        </span>
                      </div>
                    </div>

                    {/* Branching Choice Selector */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-[#00ff87]" />
                          <span>Select Branching Pathway:</span>
                        </span>
                        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-md">
                          {(['Branch A', 'Branch B'] as const).map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => handleToggleBranch(evo.id, b)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                                selectedBranchKey === b
                                  ? 'bg-[#00ff87] text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Branch Preview */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#00ff87] font-mono">
                            {activeBranch.branchName}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            Meta Score: {activeBranch.projectedMetaScore} / 100
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {activeBranch.focusSummary}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            PS+: <strong className="text-[#00ff87]">{activeBranch.addedPlayStylePlus}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            Role++: <strong className="text-amber-300">{activeBranch.addedRolePlusPlus}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            Boosts: +{activeBranch.statBoosts.pac} PAC · +{activeBranch.statBoosts.sho} SHO · +{activeBranch.statBoosts.pas} PAS · +{activeBranch.statBoosts.def} DEF
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Verified Player Candidates for Xbox Series S */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Top Xbox Series S Targets (Under 35k Coins)</span>
                        <span className="font-mono text-[10px] text-slate-500">FotMob 26/27 Verified</span>
                      </div>

                      <div className="space-y-1.5">
                        {evo.recommendedClubFits.map((fit) => {
                          const affordable = fit.marketPrice <= confirmedBudget;
                          return (
                            <div
                              key={fit.playerName}
                              className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="font-bold text-white">
                                    {fit.playerName} ({fit.currentOvr} → {fit.finalOvr} OVR)
                                  </span>
                                  <span className="text-slate-500">·</span>
                                  <span className="text-slate-400">
                                    {fit.club} ({fit.league})
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-tight">
                                  {fit.chemistryLinkReason}
                                </p>
                              </div>

                              <div className="text-right shrink-0 font-mono">
                                <div
                                  className={`font-bold ${
                                    affordable ? 'text-[#00ff87]' : 'text-amber-400'
                                  }`}
                                >
                                  {fit.marketPrice.toLocaleString()} Coins
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Rec: {fit.recommendedBranch}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      Slot Cap: 3 PS+ Max
                    </span>

                    <button
                      type="button"
                      disabled={isThinking}
                      onClick={() =>
                        onRunHighThinkingAudit(
                          `Evolution Chain Audit: ${evo.title}`,
                          `Evaluate ${evo.title} (${evo.costCoins.toLocaleString()} Coins, expires in ${evo.expiresInDays} days). Active choice: ${selectedBranchKey} (${activeBranch.branchName}). Compare candidate ${evo.recommendedClubFits[0]?.playerName} vs ${evo.recommendedClubFits[1]?.playerName} for my confirmed 35,000 Coin budget on Xbox Series S under Title Update #3.1.`
                        )
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[#00ff87] font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Deep AI Chain Audit (Gemini 4 Argon)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEvolutions.length === 0 && (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-xs">
              No active evolutions match the selected filter &quot;{activeFilter}&quot; and search &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
      )}

      {/* 5. Live Search Intelligence Report Mode */}
      {viewMode === 'LIVE_SEARCH_REPORT' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00ff87]" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Live Grounded Search Synthesis (Gemini 3.8 Flash + Google Search)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Return to Evolutions Grid
              </button>
            </div>

            {isFetchingLive ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#00ff87] animate-spin" />
                <p className="text-sm text-slate-300 font-medium">
                  Querying live EA Sports FC 27 active Evolutions via Google Search...
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Grounding against T=0 British Time & 18:00 UK Content Drop on Xbox Series S
                </p>
              </div>
            ) : liveReportText ? (
              <div className="space-y-4 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans bg-slate-950 p-4 rounded-lg border border-slate-850 max-h-[500px] overflow-y-auto">
                {liveReportText}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No live report loaded yet.{' '}
                <button
                  type="button"
                  onClick={() => handleFetchLiveEvolutions()}
                  className="text-[#00ff87] underline hover:text-white ml-1 font-semibold"
                >
                  Run live query now
                </button>
              </div>
            )}

            {/* Grounding Citations */}
            {liveSources.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#00ff87]" />
                  <span>Grounding Verification Citations:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {liveSources.map((source, index) => (
                    <a
                      key={index}
                      href={source.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg flex items-center justify-between text-xs text-slate-300 transition-colors group"
                    >
                      <span className="truncate pr-2 group-hover:text-[#00ff87]">
                        {source.title || 'EA Evolutions Source'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#00ff87] shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
