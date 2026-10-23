import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Generates the exact T = 0 British Time (Europe/London) anchor & 2026-27 Season Truth
 * at the millisecond any server request is processed.
 */
function buildServerT0Context() {
  const now = new Date();
  const londonFormatter = new Intl.DateTimeFormat('en-GB', {
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

  const parts = londonFormatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const year = parseInt(map.year || '2026', 10);
  const month = parseInt(map.month || '10', 10);
  const seasonCode =
    month >= 8
      ? `${year}-${String(year + 1).slice(-2)} (1st Half of Season)`
      : month <= 5
      ? `${year - 1}-${String(year).slice(-2)} (2nd Half of Season)`
      : `${year}-${String(year + 1).slice(-2)} (Summer Transfer Window)`;

  const formattedUk = londonFormatter.format(now);

  return {
    t0Iso: now.toISOString(),
    formattedUk,
    seasonCode,
    antigravityVersion: '2.25',
    fc27Patch: 'EA Sports FC 27 Title Update #3.1 / Live Tuning #4',
  };
}

function getCoreSystemInstruction(clientT0Override?: string) {
  const t0 = buildServerT0Context();
  return `You are the EA SPORTS FC 27 ULTIMATE TEAM STRATEGIC ENGINE (PRO CONSOLE EDITION), orchestrated via Google Antigravity 2.0 Desktop App (Firmware v${t0.antigravityVersion}).

STRICT TEMPORAL & SEASONAL GROUNDING (T = 0):
- Live British Time Anchor (Europe/London): ${clientT0Override || t0.formattedUk} (ISO: ${t0.t0Iso}).
- Active Football Season: ${t0.seasonCode}. (Remember: Aug-Dec = 1st Half of [Year]-[Year+1] season; Jan-May = 2nd Half of [Year-1]-[Year] season).
- Daily Content Drop Anchor: 18:00 UK Time.
- ANTI-AUTOREGRESSIVE TRANSFER LAW: Override historical pre-training frequency bias completely. Ground strictly in the 2026/27 season verified via FotMob and FUTBIN FC 27 Console. For example, in 2026/27, Rodri plays for FC Barcelona (LaLiga EA Sports, Spain), Kylian Mbappé plays for Real Madrid, etc. NEVER reference FC 24, FC 25, or FC 26.

FC 27 CORE MECHANICS:
1. Dual-Mode SBCs:
   - Streamlined SBCs use cumulative "Item Score" across partial submissions. Base cards are simply Bronze, Silver, or Gold (no Common/Rare split). Regular Holographic (OVR <= 87) adds a 1.25x Item Score multiplier; Pristine Holographic (OVR >= 88) adds a 1.50x multiplier. Prioritize SBC Duplicate Storage and untradeables first.
   - Traditional Puzzle SBCs require 11 players and up to 33/33 chemistry.
2. FUT Gallery:
   - Permanent collection system (100+ Sets, Set Grades, Tag Bonuses). Cards remain registered in Gallery Sets even after being sold or submitted into SBCs ("Rent-and-Flip" at Quick Sell floor minus 5% EA tax).
3. Gameplay Synthesis & Branching Evolutions:
   - Strictly enforce the 3 PlayStyles+ hard cap in FC 27.
   - Evaluate all 31 Player Roles & Focuses (Role, Role+, Role++), Chemistry Style boosts (0-3 diamonds), AcceleRATE 2.0 sprint curves, and Body Type responsiveness under ${t0.fc27Patch}.
4. 5% EA Tax Enforcement:
   - Net Sale = Sale Price * 0.95. Always state exact break-even sale price.

OUTPUT FORMAT:
- Executive Summary (1-2 crisp sentences).
- Tactical Solution / Math Breakdown (clean bulleted breakdown with tabular numbers).
- Direct Action Items (1, 2, 3...).
- Net Financials (Coins spent, Coins saved, 5% EA tax accounted for).`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Attach dynamic T=0 header to every API response
  app.use('/api', (_req, res, next) => {
    const t0 = buildServerT0Context();
    res.setHeader('X-FC27-T0-Anchor', t0.t0Iso);
    res.setHeader('X-Antigravity-Firmware', t0.antigravityVersion);
    next();
  });

  /**
   * 1. Dynamic T=0 Firmware, Patch & Live Content Discovery Endpoint
   * Uses gemini-3.8-flash with googleSearch tool grounded at T=0.
   */
  app.post('/api/gemini/discover-t0-versions', async (req, res) => {
    try {
      const { clientT0, focusTopic } = req.body || {};
      const t0 = buildServerT0Context();
      const prompt = `At exact British Time T=0 (${clientT0 || t0.formattedUk}, Season: ${t0.seasonCode}):
Verify and summarize the current live state across our 4 pillars for ${focusTopic || 'all systems'}:
1. Google Antigravity 2.0 Desktop App Firmware (v2.25 capabilities: /browser + Chrome DevTools MCP, /schedule cron hooks, dynamic subagents, .agents/mcp_config.json, Jetski CoT safety).
2. EA Sports FC 27 Console Title Update & Live Tuning Patch meta impact on 31 Roles++, PlayStyles+ (3 cap), and AcceleRATE 2.0.
3. FUTBIN FC 27 Console 18:00 UK Content Drop, Holographic arbitrage (1.25x Regular <=87 / 1.50x Pristine >=88), and Streamlined SBCs.
4. FotMob 2026/27 Season verified squad transfers (e.g., Rodri at FC Barcelona) and matchday fixtures.`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: getCoreSystemInstruction(clientT0),
          tools: [{ googleSearch: {} }],
        },
      });

      res.json({
        text: response.text || 'T=0 Temporal Discovery completed.',
        t0Anchor: t0,
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/discover-t0-versions:', error);
      res.status(500).json({
        error: error?.message || 'Failed to run T=0 discovery.',
      });
    }
  });

  /**
   * 2. High-Thinking Strategic Engine (gemini-4-argon with ThinkingLevel.HIGH)
   * Handles complex Dual-Mode SBC optimization, Branching Evolution chains,
   * Additive Gameplay Synthesis analysis, and Holographic Market Arbitrage.
   */
  app.post('/api/gemini/high-thinking-advisor', async (req, res) => {
    try {
      const { mode, taskType, query, userQuery, clubContext, clientT0 } = req.body || {};
      const resolvedMode = taskType || mode || 'STRATEGIC_ANALYSIS';
      const resolvedQuery =
        userQuery ||
        query ||
        'Provide an optimal FC 27 Console tactical and financial action plan grounded at T=0.';

      const fullPrompt = `[T=0 MODE: ${resolvedMode}]
[USER CLUB & MARKET CONTEXT]:
${JSON.stringify(clubContext || {}, null, 2)}

[TACTICAL QUERY]:
${resolvedQuery}`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: fullPrompt,
        config: {
          systemInstruction: getCoreSystemInstruction(clientT0),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({
        text: response.text || 'High-thinking analysis complete.',
        modelUsed: 'gemini-4-argon (ThinkingLevel.HIGH)',
        t0Anchor: buildServerT0Context(),
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/high-thinking-advisor:', error);
      res.status(500).json({
        error: error?.message || 'High-Thinking Advisor encountered an error.',
      });
    }
  });

  /**
   * 3. Multi-Turn Gemini Chatbot with Model Routing & Google Search Grounding
   * Supports:
   * - gemini-4-argon (with ThinkingLevel.HIGH for complex reasoning)
   * - gemini-3.8-flash (with googleSearch tool for live grounding)
   * - gemini-3.1-flash-lite (for ultra-fast tax/fodder checks)
   */
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages, selectedModel, useSearchGrounding, clientT0 } = req.body || {};
      const modelToUse =
        selectedModel === 'gemini-4-argon' ||
        selectedModel === 'gemini-3.8-flash' ||
        selectedModel === 'gemini-3.1-flash-lite'
          ? selectedModel
          : 'gemini-3.8-flash';

      const formattedContents = Array.isArray(messages)
        ? messages.map((m: { role: string; text: string }) => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.text }],
          }))
        : [{ role: 'user', parts: [{ text: String(messages || 'Hello') }] }];

      const config: Record<string, any> = {
        systemInstruction: getCoreSystemInstruction(clientT0),
      };

      if (modelToUse === 'gemini-4-argon') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (modelToUse === 'gemini-3.8-flash' && useSearchGrounding !== false) {
        config.tools = [{ googleSearch: {} }];
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: formattedContents,
        config,
      });

      res.json({
        text: response.text || 'No response generated.',
        modelUsed: modelToUse,
        t0Anchor: buildServerT0Context(),
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/chat:', error);
      res.status(500).json({
        error: error?.message || 'Chat request failed.',
      });
    }
  });

  /**
   * 4. Hands-Free Controller Voice Transcription Endpoint (gemini-3.5-transcribe)
   */
  app.post('/api/gemini/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body || {};
      if (!audioBase64) {
        res.status(400).json({ error: 'Missing audioBase64 payload.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe this EA Sports FC 27 Ultimate Team voice command or club update accurately.',
            },
          ],
        },
      });

      res.json({
        transcript: response.text || '',
        t0Anchor: buildServerT0Context(),
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/transcribe:', error);
      res.status(500).json({
        error: error?.message || 'Voice transcription failed.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FC 27 UT App Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
