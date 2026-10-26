import React, { useState, useMemo } from 'react';
import {
  FC27_ULTIMATE_SCREAM_TEAM_1,
  LivePromoCardItem,
  FC27ConsolePlayer,
} from '../data/fc27ConsoleData';
import { calculateEaTaxMetrics } from '../utils/fc27DeterministicEngine';
import { TemporalAnchor } from '../utils/timeGrounding';
import { PushToTalkButton } from './PushToTalkButton';
import { RoutingTelemetryReceipt } from './AntigravityMcpAndChatDrawer';
import {
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  Coins,
  ArrowUpRight,
  Flame,
  ShieldCheck,
} from 'lucide-react';

export interface ConsoleInvestmentPosition {
  id: string;
  playerName: string;
  rating: number;
  rarity: string;
  buyPrice: number;
  targetSellPrice: number;
  currentXboxPrice?: number;
  quantity: number;
  status?: 'active' | 'target_hit' | 'sold';
  notes?: string;
}

export interface GeminiTransferAlert {
  playerName: string;
  rating: number;
  signal: 'BUY OPPORTUNITY' | 'HOLD' | 'TAKE PROFIT (SELL NOW)' | 'PANIC DROP WARNING';
  currentXboxPrice: number;
  predictedTargetPrice: number;
  netProfitPerCardAfterTax: number;
  catalystReason: string;
  timeHorizon: string;
}

interface InvestmentTrackerTabProps {
  t0Anchor: TemporalAnchor;
  userCoins: number | null;
  onUpdateUserCoins: (newCoins: number) => void;
  investments: ConsoleInvestmentPosition[];
  onAddInvestment: (pos: Omit<ConsoleInvestmentPosition, 'id'>) => void;
  onUpdateInvestmentStatus: (id: string, status: 'active' | 'target_hit' | 'sold') => void;
  onRemoveInvestment: (id: string) => void;
  catalogPlayers: FC27ConsolePlayer[];
  clubContextForAi: Record<string, unknown>;
}

const DEFAULT_TRANSFER_ALERTS: GeminiTransferAlert[] = [
  {
    playerName: 'Geoffrey Kondogbia (Ultimate Scream)',
    rating: 86,
    signal: 'BUY OPPORTUNITY',
    currentXboxPrice: 28500,
    predictedTargetPrice: 34500,
    netProfitPerCardAfterTax: 4275,
    catalystReason:
      'Out-of-packs scarcity incoming after Ultimate Scream Team 1 rotates out; 94 Strength + Holding++ makes him top French/Ligue 1 link under 35k Coins.',
    timeHorizon: '24h–48h Hold into Weekend League',
  },
  {
    playerName: 'Marcos Alonso (Ultimate Scream)',
    rating: 85,
    signal: 'BUY OPPORTUNITY',
    currentXboxPrice: 12200,
    predictedTargetPrice: 15250,
    netProfitPerCardAfterTax: 2288,
    catalystReason:
      'Trading just 1,700 Coins above Quick Sell floor (10.5k) on Xbox Series S. Zero downside risk; spikes when LaLiga/Spain SBC requirements drop at 18:00 UK.',
    timeHorizon: 'Daily 18:00 UK Content Drop Flip',
  },
  {
    playerName: '86 Regular Holographic Fodder (Dani Olmo / Mainoo)',
    rating: 86,
    signal: 'TAKE PROFIT (SELL NOW)',
    currentXboxPrice: 12400,
    predictedTargetPrice: 12750,
    netProfitPerCardAfterTax: 1513,
    catalystReason:
      '85 Bobby Moore & 85 Otamendi Streamlined SBC demand pushed 86 Regular Holographics (1.25x = 238 Item Score) up +14%. Sell into pre-18:00 hype.',
    timeHorizon: 'Immediate Exit before 18:00 UK Supply',
  },
  {
    playerName: 'Vobian (Ultimate Scream)',
    rating: 86,
    signal: 'HOLD',
    currentXboxPrice: 14500,
    predictedTargetPrice: 18500,
    netProfitPerCardAfterTax: 3075,
    catalystReason:
      'High supply from 81+ Player Picks keeping price compressed at 14.5k; hold until Sunday night mini-release demand.',
    timeHorizon: '48h Hold',
  },
];

export const InvestmentTrackerTab: React.FC<InvestmentTrackerTabProps> = ({
  t0Anchor,
  userCoins,
  onUpdateUserCoins,
  investments,
  onAddInvestment,
  onUpdateInvestmentStatus,
  onRemoveInvestment,
  clubContextForAi,
}) => {
  // New Acquisition Form State
  const [playerName, setPlayerName] = useState<string>('Geoffrey Kondogbia');
  const [rating, setRating] = useState<number>(86);
  const [rarity, setRarity] = useState<string>('Ultimate Scream');
  const [buyPrice, setBuyPrice] = useState<number>(28500);
  const [targetSellPrice, setTargetSellPrice] = useState<number>(34000);
  const [quantity, setQuantity] = useState<number>(1);
  const [promoSearchFilter, setPromoSearchFilter] = useState<string>('');
  const [promoBudgetFilter, setPromoBudgetFilter] = useState<'ALL' | 'UNDER_35K' | 'FREE_OBJ_SBC'>(
    'ALL'
  );

  // Gemini Live Market Trend & Transfer Alert Engine State
  const [alerts, setAlerts] = useState<GeminiTransferAlert[]>(DEFAULT_TRANSFER_ALERTS);
  const [aiMarketSummary, setAiMarketSummary] = useState<string | null>(null);
  const [isAnalyzingMarket, setIsAnalyzingMarket] = useState<boolean>(false);
  const [marketAnalysisMode, setMarketAnalysisMode] = useState<
    'FLASH_SEARCH' | 'ARGON_DEEP' | 'LITE_FAST'
  >('FLASH_SEARCH');
  const [lastTelemetry, setLastTelemetry] = useState<RoutingTelemetryReceipt | null>(null);
  const [groundingSources, setGroundingSources] = useState<{ title: string; uri: string }[]>([]);

  const formTaxPreview = useMemo(
    () => calculateEaTaxMetrics(buyPrice, targetSellPrice),
    [buyPrice, targetSellPrice]
  );

  const portfolioStats = useMemo(() => {
    let totalInvested = 0;
    let projectedGrossSale = 0;
    let projectedNetProfitAfterTax = 0;
    let activeCount = 0;

    for (const inv of investments) {
      if (inv.status === 'sold') continue;
      activeCount += inv.quantity;
      totalInvested += inv.buyPrice * inv.quantity;
      projectedGrossSale += inv.targetSellPrice * inv.quantity;
      const metrics = calculateEaTaxMetrics(inv.buyPrice, inv.targetSellPrice);
      projectedNetProfitAfterTax += metrics.netProfit * inv.quantity;
    }

    const portfolioRoiPct =
      totalInvested > 0
        ? Number(((projectedNetProfitAfterTax / totalInvested) * 100).toFixed(2))
        : 0;

    return {
      totalInvested,
      projectedGrossSale,
      projectedNetProfitAfterTax,
      portfolioRoiPct,
      activeCount,
    };
  }, [investments]);

  const filteredUltimateScream = useMemo(() => {
    return FC27_ULTIMATE_SCREAM_TEAM_1.filter((item) => {
      if (promoBudgetFilter === 'UNDER_35K' && item.xboxSeriesSPrice > (userCoins ?? 35000)) {
        return false;
      }
      if (
        promoBudgetFilter === 'FREE_OBJ_SBC' &&
        item.releaseSource === 'PACKS_MARKET'
      ) {
        return false;
      }
      if (promoSearchFilter.trim().length > 0) {
        const q = promoSearchFilter.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.position.toLowerCase().includes(q) ||
          item.club.toLowerCase().includes(q) ||
          String(item.rating).includes(q)
        );
      }
      return true;
    });
  }, [promoBudgetFilter, promoSearchFilter, userCoins]);

  const handleLogAcquisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onAddInvestment({
      playerName: playerName.trim(),
      rating: Math.max(45, Math.min(99, rating)),
      rarity,
      buyPrice: Math.max(150, buyPrice),
      targetSellPrice: Math.max(200, targetSellPrice),
      currentXboxPrice: buyPrice,
      quantity: Math.max(1, quantity),
      status: 'active',
    });
  };

  const quickLoadPromoCardToForm = (card: LivePromoCardItem) => {
    const buy = card.xboxSeriesSPrice > 0 ? card.xboxSeriesSPrice : 11000;
    const suggestedSell = Math.ceil((buy * 1.15) / 250) * 250;
    setPlayerName(card.name);
    setRating(card.rating);
    setRarity('Ultimate Scream');
    setBuyPrice(buy);
    setTargetSellPrice(suggestedSell);
    setQuantity(1);
  };

  const runGeminiMarketTrendScan = async () => {
    setIsAnalyzingMarket(true);
    try {
      const resp = await fetch('/api/gemini/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientT0: t0Anchor.britishFullFormatted,
          userCoins: userCoins ?? 35000,
          activeInvestments: investments,
          analysisTier: marketAnalysisMode,
          clubContext: clubContextForAi,
        }),
      });
      const data = await resp.json();
      if (data.marketSummary) {
        setAiMarketSummary(data.marketSummary);
      }
      if (Array.isArray(data.alerts) && data.alerts.length > 0) {
        setAlerts(data.alerts);
      }
      if (data.routingTelemetry) {
        setLastTelemetry(data.routingTelemetry);
      }
      if (Array.isArray(data.sources)) {
        setGroundingSources(data.sources);
      }
    } catch (err) {
      console.error('Market trend analysis failed:', err);
    } finally {
      setIsAnalyzingMarket(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. PORTFOLIO KPI HEADER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400">
            LIQUID XBOX SERIES S COINS
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#00ff87] mt-1">
            {userCoins !== null ? `${userCoins.toLocaleString()} Coins` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Safe Trade Cap · 5% EA Tax Enforced
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400">
            CAPITAL IN ACTIVE POSITIONS
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {portfolioStats.totalInvested.toLocaleString()} Coins
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {portfolioStats.activeCount} Active Card(s) Logged
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400">
            PROJECTED NET PROFIT (AFTER 5% TAX)
          </div>
          <div
            className={`text-xl font-bold font-mono tabular-nums mt-1 ${
              portfolioStats.projectedNetProfitAfterTax >= 0 ? 'text-[#00ff87]' : 'text-red-400'
            }`}
          >
            {portfolioStats.projectedNetProfitAfterTax >= 0 ? '+' : ''}
            {portfolioStats.projectedNetProfitAfterTax.toLocaleString()} Coins
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Projected ROI: {portfolioStats.portfolioRoiPct}%
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400">
            ACTIVE PROMO CYCLE @ T=0
          </div>
          <div className="text-base font-bold text-amber-400 mt-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ultimate Scream Team 1</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            18:00 UK Drop in {t0Anchor.countdownTo1800Drop.formatted}
          </div>
        </div>
      </div>

      {/* 2. LOG PLAYER ACQUISITION + GEMINI MARKET TREND SCANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Acquisition Logger Form */}
        <form
          onSubmit={handleLogAcquisition}
          className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-[#00ff87]">
                CONSOLE INVESTMENT LOGGER (XBOX SERIES S)
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Log Player Acquisition & Flip Target
              </h3>
            </div>
            <PushToTalkButton
              compact
              label="Dictate Trade"
              onTranscript={(text) => {
                setPlayerName(text);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Player Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Geoffrey Kondogbia"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">OVR Rating</label>
              <input
                type="number"
                min={45}
                max={99}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value) || 85)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Card Rarity / Promo</label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="Ultimate Scream">Ultimate Scream</option>
                <option value="Regular Holographic">Regular Holographic (1.25x)</option>
                <option value="Pristine Holographic">Pristine Holographic (1.50x)</option>
                <option value="Gold">Base Gold</option>
                <option value="TOTW">Team of the Week (TOTW)</option>
                <option value="Trailblazers">Trailblazers</option>
                <option value="UT Hero">UT Hero</option>
                <option value="Icon">Icon</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Quantity Bought</label>
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Xbox Series S Buy Price (Coins)
              </label>
              <input
                type="number"
                min={150}
                step={50}
                value={buyPrice}
                onChange={(e) => setBuyPrice(Math.max(150, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Target Sell Price (Coins)
              </label>
              <input
                type="number"
                min={200}
                step={50}
                value={targetSellPrice}
                onChange={(e) => setTargetSellPrice(Math.max(200, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
            </div>
          </div>

          {/* Live Deterministic 5% Tax Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-400">Break-Even Sell Price (5% EA Tax):</span>
              <span className="text-amber-400 font-semibold">
                {formTaxPreview.breakEvenSalePrice.toLocaleString()} Coins
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">5% EA Tax Deducted per Card:</span>
              <span className="text-slate-300">-{formTaxPreview.eaTax.toLocaleString()} Coins</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-300">Net Profit ({quantity}x Cards):</span>
              <span
                className={
                  formTaxPreview.netProfit >= 0
                    ? 'text-[#00ff87] font-bold'
                    : 'text-red-400 font-bold'
                }
              >
                {formTaxPreview.netProfit >= 0 ? '+' : ''}
                {(formTaxPreview.netProfit * quantity).toLocaleString()} Coins ({formTaxPreview.roiPct}
                %)
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Log Acquisition to Portfolio</span>
          </button>
        </form>

        {/* Actionable Gemini Market Trend & Transfer Alert Feed */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono text-[#00ff87] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GEMINI CONSOLE MARKET TREND & TRANSFER ALERT ENGINE</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Predicted Xbox Series S Price Movements & Exit Signals
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={marketAnalysisMode}
                onChange={(e) => setMarketAnalysisMode(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
              >
                <option value="FLASH_SEARCH">
                  Tier 2: gemini-3.8-flash + Google Search (Live Web)
                </option>
                <option value="ARGON_DEEP">
                  Tier 3: gemini-4-argon (Deep Portfolio Forecast)
                </option>
                <option value="LITE_FAST">
                  Tier 1: gemini-3.5-flash-lite (Fast Check)
                </option>
              </select>

              <button
                type="button"
                onClick={runGeminiMarketTrendScan}
                disabled={isAnalyzingMarket}
                className="px-3.5 py-1.5 rounded-lg bg-[#00ff87] hover:bg-[#00e67a] disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isAnalyzingMarket ? 'Scanning Market...' : 'Scan Live Market Trends'}</span>
              </button>
            </div>
          </div>

          {lastTelemetry && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong className="text-[#00ff87]">{lastTelemetry.tierLabel}</strong> ·{' '}
                {lastTelemetry.latencyMs}ms
              </span>
              <span className="text-slate-400">{lastTelemetry.routingReason}</span>
            </div>
          )}

          {aiMarketSummary && (
            <div className="bg-slate-950/90 border border-[#00ff87]/40 rounded-xl p-3.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {aiMarketSummary}
              {groundingSources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                  {groundingSources.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#00ff87] hover:underline flex items-center gap-1"
                    >
                      <span>{s.title}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actionable Alert Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alerts.map((alert, idx) => {
              const isBuy = alert.signal === 'BUY OPPORTUNITY';
              const isSell = alert.signal === 'TAKE PROFIT (SELL NOW)';
              const isWarn = alert.signal === 'PANIC DROP WARNING';
              return (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span
                        className={
                          isBuy
                            ? 'text-[#00ff87] font-bold'
                            : isSell
                            ? 'text-amber-400 font-bold'
                            : isWarn
                            ? 'text-red-400 font-bold'
                            : 'text-sky-400 font-bold'
                        }
                      >
                        {alert.signal}
                      </span>
                      <span className="text-slate-400">{alert.timeHorizon}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">
                      {alert.rating} {alert.playerName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {alert.catalystReason}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono tabular-nums">
                    <div>
                      <span className="text-slate-400">Buy: </span>
                      <strong className="text-white">
                        {alert.currentXboxPrice.toLocaleString()}
                      </strong>
                      <span className="text-slate-500"> → </span>
                      <span className="text-slate-400">Target: </span>
                      <strong className="text-[#00ff87]">
                        {alert.predictedTargetPrice.toLocaleString()}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPlayerName(alert.playerName);
                        setRating(alert.rating);
                        setBuyPrice(alert.currentXboxPrice);
                        setTargetSellPrice(alert.predictedTargetPrice);
                      }}
                      className="text-[11px] text-[#00ff87] hover:underline"
                    >
                      Load Flip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. ACTIVE INVESTMENT PORTFOLIO TABLE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-[#00ff87]">
              TRACKED CONSOLE PORTFOLIO LEDGER
            </span>
            <h3 className="text-base font-bold text-white">
              Your Logged Player Acquisitions ({investments.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Zero-Guessing Policy: Starts Empty Until You Log Flips
          </span>
        </div>

        {investments.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-2">
            <Coins className="w-7 h-7 text-slate-500 mx-auto" />
            <div className="text-sm font-semibold text-white">
              No Player Acquisitions Logged Yet
            </div>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Use the Console Investment Logger above or click "One-Click Track Flip" on any
              Ultimate Scream Team 1 player below to track buy price, 5% EA tax break-even, and
              target sell alerts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Player / Rarity</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Buy Price</th>
                  <th className="py-2.5 px-3 text-right">Break-Even (5% Tax)</th>
                  <th className="py-2.5 px-3 text-right">Target Sell</th>
                  <th className="py-2.5 px-3 text-right">Est. Net Profit</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                {investments.map((inv) => {
                  const m = calculateEaTaxMetrics(inv.buyPrice, inv.targetSellPrice);
                  const totalNet = m.netProfit * inv.quantity;
                  const status = inv.status || 'active';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-white">
                          {inv.rating} {inv.playerName}
                        </div>
                        <div className="text-[11px] text-slate-400">{inv.rarity}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-white">{inv.quantity}x</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">
                        {inv.buyPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-400">
                        {m.breakEvenSalePrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-white font-semibold">
                        {inv.targetSellPrice.toLocaleString()}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          totalNet >= 0 ? 'text-[#00ff87]' : 'text-red-400'
                        }`}
                      >
                        {totalNet >= 0 ? '+' : ''}
                        {totalNet.toLocaleString()} ({m.roiPct}%)
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={
                            status === 'sold'
                              ? 'text-[#00ff87]'
                              : status === 'target_hit'
                              ? 'text-amber-400'
                              : 'text-sky-400'
                          }
                        >
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        {status !== 'sold' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateInvestmentStatus(inv.id, 'sold');
                              if (userCoins !== null) {
                                onUpdateUserCoins(userCoins + totalNet);
                              }
                            }}
                            className="px-2 py-1 rounded bg-[#00ff87]/15 border border-[#00ff87]/50 text-[#00ff87] hover:bg-[#00ff87]/25 text-[11px]"
                          >
                            Mark Sold (+Profit)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveInvestment(inv.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete position"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. ULTIMATE SCREAM TEAM 1 LIVE ROSTER, SBCs & OBJECTIVES RADAR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-mono text-amber-400">
              LIVE PROMO ROSTER · OCTOBER 2026 @ T=0
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Ultimate Scream Team 1 — Packs, SBCs (85 Moore / 85 Otamendi) & Free Objectives (87 Jill Scott / 87 Verón)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={promoSearchFilter}
                onChange={(e) => setPromoSearchFilter(e.target.value)}
                placeholder="Search Raphinha, Scott, Verón, Lukeba..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white w-56"
              />
            </div>
            <PushToTalkButton
              compact
              label="Voice Search"
              onTranscript={(text) => setPromoSearchFilter(text)}
            />
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setPromoBudgetFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  promoBudgetFilter === 'ALL'
                    ? 'bg-[#00ff87] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({FC27_ULTIMATE_SCREAM_TEAM_1.length})
              </button>
              <button
                type="button"
                onClick={() => setPromoBudgetFilter('UNDER_35K')}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  promoBudgetFilter === 'UNDER_35K'
                    ? 'bg-[#00ff87] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fits 35k Budget
              </button>
              <button
                type="button"
                onClick={() => setPromoBudgetFilter('FREE_OBJ_SBC')}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  promoBudgetFilter === 'FREE_OBJ_SBC'
                    ? 'bg-[#00ff87] text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SBCs & Objectives Only
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredUltimateScream.map((item) => {
            const fitsBudget =
              userCoins !== null ? item.xboxSeriesSPrice <= userCoins : item.xboxSeriesSPrice <= 35000;
            return (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      {item.releaseSource === 'OBJECTIVE_FREE'
                        ? 'FREE OBJECTIVE'
                        : item.releaseSource === 'PLAYER_SBC'
                        ? 'LIVE PLAYER SBC'
                        : 'ULTIMATE SCREAM TEAM 1'}
                      {' · '}
                      {item.position}
                      {item.altPositions.length > 0 ? ` (${item.altPositions.join('/')})` : ''}
                    </span>
                    <span className="text-[#00ff87] font-bold">
                      Worth-It: {item.worthItScore}/100
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <h4 className="text-sm font-bold text-white">
                      {item.rating} {item.name}
                    </h4>
                    <span
                      className={`text-xs font-mono tabular-nums font-bold ${
                        item.xboxSeriesSPrice === 0
                          ? 'text-[#00ff87]'
                          : fitsBudget
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {item.xboxSeriesSPrice === 0
                        ? '0 Coins (Free Grind)'
                        : `${item.xboxSeriesSPrice.toLocaleString()} Coins`}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.club} · {item.nation}
                  </div>
                  <div className="text-[11px] font-mono text-[#00ff87] mt-1.5">
                    {item.keyRolePlusPlus} · {item.keyPlayStylesPlus.join(' · ')}
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {item.tacticalNote}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {item.expiresInHours
                      ? `Expires in ${Math.floor(item.expiresInHours / 24)}d ${
                          item.expiresInHours % 24
                        }h`
                      : fitsBudget
                      ? 'Affordable Now (<=35k)'
                      : 'Progressive Target'}
                  </span>
                  {item.releaseSource === 'PACKS_MARKET' && (
                    <button
                      type="button"
                      onClick={() => quickLoadPromoCardToForm(item)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-[#00ff87]"
                    >
                      One-Click Track Flip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
