import React, { useState, useRef } from 'react';
import { TemporalAnchor } from '../utils/timeGrounding';
import { calculateEaTaxMetrics } from '../utils/fc27DeterministicEngine';
import {
  Cpu,
  Mic,
  Square,
  Send,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Terminal,
  Sliders,
  Zap,
  Search,
  ArrowUpRight,
} from 'lucide-react';

export type ClientRoutingMode =
  | 'AUTO'
  | 'TIER_1_LITE'
  | 'TIER_2_FLASH_SEARCH'
  

export interface RoutingTelemetryReceipt {
  tierLabel: string;
  modelUsed: string;
  latencyMs: number;
  routingReason: string;
  costBenchmarkSummary?: string;
}

export interface GenUiWidgetSpec {
  widgetType:
    | 'SBC_SCORE_SIMULATOR'
    | 'HOLO_ARBITRAGE_CALCULATOR'
    | 'ROLE_SYNTHESIS_COMPARATOR'
    | 'TACTICAL_PITCH_BOARD';
  title: string;
  subtitle: string;
  executiveSummary: string;
  defaultTargetScore: number;
  recommendedBuyPriceXbox: number;
  recommendedSellPriceXbox: number;
  featuredPlayerName: string;
  featuredPlayerClub2627: string;
  featuredRolePlusPlus: string;
  actionItems: string[];
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  t0Stamp?: string;
  telemetry?: RoutingTelemetryReceipt;
  genUiWidget?: GenUiWidgetSpec | null;
  sources?: { title: string; uri: string }[];
}

interface AntigravityMcpAndChatDrawerProps {
  t0Anchor: TemporalAnchor;
  clubContextForAi: Record<string, unknown>;
  onVoiceClubCommand: (transcript: string) => void;
}

const MCP_CONFIG_JSON_STRING = `{
  "$schema": "https://antigravity.google/schemas/v2.25/mcp_config.schema.json",
  "antigravityFirmwareTarget": "2.25",
  "consoleMarketLock": "XBOX_SERIES_S_ONLY",
  "temporalAnchoringMode": "DYNAMIC_T0_BRITISH_TIME",
  "builtinSkills": [
    "C:\\\\Users\\\\Kit\\\\.gemini\\\\antigravity\\\\builtin\\\\skills\\\\generative_ui\\\\SKILL.md"
  ],
  "mcpServers": {
    "chrome-devtools-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools", "--port", "9222"]
    },
    "playwright-futbin-xbox-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "fetch-patch-sbc-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "sqlite-fc27-cache-mcp": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "./fc27_xbox_mirror.db"]
    },
    "memory-transfer-graph-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "google-drive-workspace-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-drive"]
    },
    "github-ut-tools-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}`;

const GENERATIVE_UI_SKILL_SUMMARY = `# C:\\Users\\Kit\\.gemini\\antigravity\\builtin\\skills\\generative_ui\\SKILL.md
name: "generative_ui"
orchestrator: "Google Antigravity 2.25 Desktop App"
consoleLock: "Xbox Series S (Console Cross-Play Market Only)"
clubPolicy: "Zero-Guessing — Confirmed 35,000 Coins; all unknown club fields stay BLANK (—)"
widgets:
  - SBC_SCORE_SIMULATOR (Interactive Duplicate Storage + 1.25x/1.50x Holographic Score Sliders)
  - HOLO_ARBITRAGE_CALCULATOR (Interactive Xbox Series S Bid/Sell Sliders + 5% EA Tax Guard)
  - ROLE_SYNTHESIS_COMPARATOR (Interactive Stats + Chem + AcceleRATE 2.0 + 31 Roles++ Matrix)
  - TACTICAL_PITCH_BOARD (Interactive FC IQ Line Height & Share Code Generator)`;

/**
 * Interactive Generative UI Widget Renderer mounted directly inside the chat / strategy stream
 */
const InteractiveGenUiWidgetCard: React.FC<{
  spec: GenUiWidgetSpec;
  userCoins: number | null;
}> = ({ spec, userCoins }) => {
  const [regHoloCount, setRegHoloCount] = useState<number>(1);
  const [pristineHoloCount, setPristineHoloCount] = useState<number>(0);
  const [baseGold84Count, setBaseGold84Count] = useState<number>(4);
  const [simBuyPrice, setSimBuyPrice] = useState<number>(
    spec.recommendedBuyPriceXbox || 10600
  );
  const [simSellPrice, setSimSellPrice] = useState<number>(
    spec.recommendedSellPriceXbox || 12250
  );

  const cumulativeScore =
    regHoloCount * 238 + pristineHoloCount * 465 + baseGold84Count * 135;
  const totalSimCost =
    regHoloCount * 10900 + pristineHoloCount * 27500 + baseGold84Count * 1600;
  const fits35kBudget = userCoins !== null ? totalSimCost <= userCoins : true;
  const taxCalc = calculateEaTaxMetrics(simBuyPrice, simSellPrice);

  return (
    <div className="bg-slate-950 border border-[#00ff87]/50 rounded-xl p-4 mt-3 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div>
          <div className="text-[11px] font-mono text-[#00ff87]">
            Antigravity v2.25 Built-In Skill · generative_ui ({spec.widgetType})
          </div>
          <h4 className="text-sm font-bold text-white mt-0.5">{spec.title}</h4>
          <p className="text-xs text-slate-400">{spec.subtitle}</p>
        </div>
        <span className="text-xs font-mono text-amber-400">
          Xbox Series S Budget: {userCoins !== null ? `${userCoins.toLocaleString()} Coins` : '—'}
        </span>
      </div>

      <p className="text-xs text-slate-200 leading-relaxed">{spec.executiveSummary}</p>

      {/* Interactive Sliders depending on widgetType */}
      {spec.widgetType === 'SBC_SCORE_SIMULATOR' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              86 Regular Holo (1.25x = 238 pts @ 10.9k): <strong>{regHoloCount}</strong>
            </label>
            <input
              type="range"
              min={0}
              max={4}
              value={regHoloCount}
              onChange={(e) => setRegHoloCount(Number(e.target.value))}
              className="w-full accent-[#00ff87]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              88 Pristine Holo (1.50x = 465 pts @ 27.5k): <strong>{pristineHoloCount}</strong>
            </label>
            <input
              type="range"
              min={0}
              max={2}
              value={pristineHoloCount}
              onChange={(e) => setPristineHoloCount(Number(e.target.value))}
              className="w-full accent-[#00ff87]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              84 Base Gold (1.0x = 135 pts @ 1.6k): <strong>{baseGold84Count}</strong>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={baseGold84Count}
              onChange={(e) => setBaseGold84Count(Number(e.target.value))}
              className="w-full accent-[#00ff87]"
            />
          </div>
          <div className="sm:col-span-3 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
            <span>
              Simulated Score: <strong className="text-[#00ff87]">{cumulativeScore}</strong> /{' '}
              {spec.defaultTargetScore || 820} pts
            </span>
            <span className={fits35kBudget ? 'text-[#00ff87]' : 'text-red-400'}>
              Xbox Series S Cost: <strong>{totalSimCost.toLocaleString()} Coins</strong>{' '}
              {fits35kBudget ? '(Fits 35k Budget)' : '(Exceeds 35k Budget!)'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Xbox Series S Buy / Bid Price
            </label>
            <input
              type="number"
              value={simBuyPrice}
              onChange={(e) => setSimBuyPrice(Math.max(150, Number(e.target.value) || 0))}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Xbox Series S Target Sale Price
            </label>
            <input
              type="number"
              value={simSellPrice}
              onChange={(e) => setSimSellPrice(Math.max(150, Number(e.target.value) || 0))}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white"
            />
          </div>
          <div className="flex flex-col justify-center text-xs font-mono tabular-nums">
            <span className="text-amber-400">
              Break-Even (5% Tax): {taxCalc.breakEvenSalePrice.toLocaleString()}
            </span>
            <span className={taxCalc.netProfit >= 0 ? 'text-[#00ff87] font-bold' : 'text-red-400 font-bold'}>
              Net Profit: {taxCalc.netProfit >= 0 ? '+' : ''}
              {taxCalc.netProfit.toLocaleString()} Coins ({taxCalc.roiPct}%)
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
        <span>
          Featured 26–27 Target: <strong className="text-white">{spec.featuredPlayerName}</strong> (
          {spec.featuredPlayerClub2627})
        </span>
        <span className="text-amber-400">Role++ Focus: {spec.featuredRolePlusPlus}</span>
      </div>

      {spec.actionItems && spec.actionItems.length > 0 && (
        <ul className="space-y-1 text-xs text-slate-300 border-t border-slate-800 pt-2">
          {spec.actionItems.map((item, idx) => (
            <li key={idx} className="font-mono">
              {idx + 1}. {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const AntigravityMcpAndChatDrawer: React.FC<AntigravityMcpAndChatDrawerProps> = ({
  t0Anchor,
  clubContextForAi,
  onVoiceClubCommand,
}) => {
  const [routingMode, setRoutingMode] = useState<ClientRoutingMode>('AUTO');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [genUiModeActive, setGenUiModeActive] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isProbingFirmware, setIsProbingFirmware] = useState<boolean>(false);
  const [firmwareDiscoveryLog, setFirmwareDiscoveryLog] = useState<{
    text: string;
    telemetry?: RoutingTelemetryReceipt;
  } | null>(null);
  const [copiedMcp, setCopiedMcp] = useState<boolean>(false);
  const [copiedSkill, setCopiedSkill] = useState<boolean>(false);

  // Live FC 27 Xbox Series S Card Verifier state
  const [verifyPlayerQuery, setVerifyPlayerQuery] = useState<string>('');
  const [isVerifyingPlayer, setIsVerifyingPlayer] = useState<boolean>(false);
  const [verifyPlayerOutput, setVerifyPlayerOutput] = useState<{
    text: string;
    telemetry?: RoutingTelemetryReceipt;
  } | null>(null);

  // Voice recording state for gemini-3.5-transcribe
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const userCoins =
    typeof clubContextForAi.coins === 'number' ? clubContextForAi.coins : null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Executive Summary: Connected to Google Antigravity ${t0Anchor.antigravityFirmware.version} Desktop Orchestrator (with built-in generative_ui skill) at T=0 (${t0Anchor.britishFullFormatted} · ${t0Anchor.footballSeasonCode} Season).\n\nXbox Series S Club State Locked:\n• Confirmed Coin Balance: ${
        userCoins !== null ? `${userCoins.toLocaleString()} Coins` : '— (Blank)'
      }\n• All other personal club fields (Gallery Level, Owned Cards, FIFA Points, Rivals Division, Daily SP) are strictly BLANK (—) with zero guessing.\n• 5-Tier Smart Model Router is set to AUTO (routes by latency, benchmark strength, and cost).`,
      t0Stamp: t0Anchor.britishTimeFormatted,
      telemetry: {
        tierLabel: 'Tier 0 · Local T=0 Boot Verification',
        modelUsed: 'Local Deterministic Guard',
        latencyMs: 1,
        routingReason:
          'Zero-token initialization enforcing 35,000 Xbox Series S Coins and strict blank state for unknown personal club fields.',
      },
    },
  ]);

  const handleCopyMcpConfig = () => {
    navigator.clipboard.writeText(MCP_CONFIG_JSON_STRING);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const handleCopySkillMd = () => {
    navigator.clipboard.writeText(GENERATIVE_UI_SKILL_SUMMARY);
    setCopiedSkill(true);
    setTimeout(() => setCopiedSkill(false), 2000);
  };

  const handleProbeT0FirmwareAndPatches = async () => {
    setIsProbingFirmware(true);
    try {
      const res = await fetch('/api/gemini/discover-t0-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientT0: t0Anchor.britishFullFormatted,
          focusTopic:
            'Antigravity 2.25 Desktop App (generative_ui skill), EA Sports FC 27 Xbox Series S Title Update #3.1, and 2026-27 FotMob Transfers',
        }),
      });
      const data = await res.json();
      if (data.error) {
        setFirmwareDiscoveryLog({ text: `Discovery Alert: ${data.error}` });
      } else {
        setFirmwareDiscoveryLog({
          text: data.text,
          telemetry: data.routingTelemetry,
        });
      }
    } catch (err: any) {
      setFirmwareDiscoveryLog({
        text: `Failed to probe live T=0 release channels: ${err.message}`,
      });
    } finally {
      setIsProbingFirmware(false);
    }
  };

  const handleVerifyXboxCard = async () => {
    if (!verifyPlayerQuery.trim() || isVerifyingPlayer) return;
    setIsVerifyingPlayer(true);
    try {
      const res = await fetch('/api/gemini/verify-fc27-xbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: verifyPlayerQuery.trim(),
          clientT0: t0Anchor.britishFullFormatted,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setVerifyPlayerOutput({ text: `Verification Error: ${data.error}` });
      } else {
        setVerifyPlayerOutput({
          text: data.text,
          telemetry: data.routingTelemetry,
        });
      }
    } catch (err: any) {
      setVerifyPlayerOutput({ text: `Network error: ${err.message}` });
    } finally {
      setIsVerifyingPlayer(false);
    }
  };

  const handleSendMessage = async (overrideText?: string, forceGenUi?: boolean) => {
    const textToSend = (overrideText ?? chatInput).trim();
    if (!textToSend || isSending) return;

    const shouldUseGenUi = forceGenUi ?? genUiModeActive;

    const userMsg: ChatMessage = {
      role: 'user',
      text: textToSend,
      t0Stamp: t0Anchor.britishTimeFormatted,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!overrideText) setChatInput('');
    setIsSending(true);

    try {
      if (shouldUseGenUi) {
        const res = await fetch('/api/gemini/generative-ui', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToSend,
            clubContext: clubContextForAi,
            clientT0: t0Anchor.britishFullFormatted,
          }),
        });
        const data = await res.json();
        if (data.error) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: `GenUI Error: ${data.error}`,
              t0Stamp: t0Anchor.britishTimeFormatted,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text:
                data.widget?.executiveSummary ||
                'Interactive Generative UI micro-tool synthesized below.',
              t0Stamp: t0Anchor.britishTimeFormatted,
              telemetry: data.routingTelemetry,
              genUiWidget: data.widget,
            },
          ]);
        }
      } else {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
            routingMode,
            useSearchGrounding,
            clubContext: clubContextForAi,
            clientT0: t0Anchor.britishFullFormatted,
          }),
        });
        const data = await res.json();
        if (data.error) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: `Error: ${data.error}`,
              t0Stamp: t0Anchor.britishTimeFormatted,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: data.text,
              t0Stamp: t0Anchor.britishTimeFormatted,
              telemetry: data.routingTelemetry,
              sources: data.sources,
            },
          ]);
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `Network error: ${err.message}`,
          t0Stamp: t0Anchor.britishTimeFormatted,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleVoiceRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);

        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = String(reader.result || '').split(',')[1];
            if (!base64Data) {
              setIsTranscribing(false);
              return;
            }
            const res = await fetch('/api/gemini/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                mimeType: 'audio/webm',
              }),
            });
            const data = await res.json();
            if (data.transcript) {
              setChatInput(data.transcript);
              onVoiceClubCommand(data.transcript);
            }
            setIsTranscribing(false);
          };
          reader.readAsDataURL(audioBlob);
        } catch {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied or unavailable:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 5-Tier Smart Model Routing Matrix (Latency, Benchmarks & Cost) */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs text-[#00ff87] font-semibold">
              Multi-Model Latency, Benchmark & Token Cost Architecture
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              5-Tier Smart Model Router (Auto-Route by Complexity + Manual Override)
            </h3>
          </div>
          <span className="text-xs font-mono text-amber-400">
            Active Mode: {routingMode}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3 font-semibold">Tier & Engine</th>
                <th className="py-2 px-3 font-semibold">Target Latency</th>
                <th className="py-2 px-3 font-semibold">Relative Cost</th>
                <th className="py-2 pl-3 font-semibold">When Auto-Routed (Benchmark & Task Fit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono text-slate-300">
              <tr>
                <td className="py-2 pr-3 font-bold text-amber-400">
                  Cost Guardrail (Argon Blocked)
                </td>
                <td className="py-2 px-3 tabular-nums">N/A (Blocked)</td>
                <td className="py-2 px-3 text-emerald-400">Cost Protected</td>
                <td className="py-2 pl-3 font-sans text-slate-300">
                  Gemini 4 Argon is explicitly forbidden for cost reasons. All deep tasks route safely to Gemini 3.8 Flash.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-bold text-slate-200">
                  Audio · gemini-3.5-transcribe
                </td>
                <td className="py-2 px-3 tabular-nums">~300ms – 600ms</td>
                <td className="py-2 px-3 text-slate-400">Audio-Specific</td>
                <td className="py-2 pl-3 font-sans">
                  Hands-free controller microphone voice dictation for logging Xbox Series S coins or pack pulls.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live FC 27 Xbox Series S Card & Market Price Verification Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#00ff87] font-semibold">
              Strict FC 27 Xbox Series S Verification Gate (Tier 2: gemini-3.8-flash + Google Search)
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Verify Any Player for EA Sports FC 27 (Xbox Series S Console Market Only)
            </h3>
            <p className="text-xs text-slate-400">
              Checks 2026/27 FotMob club + FUTBIN FC 27 Xbox Series S price. Any datum that cannot be 100% verified for FC 27 is left BLANK (—).
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <input
              type="text"
              value={verifyPlayerQuery}
              onChange={(e) => setVerifyPlayerQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyXboxCard();
              }}
              placeholder="e.g. Rodri, Lamine Yamal, Kobbie Mainoo..."
              className="flex-1 lg:w-72 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#00ff87] min-h-[40px]"
            />
            <button
              type="button"
              disabled={isVerifyingPlayer || !verifyPlayerQuery.trim()}
              onClick={handleVerifyXboxCard}
              className="px-4 py-2 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[40px] disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isVerifyingPlayer ? 'Verifying FC 27 Xbox...' : 'Verify FC 27 Xbox'}</span>
            </button>
          </div>
        </div>

        {verifyPlayerOutput && (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
            {verifyPlayerOutput.telemetry && (
              <div className="font-mono text-[11px] text-[#00ff87] border-b border-slate-800 pb-1.5">
                {verifyPlayerOutput.telemetry.tierLabel} · {verifyPlayerOutput.telemetry.latencyMs}ms ·{' '}
                {verifyPlayerOutput.telemetry.routingReason}
              </div>
            )}
            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
              {verifyPlayerOutput.text}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Antigravity v2.25 Orchestrator (Left) + Smart-Routed Chat & Generative UI (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Antigravity v2.25 Firmware, generative_ui SKILL.md & 7-Connector MCP Hub */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs text-slate-400">
                Dynamic T=0 Firmware & Skill Pipeline ({t0Anchor.britishDateFormatted})
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <Cpu className="w-4 h-4 text-[#00ff87]" />
                <span>
                  Google Antigravity {t0Anchor.antigravityFirmware.version} Desktop Orchestrator
                </span>
              </h3>
            </div>

            <button
              type="button"
              disabled={isProbingFirmware}
              onClick={handleProbeT0FirmwareAndPatches}
              className="px-3 py-2 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[38px] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbingFirmware ? 'animate-spin' : ''}`} />
              <span>
                {isProbingFirmware ? 'Probing T=0 Releases...' : 'Verify T=0 Firmware & Patch'}
              </span>
            </button>
          </div>

          {firmwareDiscoveryLog && (
            <div className="bg-slate-950 border border-[#00ff87]/40 rounded-lg p-3.5 space-y-2 text-xs text-slate-200 max-h-56 overflow-y-auto">
              {firmwareDiscoveryLog.telemetry && (
                <div className="font-mono text-[11px] text-[#00ff87] border-b border-slate-800 pb-1.5">
                  {firmwareDiscoveryLog.telemetry.tierLabel} ·{' '}
                  {firmwareDiscoveryLog.telemetry.latencyMs}ms ·{' '}
                  {firmwareDiscoveryLog.telemetry.routingReason}
                </div>
              )}
              <div className="whitespace-pre-wrap">{firmwareDiscoveryLog.text}</div>
            </div>
          )}

          {/* Built-in generative_ui Skill Inspector */}
          <div className="space-y-2 bg-slate-900/90 border border-slate-800 rounded-lg p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#00ff87] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Built-In Skill: C:\Users\Kit\.gemini\antigravity\builtin\skills\generative_ui\SKILL.md</span>
              </span>
              <button
                type="button"
                onClick={handleCopySkillMd}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-md flex items-center gap-1 transition-colors shrink-0"
              >
                {copiedSkill ? <Check className="w-3.5 h-3.5 text-[#00ff87]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSkill ? 'Copied!' : 'Copy SKILL.md'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto">
              {GENERATIVE_UI_SKILL_SUMMARY}
            </pre>
          </div>

          {/* .agents/mcp_config.json Copy Block */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Scoped .agents/mcp_config.json (Xbox Series S + FotMob + SQLite)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyMcpConfig}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-md flex items-center gap-1 transition-colors"
              >
                {copiedMcp ? <Check className="w-3.5 h-3.5 text-[#00ff87]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMcp ? 'Copied!' : 'Copy Config'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
              {MCP_CONFIG_JSON_STRING}
            </pre>
          </div>
        </div>

        {/* Right: Multi-Turn Smart-Routed Chat + Generative UI Widget Synthesizer */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-slate-400">
                  Smart-Routed Xbox Series S Tactical & Market Thread (35,000 Coins Locked)
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-4 h-4 text-[#00ff87]" />
                  <span>Strategic Director & Generative UI Stream</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGenUiModeActive((v) => !v)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                    genUiModeActive
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>GenUI Skill: {genUiModeActive ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseSearchGrounding((v) => !v)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                    useSearchGrounding
                      ? 'bg-[#00ff87]/15 border-[#00ff87] text-[#00ff87]'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Search: {useSearchGrounding ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* 4-Option Smart Router Mode Selector (AUTO + Manual Overrides) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'AUTO', label: 'AUTO (Smart Router)' },
                { id: 'TIER_1_LITE', label: 'Tier 1: 3.5 Flash Lite' },
                { id: 'TIER_2_FLASH_SEARCH', label: 'Tier 2: 3.8 Flash + Search' },
                
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRoutingMode(m.id as ClientRoutingMode)}
                  className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors truncate min-h-[38px] ${
                    routingMode === m.id
                      ? 'bg-[#00ff87] text-slate-950 border-[#00ff87] font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Message Thread with Routing Telemetry Receipts & Interactive GenUI Widgets */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#00ff87]/15 border border-[#00ff87]/40 text-white ml-6'
                    : 'bg-slate-900/95 border border-slate-800 text-slate-200 mr-2'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 mb-1.5 font-mono">
                  <span>
                    {msg.role === 'user'
                      ? 'You (Xbox Series S · 35,000 Coins)'
                      : msg.telemetry?.tierLabel || 'Gemini Strategic Router'}
                  </span>
                  <span>
                    {msg.telemetry ? `${msg.telemetry.latencyMs}ms · ` : ''}
                    {msg.t0Stamp}
                  </span>
                </div>

                {msg.telemetry && (
                  <div className="mb-2 px-2.5 py-1.5 bg-slate-950/90 border border-slate-800 rounded text-[11px] font-mono text-amber-300">
                    <Zap className="w-3 h-3 inline mr-1 text-[#00ff87]" />
                    {msg.telemetry.routingReason}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      Grounded Sources:
                    </span>
                    {msg.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-[#00ff87] hover:underline inline-flex items-center gap-1"
                      >
                        <span>{s.title}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}

                {msg.genUiWidget && (
                  <InteractiveGenUiWidgetCard
                    spec={msg.genUiWidget}
                    userCoins={userCoins}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Quick Prompt Starters (Showcasing Tier 1, Tier 2, Tier 3, and GenUI Skill) */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleSendMessage('What is the 3 PlayStyles+ cap and Holographic multiplier rule in FC 27?', false)
              }
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-[11px] text-slate-300 transition-colors"
            >
              [Tier 1 Fast] 3 PS+ & Holo Rules
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendMessage(
                  'Verify current Xbox Series S Holographic fodder prices and 18:00 UK drop for my 35,000 Coin budget.',
                  false
                )
              }
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-[11px] text-slate-300 transition-colors"
            >
              [Tier 2 Search] Live Xbox 35k Flips
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendMessage(
                  'Build an interactive 35,000 Coin Xbox Series S Streamlined SBC & Holographic Arbitrage simulator widget.',
                  true
                )
              }
              className="px-2.5 py-1.5 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 rounded-md text-[11px] text-amber-300 font-semibold transition-colors"
            >
              [Tier 3 GenUI Skill] Launch Interactive 35k Widget
            </button>
          </div>

          {/* Input & Microphone Audio Transcription Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleToggleVoiceRecording}
              title="Voice Input via gemini-3.5-transcribe"
              className={`px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[42px] ${
                isRecording
                  ? 'bg-red-500/20 border-red-500 text-red-300'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-[#00ff87]'
              }`}
            >
              {isRecording ? (
                <Square className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className="w-4 h-4 text-[#00ff87]" />
              )}
              <span>
                {isRecording ? 'Stop Mic' : isTranscribing ? 'Transcribing...' : 'Voice Mic'}
              </span>
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Ask anything (Auto-routed across Tier 1/2/3 respecting your 35,000 Xbox Coins)..."
              className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#00ff87] min-h-[42px]"
            />

            <button
              type="button"
              disabled={isSending || !chatInput.trim()}
              onClick={() => handleSendMessage()}
              className="px-4 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[42px] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Routing...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
