import React, { useState, useRef, useEffect } from 'react';
import { Radio, Mic, MicOff, PhoneOff, Volume2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface LiveAudioHudProps {
  clubCoins: number | null;
  t0Formatted: string;
}

export const LiveAudioHud: React.FC<LiveAudioHudProps> = ({ clubCoins, t0Formatted }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready · gemini-3.8-live');
  const [liveTranscriptLog, setLiveTranscriptLog] = useState<string[]>([]);
  const [waveBars, setWaveBars] = useState<number[]>([18, 28, 14, 34, 22, 40, 16, 30, 24, 18, 32, 20]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(false);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const waveAnimIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const float32ToPcm16Base64 = (float32Array: Float32Array): string => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const playPcm24kChunk = (base64Data: string) => {
    const outputCtx = outputAudioCtxRef.current;
    if (!outputCtx) return;

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = outputCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputCtx.destination);

      const now = outputCtx.currentTime;
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now + 0.02;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      activeSourcesRef.current.push(source);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      };
    } catch (err) {
      console.error('Error playing 24kHz PCM chunk:', err);
    }
  };

  const stopAllPlayback = () => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore if already stopped
      }
    }
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  };

  const startLiveSession = async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setIsExpanded(true);
    setStatusMessage('Connecting to gemini-3.8-live...');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);
        setStatusMessage('LIVE VOICE ACTIVE · gemini-3.8-live (16kHz In / 24kHz Out)');

        // Send initial context greeting
        ws.send(
          JSON.stringify({
            text: `User joined Live Tactical Audio HUD on Xbox Series S. Confirmed Coin Balance: ${
              clubCoins !== null ? clubCoins.toLocaleString() : '35,000'
            } Coins. Active Promo: Ultimate Scream Team 1 (90 Raphinha, 89 CR7, 89 Zola, 85 Moore SBC, 85 Otamendi SBC, 87 Jill Scott Objective, 87 Veron Objective). Greet briefly in 1 sentence and ask how to assist with their squad, SBCs, or market flips.`,
          })
        );

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const channelData = e.inputBuffer.getChannelData(0);

          // Compute RMS amplitude for waveform bars
          let sum = 0;
          for (let i = 0; i < channelData.length; i += 16) {
            sum += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sum / (channelData.length / 16));
          const boost = Math.min(100, Math.max(12, Math.round(rms * 420)));
          setWaveBars((prev) => prev.map((_, idx) => Math.max(12, Math.min(96, boost + ((idx * 17) % 35)))));

          const base64Audio = float32ToPcm16Base64(channelData);
          ws.send(JSON.stringify({ audio: base64Audio }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playPcm24kChunk(msg.audio);
            setWaveBars((prev) =>
              prev.map((_, i) => 22 + Math.floor(Math.abs(Math.sin(Date.now() / 120 + i)) * 68))
            );
          }
          if (msg.transcript) {
            setLiveTranscriptLog((prev) => [...prev.slice(-5), msg.transcript]);
          }
          if (msg.interrupted) {
            stopAllPlayback();
          }
          if (msg.error) {
            setStatusMessage(`Live API Notice: ${msg.error}`);
          }
        } catch (e) {
          console.error('Error parsing Live WS message:', e);
        }
      };

      ws.onerror = () => {
        setStatusMessage('Live WebSocket error — check connection.');
      };

      ws.onclose = () => {
        cleanupSession();
      };
    } catch (err: any) {
      console.error('Failed to start gemini-3.8-live session:', err);
      setIsConnecting(false);
      setStatusMessage(err?.message || 'Mic or Live session failed.');
    }
  };

  const cleanupSession = () => {
    stopAllPlayback();
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    if (waveAnimIntervalRef.current) {
      clearInterval(waveAnimIntervalRef.current);
      waveAnimIntervalRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setStatusMessage('Disconnected · gemini-3.8-live');
    setWaveBars([18, 28, 14, 34, 22, 40, 16, 30, 24, 18, 32, 20]);
  };

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, []);

  const sendQuickVoicePrompt = (promptText: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: promptText }));
      setLiveTranscriptLog((prev) => [...prev.slice(-5), `You: ${promptText}`]);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (!isConnected && !isConnecting) {
              startLiveSession();
            } else {
              setIsExpanded((prev) => !prev);
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all border ${
            isConnected
              ? 'bg-[#00ff87]/15 border-[#00ff87] text-[#00ff87] shadow-[0_0_15px_rgba(0,255,135,0.25)]'
              : isConnecting
              ? 'bg-amber-500/15 border-amber-400 text-amber-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-[#00ff87]/60'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-[#00ff87] animate-ping' : 'text-[#00ff87]'}`} />
          <span>{isConnected ? 'LIVE AUDIO HUD (ACTIVE)' : isConnecting ? 'CONNECTING LIVE...' : 'LIVE VOICE HUD'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="fixed right-4 top-16 z-50 w-96 max-w-[calc(100vw-2rem)] bg-[#0b111e]/95 backdrop-blur-md border border-[#00ff87]/50 rounded-2xl shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#00ff87]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GEMINI 3.8 LIVE API · REAL-TIME VOICE HUD</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{statusMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
            >
              Minimize
            </button>
          </div>

          {/* Interactive Real-Time Waveform Visualizer */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center">
            <div className="flex items-end justify-center gap-1.5 h-14 w-full px-2">
              {waveBars.map((heightPct, idx) => (
                <div
                  key={idx}
                  style={{ height: `${isConnected ? heightPct : 18}%` }}
                  className={`w-2 rounded-full transition-all duration-150 ${
                    isConnected
                      ? isMuted
                        ? 'bg-amber-400/60'
                        : 'bg-gradient-to-t from-[#00ff87] to-emerald-300'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-900">
              <span>Xbox Series S · {clubCoins !== null ? `${clubCoins.toLocaleString()} Coins` : '35,000 Coins'}</span>
              <span>T=0 {t0Formatted.split(',')[1] || t0Formatted}</span>
            </div>
          </div>

          {/* Quick Voice Coaching Triggers */}
          {isConnected && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400">
                Hands-Free Coaching Prompts (or just speak into your mic):
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    sendQuickVoicePrompt(
                      'Should I complete 85 Otamendi or 85 Bobby Moore Ultimate Scream SBC first with my 35k coins?'
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
                >
                  85 Otamendi vs 85 Moore SBC?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    sendQuickVoicePrompt(
                      'How should I grind 87 Jill Scott CB/CDM/CM and 87 Veron Objectives today?'
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
                >
                  87 Scott & Verón Objectives
                </button>
                <button
                  type="button"
                  onClick={() =>
                    sendQuickVoicePrompt(
                      'Give me 2 quick Ultimate Scream Team 1 flips on Xbox Series S under 35,000 coins.'
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
                >
                  Ultimate Scream 35k Flips
                </button>
              </div>
            </div>
          )}

          {liveTranscriptLog.length > 0 && (
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-2.5 max-h-28 overflow-y-auto space-y-1 text-[11px] font-mono text-slate-300">
              {liveTranscriptLog.map((line, i) => (
                <div key={i} className="leading-snug">
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {!isConnected ? (
              <button
                type="button"
                onClick={startLiveSession}
                disabled={isConnecting}
                className="w-full py-2 px-4 rounded-lg bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isConnecting ? 'Establishing Live Stream...' : 'Start Live Voice Conversation'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border ${
                    isMuted
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#00ff87]" />}
                  <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                </button>
                <button
                  type="button"
                  onClick={cleanupSession}
                  className="py-2 px-4 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/60 text-red-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>End Live</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
