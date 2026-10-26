import React, { useState, useRef, useEffect } from 'react';
import { TemporalAnchor } from '../utils/timeGrounding';
import { PushToTalkButton } from './PushToTalkButton';
import { RoutingTelemetryReceipt, ClientRoutingMode } from './AntigravityMcpAndChatDrawer';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Globe,
  Cpu,
  Zap,
  Shield,
  TrendingUp,
  RotateCcw,
  ArrowUpRight,
} from 'lucide-react';

export type ChatbotRolePersona =
  | 'DIRECTOR_OF_FOOTBALL'
  | 'SBC_EVO_RANKER'
  | 'CONSOLE_MARKET_TRADER';

interface TacticalChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  personaUsed?: ChatbotRolePersona;
  telemetry?: RoutingTelemetryReceipt;
  sources?: { title: string; uri: string }[];
}

interface TacticalChatTabProps {
  t0Anchor: TemporalAnchor;
  clubContextForAi: Record<string, unknown>;
}

const PERSONA_CONFIG: Record<
  ChatbotRolePersona,
  {
    title: string;
    subtitle: string;
    roleInstruction: string;
    starterPrompts: string[];
  }
> = {
  DIRECTOR_OF_FOOTBALL: {
    title: 'Pro Console Tactical Director & Squad Analyst',
    subtitle: '31 Roles++ · AcceleRATE 2.0 · 33/33 Chemistry · Starting XI Upgrade Deltas',
    roleInstruction:
      'Act as an authoritative Pro Console Director of Football for EA Sports FC 27 Ultimate Team (Xbox Series S). Analyze the user\'s squad, 31 Roles++, and 35,000 Coin budget. Recommend exact Ultimate Scream Team 1 starters (e.g., 86 Kondogbia, 86 Tolisso, 85 Lukeba) and free Objectives (87 Jill Scott CB/CDM/CM, 87 Verón CM) without guessing any blank club fields.',
    starterPrompts: [
      'How do I fit Free Objective 87 Jill Scott (CB/CDM/CM) and 87 Verón (CM) into a 4-2-1-3 with 35k coins?',
      'Which Ultimate Scream Team 1 midfielder is better under 35k on Xbox Series S: 86 Kondogbia, 86 Çalhanoğlu, or 86 Tolisso?',
      'Give me a full Pro Console Quad-Action review of my club with my confirmed 35,000 Coins.',
    ],
  },
  SBC_EVO_RANKER: {
    title: 'Live SBC, Evolution & Objectives Value Ranker',
    subtitle: 'Top 5 Player SBCs vs. Top 5 Upgrade SBCs · 85 Moore · 85 Otamendi · Live Timers',
    roleInstruction:
      'Act as the Ultimate Scream Team 1 SBC & Evolution Value Specialist for EA Sports FC 27 (Xbox Series S). Rank and compare active Player SBCs (85 Otamendi, 85 Bobby Moore, LaLiga POTM) vs. Upgrade SBCs (81+ Player Pick, 83+ Double Upgrade) by Worth-It Score, time remaining, and 1.25x/1.50x Holographic Item Score multipliers.',
    starterPrompts: [
      'Rank the Top 5 Player SBCs vs Top 5 Upgrade SBCs out right now during Ultimate Scream Team 1.',
      'Is 85 Nicolás Otamendi SBC (24.5k) or 85 Bobby Moore Icon SBC (48k) better value for my squad?',
      'Which Ultimate Scream 83–85 card (like 83 Tverskov or 85 Alonso) chains best into active Evolutions?',
    ],
  },
  CONSOLE_MARKET_TRADER: {
    title: 'Xbox Series S Market & 35k Investment Specialist',
    subtitle: '5% EA Tax Guard · Discard Floor Flips · 18:00 UK Content Drop Arbitrage',
    roleInstruction:
      'Act as an elite Xbox Series S Transfer Market Analyst for EA Sports FC 27. Focus strictly on console cross-play pricing, 5% EA Tax break-even math, Ultimate Scream Team 1 discard-floor flips (85 Alonso, 85 Chong, 85 El Mala, 86 Vobian), and 18:00 UK fodder spikes.',
    starterPrompts: [
      'Build a zero-loss 35,000 Coin Ultimate Scream Team 1 trading plan on Xbox Series S accounting for 5% EA tax.',
      'When is the best window today to buy and sell 86 Kondogbia, 86 Le Fée, and 85 Lukeba on Xbox Series S?',
      'Compare 86 Regular Holographic fodder arbitrage (1.25x score) vs buying base 86s for 85 Bobby Moore SBC.',
    ],
  },
};

export const TacticalChatTab: React.FC<TacticalChatTabProps> = ({
  t0Anchor,
  clubContextForAi,
}) => {
  const [activePersona, setActivePersona] = useState<ChatbotRolePersona>('DIRECTOR_OF_FOOTBALL');
  const [routingMode, setRoutingMode] = useState<ClientRoutingMode>('AUTO');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const [messages, setMessages] = useState<TacticalChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      timestamp: t0Anchor.britishFullFormatted,
      personaUsed: 'DIRECTOR_OF_FOOTBALL',
      text: `Tactical Command Online at T=0 (${t0Anchor.britishFullFormatted}).\n\nI am calibrated to your **35,000 Xbox Series S Coin balance** and the live **Ultimate Scream Team 1** release (**90 Raphinha, 89 Cristiano Ronaldo, 89 Zola, 88 Szoboszlai, 88 Jaap Stam, 87 Palmer, 87 Mandžukić, 86 Kondogbia, 86 Çalhanoğlu, 86 Vobian, 86 Tolisso, 86 Le Fée, 85 Alonso, 85 Chong, 85 Lukeba, 85 Flint, 85 El Mala, 83 Tverskov**, plus **85 Moore & 85 Otamendi SBCs** and **Free 87 Jill Scott CB/CDM/CM & 87 Verón CM Objectives**).\n\nSelect a specialist role or model routing tier above, or ask any squad, SBC, Evolution, or market question below.`,
      telemetry: {
        tierLabel: 'System Ready · 5-Tier Smart Router (gemini-3.5-flash-lite / 3.8-flash / 4-argon)',
        modelUsed: 'gemini-3.8-flash',
        latencyMs: 1,
        routingReason: 'Multi-turn conversation thread initialized with zero-guessing club state.',
      },
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const sendChatMessage = async (textOverride?: string) => {
    const textToSend = (textOverride ?? inputMessage).trim();
    if (!textToSend || isSending) return;

    const userMsg: TacticalChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: t0Anchor.britishFullFormatted,
      personaUsed: activePersona,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInputMessage('');
    setIsSending(true);

    try {
      const personaInfo = PERSONA_CONFIG[activePersona];
      const resp = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          routingMode,
          useSearchGrounding,
          rolePersonaInstruction: personaInfo.roleInstruction,
          clubContext: clubContextForAi,
          clientT0: t0Anchor.britishFullFormatted,
        }),
      });
      const data = await resp.json();

      const modelMsg: TacticalChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.text || data.error || 'No response received.',
        timestamp: t0Anchor.britishFullFormatted,
        personaUsed: activePersona,
        telemetry: data.routingTelemetry,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Connection error: ${err?.message || 'Unable to reach Gemini endpoint.'}`,
          timestamp: t0Anchor.britishFullFormatted,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const currentPersona = PERSONA_CONFIG[activePersona];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT SIDEBAR: ROLE PERSONAS & MODEL ROUTING ECONOMICS */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-mono text-[#00ff87]">
            1. SELECT TACTICAL CHATBOT ROLE
          </div>
          <div className="space-y-2">
            {(Object.keys(PERSONA_CONFIG) as ChatbotRolePersona[]).map((key) => {
              const p = PERSONA_CONFIG[key];
              const isSelected = activePersona === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePersona(key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#00ff87]/10 border-[#00ff87] text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{p.title}</span>
                    {isSelected && <span className="text-[10px] font-mono text-[#00ff87]">ACTIVE</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{p.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Complexity Router Selector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#00ff87]">
              2. SMART MODEL ROUTER (COST vs LATENCY)
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <button
              type="button"
              onClick={() => setRoutingMode('AUTO')}
              className={`w-full text-left p-2.5 rounded-lg border font-mono ${
                routingMode === 'AUTO'
                  ? 'bg-[#00ff87]/15 border-[#00ff87] text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold text-[#00ff87]">AUTO (Dynamic Complexity Router)</div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                Routes fast checks to 3.5-flash-lite, live web queries to 3.8-flash + Search, and
                complex multi-constraint puzzles to 4-argon.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRoutingMode('TIER_1_LITE')}
              className={`w-full text-left p-2.5 rounded-lg border font-mono ${
                routingMode === 'TIER_1_LITE'
                  ? 'bg-[#00ff87]/15 border-[#00ff87] text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Fast Tier · gemini-3.5-flash-lite</span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                ~220–380ms latency · 1x lowest token cost · Quick SBC & rule checks.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRoutingMode('TIER_2_FLASH_SEARCH')}
              className={`w-full text-left p-2.5 rounded-lg border font-mono ${
                routingMode === 'TIER_2_FLASH_SEARCH'
                  ? 'bg-[#00ff87]/15 border-[#00ff87] text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Balanced + Search · gemini-3.8-flash</span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                ~750–1200ms · ~3x cost · Grounded with live Google Search data.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRoutingMode('TIER_3_ARGON_HIGH')}
              className={`w-full text-left p-2.5 rounded-lg border font-mono ${
                routingMode === 'TIER_3_ARGON_HIGH'
                  ? 'bg-[#00ff87]/15 border-[#00ff87] text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Deep Reasoning · gemini-4-argon (HIGH)</span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                ~2.5s–4.8s · ~15x cost · Complex squad chemistry & portfolio optimization.
              </div>
            </button>
          </div>

          <label className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-300 cursor-pointer">
            <span>Enable Google Search Grounding (Tier 2)</span>
            <input
              type="checkbox"
              checked={useSearchGrounding}
              onChange={(e) => setUseSearchGrounding(e.target.checked)}
              className="accent-[#00ff87]"
            />
          </label>
        </div>
      </div>

      {/* RIGHT MAIN PANEL: MULTI-TURN SCROLLABLE CONVERSATION THREAD */}
      <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col h-[720px]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono text-[#00ff87]">
              STANDALONE MULTI-TURN TACTICAL COMMAND CHAT
            </div>
            <h3 className="text-base font-bold text-white">{currentPersona.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => setMessages((prev) => prev.slice(0, 1))}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Thread</span>
          </button>
        </div>

        {/* Starter Prompts */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap gap-1.5">
          {currentPersona.starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendChatMessage(prompt)}
              disabled={isSending}
              className="text-[11px] text-left px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-[#00ff87] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Scrollable Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-4 space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-[#00ff87]/15 border border-[#00ff87]/40 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[11px] font-mono text-slate-400 border-b border-slate-800/70 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    {msg.role === 'user' ? (
                      <>
                        <User className="w-3.5 h-3.5 text-[#00ff87]" />
                        <strong className="text-white">You (Xbox Series S)</strong>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5 text-[#00ff87]" />
                        <strong className="text-[#00ff87]">FC 27 Tactical Director</strong>
                      </>
                    )}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {msg.telemetry && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 space-y-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[#00ff87] font-semibold">
                        {msg.telemetry.tierLabel}
                      </span>
                      <span className="text-amber-400 tabular-nums">
                        Latency: {msg.telemetry.latencyMs}ms
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Reason: {msg.telemetry.routingReason}
                    </div>
                  </div>
                )}

                <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      Google Search Grounded Sources:
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
              </div>
            </div>
          ))}

          {isSending && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-[#00ff87] animate-pulse">
              Routing request via Smart Model Router & synthesizing FC 27 Xbox Series S response...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Composer with Push-to-Talk */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendChatMessage();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center gap-2"
        >
          <PushToTalkButton
            label="Voice"
            onTranscript={(transcript) => {
              setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
            }}
          />
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about Ultimate Scream Team 1, Top 5 Player vs Upgrade SBCs, 87 Jill Scott Objective, or 35k flips..."
            className="flex-1 min-w-[220px] px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff87]"
          />
          <button
            type="submit"
            disabled={isSending || !inputMessage.trim()}
            className="px-4 py-2 rounded-xl bg-[#00ff87] hover:bg-[#00e67a] disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
