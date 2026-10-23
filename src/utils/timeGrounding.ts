/**
 * Universal Dynamic Temporal Anchoring Engine (T = 0)
 * Strictly anchored to British Time (Europe/London, BST/GMT).
 * Resolves the football season, 18:00 UK Daily Content Drop countdown,
 * Antigravity 2.0 Desktop App firmware version, and EA Sports FC 27 patch state
 * dynamically at the exact millisecond of any prompt, click, or runtime task.
 */

export interface AntigravityFirmwareManifest {
  version: string;
  releaseDateUk: string;
  codename: string;
  activeFeatures: {
    id: string;
    title: string;
    commandOrConfig: string;
    description: string;
    status: 'ACTIVE' | 'NEW_IN_2_25';
  }[];
}

export interface TemporalAnchor {
  t0EpochMs: number;
  t0Iso: string;
  britishFullFormatted: string;
  britishDateFormatted: string;
  britishTimeFormatted: string;
  weekday: string;
  timezoneAbbrev: 'BST' | 'GMT';
  footballSeasonCode: string; // e.g., "2026-27"
  footballSeasonShort: string; // e.g., "26-27"
  seasonHalfLabel: string; // e.g., "1st Half (Start of Season)" | "2nd Half (End of Season)"
  utLiveSeasonLabel: string; // e.g., "FC 27 Season 2 (Actively Live)"
  countdownTo1800Drop: {
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
    totalSeconds: number;
  };
  matchdayContext: string;
  antigravityFirmware: AntigravityFirmwareManifest;
  fc27PatchState: {
    titleUpdateVersion: string;
    liveTuningVersion: string;
    effectiveDateUk: string;
    summary: string;
  };
}

/**
 * Extracts exact Europe/London date/time components from any Date instance.
 */
function getLondonParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const year = parseInt(map.year || '2026', 10);
  const month = parseInt(map.month || '10', 10);
  const day = parseInt(map.day || '23', 10);
  const hour = parseInt(map.hour || '0', 10);
  const minute = parseInt(map.minute || '0', 10);
  const second = parseInt(map.second || '0', 10);
  const weekday = map.weekday || 'Friday';
  const tzName = map.timeZoneName || 'BST';
  const timezoneAbbrev: 'BST' | 'GMT' = tzName.includes('BST') || tzName.includes('GMT+1') ? 'BST' : 'GMT';

  return { year, month, day, hour, minute, second, weekday, timezoneAbbrev };
}

/**
 * Season Math Rule (Anti-Autoregressive Transfer Law):
 * - Football seasons run August (Month 8) to May (Month 5).
 * - Latter half of the calendar year (Months 8-12: Aug-Dec) = First Half (Start) of the [Year]-[Year+1] season.
 *   Example: October 2026 -> 2026-27 (26-27) Season, First Half.
 * - Beginning half of the calendar year (Months 1-5: Jan-May) = Second Half (End) of the [Year-1]-[Year] season.
 *   Example: May 2026 -> 2025-26 (25-26) Season; February 2034 -> 2033-34 (33-34) Season.
 * - Months 6-7 (Jun-Jul) = Summer Transfer Window / Pre-Season transition into [Year]-[Year+1].
 */
export function resolveFootballSeason(year: number, month: number): {
  footballSeasonCode: string;
  footballSeasonShort: string;
  seasonHalfLabel: string;
} {
  if (month >= 8) {
    const nextYearShort = String(year + 1).slice(-2);
    const currYearShort = String(year).slice(-2);
    return {
      footballSeasonCode: `${year}-${nextYearShort}`,
      footballSeasonShort: `${currYearShort}-${nextYearShort}`,
      seasonHalfLabel: '1st Half (Aug–Dec Opening Phase)',
    };
  }
  if (month <= 5) {
    const prevYear = year - 1;
    const prevYearShort = String(prevYear).slice(-2);
    const currYearShort = String(year).slice(-2);
    return {
      footballSeasonCode: `${prevYear}-${currYearShort}`,
      footballSeasonShort: `${prevYearShort}-${currYearShort}`,
      seasonHalfLabel: '2nd Half (Jan–May Run-In Phase)',
    };
  }
  const nextYearShort = String(year + 1).slice(-2);
  const currYearShort = String(year).slice(-2);
  return {
    footballSeasonCode: `${year}-${nextYearShort}`,
    footballSeasonShort: `${currYearShort}-${nextYearShort}`,
    seasonHalfLabel: 'Summer Transfer Window (Jun–Jul)',
  };
}

/**
 * Dynamically resolves the Antigravity 2.0 Desktop App firmware version & feature set at T = 0.
 * As of October 22/23, 2026, Antigravity 2.25 is the active flagship release.
 */
export function resolveAntigravityFirmwareAtT0(year: number, month: number, day: number): AntigravityFirmwareManifest {
  const isV225OrLater =
    year > 2026 || (year === 2026 && (month > 10 || (month === 10 && day >= 22)));

  const version = isV225OrLater ? '2.25' : '2.24';

  return {
    version,
    releaseDateUk: '22 October 2026',
    codename: 'Jetski / OrionFire Multi-Agent Core',
    activeFeatures: [
      {
        id: 'ag-browser-devtools-mcp',
        title: 'Native /browser Subagent & Chrome DevTools MCP',
        commandOrConfig: '/browser --attach-devtools-mcp',
        description:
          'Directly inspects live DOM/accessibility snapshots of EA FC 27 Companion Web App, FUTBIN FC 27 hourly price charts, and FotMob 26-27 squad tables without screenshots.',
        status: 'NEW_IN_2_25',
      },
      {
        id: 'ag-jetski-cot-guard',
        title: 'Jetski Reasoning Scaffolding & CoT Safety Classifier',
        commandOrConfig: '<JETSKI_THOUGHT> / CoT Guard',
        description:
          'Real-time chain-of-thought verification ensuring zero legacy club hallucinations (e.g., enforcing Rodri at FC Barcelona in 26-27) and blocking unsafe file overwrites.',
        status: 'NEW_IN_2_25',
      },
      {
        id: 'ag-parallel-subagents',
        title: 'Dynamic Parallel Subagent Spawning',
        commandOrConfig: 'spawnSubagents([Market, FotMob, EvoLab])',
        description:
          'Delegates price scraping, FotMob transfer verification, and Branching Evolution simulation to isolated worker threads without polluting primary context.',
        status: 'ACTIVE',
      },
      {
        id: 'ag-schedule-cron-hooks',
        title: 'Autonomous /schedule Cron & JSON Lifecycle Hooks',
        commandOrConfig: '/schedule "0 18 * * *" Europe/London',
        description:
          'Automates the 18:00 UK Daily Content Drop ingestion (new SBCs, Promos, Evolutions, Holographic spreads) and pushes alerts to ZenBook ScreenPad Plus.',
        status: 'ACTIVE',
      },
      {
        id: 'ag-scoped-mcp-config',
        title: 'Scoped Workspace MCP Scaling (.agents/mcp_config.json)',
        commandOrConfig: '.agents/mcp_config.json',
        description:
          'Binds local ZenBook SQLite cache (<2ms math), Playwright, Fetch, Memory Graph, Google Drive, and GitHub MCP connectors directly to the runtime.',
        status: 'NEW_IN_2_25',
      },
      {
        id: 'ag-builtin-generative-ui-skill',
        title: 'Built-In Generative UI Skill (Dynamic Interactive Micro-Tools)',
        commandOrConfig: 'C:\\Users\\Kit\\.gemini\\antigravity\\builtin\\skills\\generative_ui\\SKILL.md',
        description:
          'Synthesizes live, interactive GenUI widgets (SBC Score Sliders, Role++ Comparators, 5G Tax Calculators, and FC IQ Pitch Boards) directly inside the tactical stream at T=0.',
        status: 'NEW_IN_2_25',
      },
    ],
  };
}

/**
 * Generates a fresh T = 0 TemporalAnchor for any runtime action, prompt, or UI render.
 */
export function createTemporalAnchor(now: Date = new Date()): TemporalAnchor {
  const { year, month, day, hour, minute, second, weekday, timezoneAbbrev } = getLondonParts(now);
  const { footballSeasonCode, footballSeasonShort, seasonHalfLabel } = resolveFootballSeason(year, month);

  // Calculate countdown to 18:00 UK Daily Content Drop
  const currentSecondsOfDay = hour * 3600 + minute * 60 + second;
  const dropTargetSecondsOfDay = 18 * 3600; // 18:00:00 UK
  let secondsUntilDrop = dropTargetSecondsOfDay - currentSecondsOfDay;
  if (secondsUntilDrop <= 0) {
    secondsUntilDrop += 24 * 3600;
  }

  const dropHours = Math.floor(secondsUntilDrop / 3600);
  const dropMinutes = Math.floor((secondsUntilDrop % 3600) / 60);
  const dropSecs = secondsUntilDrop % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const britishDateFormatted = `${pad(day)}/${pad(month)}/${year}`;
  const britishTimeFormatted = `${pad(hour)}:${pad(minute)}:${pad(second)} ${timezoneAbbrev}`;
  const britishFullFormatted = `${weekday}, ${pad(day)}/${pad(month)}/${year} · ${britishTimeFormatted}`;

  // Determine UT Season state (Season 1 ended Thursday 22 Oct 2026 at 08:00 UK -> Season 2 is live)
  const isSeason2 =
    year > 2026 ||
    (year === 2026 && (month > 10 || (month === 10 && (day > 22 || (day === 22 && hour >= 8)))));
  const utLiveSeasonLabel = isSeason2
    ? 'FC 27 Season 2: Trailblazers & Centurions Act I (850 SP/Day Cap)'
    : 'FC 27 Season 1 Final Countdown (850 SP/Day Cap)';

  // Matchday context based on UK day of week
  const matchdayMap: Record<string, string> = {
    Monday: 'Squad Battles Rewards Post-Drop & Upgrade SBC Grind Window (18:00 UK)',
    Tuesday: 'UEFA Champions League Matchday 1 — RTTK & Live Card Fluctuation Watch',
    Wednesday: 'UEFA Champions League Matchday 2 & TOTW Console Supply Window (18:00 UK)',
    Thursday: 'Division Rivals Rewards Drop (08:00 UK) & Marquee Matchups Puzzle SBC (18:00 UK)',
    Friday: 'FUT Champions Finals Open & Flagship Promo Team Drop at 18:00 UK',
    Saturday: 'Peak Weekend League Gameplay & Saturday Evening Panic Selling Window',
    Sunday: 'FUT Champions Sell-Off Dip — Prime 5G Bid-Flipping & Holographic Arbitrage Window',
  };

  return {
    t0EpochMs: now.getTime(),
    t0Iso: now.toISOString(),
    britishFullFormatted,
    britishDateFormatted,
    britishTimeFormatted,
    weekday,
    timezoneAbbrev,
    footballSeasonCode,
    footballSeasonShort,
    seasonHalfLabel,
    utLiveSeasonLabel,
    countdownTo1800Drop: {
      hours: dropHours,
      minutes: dropMinutes,
      seconds: dropSecs,
      formatted: `${pad(dropHours)}h ${pad(dropMinutes)}m ${pad(dropSecs)}s`,
      totalSeconds: secondsUntilDrop,
    },
    matchdayContext: matchdayMap[weekday] || 'Live FC 27 Console Transfer & Gameplay Window',
    antigravityFirmware: resolveAntigravityFirmwareAtT0(year, month, day),
    fc27PatchState: {
      titleUpdateVersion: 'FC 27 Title Update #3.1 (Console v1.04)',
      liveTuningVersion: 'Live Tuning Update #4 (Oct 2026)',
      effectiveDateUk: '21 October 2026',
      summary:
        'Buffed Inside Forward++ & Deep-Lying Playmaker++ AI runs; tuned Controlled Lengthy breakaway sprint sustain; capped PlayStyles Lab chains strictly at 3 PlayStyles+.',
    },
  };
}
