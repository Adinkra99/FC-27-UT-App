import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface PushToTalkButtonProps {
  onTranscript: (transcript: string, latencyMs?: number) => void;
  label?: string;
  compact?: boolean;
  className?: string;
  title?: string;
}

export const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  onTranscript,
  label = 'Voice Input',
  compact = false,
  className = '',
  title = 'Push-to-Talk Voice Transcription (gemini-3.5-transcribe)',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (isTranscribing) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = String(reader.result || '').split(',')[1];
          if (!base64String) return;
          setIsTranscribing(true);
          try {
            const resp = await fetch('/api/gemini/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64String,
                mimeType: 'audio/webm',
              }),
            });
            const data = await resp.json();
            if (data.transcript) {
              const clean = data.transcript.trim();
              const ms = data.routingTelemetry?.latencyMs;
              if (typeof ms === 'number') setLastLatencyMs(ms);
              onTranscript(clean, ms);
            }
          } catch (err) {
            console.error('gemini-3.5-transcribe error:', err);
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied or unavailable:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleRecording}
      disabled={isTranscribing}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg font-mono transition-colors ${
        compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'
      } ${
        isRecording
          ? 'bg-red-500/20 border border-red-500 text-red-300 animate-pulse'
          : isTranscribing
          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
          : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-[#00ff87]'
      } ${className}`}
    >
      {isTranscribing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>Transcribing...</span>
        </>
      ) : isRecording ? (
        <>
          <Square className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          <span>Stop Mic</span>
        </>
      ) : (
        <>
          <Mic className="w-3.5 h-3.5 text-[#00ff87]" />
          <span>{label}</span>
          {lastLatencyMs !== null && !compact && (
            <span className="text-[10px] text-slate-500">{lastLatencyMs}ms</span>
          )}
        </>
      )}
    </button>
  );
};
