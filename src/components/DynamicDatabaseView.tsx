import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  ExternalLink,
  RefreshCw,
  Zap,
  TrendingUp,
  Shield,
  Activity,
  Sparkles,
  Check,
  Scale,
  Flame,
  FileSpreadsheet,
  MessageSquare,
  AlertCircle,
  Filter,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { FC27ConsolePlayer } from '../data/fc27ConsoleData';
import {
  FC27_CHEMISTRY_STYLES,
  ChemStyleName,
  applyChemistryStyleBoost,
} from '../utils/fc27ChemistryEngine';
import { TemporalAnchor } from '../utils/timeGrounding';

interface DynamicDatabaseViewProps {
  t0Anchor: TemporalAnchor;
  catalogPlayers: FC27ConsolePlayer[];
  userCoins: number | null;
  onAddToSquad?: (player: FC27ConsolePlayer) => void;
  onLogInvestment?: (player: FC27ConsolePlayer, targetPrice: number) => void;
  onNavigateToTab?: (tabId: string) => void;
}

interface LiveBinSyncResult {
  playerName: string;
  rating: number;
  lowestBinXbox: number;
  priceChange24hPct: number;
  futbinUrl: string;
  futGgUrl: string;
  metaSummary: string;
  sources?: { title: string; uri: string }[];
  lastSyncedAt: string;
}

export const DynamicDatabaseView: React.FC<DynamicDatabaseViewProps> = ({
  t0Anchor,
  catalogPlayers,
  userCoins,
  onAddToSquad,
  onLogInvestment,
  onNavigateToTab,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');
  const [budgetOnlyFilter, setBudgetOnlyFilter] = useState<boolean>(false);

  // Selected Player for Comparison Lab
  const [selectedPlayer, setSelectedPlayer] = useState<FC27ConsolePlayer>(
    catalogPlayers[0] || null
  );

  // Chemistry Diamonds Selector (0, 1, 2, or 3)
  const [chemistryDiamonds, setChemistryDiamonds] = useState<0 | 1 | 2 | 3>(3);

  // Dual Chemistry Styles: Style A vs. Style B
  const [styleA, setStyleA] = useState<ChemStyleName>('Hunter');
  const [styleB, setStyleB] = useState<ChemStyleName>('Hawk');

  // Live BIN Sync State
  const [isSyncingBin, setIsSyncingBin] = useState<boolean>(false);
  const [syncResults, setSyncResults] = useState<Record<string, LiveBinSyncResult>>({});
  const [syncError, setSyncError] = useState<string | null>(null);

  // Filtered Players Catalog
  const filteredPlayers = useMemo(() => {
    return catalogPlayers.filter((p) => {
      // Name, club, league match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesClub = p.club.toLowerCase().includes(q);
        const matchesLeague = p.league.toLowerCase().includes(q);
        const matchesPos = p.position.toLowerCase() === q || p.altPositions?.some((pos) => pos.toLowerCase() === q);
        if (!matchesName && !matchesClub && !matchesLeague && !matchesPos) {
          return false;
        }
      }

      // Position filter
      if (selectedPosition !== 'ALL') {
        const matchesPos = p.position === selectedPosition || p.altPositions?.includes(selectedPosition);
        if (!matchesPos) return false;
      }

      // Rarity filter
      if (selectedRarity !== 'ALL') {
        if (p.rarity !== selectedRarity) return false;
      }

      // Budget filter (< 35,000 Coins or userCoins)
      if (budgetOnlyFilter) {
        const maxBudget = userCoins !== null ? userCoins : 35000;
        if (p.consolePrice > maxBudget) return false;
      }

      return true;
    });
  }, [catalogPlayers, searchQuery, selectedPosition, selectedRarity, budgetOnlyFilter, userCoins]);

  // Sync Lowest BIN from FUTBIN & FUT.GG via /api/database/sync-lowest-bin
  const handleSyncLowestBin = async (player: FC27ConsolePlayer) => {
    setIsSyncingBin(true);
    setSyncError(null);

    try {
      const res = await fetch('/api/database/sync-lowest-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: player.name,
          rating: player.rating,
          rarity: player.rarity,
          club: player.club,
          clientT0: t0Anchor.britishFullFormatted,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        setSyncError(data.error);
      } else {
        setSyncResults((prev) => ({
          ...prev,
          [player.id]: {
            playerName: data.playerName || player.name,
            rating: data.rating || player.rating,
            lowestBinXbox: data.lowestBinXbox || player.consolePrice,
            priceChange24hPct: data.priceChange24hPct ?? player.priceChange24hPct,
            futbinUrl:
              data.futbinUrl ||
              `https://www.futbin.com/27/player/${encodeURIComponent(player.name)}`,
            futGgUrl:
              data.futGgUrl ||
              `https://www.fut.gg/players/${encodeURIComponent(player.name)}`,
            metaSummary: data.metaSummary || 'Grounded across FUTBIN & FUT.GG databases.',
            sources: data.sources || [],
            lastSyncedAt: t0Anchor.britishTimeFormatted,
          },
        }));
      }
    } catch (err: any) {
      setSyncError(`Failed to sync from FUTBIN/FUT.GG: ${err.message}`);
    } finally {
      setIsSyncingBin(false);
    }
  };

  // Deterministic Boost Results for Style A and Style B
  const boostA = useMemo(() => {
    if (!selectedPlayer) return null;
    return applyChemistryStyleBoost(selectedPlayer, styleA, chemistryDiamonds);
  }, [selectedPlayer, styleA, chemistryDiamonds]);

  const boostB = useMemo(() => {
    if (!selectedPlayer) return null;
    return applyChemistryStyleBoost(selectedPlayer, styleB, chemistryDiamonds);
  }, [selectedPlayer, styleB, chemistryDiamonds]);

  const activeSync = selectedPlayer ? syncResults[selectedPlayer.id] : null;

  // Available positions list
  const availablePositions = ['ALL', 'ST', 'CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];

  // All Chem Styles grouped
  const allChemStyles = Object.keys(FC27_CHEMISTRY_STYLES) as ChemStyleName[];

  return (
    <div className="space-y-6">
      {/* HEADER: Dynamic Database & FUTBIN / FUT.GG Grounding */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40">
                LIVE DYNAMIC DATABASES
              </span>
              <span className="text-xs font-mono text-slate-400">
                FUTBIN & FUT.GG Grounding · EA FC 27
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
              <Database className="w-6 h-6 text-[#00ff87]" />
              FUTBIN & FUT.GG Console Database & Chem Lab
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Real-time Xbox Series S lowest BIN sync, 24h market trends, direct links to verified FUTBIN & FUT.GG player dossiers, and instant 0ms deterministic chemistry style comparison calibrated to FC 27 Title Update #3.1 mechanics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
              <span className="text-slate-400">Xbox Series S Coins: </span>
              <strong className="text-[#00ff87]">
                {userCoins !== null ? `${userCoins.toLocaleString()} Coins` : '35,000 Coins (Default)'}
              </strong>
            </div>
            {selectedPlayer && (
              <button
                type="button"
                onClick={() => handleSyncLowestBin(selectedPlayer)}
                disabled={isSyncingBin}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#00ff87] hover:bg-[#00e077] disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition-colors min-h-[38px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBin ? 'animate-spin' : ''}`} />
                <span>{isSyncingBin ? 'Syncing FUTBIN...' : 'Sync Lowest BIN'}</span>
              </button>
            )}
          </div>
        </div>

        {syncError && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{syncError}</span>
          </div>
        )}
      </div>

      {/* DUAL-COLUMN WORKSPACE: LEFT CATALOG SEARCH + RIGHT DUAL CHEM LAB */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: LIVE SEARCH & PLAYER CATALOG (5 of 12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-[#00ff87]" />
                FC 27 Dynamic Player Search
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {filteredPlayers.length} Cards Found
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player, club (e.g. Barcelona), position..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff87]"
              />
            </div>

            {/* Position Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {availablePositions.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setSelectedPosition(pos)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors shrink-0 ${
                    selectedPosition === pos
                      ? 'bg-[#00ff87] text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Filter Row: Rarity + Budget Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Rarities</option>
                  <option value="Gold">Gold</option>
                  <option value="Regular Holographic">Regular Holo (&lt;=87)</option>
                  <option value="Pristine Holographic">Pristine Holo (&gt;=88)</option>
                  <option value="Ultimate Scream">Ultimate Scream</option>
                  <option value="TOTW">TOTW</option>
                  <option value="Icon">Icon</option>
                  <option value="UT Hero">UT Hero</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setBudgetOnlyFilter((prev) => !prev)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                  budgetOnlyFilter
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <span>&lt; {userCoins !== null ? `${(userCoins / 1000).toFixed(0)}k` : '35k'} Budget</span>
                {budgetOnlyFilter && <Check className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredPlayers.length === 0 ? (
              <div className="p-8 text-center bg-[#111827] border border-slate-800 rounded-xl space-y-2">
                <p className="text-xs text-slate-400">No players match the current filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPosition('ALL');
                    setSelectedRarity('ALL');
                    setBudgetOnlyFilter(false);
                  }}
                  className="text-xs text-[#00ff87] underline font-semibold"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayer?.id === player.id;
                const synced = syncResults[player.id];
                const displayPrice = synced ? synced.lowestBinXbox : player.consolePrice;
                const displayDelta = synced ? synced.priceChange24hPct : player.priceChange24hPct;
                const isAffordable = userCoins !== null ? displayPrice <= userCoins : displayPrice <= 35000;

                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1e293b] border-[#00ff87] shadow-lg shadow-[#00ff87]/5 ring-1 ring-[#00ff87]'
                        : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-11 rounded-md flex flex-col items-center justify-center font-bold shrink-0 ${
                            player.rating >= 88
                              ? 'bg-amber-400 text-slate-950'
                              : player.rating >= 84
                              ? 'bg-[#00ff87] text-slate-950'
                              : 'bg-slate-700 text-slate-100'
                          }`}
                        >
                          <span className="text-xs leading-none">{player.rating}</span>
                          <span className="text-[9px] font-mono leading-tight">{player.position}</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {player.holographicMultiplier > 1 && (
                              <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[9px] font-mono">
                                {player.holographicMultiplier === 1.5 ? 'Pristine Holo' : 'Regular Holo'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {player.club} · {player.nation}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-white">
                          {displayPrice.toLocaleString()} <span className="text-[10px] text-slate-400">Coins</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {displayDelta >= 0 ? (
                            <span className="text-[10px] font-mono text-[#00ff87] flex items-center">
                              +{displayDelta.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-red-400 flex items-center">
                              {displayDelta.toFixed(1)}%
                            </span>
                          )}
                          {isAffordable && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87]" title="Fits within 35k budget" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Face Stats Preview */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-6 gap-1 text-center font-mono text-[10px]">
                      <div>
                        <div className="text-slate-400 text-[9px]">PAC</div>
                        <div className="font-bold text-slate-200">{player.faceStats.pac}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[9px]">SHO</div>
                        <div className="font-bold text-slate-200">{player.faceStats.sho}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[9px]">PAS</div>
                        <div className="font-bold text-slate-200">{player.faceStats.pas}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[9px]">DRI</div>
                        <div className="font-bold text-slate-200">{player.faceStats.dri}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[9px]">DEF</div>
                        <div className="font-bold text-slate-200">{player.faceStats.def}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[9px]">PHY</div>
                        <div className="font-bold text-slate-200">{player.faceStats.phy}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: INTERACTIVE CHEMISTRY STYLE & META BOOST COMPARISON TOOL (7 of 12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedPlayer ? (
            <>
              {/* CARD DOSSIER HEADER WITH LIVE FUTBIN / FUT.GG LINKS */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-lg bg-gradient-to-b from-[#00ff87]/20 to-slate-800 border border-[#00ff87]/50 flex flex-col items-center justify-center font-extrabold text-white">
                      <span className="text-base">{selectedPlayer.rating}</span>
                      <span className="text-[10px] font-mono text-[#00ff87]">{selectedPlayer.position}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{selectedPlayer.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                          {selectedPlayer.club}
                        </span>
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{selectedPlayer.league}</span>
                        <span>·</span>
                        <span>{selectedPlayer.nation}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-300">{selectedPlayer.heightCm} cm</span>
                        <span>·</span>
                        <span className="text-amber-400 font-mono">
                          {selectedPlayer.skillMoves}★ SM / {selectedPlayer.weakFoot}★ WF
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* External FUTBIN & FUT.GG Grounded Links */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={
                        activeSync?.futbinUrl ||
                        `https://www.futbin.com/27/player/${encodeURIComponent(selectedPlayer.name)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                      title="View on FUTBIN FC 27 Database"
                    >
                      <span>FUTBIN</span>
                      <ExternalLink className="w-3 h-3 text-[#00ff87]" />
                    </a>
                    <a
                      href={
                        activeSync?.futGgUrl ||
                        `https://www.fut.gg/players/${encodeURIComponent(selectedPlayer.name)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                      title="View on FUT.GG FC 27 Database"
                    >
                      <span>FUT.GG</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </a>
                  </div>
                </div>

                {/* Lowest BIN Xbox Metric Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">Xbox Series S Lowest BIN</div>
                    <div className="font-mono font-bold text-base text-[#00ff87] mt-0.5">
                      {activeSync ? activeSync.lowestBinXbox.toLocaleString() : selectedPlayer.consolePrice.toLocaleString()} Coins
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">24h Price Swing</div>
                    <div className="font-mono font-bold text-base mt-0.5 flex items-center gap-1">
                      {(activeSync?.priceChange24hPct ?? selectedPlayer.priceChange24hPct) >= 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-[#00ff87]" />
                          <span className="text-[#00ff87]">
                            +{(activeSync?.priceChange24hPct ?? selectedPlayer.priceChange24hPct).toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">
                            {(activeSync?.priceChange24hPct ?? selectedPlayer.priceChange24hPct).toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Database Grounding Status</div>
                    <div className="text-xs text-slate-200 mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
                      <span>{activeSync ? `Synced at ${activeSync.lastSyncedAt}` : 'Calibrated at T=0'}</span>
                    </div>
                  </div>
                </div>

                {/* Meta AI Advice Strip */}
                {activeSync?.metaSummary && (
                  <div className="p-3 bg-[#00ff87]/5 border border-[#00ff87]/20 rounded-lg text-xs text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#00ff87] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="text-white">Database Meta Verdict: </strong>
                      {activeSync.metaSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* INTERACTIVE CHEMISTRY STYLE & META BOOST COMPARISON LAB */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Scale className="w-5 h-5 text-[#00ff87]" />
                      Side-by-Side Chemistry Style & Meta Boost Lab
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Deterministic calculation calibrated to Title Update #3.1 mechanics.
                    </p>
                  </div>

                  {/* Chemistry Diamonds Selector (0, 1, 2, 3) */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold px-1">Chem Diamonds:</span>
                    {([0, 1, 2, 3] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setChemistryDiamonds(d)}
                        className={`w-7 h-7 rounded text-xs font-mono font-bold transition-all ${
                          chemistryDiamonds === d
                            ? 'bg-[#00ff87] text-slate-950 scale-105 shadow-md shadow-[#00ff87]/20'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                        title={`${d} Diamond${d === 1 ? '' : 's'} (${d === 0 ? '0%' : d === 1 ? '33%' : d === 2 ? '66%' : '100%'} Boost)`}
                      >
                        {d === 0 ? '0' : '◆'.repeat(d)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DUAL SELECTOR DROPDOWNS: STYLE A vs. STYLE B */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Style A Selector */}
                  <div className="p-3.5 bg-slate-900/90 border border-cyan-500/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        Chemistry Style A
                      </span>
                      {boostA && (
                        <span className="font-mono text-xs text-cyan-300 font-bold">
                          Est. OVR: {boostA.estimatedInGameOvr} (+{boostA.estimatedInGameOvr - selectedPlayer.rating})
                        </span>
                      )}
                    </div>
                    <select
                      value={styleA}
                      onChange={(e) => setStyleA(e.target.value as ChemStyleName)}
                      className="w-full bg-slate-950 border border-cyan-500/50 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none"
                    >
                      {allChemStyles.map((style) => (
                        <option key={style} value={style}>
                          {style} ({FC27_CHEMISTRY_STYLES[style].category})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      {FC27_CHEMISTRY_STYLES[styleA].description}
                    </p>
                  </div>

                  {/* Style B Selector */}
                  <div className="p-3.5 bg-slate-900/90 border border-amber-500/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Chemistry Style B
                      </span>
                      {boostB && (
                        <span className="font-mono text-xs text-amber-300 font-bold">
                          Est. OVR: {boostB.estimatedInGameOvr} (+{boostB.estimatedInGameOvr - selectedPlayer.rating})
                        </span>
                      )}
                    </div>
                    <select
                      value={styleB}
                      onChange={(e) => setStyleB(e.target.value as ChemStyleName)}
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none"
                    >
                      {allChemStyles.map((style) => (
                        <option key={style} value={style}>
                          {style} ({FC27_CHEMISTRY_STYLES[style].category})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      {FC27_CHEMISTRY_STYLES[styleB].description}
                    </p>
                  </div>
                </div>

                {/* AcceleRATE 2.0 PHYSICAL ARCHETYPE TRANSITION BADGES */}
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#00ff87]" />
                      AcceleRATE 2.0 Sprint Archetype Comparison
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Base: <strong className="text-white">{selectedPlayer.baseAccelerate}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-lg">
                      <div className="text-[10px] text-cyan-400 font-semibold">With {styleA}</div>
                      <div className="font-bold text-sm text-white mt-0.5">
                        {boostA?.boostedAccelerate}
                      </div>
                      {boostA?.accelerateShifted && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-cyan-400 text-slate-950 text-[10px] font-bold rounded-full">
                          Sprint Shifted!
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg">
                      <div className="text-[10px] text-amber-400 font-semibold">With {styleB}</div>
                      <div className="font-bold text-sm text-white mt-0.5">
                        {boostB?.boostedAccelerate}
                      </div>
                      {boostB?.accelerateShifted && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full">
                          Sprint Shifted!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* FACE STATS SIDE-BY-SIDE COMPARISON TABLE */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Face Attributes Differential
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden text-xs font-mono">
                    <div className="grid grid-cols-12 py-2 px-3 bg-slate-800/80 font-bold text-slate-300 text-[11px]">
                      <div className="col-span-3 text-left">Stat</div>
                      <div className="col-span-2 text-center text-slate-400">Base</div>
                      <div className="col-span-3 text-center text-cyan-400">{styleA}</div>
                      <div className="col-span-3 text-center text-amber-400">{styleB}</div>
                      <div className="col-span-1 text-right">Adv</div>
                    </div>

                    {[
                      { key: 'pac', label: 'Pace (PAC)' },
                      { key: 'sho', label: 'Shooting (SHO)' },
                      { key: 'pas', label: 'Passing (PAS)' },
                      { key: 'dri', label: 'Dribbling (DRI)' },
                      { key: 'def', label: 'Defending (DEF)' },
                      { key: 'phy', label: 'Physicality (PHY)' },
                    ].map(({ key, label }) => {
                      const baseVal = (selectedPlayer.faceStats as any)[key];
                      const valA = boostA ? (boostA.boostedFace as any)[key] : baseVal;
                      const valB = boostB ? (boostB.boostedFace as any)[key] : baseVal;
                      const diffA = valA - baseVal;
                      const diffB = valB - baseVal;
                      const winner = valA > valB ? 'A' : valB > valA ? 'B' : 'TIE';

                      return (
                        <div
                          key={key}
                          className="grid grid-cols-12 py-2 px-3 border-t border-slate-800/60 items-center hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="col-span-3 font-sans font-medium text-slate-200 text-xs">
                            {label}
                          </div>
                          <div className="col-span-2 text-center text-slate-400">{baseVal}</div>
                          <div className="col-span-3 text-center">
                            <span className="font-bold text-white">{valA}</span>
                            {diffA > 0 && <span className="text-cyan-400 text-[10px] ml-1">+{diffA}</span>}
                          </div>
                          <div className="col-span-3 text-center">
                            <span className="font-bold text-white">{valB}</span>
                            {diffB > 0 && <span className="text-amber-400 text-[10px] ml-1">+{diffB}</span>}
                          </div>
                          <div className="col-span-1 text-right">
                            {winner === 'A' ? (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-bold text-[10px]">
                                A
                              </span>
                            ) : winner === 'B' ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px]">
                                B
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* KEY IN-GAME SUB-STATS COMPARISON */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Key In-Game Sub-Attributes Breakdown
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {[
                      { key: 'acceleration', label: 'Acceleration' },
                      { key: 'sprintSpeed', label: 'Sprint Speed' },
                      { key: 'finishing', label: 'Finishing' },
                      { key: 'shotPower', label: 'Shot Power' },
                      { key: 'shortPassing', label: 'Short Passing' },
                      { key: 'vision', label: 'Vision' },
                      { key: 'agility', label: 'Agility' },
                      { key: 'balance', label: 'Balance' },
                      { key: 'interceptions', label: 'Interceptions' },
                      { key: 'standingTackle', label: 'Standing Tackle' },
                      { key: 'strength', label: 'Strength' },
                      { key: 'stamina', label: 'Stamina' },
                    ].map(({ key, label }) => {
                      const baseSub = (selectedPlayer.subStats as any)[key] ?? 70;
                      const subA = boostA ? (boostA.boostedSub as any)[key] ?? baseSub : baseSub;
                      const subB = boostB ? (boostB.boostedSub as any)[key] ?? baseSub : baseSub;
                      const deltaA = subA - baseSub;
                      const deltaB = subB - baseSub;

                      return (
                        <div
                          key={key}
                          className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between"
                        >
                          <span className="font-sans text-slate-300">{label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-cyan-400">
                              {subA} {deltaA > 0 && <span className="text-[10px]">+{deltaA}</span>}
                            </span>
                            <span className="text-slate-600">vs</span>
                            <span className="text-amber-400">
                              {subB} {deltaB > 0 && <span className="text-[10px]">+{deltaB}</span>}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 31 ROLES++ SYNERGY SUMMARY */}
                {selectedPlayer.roles && selectedPlayer.roles.length > 0 && (
                  <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[#00ff87]" />
                      Player Roles & Focuses ({selectedPlayer.roles.length} Roles Assigned)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayer.roles.map((r, idx) => (
                        <div
                          key={idx}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                            r.tier === 'Role++'
                              ? 'bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40'
                              : r.tier === 'Role+'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{r.roleName}</span>
                          <span className="font-mono text-[10px]">({r.tier})</span>
                          <span className="text-[10px] text-slate-400 font-normal">· {r.focus}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS TOOLBAR */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2.5">
                  {onAddToSquad && (
                    <button
                      type="button"
                      onClick={() => onAddToSquad(selectedPlayer)}
                      className="px-3.5 py-2 bg-[#00ff87] hover:bg-[#00e077] text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Add to Starting XI</span>
                    </button>
                  )}

                  {onLogInvestment && (
                    <button
                      type="button"
                      onClick={() =>
                        onLogInvestment(
                          selectedPlayer,
                          Math.round(selectedPlayer.consolePrice * 1.15)
                        )
                      }
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Log to Investment Tracker</span>
                    </button>
                  )}

                  {onNavigateToTab && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('WORKSPACE_HUB')}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export to Google Sheets</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigateToTab('TACTICAL_COMMAND')}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                        <span>Ask Tactical Director</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              Select a player from the search catalog to analyze in the Chemistry & Meta Boost Lab.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
