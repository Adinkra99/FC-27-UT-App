import React, { useState, useEffect } from 'react';

interface HubViewProps {
  onNavigateTab: (tab: 'hub' | 'squad' | 'market' | 'sbcs' | 'ai-studio') => void;
  coins: number | null;
  onUpdateCoins: (newCoins: number) => void;
  onShowNotice?: (msg: string) => void;
}

interface MatchRecord {
  matchNumber: number;
  result: 'W' | 'L';
  score: string;
  opponentSR: number;
  xgFor: number;
  xgAgainst: number;
  highlight: string;
}

const MATCH_HISTORY: MatchRecord[] = [
  { matchNumber: 1, result: 'W', score: '4 - 1', opponentSR: 1980, xgFor: 3.8, xgAgainst: 1.1, highlight: 'Mbappé Hat-Trick' },
  { matchNumber: 2, result: 'W', score: '3 - 0 (RQ)', opponentSR: 2010, xgFor: 2.9, xgAgainst: 0.4, highlight: 'Vini Jr Skill Run' },
  { matchNumber: 3, result: 'W', score: '2 - 1 (AET)', opponentSR: 2095, xgFor: 2.4, xgAgainst: 1.8, highlight: 'Bellingham 118′ Header' },
  { matchNumber: 4, result: 'L', score: '2 - 3', opponentSR: 2150, xgFor: 2.1, xgAgainst: 2.6, highlight: 'Right Half-space cutback conceded' },
  { matchNumber: 5, result: 'W', score: '5 - 1', opponentSR: 2020, xgFor: 4.4, xgAgainst: 0.8, highlight: 'Clinical 4-3-2-1 counter' },
  { matchNumber: 6, result: 'W', score: '3 - 1', opponentSR: 2040, xgFor: 3.1, xgAgainst: 1.2, highlight: 'Rice interception masterclass' },
  { matchNumber: 7, result: 'W', score: '4 - 2', opponentSR: 2065, xgFor: 3.5, xgAgainst: 2.0, highlight: 'Rodri long-range Trivela' },
  { matchNumber: 8, result: 'W', score: '2 - 0 (RQ)', opponentSR: 2030, xgFor: 2.5, xgAgainst: 0.3, highlight: 'Clean Sheet defensive lock' },
  { matchNumber: 9, result: 'W', score: '3 - 2', opponentSR: 2105, xgFor: 3.2, xgAgainst: 2.1, highlight: 'Comeback from 0-2 at 60′' },
  { matchNumber: 10, result: 'W', score: '4 - 0 (RQ)', opponentSR: 2015, xgFor: 3.9, xgAgainst: 0.2, highlight: '4 goals in 32 mins' },
  { matchNumber: 11, result: 'W', score: '1 - 0', opponentSR: 2120, xgFor: 1.9, xgAgainst: 0.9, highlight: 'Courtois 8 saves' },
  { matchNumber: 12, result: 'W', score: '3 - 1', opponentSR: 2080, xgFor: 2.8, xgAgainst: 1.0, highlight: 'Mbappé brace' },
  { matchNumber: 13, result: 'W', score: '5 - 2', opponentSR: 2070, xgFor: 4.6, xgAgainst: 1.7, highlight: 'High pressing turnover' },
  { matchNumber: 14, result: 'W', score: '2 - 1', opponentSR: 2110, xgFor: 2.3, xgAgainst: 1.2, highlight: 'Late penalty conversion' },
  { matchNumber: 15, result: 'W', score: '3 - 0 (RQ)', opponentSR: 2145, xgFor: 3.4, xgAgainst: 0.5, highlight: 'Elite Division Dominance' },
];

export const HubView: React.FC<HubViewProps> = ({
  onNavigateTab,
  coins,
  onUpdateCoins,
  onShowNotice,
}) => {
  // Decision Card 1: Market Alert
  const [totwListed, setTotwListed] = useState<boolean>(false);
  const [showListingModal, setShowListingModal] = useState<boolean>(false);

  // Decision Card 2: Tactical Gap
  const [riceInstructionApplied, setRiceInstructionApplied] = useState<boolean>(false);
  const [frimpongSlotted, setFrimpongSlotted] = useState<boolean>(false);

  // Decision Card 3: SBC Solution
  const [sbcSubmitting, setSbcSubmitting] = useState<boolean>(false);
  const [sbcSubmitted, setSbcSubmitted] = useState<boolean>(false);
  const [revealedPack, setRevealedPack] = useState<boolean>(false);

  // Weekend League Modal
  const [showChampsModal, setShowChampsModal] = useState<boolean>(false);
  const [hoveredMatch, setHoveredMatch] = useState<MatchRecord | null>(null);

  // Telemetry ticker simulation
  const [syncSecondsAgo, setSyncSecondsAgo] = useState<number>(32);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncSecondsAgo((prev) => (prev >= 60 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExecuteListing = () => {
    if (totwListed) return;
    const saleTotal = 4 * 38500; // 154,000
    const netCoins = Math.round(saleTotal * 0.95); // 146,300 after 5% EA tax
    const currentCoins = coins ?? 1420000;
    onUpdateCoins(currentCoins + netCoins);
    setTotwListed(true);
    setShowListingModal(false);
    onShowNotice?.(`Listed 4x TOTW In-Forms at 38,500 coins. +${netCoins.toLocaleString()} Coins credited (5% EA tax deducted)!`);
  };

  const handleApplyRice = () => {
    setRiceInstructionApplied(true);
    onShowNotice?.('Tactical Instruction Applied: Declan Rice set to "Stay Back While Attacking". Expected xGA reduced to 0.72.');
  };

  const handleSlotFrimpong = () => {
    setFrimpongSlotted(true);
    onShowNotice?.('Squad Update: 94 TOTY Jeremie Frimpong slotted at RB. 97 Pace recovery lock active.');
  };

  const handleAutoSubmitSbc = () => {
    if (sbcSubmitted) return;
    setSbcSubmitting(true);
    setTimeout(() => {
      setSbcSubmitting(false);
      setSbcSubmitted(true);
      setRevealedPack(true);
      onShowNotice?.('86+ Double Upgrade Submitted! 11 duplicate untradeables recycled. Opening reward pack...');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full px-space-md py-space-sm space-y-space-md max-w-5xl mx-auto">
      {/* CLUB META BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-md shadow-xl border border-white/5">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary-container/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-secondary-container/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col space-y-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-space-xs">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-lowest text-primary-container shadow-inner border border-primary-container/20">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </span>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-headline-md text-headline-md tracking-tight text-on-surface uppercase font-bold">
                    CYBER APEX FC
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase border border-white/5">
                    EST. 2024
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary-container text-[14px]">military_tech</span>
                  <span className="font-body-sm text-body-sm text-primary-container font-semibold">Elite Division</span>
                  <span className="text-on-surface-variant font-body-sm text-body-sm">• SR 2045 (Rank 1)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container font-label-caps text-label-caps uppercase tracking-wider animate-pulse border border-primary-container/30">
                LIVE SYNC
              </span>
              <span className="font-data-tabular text-data-tabular text-on-surface-variant mt-0.5">ID #8027-FC</span>
            </div>
          </div>

          {/* WL Champs Status Pill (Clickable) */}
          <button
            type="button"
            onClick={() => setShowChampsModal(true)}
            className="w-full text-left flex items-center justify-between rounded-lg bg-surface-container-lowest/80 px-space-sm py-2 hover:bg-surface-container-lowest transition-colors border border-white/5 group"
          >
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px]">workspace_premium</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-tertiary-fixed-dim uppercase tracking-wider">
                  CHAMPS FINALS
                </span>
                <span className="font-data-tabular text-data-tabular text-on-surface font-bold">
                  14-1 <span className="text-on-surface-variant text-[11px] font-normal">(Rank II Locked • 71 Pts)</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="px-2 py-1 rounded bg-surface-container-high text-primary-container font-label-caps text-label-caps text-right border border-primary-container/20">
                5 LEFT
              </span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container group-hover:translate-x-0.5 transition-all text-[16px]">
                chevron_right
              </span>
            </div>
          </button>

          {/* Quick Telemetry Badges Strip */}
          <div className="grid grid-cols-3 gap-space-xs pt-1">
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container-low text-center border border-white/5">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Club Value</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[15px]">monetization_on</span>
                <span className="font-headline-md text-headline-md font-bold text-on-surface">48.2M</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container-low text-center border border-white/5">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Untradeables</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="material-symbols-outlined text-secondary-fixed text-[15px]">inventory_2</span>
                <span className="font-headline-md text-headline-md font-bold text-on-surface">1,842</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container-low text-center border border-white/5">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Chem Matrix</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="material-symbols-outlined text-primary-container text-[15px]">bolt</span>
                <span className="font-headline-md text-headline-md font-bold text-primary-container">33/33</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GOOGLE AI STUDIO & ANTIGRAVITY 2.26 SYNC STRIP */}
      <div className="rounded-xl bg-surface-container-low p-space-sm shadow-md border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="relative flex items-center justify-center w-7 h-7 rounded bg-primary-container/20 border border-primary-container/30">
              <span className="material-symbols-outlined text-primary-container text-[18px]">neurology</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_#00FF87] animate-ping"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wide">
                  Gemini 1.5 Pro Telemetry
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container-highest text-secondary-container font-label-caps font-bold border border-secondary-container/20">
                  ANTIGRAVITY 2.26
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-primary-container font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container inline-block"></span>
                Model Active &amp; Calibrated
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-data-tabular text-data-tabular text-on-surface-variant">14ms latency</div>
            <div className="font-data-tabular text-data-tabular text-secondary-container">Sync: {syncSecondsAgo}s ago</div>
          </div>
        </div>
      </div>

      {/* QUICK ACTION GRID (AI Operations Deck) */}
      <div>
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            AI Operations Deck
          </span>
          <span className="font-label-caps text-label-caps text-primary-container uppercase">Fast Route</span>
        </div>
        <div className="grid grid-cols-2 gap-space-xs sm:gap-space-sm">
          {/* AI Squad Optimizer */}
          <button
            onClick={() => onNavigateTab('squad')}
            className="flex flex-col text-left p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high transition-all group border border-white/5"
            type="button"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container group-hover:scale-105 transition-transform border border-primary-container/20">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container font-label-caps text-label-caps border border-primary-container/20">
                OPTIMAL
              </span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
              Squad Optimizer
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Target 92 OVR • 33 Chem
            </span>
          </button>

          {/* FUTBIN Live Radar */}
          <button
            onClick={() => onNavigateTab('market')}
            className="flex flex-col text-left p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high transition-all group border border-white/5"
            type="button"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary-container group-hover:scale-105 transition-transform border border-secondary-container/20">
                <span className="material-symbols-outlined text-[20px]">radar</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container/15 text-secondary-container font-label-caps text-label-caps border border-secondary-container/20">
                LIVE
              </span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
              FUTBIN Radar
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Mbappé, Jude, Vini Jr
            </span>
          </button>

          {/* Instant SBC Auto-Solver */}
          <button
            onClick={() => onNavigateTab('sbcs')}
            className="flex flex-col text-left p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high transition-all group border border-white/5"
            type="button"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary-fixed-dim group-hover:scale-105 transition-transform border border-tertiary-fixed-dim/20">
                <span className="material-symbols-outlined text-[20px]">extension</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary-fixed-dim font-label-caps text-label-caps border border-tertiary-fixed-dim/20">
                3 READY
              </span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
              SBC Solver
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              3 Solvable right now
            </span>
          </button>

          {/* Antigravity Market Sniper */}
          <button
            onClick={() => onNavigateTab('market')}
            className="flex flex-col text-left p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high transition-all group border border-white/5"
            type="button"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform border border-white/10">
                <span className="material-symbols-outlined text-[20px]">filter_center_focus</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary-container font-label-caps text-label-caps border border-primary-container/20">
                2 ACTIVE
              </span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
              Market Sniper
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              2 Filters tracking bins
            </span>
          </button>
        </div>
      </div>

      {/* GEMINI TACTICAL & CLUB DECISION FEED */}
      <div className="flex flex-col space-y-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-primary-container text-[18px]">psychology</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              AI Decision Feed
            </span>
          </div>
          <span className="font-data-tabular text-data-tabular text-on-surface-variant">3 High Impact</span>
        </div>

        {/* Feed Card 1: Market Alert */}
        <div className="flex flex-col rounded-xl bg-surface-container p-space-md space-y-space-sm shadow-md border border-white/5 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary-fixed-dim border border-tertiary-container/30 shrink-0">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-tertiary-fixed-dim uppercase tracking-wider">
                  Market Alert • Peak Volatility
                </span>
                <div className="font-headline-md text-headline-md text-on-surface font-semibold">
                  4 TOTW Cards Projected +22%
                </div>
              </div>
            </div>
            <span className="font-data-tabular text-data-tabular text-tertiary-fixed-dim font-bold bg-tertiary-container/10 px-2 py-0.5 rounded">
              18:00 UTC
            </span>
          </div>

          <p className="font-body-base text-body-base text-on-surface-variant leading-relaxed">
            Forecasting sudden demand squeeze for 84-86 In-Forms ahead of marquee match-up release. Recommended listing trigger at{' '}
            <span className="text-on-surface font-semibold font-data-tabular text-tertiary-fixed-dim">38,500 coins</span>.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-surface-container-highest border border-surface flex items-center justify-center text-[10px] font-bold text-tertiary-fixed-dim shadow">
                  86
                </div>
                <div className="w-7 h-7 rounded-full bg-surface-container-highest border border-surface flex items-center justify-center text-[10px] font-bold text-tertiary-fixed-dim shadow">
                  85
                </div>
                <div className="w-7 h-7 rounded-full bg-surface-container-highest border border-surface flex items-center justify-center text-[10px] font-bold text-tertiary-fixed-dim shadow">
                  85
                </div>
                <div className="w-7 h-7 rounded-full bg-surface-container-highest border border-surface flex items-center justify-center text-[10px] font-bold text-tertiary-fixed-dim shadow">
                  84
                </div>
              </div>
              <span className="text-xs text-on-surface-variant font-data-tabular">4 Cards ready in Club</span>
            </div>

            {totwListed ? (
              <span className="px-space-md py-2 rounded-lg bg-surface-container-highest text-primary-container font-label-caps text-label-caps uppercase tracking-wider font-bold flex items-center gap-1.5 border border-primary-container/30">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Listed at 38,500 Coins
              </span>
            ) : (
              <button
                onClick={() => setShowListingModal(true)}
                className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-caps text-label-caps uppercase tracking-wider font-bold shadow-[0_0_12px_rgba(0,255,135,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                Review &amp; One-Tap List
              </button>
            )}
          </div>
        </div>

        {/* Feed Card 2: Tactical Gap Identified */}
        <div className="flex flex-col rounded-xl bg-surface-container p-space-md space-y-space-sm shadow-md border border-white/5 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-error-container/40 flex items-center justify-center text-error border border-error/30 shrink-0">
                <span className="material-symbols-outlined text-[18px]">shield</span>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-error uppercase tracking-wider">
                  Tactical Gap • High xGA Threat
                </span>
                <div className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Right Half-Space Overloaded
                </div>
              </div>
            </div>
            <span className="font-data-tabular text-data-tabular text-error font-bold bg-error-container/20 px-2 py-0.5 rounded">
              {riceInstructionApplied || frimpongSlotted ? 'xGA 0.72' : 'xGA 1.84'}
            </span>
          </div>

          <p className="font-body-base text-body-base text-on-surface-variant leading-relaxed">
            Champs opponents exploit inverted cutbacks against current 4-3-2-1 spacing. Telemetry suggests adjusting Rice to{' '}
            <span className="text-primary-container font-semibold">"Stay Back While Attacking"</span> or swapping in{' '}
            <span className="text-secondary-fixed font-semibold">TOTY Frimpong</span> for recovery pace.
          </p>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleApplyRice}
              disabled={riceInstructionApplied}
              className={`flex-1 py-2 px-space-sm rounded-lg font-label-caps text-label-caps uppercase tracking-wider font-semibold active:scale-95 transition-all text-center border ${
                riceInstructionApplied
                  ? 'bg-surface-container-highest text-primary-container border-primary-container/40'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border-white/10'
              }`}
              type="button"
            >
              {riceInstructionApplied ? '✓ Rice Stay Back Applied' : 'Apply Rice Instruction'}
            </button>
            <button
              onClick={handleSlotFrimpong}
              disabled={frimpongSlotted}
              className={`flex-1 py-2 px-space-sm rounded-lg font-label-caps text-label-caps uppercase tracking-wider font-semibold active:scale-95 transition-all text-center border ${
                frimpongSlotted
                  ? 'bg-secondary-container/30 text-secondary-fixed border-secondary-container/40'
                  : 'bg-secondary-container/20 text-secondary-fixed hover:bg-secondary-container/30 border-secondary-container/30'
              }`}
              type="button"
            >
              {frimpongSlotted ? '✓ Frimpong Slotted' : 'Slot Frimpong'}
            </button>
          </div>
        </div>

        {/* Feed Card 3: SBC Opportunity */}
        <div className="flex flex-col rounded-xl bg-surface-container p-space-md space-y-space-sm shadow-md border border-white/5 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary-container border border-secondary-container/30 shrink-0">
                <span className="material-symbols-outlined text-[18px]">auto_awesome_motion</span>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-secondary-container uppercase tracking-wider">
                  Zero-Coin Solution Found
                </span>
                <div className="font-headline-md text-headline-md text-on-surface font-semibold">
                  86+ Double Upgrade (3h Left)
                </div>
              </div>
            </div>
            <span className="font-data-tabular text-data-tabular text-secondary-container font-bold bg-secondary-container/10 px-2 py-0.5 rounded">
              0 COINS
            </span>
          </div>

          <p className="font-body-base text-body-base text-on-surface-variant leading-relaxed">
            Gemini located an exact rating formula recycling 11 duplicate untradeable cards rotting in your unassigned queue. 0 market coins required.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim">recycling</span>
              Duplicate Value Reclaimed: <strong className="text-on-surface font-data-tabular">44,000</strong>
            </span>

            {sbcSubmitted ? (
              <button
                type="button"
                onClick={() => setRevealedPack(true)}
                className="px-space-md py-2 rounded-lg bg-surface-container-highest text-secondary-container font-label-caps text-label-caps uppercase tracking-wider font-bold border border-secondary-container/30 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">redeem</span>
                Open Reward Pack
              </button>
            ) : (
              <button
                onClick={handleAutoSubmitSbc}
                disabled={sbcSubmitting}
                className="px-space-md py-2 rounded-lg bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase tracking-wider font-bold active:scale-95 transition-all shadow-[0_0_12px_rgba(0,227,253,0.3)] hover:brightness-110 cursor-pointer disabled:opacity-50"
                type="button"
              >
                {sbcSubmitting ? 'Calculating & Submitting...' : 'Auto-Submit'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RECENT CLUB PERFORMANCE & ELO TELEMETRY */}
      <div className="flex flex-col rounded-xl bg-surface-container p-space-md space-y-space-sm shadow-lg border border-white/5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary-container text-[18px]">show_chart</span>
            <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">
              Weekend League Elo Dynamics
            </span>
          </div>
          <span className="font-data-tabular text-data-tabular text-primary-container font-bold">+340 Δ Elo</span>
        </div>

        {/* SVG Telemetry Graph */}
        <div className="relative w-full h-36 pt-2">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 90">
            <defs>
              <linearGradient id="eloGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00FF87" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00FF87" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="xgaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line stroke="#33353b" strokeDasharray="3 3" strokeOpacity="0.4" x1="0" x2="320" y1="20" y2="20" />
            <line stroke="#33353b" strokeDasharray="3 3" strokeOpacity="0.4" x1="0" x2="320" y1="50" y2="50" />
            <line stroke="#33353b" strokeOpacity="0.4" x1="0" x2="320" y1="80" y2="80" />

            {/* Elo Curve Area + Stroke */}
            <path
              d="M0,75 C40,70 60,65 90,55 C120,45 150,52 180,38 C210,25 240,30 270,18 C290,12 310,14 320,10 L320,85 L0,85 Z"
              fill="url(#eloGradient)"
            />
            <path
              d="M0,75 C40,70 60,65 90,55 C120,45 150,52 180,38 C210,25 240,30 270,18 C290,12 310,14 320,10"
              fill="none"
              stroke="#00FF87"
              strokeLinecap="round"
              strokeWidth="2.5"
            />

            {/* xGD Metric Stroke (Electric Cyan) */}
            <path
              d="M0,60 C40,55 70,58 110,48 C150,38 180,44 220,32 C260,20 290,26 320,18"
              fill="none"
              stroke="#00E5FF"
              strokeDasharray="4 2"
              strokeWidth="1.8"
            />

            {/* Match points (15 matches) */}
            {[
              { cx: 0, cy: 75, matchIndex: 0 },
              { cx: 22, cy: 72, matchIndex: 1 },
              { cx: 45, cy: 68, matchIndex: 2 },
              { cx: 68, cy: 64, matchIndex: 3 }, // loss
              { cx: 90, cy: 55, matchIndex: 4 },
              { cx: 112, cy: 49, matchIndex: 5 },
              { cx: 135, cy: 46, matchIndex: 6 },
              { cx: 158, cy: 42, matchIndex: 7 },
              { cx: 180, cy: 38, matchIndex: 8 },
              { cx: 202, cy: 32, matchIndex: 9 },
              { cx: 225, cy: 26, matchIndex: 10 },
              { cx: 248, cy: 22, matchIndex: 11 },
              { cx: 270, cy: 18, matchIndex: 12 },
              { cx: 295, cy: 14, matchIndex: 13 },
              { cx: 320, cy: 10, matchIndex: 14 },
            ].map((pt) => {
              const rec = MATCH_HISTORY[pt.matchIndex];
              const isSelected = hoveredMatch?.matchNumber === rec.matchNumber;
              return (
                <circle
                  key={pt.matchIndex}
                  cx={pt.cx}
                  cy={pt.cy}
                  r={isSelected ? 5 : 3}
                  fill={rec.result === 'W' ? '#00FF87' : '#ffb4ab'}
                  stroke="#111319"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all hover:scale-150"
                  onMouseEnter={() => setHoveredMatch(rec)}
                  onClick={() => {
                    setHoveredMatch(rec);
                    setShowChampsModal(true);
                  }}
                />
              );
            })}

            {/* Current Apex Beacon Dot */}
            <circle
              className="animate-ping"
              cx="320"
              cy="10"
              fill="#00FF87"
              r="4.5"
              style={{ transformOrigin: '320px 10px', animationDuration: '2s' }}
            />
            <circle cx="320" cy="10" fill="#00FF87" r="3.5" />
          </svg>
        </div>

        {/* Interactive Match Tooltip if hovered */}
        {hoveredMatch && (
          <div className="bg-surface-container-highest p-2 rounded-lg flex items-center justify-between text-xs border border-white/10 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded font-bold ${hoveredMatch.result === 'W' ? 'bg-primary-container/20 text-primary-container' : 'bg-error-container text-error'}`}>
                {hoveredMatch.result}
              </span>
              <span className="font-semibold text-white">Match #{hoveredMatch.matchNumber}: {hoveredMatch.score}</span>
              <span className="text-on-surface-variant">({hoveredMatch.highlight})</span>
            </div>
            <div className="font-data-tabular text-on-surface-variant">
              xG {hoveredMatch.xgFor} - {hoveredMatch.xgAgainst} (Opp SR {hoveredMatch.opponentSR})
            </div>
          </div>
        )}

        {/* Graph Telemetry Legends */}
        <div className="flex items-center justify-between pt-1 border-t-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-0.5 rounded-full bg-primary-container"></span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">ELO (15 MATCHES)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-0.5 rounded-full bg-secondary-container"></span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">xGD (+2.42/G)</span>
            </div>
          </div>
          <div className="font-data-tabular text-data-tabular text-primary-container font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            WIN STREAK: 9
          </div>
        </div>
      </div>

      {/* MODAL 1: Review & One-Tap List Confirmation */}
      {showListingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container border border-white/10 rounded-xl max-w-md w-full p-space-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[24px]">monetization_on</span>
                <h3 className="font-headline-md text-headline-md font-bold text-white uppercase">
                  Review &amp; One-Tap List
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowListingModal(false)}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-body-base text-on-surface-variant leading-relaxed">
              Confirm listing 4 tradeable In-Forms at the projected peak trigger of <strong className="text-white">38,500 coins</strong> each before 18:00 UTC marquee release.
            </p>

            <div className="bg-surface-container-low rounded-lg p-3 space-y-2 text-xs border border-white/5">
              <div className="flex justify-between text-on-surface-variant">
                <span>Total Gross Sales (4 × 38,500):</span>
                <span className="font-data-tabular text-white font-bold">154,000 Coins</span>
              </div>
              <div className="flex justify-between text-error">
                <span>EA Transfer Tax (-5%):</span>
                <span className="font-data-tabular">-7,700 Coins</span>
              </div>
              <div className="flex justify-between text-primary-container border-t border-white/10 pt-2 font-bold text-sm">
                <span>Net Credited to Wallet:</span>
                <span className="font-data-tabular">+146,300 Coins</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowListingModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteListing}
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,135,0.4)]"
              >
                Confirm List All (146,300 Net)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Champs Finals Detailed Run */}
      {showChampsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container border border-white/10 rounded-xl max-w-lg w-full p-space-md space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[24px]">workspace_premium</span>
                <div>
                  <h3 className="font-headline-md text-headline-md font-bold text-white uppercase">
                    Champs Finals Campaign (14-1)
                  </h3>
                  <span className="text-xs text-on-surface-variant font-data-tabular">
                    Elite Division • 5 Matches Remaining
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChampsModal(false)}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Rank Projection Banner */}
            <div className="p-3 rounded-lg bg-primary-container/10 border border-primary-container/30 flex items-center justify-between">
              <div>
                <span className="font-label-caps text-label-caps text-primary-container uppercase">Rank Status</span>
                <div className="font-headline-md text-sm text-white font-bold">Rank II Locked (67 Pts)</div>
              </div>
              <div className="text-right">
                <span className="font-label-caps text-label-caps text-secondary-container uppercase">Target Rank I (76 Pts)</span>
                <div className="text-xs text-on-surface font-data-tabular">Need 3 Wins out of 5</div>
              </div>
            </div>

            {/* Match History Scroll Area */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {MATCH_HISTORY.map((m) => (
                <div
                  key={m.matchNumber}
                  className="p-2.5 rounded-lg bg-surface-container-low border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] ${
                        m.result === 'W'
                          ? 'bg-primary-container/20 text-primary-container'
                          : 'bg-error-container text-error'
                      }`}
                    >
                      {m.result}
                    </span>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Match #{m.matchNumber}</span>
                        <span className="font-data-tabular text-on-surface-variant">({m.score})</span>
                      </div>
                      <div className="text-on-surface-variant text-[11px]">{m.highlight}</div>
                    </div>
                  </div>
                  <div className="text-right font-data-tabular text-[11px]">
                    <div className="text-white">Opp SR {m.opponentSR}</div>
                    <div className="text-on-surface-variant">xG {m.xgFor} - {m.xgAgainst}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowChampsModal(false)}
                className="px-4 py-2 bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider rounded-lg"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reward Pack Opening Animation */}
      {revealedPack && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container border border-primary-container/40 rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-[0_0_50px_rgba(0,255,135,0.2)]">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary-container/20 border-2 border-primary-container flex items-center justify-center text-primary-container animate-bounce">
                <span className="material-symbols-outlined text-[36px]">workspace_premium</span>
              </div>
            </div>

            <div>
              <span className="font-label-caps text-label-caps text-primary-container uppercase tracking-widest">
                WALKOUT REWARD UNLOCKED
              </span>
              <h3 className="font-headline-xl text-headline-xl text-white font-bold mt-1">
                86+ Double Upgrade Pack
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Recycled 11 duplicate untradeables at 0 coin cost!
              </p>
            </div>

            {/* Revealed Player Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-gradient-to-b from-amber-500/20 via-surface-container-high to-surface-container border border-amber-400/30 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-amber-400">TOTW WALKOUT</span>
                <div className="font-headline-xl text-2xl font-black text-white mt-1">89</div>
                <div className="font-headline-md text-sm font-bold text-white mt-0.5">Rodri</div>
                <div className="text-[11px] text-on-surface-variant">FC Barcelona • CDM</div>
                <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-mono font-bold">
                  PlayStyle+ Anchor
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-b from-primary-container/20 via-surface-container-high to-surface-container border border-primary-container/30 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-primary-container">SPECIAL EDITION</span>
                <div className="font-headline-xl text-2xl font-black text-white mt-1">88</div>
                <div className="font-headline-md text-sm font-bold text-white mt-0.5">Valverde</div>
                <div className="text-[11px] text-on-surface-variant">Real Madrid • CM</div>
                <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-secondary-container/20 text-secondary-container font-mono font-bold">
                  PlayStyle+ Relentless
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRevealedPack(false)}
              className="w-full py-3 rounded-lg bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,135,0.4)] hover:brightness-110"
            >
              Send Both to Club Inventory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
