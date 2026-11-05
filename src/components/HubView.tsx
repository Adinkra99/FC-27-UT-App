import React, { useState } from 'react';

export interface HubViewProps {
  onNavigateTab: (tab: 'hub' | 'squad' | 'market' | 'sbcs' | 'ai-studio') => void;
  coins: number | null;
  clubName: string | null;
  rivalsDivision: string | null;
  fifaPoints: number | null;
  dailySp: number | null;
  galleryLevel: number | null;
  champsRecord: string | null;
  onUpdateCoins: (newCoins: number | null) => void;
  onOpenSyncModal: () => void;
  onShowNotice?: (msg: string) => void;
  activeModelRoute: string;
  onChangeModelRoute: (route: string) => void;
}

export const HubView: React.FC<HubViewProps> = ({
  onNavigateTab,
  coins,
  clubName,
  rivalsDivision,
  fifaPoints,
  dailySp,
  galleryLevel,
  champsRecord,
  onUpdateCoins,
  onOpenSyncModal,
  onShowNotice,
  activeModelRoute,
  onChangeModelRoute,
}) => {
  // Inline Coin Tuner State
  const [isEditingCoins, setIsEditingCoins] = useState<boolean>(false);
  const [coinInputVal, setCoinInputVal] = useState<string>(coins !== null ? String(coins) : '');

  // Feed Actions
  const [marketActionLogged, setMarketActionLogged] = useState<boolean>(false);
  const [tacticalActionLogged, setTacticalActionLogged] = useState<boolean>(false);

  const formatCoins = (num: number | null): string => {
    if (num === null) return '—';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  const handleSaveCoinInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (coinInputVal.trim() === '' || coinInputVal.trim() === '—') {
      onUpdateCoins(null);
      if (onShowNotice) onShowNotice('Coins set to BLANK (—)');
    } else {
      const parsed = parseInt(coinInputVal.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed)) {
        onUpdateCoins(parsed);
        if (onShowNotice) onShowNotice(`Coins updated to ${parsed.toLocaleString()}`);
      }
    }
    setIsEditingCoins(false);
  };

  const handleQuickCoinAdjust = (delta: number) => {
    const current = coins ?? 0;
    const nextVal = Math.max(0, current + delta);
    onUpdateCoins(nextVal);
    setCoinInputVal(String(nextVal));
    if (onShowNotice) {
      onShowNotice(`${delta > 0 ? '+' : ''}${delta.toLocaleString()} Coins applied (${nextVal.toLocaleString()} total)`);
    }
  };

  const getModelLabel = (routeId: string) => {
    switch (routeId) {
      case 'FLASH_38_PRIORITY':
        return { name: 'Gemini 3.8 Flash', tag: 'WORKHORSE', icon: 'bolt' };
      case 'SPEED_LITE_35':
        return { name: 'Gemini 3.5 Flash-Lite', tag: 'SUB-200MS SPEED', icon: 'speed' };
      case 'ARGON_MATH':
        return { name: 'Gemini 3.8 Flash (Cost Guardrail)', tag: 'COST PROTECTED', icon: 'shield' };
      default:
        return { name: 'Gemini Auto-Router', tag: '3.8 FLASH + 3.5 LITE', icon: 'auto_awesome' };
    }
  };

  const currentModel = getModelLabel(activeModelRoute);

  return (
    <div className="flex flex-col w-full px-space-md py-space-sm space-y-space-md max-w-[1600px] mx-auto">
      {/* 1. CLUB META BANNER: CANNONS N PECKS (EST. SEP 2009 · 17 YRS) */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-high p-space-md shadow-2xl border border-white/5">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col space-y-space-sm">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-space-xs">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-lowest text-primary-container shadow-inner border border-primary-container/20">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-headline-md text-headline-md tracking-tight text-on-surface uppercase font-bold text-white">
                    {clubName || 'CANNONS N PECKS'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container font-label-caps text-[10px] tracking-wider uppercase font-bold">
                    EST. SEP 2009 · 17 YRS
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-on-surface-variant text-xs mt-0.5">
                  <span className="material-symbols-outlined text-primary-container text-[14px]">military_tech</span>
                  <span className="font-semibold text-primary-container">
                    {rivalsDivision || '— (Division Unsynced)'}
                  </span>
                  <span className="text-on-surface-variant">• Founded Age 10 • Sep 2009 Profile</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="px-3 py-1.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-white/10 text-primary-container font-label-caps text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-primary-container animate-spin" style={{ animationDuration: '6s' }}>sync</span>
                <span>SYNC CLUB DATA</span>
              </button>
              <div className="flex flex-col items-end">
                <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container font-label-caps text-[10px] uppercase tracking-wider animate-pulse font-bold">
                  LIVE ANCHOR
                </span>
                <span className="font-data-tabular text-[11px] text-on-surface-variant mt-0.5">
                  XBOX SERIES S
                </span>
              </div>
            </div>
          </div>

          {/* Champs & Division Pill */}
          <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest/80 px-4 py-2 border border-white/5">
            <div className="flex items-center space-x-2.5">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px]">workspace_premium</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-tertiary-fixed-dim uppercase tracking-wider font-bold">
                  CHAMPS FINALS & RIVALS STATUS
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-data-tabular text-sm text-on-surface font-bold">
                    {champsRecord ? champsRecord : '—'}
                  </span>
                  <span className="text-on-surface-variant text-xs">
                    {champsRecord ? '(Weekend League Active)' : '(Not entered / Unsynced)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-caps text-[11px] transition-colors"
              >
                {rivalsDivision ? 'UPDATE DIV' : 'SET DIVISION'}
              </button>
            </div>
          </div>

          {/* Quick Telemetry Badges Strip: Coins (Replaces Club Value), Untradeables, Chem */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs pt-1">
            {/* Coins Card (Replaces Club Value) */}
            <div className="relative flex flex-col p-3 rounded-xl bg-surface-container-low border border-white/5 hover:border-tertiary-fixed-dim/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                  Club Coins (Xbox Series S)
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingCoins(!isEditingCoins)}
                  className="text-tertiary-fixed-dim hover:text-white transition-colors"
                  title="Click to edit or tune coins"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                </button>
              </div>

              {!isEditingCoins ? (
                <div
                  onClick={() => setIsEditingCoins(true)}
                  className="flex items-baseline space-x-1.5 mt-1 cursor-pointer"
                  title="Click to tune coin balance"
                >
                  <span className="material-symbols-outlined text-tertiary-fixed-dim text-[18px]">monetization_on</span>
                  <span className="font-headline-md text-xl font-bold text-on-surface font-data-tabular">
                    {coins !== null ? coins.toLocaleString() : '—'}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {coins !== null ? `(${formatCoins(coins)})` : '(Blank)'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSaveCoinInput} className="mt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={coinInputVal}
                    onChange={(e) => setCoinInputVal(e.target.value)}
                    placeholder="Enter coins or leave blank"
                    className="w-full bg-surface-container-lowest px-2 py-1 rounded text-xs font-data-tabular text-white border border-tertiary-fixed-dim focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-tertiary-fixed-dim text-black rounded text-[10px] font-bold uppercase"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCoins(null);
                      setCoinInputVal('');
                      setIsEditingCoins(false);
                    }}
                    className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded text-[10px] uppercase"
                    title="Set to blank"
                  >
                    Clear
                  </button>
                </form>
              )}

              {/* Quick Coin Adjust Buttons */}
              <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleQuickCoinAdjust(5000)}
                  className="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-[10px] font-data-tabular text-tertiary-fixed-dim transition-colors"
                >
                  +5K
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCoinAdjust(25000)}
                  className="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-[10px] font-data-tabular text-tertiary-fixed-dim transition-colors"
                >
                  +25K
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCoinAdjust(100000)}
                  className="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-[10px] font-data-tabular text-tertiary-fixed-dim transition-colors"
                >
                  +100K
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCoinAdjust(-10000)}
                  className="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-[10px] font-data-tabular text-error transition-colors ml-auto"
                >
                  -10K
                </button>
              </div>
            </div>

            {/* FIFA Points & SP Card */}
            <div className="flex flex-col justify-between p-3 rounded-xl bg-surface-container-low border border-white/5">
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                  Points & Daily Season SP
                </span>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-1">
                    <span className="material-symbols-outlined text-primary-container text-[16px]">diamond</span>
                    <span className="font-data-tabular text-base font-bold text-white">
                      {fifaPoints !== null ? fifaPoints.toLocaleString() : '—'}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">FP</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="material-symbols-outlined text-secondary-fixed text-[16px]">military_tech</span>
                    <span className="font-data-tabular text-base font-bold text-secondary-fixed">
                      {dailySp !== null ? `${dailySp}/850` : '—/850'}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">SP</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-white/5 mt-2">
                <span>Gallery Level: {galleryLevel !== null ? `Tier ${galleryLevel}` : '—'}</span>
                <button
                  type="button"
                  onClick={onOpenSyncModal}
                  className="text-primary-container hover:underline text-[10px] font-bold"
                >
                  Edit Values
                </button>
              </div>
            </div>

            {/* Chem Matrix Card */}
            <div className="flex flex-col justify-between p-3 rounded-xl bg-surface-container-low border border-white/5">
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                  S+ 4-2-1-3 Tactical Chem
                </span>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">bolt</span>
                  <span className="font-headline-md text-xl font-bold text-primary-container font-data-tabular">
                    33 / 33
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">(Full Boost)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-white/5 mt-2">
                <span>AcceleRATE 2.0 Synced</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('squad')}
                  className="text-primary-container hover:underline text-[10px] font-bold"
                >
                  Inspect Pitch
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GEMINI MULTI-MODEL INTELLIGENCE COMMANDER STRIP (Replaces ancient Gemini 1.5 Pro) */}
      <div className="rounded-2xl bg-surface-container-low p-4 shadow-xl border border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-primary-container/20 text-primary-container">
              <span className="material-symbols-outlined text-[20px]">{currentModel.icon}</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_8px_#00FF87] animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_8px_#00FF87]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-label-caps text-xs text-white uppercase tracking-wider font-bold">
                  {currentModel.name}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-highest text-primary-container font-label-caps font-bold">
                  {currentModel.tag}
                </span>
              </div>
              <span className="text-xs text-on-surface-variant mt-0.5">
                Dynamic Auto-Router • Latency: <span className="text-primary-container font-data-tabular font-bold">18ms</span> • Cost: <span className="text-secondary-fixed font-data-tabular font-bold">$0.00014</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/5 text-xs text-on-surface font-label-caps flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-primary-container">tune</span>
              <span>CONFIGURE COMMANDER</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC CHANGES IN THE CLUB: 4 WAYS TO GATHER INFORMATION */}
      <div className="rounded-2xl bg-surface-container p-space-md border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">sync_alt</span>
            <span className="font-label-caps text-xs text-white uppercase tracking-wider font-bold">
              Dynamic Club Ingestion & Sync Methods
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant">Zero Guessing • Exact Sync</span>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Your club constantly evolves—coins change on every market bid, players are acquired via SBCs, and division ratings fluctuate. Use any of these 4 verified methods to keep FC NEXUS 27 100% in sync:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Method 1: FC Companion Web App */}
          <div
            onClick={onOpenSyncModal}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-white/5 hover:border-primary-container/40 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-primary-container text-[20px] group-hover:scale-110 transition-transform">
                  terminal
                </span>
                <span className="px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container text-[9px] font-bold uppercase">
                  DIRECT DEVTOOLS
                </span>
              </div>
              <span className="font-bold text-white text-xs block">FC Companion Web App</span>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                Run our 1-click DevTools console script on ea.com to copy live Coins, points, and squad JSON.
              </p>
            </div>
            <span className="text-[11px] text-primary-container font-semibold mt-3 flex items-center gap-1">
              View Walkthrough & Script <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </span>
          </div>

          {/* Method 2: FUTBIN & FUT.GG */}
          <div
            onClick={onOpenSyncModal}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-white/5 hover:border-secondary-container/40 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-secondary-container text-[20px] group-hover:scale-110 transition-transform">
                  dataset_linked
                </span>
                <span className="px-1.5 py-0.5 rounded bg-secondary-container/15 text-secondary-container text-[9px] font-bold uppercase">
                  ACCOUNT SYNC
                </span>
              </div>
              <span className="font-bold text-white text-xs block">FUTBIN & FUT.GG Squads</span>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                Connect your FUTBIN or FUT.GG public squad URL to automatically mirror your real 11 players & bench.
              </p>
            </div>
            <span className="text-[11px] text-secondary-container font-semibold mt-3 flex items-center gap-1">
              Link Accounts & Squads <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </span>
          </div>

          {/* Method 3: Direct Inline Typing */}
          <div
            onClick={() => setIsEditingCoins(true)}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-white/5 hover:border-tertiary-fixed-dim/40 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px] group-hover:scale-110 transition-transform">
                  edit_note
                </span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary-fixed-dim text-[9px] font-bold uppercase">
                  MANUAL INPUT
                </span>
              </div>
              <span className="font-bold text-white text-xs block">Direct Typing & Tuner</span>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                Simply type your current coins, division, or results directly on cards or use the fast +/- buttons.
              </p>
            </div>
            <span className="text-[11px] text-tertiary-fixed-dim font-semibold mt-3 flex items-center gap-1">
              Edit Coins Now <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </span>
          </div>

          {/* Method 4: Clear to Blank */}
          <div
            onClick={() => {
              onUpdateCoins(null);
              if (onShowNotice) onShowNotice('Club figures reset to BLANK (—)');
            }}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-white/5 hover:border-error/40 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-error text-[20px] group-hover:scale-110 transition-transform">
                  block
                </span>
                <span className="px-1.5 py-0.5 rounded bg-error/15 text-error text-[9px] font-bold uppercase">
                  ANTI-HALLUCINATE
                </span>
              </div>
              <span className="font-bold text-white text-xs block">Reset to Blank (—)</span>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                If numbers are unverified, wipe them to strictly blank. We never make up values.
              </p>
            </div>
            <span className="text-[11px] text-error font-semibold mt-3 flex items-center gap-1">
              Set Blank (—) <span className="material-symbols-outlined text-[13px]">clear</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. AI OPERATIONS DECK (Fast Navigation) */}
      <div>
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
            Tactical & Market Operations Deck
          </span>
          <span className="font-label-caps text-xs text-primary-container uppercase font-bold">Fast Routes</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-xs">
          {/* Tactical Pitch 4-2-1-3 */}
          <button
            type="button"
            onClick={() => onNavigateTab('squad')}
            className="flex flex-col text-left p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 transition-all group"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">sports_soccer</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container font-label-caps text-[10px] font-bold">
                PITCH
              </span>
            </div>
            <span className="font-headline-md text-sm text-on-surface font-semibold truncate">
              4-2-1-3 Pitch
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5">31 Roles++ & AcceleRATE</span>
          </button>

          {/* FUTBIN & Chem Lab */}
          <button
            type="button"
            onClick={() => onNavigateTab('squad')}
            className="flex flex-col text-left p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 transition-all group"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary-container group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">database</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container/15 text-secondary-container font-label-caps text-[10px] font-bold">
                FUTBIN
              </span>
            </div>
            <span className="font-headline-md text-sm text-on-surface font-semibold truncate">
              FUTBIN Chem Lab
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5">Compare Chem Styles (A vs B)</span>
          </button>

          {/* Dual SBC Solver */}
          <button
            type="button"
            onClick={() => onNavigateTab('sbcs')}
            className="flex flex-col text-left p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 transition-all group"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary-fixed-dim group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">extension</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary-fixed-dim font-label-caps text-[10px] font-bold">
                SUB-2MS
              </span>
            </div>
            <span className="font-headline-md text-sm text-on-surface font-semibold truncate">
              Dual-Mode SBCs
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5">Streamlined & 121 Rule</span>
          </button>

          {/* Market & 5G */}
          <button
            type="button"
            onClick={() => onNavigateTab('market')}
            className="flex flex-col text-left p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 transition-all group"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">candlestick_chart</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary-container font-label-caps text-[10px] font-bold">
                5% TAX
              </span>
            </div>
            <span className="font-headline-md text-sm text-on-surface font-semibold truncate">
              Xbox Series S Market
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5">Holographic Arbitrage & Flips</span>
          </button>
        </div>
      </div>

      {/* 5. GEMINI 3.8 FLASH TACTICAL & CLUB DECISION FEED */}
      <div className="flex flex-col space-y-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-primary-container text-[18px]">psychology</span>
            <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
              AI Decision & Advisory Feed
            </span>
          </div>
          <span className="font-data-tabular text-xs text-on-surface-variant">
            Season 2: Trailblazers & Scream Team 1
          </span>
        </div>

        {/* Feed Card 1: Market Opportunity */}
        <div className="flex flex-col rounded-xl bg-surface-container p-space-md space-y-space-sm shadow-md border border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary-fixed-dim">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] text-tertiary-fixed-dim uppercase tracking-wider font-bold">
                  Scream Team 1 Arbitrage • Under 35k Coins
                </span>
                <div className="font-headline-md text-sm text-on-surface font-semibold">
                  85 Otamendi SBC (24,500 Coins) vs Fodder Spikes
                </div>
              </div>
            </div>
            <span className="font-data-tabular text-xs text-tertiary-fixed-dim font-bold">18:00 UK DROP</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Otamendi (Stopper++ & Anticipate+) is ranked #1 player SBC (Score: 680, Worth-It: 96/100). If completing from market, utilize 86 Regular Holographic cards (1.25x multiplier at 10.9k coins) for 45.80 coins/pt.
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-on-surface-variant font-data-tabular">
              Target Cost: 24,500 Coins • Fits Cannons n Pecks
            </span>
            <button
              type="button"
              onClick={() => {
                setMarketActionLogged(true);
                onNavigateTab('sbcs');
              }}
              className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-caps text-[11px] uppercase tracking-wider font-bold shadow-[0_0_12px_rgba(0,255,135,0.3)] active:scale-95 transition-all"
            >
              {marketActionLogged ? 'SOLVING SBC...' : 'OPEN SBC SOLVER'}
            </button>
          </div>
        </div>

        {/* Feed Card 2: 4-2-1-3 Tactical Spacing */}
        <div className="flex flex-col rounded-xl bg-surface-container p-space-md space-y-space-sm shadow-md border border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] text-primary-container uppercase tracking-wider font-bold">
                  Patch TU #3.1 Spacing • 4-2-1-3 Meta
                </span>
                <div className="font-headline-md text-sm text-on-surface font-semibold">
                  Deep-Lying Playmaker++ & Inside Forward++ AI Runs
                </div>
              </div>
            </div>
            <span className="font-data-tabular text-xs text-primary-container font-bold">TU #3.1 ACTIVE</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Console Title Update 3.1 tuned Controlled Lengthy sprint sustain and boosted off-the-ball runs for Inside Forward++ wingers. Ensure CDMs operate on Holding++ and Deep-Lying Playmaker++ to prevent cutback counters.
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-on-surface-variant font-data-tabular">
              Code: FC27#9X4M-L8Q2-TU31 • Height: 68
            </span>
            <button
              type="button"
              onClick={() => {
                setTacticalActionLogged(true);
                onNavigateTab('squad');
              }}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-white font-label-caps text-[11px] uppercase tracking-wider font-semibold active:scale-95 transition-all"
            >
              {tacticalActionLogged ? 'TACTIC LOADED' : 'VIEW TACTICAL PITCH'}
            </button>
          </div>
        </div>
      </div>

      {/* 6. RECENT CLUB PERFORMANCE & ELO TELEMETRY */}
      <div className="flex flex-col rounded-xl bg-surface-container p-space-md space-y-space-sm shadow-lg mb-4 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary-container text-[18px]">show_chart</span>
            <span className="font-label-caps text-xs text-on-surface uppercase tracking-wider font-bold">
              Weekend League & Division Rivals Form Dynamics
            </span>
          </div>
          <span className="font-data-tabular text-xs text-primary-container font-bold">+340 Δ Elo</span>
        </div>

        {/* SVG Graph */}
        <div className="relative w-full h-32 pt-2">
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
            <line stroke="#33353b" strokeDasharray="3 3" strokeOpacity="0.4" x1="0" x2="320" y1="20" y2="20" />
            <line stroke="#33353b" strokeDasharray="3 3" strokeOpacity="0.4" x1="0" x2="320" y1="50" y2="50" />
            <line stroke="#33353b" strokeOpacity="0.4" x1="0" x2="320" y1="80" y2="80" />
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
            <circle cx="320" cy="10" fill="#00FF87" r="3.5" />
          </svg>
        </div>

        <div className="flex items-center justify-between pt-1 border-t-0">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-0.5 rounded-full bg-primary-container" />
              <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">ELO (5 MATCHES)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-0.5 rounded-full bg-secondary-container" />
              <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">xGD (+2.42/G)</span>
            </div>
          </div>
          <div className="font-data-tabular text-xs text-on-surface font-bold">Cannons n Pecks • Est. Sep 2009</div>
        </div>
      </div>
    </div>
  );
};
