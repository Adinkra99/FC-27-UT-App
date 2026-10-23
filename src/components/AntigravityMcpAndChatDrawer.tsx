import React, { useState, useRef } from 'react';
import { TemporalAnchor } from '../utils/timeGrounding';
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
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  modelBadge?: string;
  t0Stamp?: string;
}

interface AntigravityMcpAndChatDrawerProps {
  t0Anchor: TemporalAnchor;
  onVoiceClubCommand: (transcript: string) => void;
}

const MCP_CONFIG_JSON_STRING = `{
  "$schema": "https://antigravity.google/schemas/v2.25/mcp_config.schema.json",
  "antigravityFirmwareTarget": "2.25",
  "temporalAnchoringMode": "DYNAMIC_T0_BRITISH_TIME",
  "mcpServers": {
    "chrome-devtools-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools", "--port", "9222"]
    },
    "playwright-futbin-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "fetch-patch-sbc-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "sqlite-fc27-cache-mcp": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "./fc27_futbin_mirror.db"]
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

export const AntigravityMcpAndChatDrawer: React.FC<AntigravityMcpAndChatDrawerProps> = ({
  t0Anchor,
  onVoiceClubCommand,
}) => {
  const [selectedModel, setSelectedModel] = useState<
    'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'
  >('gemini-4-argon');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [chatInput, setChatInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isProbingFirmware, setIsProbingFirmware] = useState<boolean>(false);
  const [firmwareDiscoveryLog, setFirmwareDiscoveryLog] = useState<string | null>(null);
  const [copiedMcp, setCopiedMcp] = useState<boolean>(false);

  // Voice recording state for gemini-3.5-transcribe
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Executive Summary: Connected to Google Antigravity ${t0Anchor.antigravityFirmware.version} Desktop Orchestrator and grounded at T=0 (${t0Anchor.britishFullFormatted} · ${t0Anchor.footballSeasonCode} Season). Ask me to solve Streamlined SBCs, chain Branching Evolutions around your FC Barcelona (Rodri/Yamal/Pedri) core, or analyze console Holographic arbitrage.`,
      modelBadge: 'Antigravity v2.25 · T=0 Grounded',
      t0Stamp: t0Anchor.britishTimeFormatted,
    },
  ]);

  const handleCopyMcpConfig = () => {
    navigator.clipboard.writeText(MCP_CONFIG_JSON_STRING);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const handleProbeT0FirmwareAndPatches = async () => {
    setIsProbingFirmware(true);
    try {
      const res = await fetch('/api/gemini/discover-t0-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientT0: t0Anchor.britishFullFormatted,
          focusTopic: 'Antigravity 2.25 Desktop App, EA Sports FC 27 Title Update #3.1, and 2026-27 FotMob Transfers',
        }),
      });
      const data = await res.json();
      if (data.error) {
        setFirmwareDiscoveryLog(`Discovery Alert: ${data.error}`);
      } else {
        setFirmwareDiscoveryLog(data.text);
      }
    } catch (err: any) {
      setFirmwareDiscoveryLog(`Failed to probe live T=0 release channels: ${err.message}`);
    } finally {
      setIsProbingFirmware(false);
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? chatInput).trim();
    if (!textToSend || isSending) return;

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
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
          selectedModel,
          useSearchGrounding,
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
            modelBadge: selectedModel,
            t0Stamp: t0Anchor.britishTimeFormatted,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: data.text,
            modelBadge:
              selectedModel === 'gemini-4-argon'
                ? 'gemini-4-argon (Thinking HIGH)'
                : selectedModel === 'gemini-3.8-flash'
                ? 'gemini-3.8-flash (Search Grounded)'
                : 'gemini-3.1-flash-lite (Fast)',
            t0Stamp: t0Anchor.britishTimeFormatted,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `Network error: ${err.message}`,
          modelBadge: selectedModel,
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
      {/* Top Grid: Antigravity v2.25 Orchestrator + Multi-Turn Gemini Chatbot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Antigravity v2.25 Firmware & 7-Connector MCP Hub */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs text-slate-400">
                Dynamic T=0 Firmware & MCP Pipeline ({t0Anchor.britishDateFormatted})
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
            <div className="bg-slate-950 border border-[#00ff87]/40 rounded-lg p-3.5 text-xs text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {firmwareDiscoveryLog}
            </div>
          )}

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-300">
              Active Capabilities Unlocked by Antigravity v{t0Anchor.antigravityFirmware.version} at T=0:
            </div>
            {t0Anchor.antigravityFirmware.activeFeatures.map((feat) => (
              <div
                key={feat.id}
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-white">{feat.title}</span>
                  <span className="font-mono text-[#00ff87]">{feat.commandOrConfig}</span>
                </div>
                <p className="text-xs text-slate-400">{feat.description}</p>
              </div>
            ))}
          </div>

          {/* .agents/mcp_config.json Copy Block */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Scoped .agents/mcp_config.json (FUTBIN 27 + FotMob + SQLite)</span>
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
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-44">
              {MCP_CONFIG_JSON_STRING}
            </pre>
          </div>
        </div>

        {/* Right: Multi-Turn Gemini Chatbot + Voice Transcription (gemini-3.5-transcribe) */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-slate-400">
                  Multi-Turn Tactical & Market Intelligence Thread
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-4 h-4 text-[#00ff87]" />
                  <span>Gemini Strategic Director & Voice Sync</span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setUseSearchGrounding((v) => !v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                  useSearchGrounding
                    ? 'bg-[#00ff87]/15 border-[#00ff87] text-[#00ff87]'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Google Search Grounding: {useSearchGrounding ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Model Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gemini-4-argon', label: 'Gemini 4 Argon (High Thinking)' },
                { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Search)' },
                { id: 'gemini-3.1-flash-lite', label: '3.1 Flash Lite (Fast)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id as any)}
                  className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors truncate min-h-[38px] ${
                    selectedModel === m.id
                      ? 'bg-[#00ff87] text-slate-950 border-[#00ff87]'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#00ff87]/15 border border-[#00ff87]/40 text-white ml-6'
                    : 'bg-slate-900/95 border border-slate-800 text-slate-200 mr-4'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                  <span>{msg.role === 'user' ? 'You (Console Commander)' : msg.modelBadge}</span>
                  <span>{msg.t0Stamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Quick Prompt Starters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              'Best Evolution chain for FC Barcelona links (Rodri + Yamal)?',
              'Cheapest Holographic combo for 1,450 Item Score Hero SBC?',
              'Best 5G Bid-Flipping targets before 18:00 UK drop?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-[11px] text-slate-300 transition-colors"
              >
                {q}
              </button>
            ))}
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
              {isRecording ? <Square className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-[#00ff87]" />}
              <span>{isRecording ? 'Stop Mic' : isTranscribing ? 'Transcribing...' : 'Voice Mic'}</span>
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Ask about SBCs, 26-27 transfers, Roles++, or dictate pack pulls..."
              className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#00ff87] min-h-[42px]"
            />

            <button
              type="button"
              disabled={isSending || !chatInput.trim()}
              onClick={() => handleSendMessage()}
              className="px-4 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[42px] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Thinking...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ecosystem Comparison Matrix: FUTBIN vs. FUT.GG vs. EasySBC vs. FotMob vs. Our App */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <div className="text-xs text-slate-400">
            RAEC Benchmark & Platform Critique (2026/27 Season Console Ecosystem)
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">
            FUTBIN vs. FUT.GG vs. EasySBC vs. FotMob vs. FC 27 UT App
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-4 font-semibold">Evaluation Criteria</th>
                <th className="py-2.5 px-3 font-semibold">FUTBIN (FC 27)</th>
                <th className="py-2.5 px-3 font-semibold">FUT.GG</th>
                <th className="py-2.5 px-3 font-semibold">EasySBC</th>
                <th className="py-2.5 px-3 font-semibold">FotMob (26–27)</th>
                <th className="py-2.5 pl-3 font-semibold text-[#00ff87]">Our FC 27 UT App (Winner)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">Streamlined SBCs (Item Score)</td>
                <td className="py-2.5 px-3">Static Item Score tables</td>
                <td className="py-2.5 px-3">Cheapest by Rating list</td>
                <td className="py-2.5 px-3">Paywalled solver ($11.99/mo)</td>
                <td className="py-2.5 px-3">N/A</td>
                <td className="py-2.5 pl-3 text-[#00ff87] font-semibold">
                  0ms Deterministic Duplicate Storage + Holographic (1.25x/1.50x) Optimizer
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">FUT Gallery Sets, Tags & Flip</td>
                <td className="py-2.5 px-3">Gallery Builder & Grades</td>
                <td className="py-2.5 px-3">Holographic card DB</td>
                <td className="py-2.5 px-3">Minimal</td>
                <td className="py-2.5 px-3">N/A</td>
                <td className="py-2.5 pl-3 text-[#00ff87] font-semibold">
                  100+ Sets Tracker + Tag Bonus Calc + Discard "Rent-and-Flip" Optimizer
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">Gameplay Synthesis & 31 Roles++</td>
                <td className="py-2.5 px-3">Chem style stat calculator</td>
                <td className="py-2.5 px-3">Strong Evo Lab & Roles++</td>
                <td className="py-2.5 px-3">S–D Meta Ratings</td>
                <td className="py-2.5 px-3">N/A</td>
                <td className="py-2.5 pl-3 text-[#00ff87] font-semibold">
                  Synthesizes Stats + Chem + AcceleRATE 2.0 + 3 PS+ Cap + Body Type + Role++
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">2026–27 Transfer Truth (T=0)</td>
                <td className="py-2.5 px-3">Game DB bound</td>
                <td className="py-2.5 px-3">Game DB bound</td>
                <td className="py-2.5 px-3">Game DB bound</td>
                <td className="py-2.5 px-3">Live 26–27 Rosters</td>
                <td className="py-2.5 pl-3 text-[#00ff87] font-semibold">
                  Dual FotMob + FUTBIN 27 Grounding (e.g. Rodri @ FC Barcelona verified)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white">Club Sync (No Camera Uploads)</td>
                <td className="py-2.5 px-3">Broken/manual import</td>
                <td className="py-2.5 px-3">Manual checklist</td>
                <td className="py-2.5 px-3">Browser extension</td>
                <td className="py-2.5 px-3">N/A</td>
                <td className="py-2.5 pl-3 text-[#00ff87] font-semibold">
                  Antigravity v2.25 /browser MCP + Web App JSON + Google Drive + Voice Mic
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
