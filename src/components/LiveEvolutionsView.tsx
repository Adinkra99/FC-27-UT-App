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
  Award,
  Shield,
  Zap,
  Flame,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import { TemporalAnchor } from '../utils/timeGrounding';
import {
  BranchingEvolution,
  EvolutionSectionType,
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
  onSimulateInSquad?: (playerName: string, finalRating: number) => void;
}

const SECTION_TABS: { key: EvolutionSectionType; label: string; badge?: string }[] = [
  { key: 'ALL', label: 'All Live Evolutions' },
  { key: 'MY_EVOS', label: 'My Evolutions', badge: '1 Active' },
  { key: 'PLAYSTYLES_PLUS_LAB', label: 'PlayStyles+ Lab', badge: 'New' },
  { key: 'FUTURE_STARS_ACADEMY', label: 'Future Stars Academy', badge: 'New' },
  { key: 'TRAINING_CAMP', label: 'Training Camp' },
  { key: 'REWARD_EVOS', label: 'Rewards' },
  { key: 'COSMETICS', label: 'Cosmetics' },
];

export const LiveEvolutionsView: React.FC<LiveEvolutionsViewProps> = ({
  t0Anchor,
  userCoins,
  players,
  onRunHighThinkingAudit,
  isThinking,
  onSimulateInSquad,
}) => {
  const confirmedBudget = userCoins ?? 35000;
  const [activeSection, setActiveSection] = useState<EvolutionSectionType>('ALL');
  const [budgetFilter, setBudgetFilter] = useState<'ALL' | 'FREE' | 'AFFORDABLE_35K'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranches, setSelectedBranches] = useState<Record<string, 'Branch A' | 'Branch B'>>(
    () => ({
      'evo-speed-bump-the-zoom': 'Branch A',
      'evo-future-stars-academy-playmaker': 'Branch A',
      'evo-training-camp-passing': 'Branch A',
      'evo-rewards-champions-red-pick': 'Branch B',
      'evo-cosmetics-holographic-prism': 'Branch A',
      'evo-inside-forward-unleashed': 'Branch A',
      'evo-box-to-box-engine': 'Branch A',
      'evo-la-masia-catalyst-branching': 'Branch B',
    })
  );

  const [activeCandidateCategory, setActiveCandidateCategory] = useState<
    Record<string, 'CHEAP' | 'SQUAD_FIT' | 'PREMIUM'>
  >({
    'evo-speed-bump-the-zoom': 'CHEAP',
  });

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
          categoryFilter: activeSection,
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
      // Section tab filter
      if (activeSection === 'MY_EVOS' && !evo.isCurrentlyInProgress) return false;
      if (
        activeSection !== 'ALL' &&
        activeSection !== 'MY_EVOS' &&
        evo.evolutionSection !== activeSection
      ) {
        return false;
      }

      // Budget filter
      if (budgetFilter === 'FREE' && evo.costCoins > 0) return false;
      if (budgetFilter === 'AFFORDABLE_35K' && evo.costCoins > confirmedBudget) return false;

      // Text search
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
  }, [activeSection, budgetFilter, searchQuery, confirmedBudget]);

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
            <span>EA Sports FC 27 Live Dynamic Evolutions Hub & In-Progress Tracker</span>
          </h2>

          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Dynamically tracks active Evolutions, in-progress stages, and exact candidate scouter
            tiers (Cheap Beasts, Best Squad Links, and 80-Rated In-Form Specials) tailored to your{' '}
            <strong className="text-white font-mono">
              {confirmedBudget.toLocaleString()} Xbox Series S Coin budget
            </strong>
            , enforcing the <strong className="text-[#00ff87]">3 PlayStyles+ hard cap</strong>.
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
              <span>Live Search Intel</span>
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
              {isFetchingLive ? 'Searching Active Evolutions...' : 'Sync Live Evos @ T=0'}
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

      {/* 3. DYNAMIC EVOLUTION SECTIONS BAR (My Evolutions, PlayStyles+ Lab, Future Stars Academy, etc.) */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSection(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 min-h-[36px] ${
                activeSection === tab.key
                  ? 'bg-[#00ff87] text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    activeSection === tab.key
                      ? 'bg-slate-950 text-[#00ff87] font-bold'
                      : 'bg-[#00ff87]/20 text-[#00ff87]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            {[
              { id: 'ALL', label: 'All Costs' },
              { id: 'FREE', label: 'Free (0c)' },
              { id: 'AFFORDABLE_35K', label: '≤35k Budget' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setBudgetFilter(f.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  budgetFilter === f.id
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CB, Pavard..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff87]"
            />
          </div>
        </div>
      </div>

      {/* 4. ACTIVE EVOLUTIONS LIST & DETAILED CARDS */}
      {viewMode === 'CARDS' && (
        <div className="space-y-6">
          {filteredEvolutions.map((evo) => {
            const selectedBranchKey = selectedBranches[evo.id] || 'Branch A';
            const activeBranch = selectedBranchKey === 'Branch A' ? evo.branchA : evo.branchB;
            const isFree = evo.costCoins === 0;
            const fitsBudget = evo.costCoins <= confirmedBudget;
            const candidateCat = activeCandidateCategory[evo.id] || 'CHEAP';

            return (
              <div
                key={evo.id}
                className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm"
              >
                {/* Evolution Header: Promo, Title, In-Progress Banner & Time Limits */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {evo.promoName && (
                        <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {evo.promoName}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          isFree
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : fitsBudget
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {isFree ? 'FREE (0 COINS)' : fitsBudget ? 'FITS 35K BUDGET' : 'PREMIUM'}
                      </span>

                      {evo.isCurrentlyInProgress && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#00ff87] text-slate-950 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ACTIVE IN MY EVOLUTIONS</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{evo.title}</span>
                    </h3>
                  </div>

                  {/* Right side: Countdown timers, claim limit, and cost */}
                  <div className="flex flex-wrap items-center lg:flex-col lg:items-end gap-2 text-xs font-mono">
                    <div
                      className={`text-sm font-bold ${
                        isFree ? 'text-[#00ff87]' : fitsBudget ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {isFree
                        ? 'Free / 0 Coins'
                        : `${evo.costCoins.toLocaleString()} Coins / ${evo.costFifaPoints} FP`}
                    </div>
                    <div className="text-amber-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expires in {evo.expiresInDays} Days</span>
                      {evo.claimWindowHours && (
                        <span className="text-slate-300 font-semibold">
                          · Claim in {evo.claimWindowHours}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* IN-PROGRESS TRACKING STRIP (IF ACTIVE IN USER'S CLUB) */}
                {evo.isCurrentlyInProgress && evo.currentProgressStage && (
                  <div className="bg-slate-900 border border-[#00ff87]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-mono text-[#00ff87] flex items-center gap-1.5 font-bold">
                        <Flame className="w-4 h-4 text-[#00ff87]" />
                        <span>MY EVOLUTION IN PROGRESS</span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        Active Player:{' '}
                        <span className="text-[#00ff87]">
                          {evo.currentProgressStage.activePlayerName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Stage: Level {evo.currentProgressStage.currentLevel} · Completed:{' '}
                        <strong className="text-white">
                          {evo.currentProgressStage.completedChallenges} /{' '}
                          {evo.currentProgressStage.totalChallenges} Challenges
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <div className="w-32 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-700">
                        <div
                          className="bg-[#00ff87] h-full rounded-full"
                          style={{
                            width: `${
                              (evo.currentProgressStage.completedChallenges /
                                evo.currentProgressStage.totalChallenges) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#00ff87] font-bold">50%</span>
                    </div>
                  </div>
                )}

                {/* Detailed Requirements & Multi-Level Challenge Stages */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Player Eligibility & Exact Criteria */}
                  <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Exact Player Requirements</span>
                      <span className="font-mono text-[#00ff87]">3 PS+ Cap Enforced</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-slate-400 text-[11px]">Overall Rating</div>
                        <div className="text-white font-bold text-sm">
                          Max {evo.detailedCriteria?.maxOvr ?? evo.eligibility.maxOvr}
                        </div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-slate-400 text-[11px]">Eligible Position</div>
                        <div className="text-[#00ff87] font-bold text-sm">
                          {evo.detailedCriteria?.position ?? evo.eligibility.positions.join(', ')}
                        </div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-slate-400 text-[11px]">Max PlayStyles</div>
                        <div className="text-white font-bold text-sm">
                          {evo.detailedCriteria?.maxPlayStyles ?? 'Max 7'} PlayStyles
                        </div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-slate-400 text-[11px]">Sprint Speed / Pace</div>
                        <div className="text-white font-bold text-sm">
                          {evo.detailedCriteria?.maxPace ? `Max ${evo.detailedCriteria.maxPace}` : 'Max 75'} Pace
                        </div>
                      </div>
                    </div>

                    {evo.detailedCriteria?.disallowedPositions && (
                      <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-2.5 text-xs text-rose-300 font-mono">
                        🚫 Must NOT have:{' '}
                        <strong>{evo.detailedCriteria.disallowedPositions.join(', ')}</strong> secondary
                        or primary position.
                      </div>
                    )}

                    {/* Challenge Stages Breakdown (Levels 1, 2, 3) */}
                    {evo.challengeStages && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="text-xs font-semibold text-slate-300">
                          Challenges & Upgrade Levels ({evo.challengeStages.length} Levels / 4 Total
                          Challenges):
                        </div>
                        <div className="space-y-2">
                          {evo.challengeStages.map((stage) => (
                            <div
                              key={stage.levelNumber}
                              className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-[#00ff87]">{stage.title}</span>
                                {stage.playStyleReward && (
                                  <span className="text-amber-400 font-semibold text-[11px]">
                                    ★ {stage.playStyleReward}
                                  </span>
                                )}
                              </div>
                              <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                                {stage.challenges.map((c, i) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                              <div className="text-[11px] text-slate-400 font-mono pt-1">
                                Upgrade: <strong className="text-white">{stage.levelUpgrades}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Branching Pathway Selector & Projected Role++ */}
                  <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <GitBranch className="w-4 h-4 text-[#00ff87]" />
                        <span>Branching Pathway Choice:</span>
                      </span>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-md">
                        {(['Branch A', 'Branch B'] as const).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => handleToggleBranch(evo.id, b)}
                            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
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

                    {/* Active Branch Meta Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white font-mono">
                          {activeBranch.branchName}
                        </h4>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                          Meta Score: {activeBranch.projectedMetaScore} / 100
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {activeBranch.focusSummary}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                          PlayStyle+: <strong className="text-[#00ff87]">{activeBranch.addedPlayStylePlus}</strong>
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                          Role++ AI: <strong className="text-amber-300">{activeBranch.addedRolePlusPlus}</strong>
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          +{activeBranch.statBoosts.pac} PAC · +{activeBranch.statBoosts.def} DEF · +{activeBranch.statBoosts.phy} PHY
                        </span>
                      </div>
                    </div>

                    {/* THREE-TIER SCOUTED CANDIDATE CATEGORIES (Cheap, Best Squad Fit, Premium Specials) */}
                    {evo.categorizedCandidates ? (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-300">
                            Scouted Evolution Candidates (Categorized by Strategic Intent):
                          </span>
                          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCandidateCategory((prev) => ({ ...prev, [evo.id]: 'CHEAP' }))
                              }
                              className={`px-2.5 py-1 rounded font-semibold ${
                                candidateCat === 'CHEAP'
                                  ? 'bg-[#00ff87] text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              1. Cheap Beasts (&lt;3k)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCandidateCategory((prev) => ({
                                  ...prev,
                                  [evo.id]: 'SQUAD_FIT',
                                }))
                              }
                              className={`px-2.5 py-1 rounded font-semibold ${
                                candidateCat === 'SQUAD_FIT'
                                  ? 'bg-[#00ff87] text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              2. Best Squad Fit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCandidateCategory((prev) => ({
                                  ...prev,
                                  [evo.id]: 'PREMIUM',
                                }))
                              }
                              className={`px-2.5 py-1 rounded font-semibold ${
                                candidateCat === 'PREMIUM'
                                  ? 'bg-[#00ff87] text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              3. 80 In-Forms / Specials
                            </button>
                          </div>
                        </div>

                        {/* Category 1: Cheap Beasts */}
                        {candidateCat === 'CHEAP' && (
                          <div className="space-y-2">
                            {evo.categorizedCandidates.cheapOptions.map((c) => (
                              <div
                                key={c.playerName}
                                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                              >
                                <div>
                                  <div className="font-bold text-white flex items-center gap-2">
                                    <span>
                                      {c.playerName} ({c.ovr} →{' '}
                                      <strong className="text-[#00ff87]">{c.finalRating} OVR</strong>)
                                    </span>
                                    <span className="text-slate-400 font-normal">
                                      · {c.club} ({c.league})
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                    {c.reason}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 font-mono">
                                  <div className="text-[#00ff87] font-bold">
                                    {c.price === 0 ? '0 Coins (In Club)' : `${c.price.toLocaleString()} Coins`}
                                  </div>
                                  {onSimulateInSquad && (
                                    <button
                                      type="button"
                                      onClick={() => onSimulateInSquad(c.playerName, c.finalRating)}
                                      className="text-[10px] text-amber-400 hover:underline mt-0.5 block"
                                    >
                                      Simulate in Squad
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Category 2: Best Squad Fit Options */}
                        {candidateCat === 'SQUAD_FIT' && (
                          <div className="space-y-2">
                            {evo.categorizedCandidates.bestSquadFitOptions.map((c) => (
                              <div
                                key={c.playerName}
                                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                              >
                                <div>
                                  <div className="font-bold text-white flex items-center gap-2">
                                    <span>
                                      {c.playerName} ({c.ovr} →{' '}
                                      <strong className="text-[#00ff87]">{c.finalRating} OVR</strong>)
                                    </span>
                                    <span className="text-slate-400 font-normal">
                                      · {c.club} ({c.league})
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                    {c.reason}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 font-mono">
                                  <div className="text-amber-400 font-bold">
                                    {c.price.toLocaleString()} Coins
                                  </div>
                                  {onSimulateInSquad && (
                                    <button
                                      type="button"
                                      onClick={() => onSimulateInSquad(c.playerName, c.finalRating)}
                                      className="text-[10px] text-amber-400 hover:underline mt-0.5 block"
                                    >
                                      Simulate in Squad
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Category 3: Premium Special Options */}
                        {candidateCat === 'PREMIUM' && (
                          <div className="space-y-2">
                            {evo.categorizedCandidates.premiumSpecialOptions.map((c) => (
                              <div
                                key={c.playerName}
                                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                              >
                                <div>
                                  <div className="font-bold text-white flex items-center gap-2">
                                    <span>
                                      {c.playerName} ({c.ovr} →{' '}
                                      <strong className="text-[#00ff87]">{c.finalRating} OVR</strong>)
                                    </span>
                                    <span className="text-amber-400 font-mono text-[11px]">
                                      [{c.cardType}]
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                    {c.reason}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 font-mono">
                                  <div className="text-purple-400 font-bold">
                                    {c.price.toLocaleString()} Coins
                                  </div>
                                  {onSimulateInSquad && (
                                    <button
                                      type="button"
                                      onClick={() => onSimulateInSquad(c.playerName, c.finalRating)}
                                      className="text-[10px] text-amber-400 hover:underline mt-0.5 block"
                                    >
                                      Simulate in Squad
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback to standard recommended club fits */
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="text-xs font-semibold text-slate-400">
                          Recommended Candidates:
                        </div>
                        <div className="space-y-1.5">
                          {evo.recommendedClubFits.map((fit) => (
                            <div
                              key={fit.playerName}
                              className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono"
                            >
                              <div>
                                <span className="font-bold text-white">
                                  {fit.playerName} ({fit.currentOvr} → {fit.finalOvr} OVR)
                                </span>
                                <div className="text-[11px] text-slate-400 font-sans">
                                  {fit.chemistryLinkReason}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[#00ff87] font-bold">
                                  {fit.marketPrice.toLocaleString()} Coins
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-mono">
                    Hard Cap: 3 PlayStyles+ Maximum (Enforced on Xbox Series S)
                  </span>

                  <button
                    type="button"
                    disabled={isThinking}
                    onClick={() =>
                      onRunHighThinkingAudit(
                        `Evolution Audit: ${evo.title}`,
                        `Audit the evolution "${evo.title}". Evaluate whether I should commit my ${
                          confirmedBudget.toLocaleString()
                        } Coins or start Benjamin Pavard (80 CB) vs Castello Lukeba (79 CB) under FC 27 Title Update #3.1.`
                      )
                    }
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#00ff87] font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Deep AI Audit (Gemini 3.8 Flash)</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredEvolutions.length === 0 && (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-xs">
              No active evolutions match the selected section &quot;{activeSection}&quot; and search
              filter.
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
              <div className="space-y-4 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans bg-slate-950 p-4 rounded-lg border border-slate-800 max-h-[500px] overflow-y-auto">
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
