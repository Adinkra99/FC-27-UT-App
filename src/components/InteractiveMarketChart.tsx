import React, { useState } from 'react';
import { FC27ConsolePlayer } from '../data/fc27ConsoleData';
import { calculateEaTaxMetrics } from '../utils/fc27DeterministicEngine';
import { TrendingUp, Bell, Sparkles, Calculator } from 'lucide-react';

interface InteractiveMarketChartProps {
  player: FC27ConsolePlayer;
  t0Formatted: string;
  onTrackInvestment: (player: FC27ConsolePlayer, buyPrice: number, targetSell: number) => void;
  onAskGeminiTrend: (player: FC27ConsolePlayer) => void;
  isAnalyzingTrend: boolean;
}

export const InteractiveMarketChart: React.FC<InteractiveMarketChartProps> = ({
  player,
  t0Formatted,
  onTrackInvestment,
  onAskGeminiTrend,
  isAnalyzingTrend,
}) => {
  const [timeframe, setTimeframe] = useState<'24H' | '7D'>('24H');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [customBuyPrice, setCustomBuyPrice] = useState<number>(player.consolePrice);
  const [customSellPrice, setCustomSellPrice] = useState<number>(
    Math.round(player.consolePrice * 1.09)
  );

  // Sync default prices when selected player changes
  React.useEffect(() => {
    setCustomBuyPrice(player.consolePrice);
    setCustomSellPrice(Math.round(player.consolePrice * 1.09));
    setHoveredIdx(null);
  }, [player.id, player.consolePrice]);

  const series =
    timeframe === '24H' ? player.hourlyPriceHistory24h : player.dailyPriceHistory7d;

  const prices = series.map((p) => p.consolePrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = Math.max(1, maxPrice - minPrice);

  const svgWidth = 640;
  const svgHeight = 210;
  const padX = 36;
  const padY = 24;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padY * 2;

  const points = series.map((pt, idx) => {
    const x = padX + (idx / Math.max(1, series.length - 1)) * plotW;
    const y = padY + plotH - ((pt.consolePrice - minPrice) / range) * plotH;
    return { x, y, ...pt };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${points[0].x},${padY + plotH} ${polylinePoints} ${
    points[points.length - 1].x
  },${padY + plotH}`;

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];
  const taxMetrics = calculateEaTaxMetrics(customBuyPrice, customSellPrice);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Top Player Summary & Timeframe Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-[#00ff87]">{player.rarity}</span>
            <span aria-hidden="true">·</span>
            <span>{player.club}</span>
            <span aria-hidden="true">·</span>
            <span>{player.league}</span>
            <span aria-hidden="true">·</span>
            <span>{player.nation}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Item Score: {player.effectiveItemScore} ({player.holographicMultiplier}x)</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            {player.rating} OVR {player.name} ({player.position})
          </h3>
          {player.fotmobTransferNote && (
            <p className="text-xs text-slate-400 mt-1">{player.fotmobTransferNote}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Console Live Buy-Now (T=0)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#00ff87]">
              {player.consolePrice.toLocaleString()} <span className="text-xs text-slate-400">Coins</span>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setTimeframe('24H')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                timeframe === '24H'
                  ? 'bg-[#00ff87] text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              24H Hourly
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('7D')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                timeframe === '7D'
                  ? 'bg-[#00ff87] text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              7D Trend
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Touch/Hover SVG Price Graph */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Selected Point ({activePoint.timeLabel}):{' '}
            <strong className="text-white font-mono tabular-nums">
              {activePoint.consolePrice.toLocaleString()} Coins
            </strong>{' '}
            · Trade Volume:{' '}
            <strong className="text-slate-200 font-mono tabular-nums">
              {activePoint.volume} auctions
            </strong>
          </span>
          <span className="font-mono text-slate-400">
            24h Range: {minPrice.toLocaleString()} – {maxPrice.toLocaleString()} · Anchored {t0Formatted}
          </span>
        </div>

        <div className="w-full overflow-x-auto bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-48 select-none touch-pan-y"
            role="img"
            aria-label={`Console price history chart for ${player.name}`}
          >
            <defs>
              <linearGradient id="fc27PriceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff87" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#00ff87" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal reference lines */}
            {[0, 0.5, 1].map((ratio, i) => {
              const y = padY + ratio * plotH;
              const val = Math.round(maxPrice - ratio * range);
              return (
                <g key={i}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={svgWidth - padX}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padX}
                    y={y - 5}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {val.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Shaded area & line */}
            <polygon points={areaPoints} fill="url(#fc27PriceGrad)" />
            <polyline
              fill="none"
              stroke="#00ff87"
              strokeWidth="2.5"
              points={polylinePoints}
            />

            {/* Interactive touch/mouse hit columns */}
            {points.map((pt, idx) => (
              <g
                key={pt.timeLabel}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(idx)}
              >
                <rect
                  x={pt.x - plotW / (points.length * 2)}
                  y={0}
                  width={plotW / points.length}
                  height={svgHeight}
                  fill="transparent"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === idx ? 6 : 4}
                  fill={hoveredIdx === idx ? '#fbbf24' : '#00ff87'}
                  stroke="#090d16"
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  fill={hoveredIdx === idx ? '#f8fafc' : '#94a3b8'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {pt.timeLabel}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 5% EA Tax & Break-Even Calculator + Action Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-800">
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Target Buy / Bid</label>
            <input
              type="number"
              value={customBuyPrice}
              onChange={(e) => setCustomBuyPrice(Math.max(150, Number(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-[#00ff87]"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Target Sale Price</label>
            <input
              type="number"
              value={customSellPrice}
              onChange={(e) => setCustomSellPrice(Math.max(150, Number(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-[#00ff87]"
            />
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>Break-Even (5% Tax)</span>
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-amber-400 mt-1">
              {taxMetrics.breakEvenSalePrice.toLocaleString()} Coins
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Tax: -{taxMetrics.eaTax.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#00ff87]" />
              <span>Net Profit (After Tax)</span>
            </div>
            <div
              className={`text-sm font-bold font-mono tabular-nums mt-1 ${
                taxMetrics.netProfit >= 0 ? 'text-[#00ff87]' : 'text-red-400'
              }`}
            >
              {taxMetrics.netProfit >= 0 ? '+' : ''}
              {taxMetrics.netProfit.toLocaleString()} ({taxMetrics.roiPct}%)
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Discard: {player.quickSellDiscard.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col justify-end gap-2">
          <button
            type="button"
            onClick={() => onTrackInvestment(player, customBuyPrice, customSellPrice)}
            className="w-full py-2.5 px-4 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
          >
            <Bell className="w-4 h-4" />
            <span>Track Flip & Price Alert</span>
          </button>
          <button
            type="button"
            disabled={isAnalyzingTrend}
            onClick={() => onAskGeminiTrend(player)}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[42px] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {isAnalyzingTrend ? 'Running Trend Analysis...' : 'Analyze Chart with Gemini 3.8 Flash'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
