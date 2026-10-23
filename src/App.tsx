import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  createTemporalAnchor,
  TemporalAnchor,
} from './utils/timeGrounding';
import {
  FC27_ACTIVE_SBCS,
  FC27_CHEAPEST_BY_RATING,
  FC27_CONSOLE_PLAYERS,
  FC27_GALLERY_SETS,
  FC27_MATCH_STACKER_OBJECTIVES,
  FC27ConsolePlayer,
} from './data/fc27ConsoleData';
import {
  calculateEaTaxMetrics,
  calculateSquadChemistry,
  solveStreamlinedSbcItemScore,
} from './utils/fc27DeterministicEngine';
import {
  DriveFileSummary,
  createFc27DriveSnapshot,
  deleteFc27DriveSnapshotConfirmed,
  googleSignIn,
  initAuth,
  listFc27DriveBackups,
  loadClubStateFromFirestore,
  logoutUser,
  syncClubStateToFirestore,
} from './services/firebaseAndDriveService';
import { InteractiveMarketChart } from './components/InteractiveMarketChart';
import { GameplaySynthesisView } from './components/GameplaySynthesisView';
import {
  AntigravityMcpAndChatDrawer,
  RoutingTelemetryReceipt,
} from './components/AntigravityMcpAndChatDrawer';
import {
  Shield,
  TrendingUp,
  Layers,
  Award,
  Cpu,
  Clock,
  Upload,
  Cloud,
  Sparkles,
  CheckCircle2,
  Trash2,
  Monitor,
  LogOut,
  Coins,
  Zap,
  AlertTriangle,
  X,
  Mic,
  Square,
  Sliders,
  Search,
  Plus,
} from 'lucide-react';
import type { User } from 'firebase/auth';

type PrincipalDomain = 'MENUS' | 'GAMEPLAY';
type ActiveTab =
  | 'CLUB_SYNC'
  | 'DUAL_SBCS'
  | 'FUT_GALLERY'
  | 'CONSOLE_MARKET'
  | 'GAMEPLAY_LAB'
  | 'ANTIGRAVITY_AI';

interface TrackedInvestment {
  id: string;
  playerName: string;
  rating: number;
  rarity: string;
  buyPrice: number;
  targetSellPrice: number;
  quantity: number;
}

interface UnverifiedCustomPlayer {
  id: string;
  name: string;
  rating: number | null;
  club2627: string | null;
  xboxSeriesSPrice: number | null;
  inClubInventory: boolean;
  inDuplicateStorage: boolean;
  verifiedReport: string | null;
  isVerifying: boolean;
}

export function App() {
  // 1. Live Universal Dynamic Temporal Anchor (T = 0 in British Time BST/GMT)
  const [t0Anchor, setT0Anchor] = useState<TemporalAnchor>(() =>
    createTemporalAnchor(new Date())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setT0Anchor(createTemporalAnchor(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Principal Domain ('MENUS' vs 'GAMEPLAY') & Navigation State
  const [principalDomain, setPrincipalDomain] = useState<PrincipalDomain>('MENUS');
  const [activeTab, setActiveTab] = useState<ActiveTab>('CLUB_SYNC');
  const [screenPadTickerOpen, setScreenPadTickerOpen] = useState<boolean>(true);

  // 3. ZERO-GUESSING PERSONAL XBOX SERIES S CLUB STATE
  // Only confirmed datum: 35,000 Xbox Series S Coins.
  // Every other personal club field starts strictly null (blank '—') or empty ([]).
  const [coins, setCoins] = useState<number | null>(35000);
  const [clubName, setClubName] = useState<string | null>(null);
  const [fifaPoints, setFifaPoints] = useState<number | null>(null);
  const [rivalsDivision, setRivalsDivision] = useState<string | null>(null);
  const [dailySp, setDailySp] = useState<number | null>(null);
  const [galleryLevel, setGalleryLevel] = useState<number | null>(null);

  // FC 27 Xbox Series S Reference Catalog (all inClubInventory & inDuplicateStorage start FALSE)
  const [players, setPlayers] = useState<FC27ConsolePlayer[]>(FC27_CONSOLE_PLAYERS);
  const [customClubPlayers, setCustomClubPlayers] = useState<UnverifiedCustomPlayer[]>([]);
  const [newCustomPlayerName, setNewCustomPlayerName] = useState<string>('');

  const [useClubUntradeablesInSbc, setUseClubUntradeablesInSbc] = useState<boolean>(true);
  const [selectedSbcId, setSelectedSbcId] = useState<string>(FC27_ACTIVE_SBCS[1].id); // 22.9k Trailblazers Guarantee fits 35k budget

  // 4. Market & 5G Investment Portfolio State (Starts strictly empty [] — zero guessed trades)
  const [selectedMarketPlayerId, setSelectedMarketPlayerId] = useState<string>(
    FC27_CONSOLE_PLAYERS[7].id // 83 Balde (8,400 Coins — fits 35k Xbox Series S budget)
  );
  const [marketFilter5G, setMarketFilter5G] = useState<'ALL' | 'UNDER_35K' | 'HOLOGRAPHIC'>(
    'UNDER_35K'
  );
  const [trackedInvestments, setTrackedInvestments] = useState<TrackedInvestment[]>([]);

  // 5. Gallery Set Registration State (Starts strictly empty {})
  const [registeredRentIds, setRegisteredRentIds] = useState<Record<string, boolean>>({});

  // 6. Immediate Launch Club Sync Modal (Confirmed Phase 1 User Choice)
  const [showLaunchSyncModal, setShowLaunchSyncModal] = useState<boolean>(true);
  const [syncModalTab, setSyncModalTab] = useState<
    'MANUAL_VOICE' | 'WEB_APP_JSON' | 'BROWSER_MCP' | 'CLOUD_RESTORE'
  >('MANUAL_VOICE');

  // Form inputs inside the Sync Modal (empty string = keep blank / null)
  const [draftCoins, setDraftCoins] = useState<string>('35000');
  const [draftClubName, setDraftClubName] = useState<string>('');
  const [draftFifaPoints, setDraftFifaPoints] = useState<string>('');
  const [draftRivalsDivision, setDraftRivalsDivision] = useState<string>('');
  const [draftGalleryLevel, setDraftGalleryLevel] = useState<string>('');
  const [draftDailySp, setDraftDailySp] = useState<string>('');
  const [jsonImportText, setJsonImportText] = useState<string>('');

  // Voice dictation in Sync Modal
  const [isRecordingSyncVoice, setIsRecordingSyncVoice] = useState<boolean>(false);
  const [isTranscribingSyncVoice, setIsTranscribingSyncVoice] = useState<boolean>(false);
  const syncMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const syncAudioChunksRef = useRef<Blob[]>([]);

  // 7. Firebase Auth, Firestore Sync & Google Drive REST API v3 State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState<boolean>(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileSummary[]>([]);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudStatusBanner, setCloudStatusBanner] = useState<string | null>(null);
  const [pendingDeleteDriveFile, setPendingDeleteDriveFile] = useState<DriveFileSummary | null>(
    null
  );

  // 8. Smart-Routed Strategic Output Drawer (with Tier, Latency ms, and Reason telemetry)
  const [isThinkingAdvisor, setIsThinkingAdvisor] = useState<boolean>(false);
  const [strategyOutput, setStrategyOutput] = useState<{
    title: string;
    text: string;
    t0Stamp: string;
    telemetry?: RoutingTelemetryReceipt;
  } | null>(null);

  // Initialize Firebase Auth & load persisted Firestore state (only overwriting fields that exist)
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setCurrentUser(user);
        setHasDriveToken(Boolean(token));
        try {
          const data = await loadClubStateFromFirestore();
          if (data) {
            if (typeof data.coins === 'number' || data.coins === null) {
              setCoins(data.coins ?? 35000);
              setDraftCoins(data.coins !== null && data.coins !== undefined ? String(data.coins) : '');
            }
            if (typeof data.clubName === 'string' || data.clubName === null) {
              setClubName(data.clubName ?? null);
              setDraftClubName(data.clubName || '');
            }
            if (typeof data.fifaPoints === 'number' || data.fifaPoints === null) {
              setFifaPoints(data.fifaPoints ?? null);
              setDraftFifaPoints(
                data.fifaPoints !== null && data.fifaPoints !== undefined ? String(data.fifaPoints) : ''
              );
            }
            if (typeof data.rivalsDivision === 'string' || data.rivalsDivision === null) {
              setRivalsDivision(data.rivalsDivision ?? null);
              setDraftRivalsDivision(data.rivalsDivision || '');
            }
            if (typeof data.dailySp === 'number' || data.dailySp === null) {
              setDailySp(data.dailySp ?? null);
              setDraftDailySp(
                data.dailySp !== null && data.dailySp !== undefined ? String(data.dailySp) : ''
              );
            }
            if (typeof data.galleryLevel === 'number' || data.galleryLevel === null) {
              setGalleryLevel(data.galleryLevel ?? null);
              setDraftGalleryLevel(
                data.galleryLevel !== null && data.galleryLevel !== undefined
                  ? String(data.galleryLevel)
                  : ''
              );
            }
          }
        } catch (err) {
          console.error('Firestore initial load error:', err);
        }
      },
      () => {
        setCurrentUser(null);
        setHasDriveToken(false);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  // Build strict zero-guessing club context object for AI calls
  const clubContextForAi = useMemo(() => {
    const ownedCatalogCards = players
      .filter((p) => p.inClubInventory && !p.inDuplicateStorage)
      .map((p) => `${p.rating} ${p.name} (${p.club}, ${p.rarity}, ${p.effectiveItemScore} pts)`);
    const ownedCustomCards = customClubPlayers
      .filter((p) => p.inClubInventory && !p.inDuplicateStorage)
      .map((p) => `${p.rating ?? '—'} ${p.name} (${p.club2627 ?? 'Unverified Club'})`);
    const dupStorageCards = players
      .filter((p) => p.inDuplicateStorage)
      .map((p) => `${p.rating} ${p.name} (${p.rarity}, ${p.effectiveItemScore} pts)`);

    return {
      consolePlatform: 'Xbox Series S (Console Cross-Play Market Only)',
      coins: coins,
      clubName: clubName ?? 'BLANK (Not Provided)',
      fifaPoints: fifaPoints ?? 'BLANK (Not Provided)',
      rivalsDivision: rivalsDivision ?? 'BLANK (Not Provided)',
      galleryLevel: galleryLevel ?? 'BLANK (Not Provided)',
      dailySp: dailySp !== null ? `${dailySp}/850 SP` : 'BLANK (Not Provided)',
      ownedClubCards:
        ownedCatalogCards.length + ownedCustomCards.length > 0
          ? [...ownedCatalogCards, ...ownedCustomCards]
          : 'BLANK (0 Cards Synced — Do NOT guess or assume the user owns any cards)',
      sbcDuplicateStorage:
        dupStorageCards.length > 0
          ? dupStorageCards
          : 'BLANK (0 Duplicate Storage Cards Synced — Do NOT assume any duplicate fodder)',
    };
  }, [coins, clubName, fifaPoints, rivalsDivision, galleryLevel, dailySp, players, customClubPlayers]);

  // Apply manual partial sync from Launch Modal (any empty input remains strictly null / blank)
  const handleApplyPartialClubSync = () => {
    const parsedCoins = draftCoins.trim() !== '' ? Number(draftCoins.replace(/,/g, '')) : null;
    const parsedFp = draftFifaPoints.trim() !== '' ? Number(draftFifaPoints.replace(/,/g, '')) : null;
    const parsedGal = draftGalleryLevel.trim() !== '' ? Number(draftGalleryLevel) : null;
    const parsedSp = draftDailySp.trim() !== '' ? Number(draftDailySp) : null;

    setCoins(parsedCoins !== null && !Number.isNaN(parsedCoins) ? parsedCoins : null);
    setClubName(draftClubName.trim() !== '' ? draftClubName.trim() : null);
    setFifaPoints(parsedFp !== null && !Number.isNaN(parsedFp) ? parsedFp : null);
    setRivalsDivision(draftRivalsDivision.trim() !== '' ? draftRivalsDivision.trim() : null);
    setGalleryLevel(parsedGal !== null && !Number.isNaN(parsedGal) ? parsedGal : null);
    setDailySp(parsedSp !== null && !Number.isNaN(parsedSp) ? Math.min(850, parsedSp) : null);

    setShowLaunchSyncModal(false);
    setCloudStatusBanner(
      `Xbox Series S Club State updated at T=0 (${t0Anchor.britishTimeFormatted}). Unfilled fields remain strictly blank (—).`
    );
  };

  // Parse Companion Web App / Paletools JSON without guessing missing fields
  const handleApplyJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonImportText);
      if (parsed.coins !== undefined) {
        setCoins(typeof parsed.coins === 'number' ? parsed.coins : null);
        setDraftCoins(typeof parsed.coins === 'number' ? String(parsed.coins) : '');
      }
      if (parsed.fifaPoints !== undefined) {
        setFifaPoints(typeof parsed.fifaPoints === 'number' ? parsed.fifaPoints : null);
        setDraftFifaPoints(typeof parsed.fifaPoints === 'number' ? String(parsed.fifaPoints) : '');
      }
      if (parsed.rivalsDivision !== undefined) {
        setRivalsDivision(typeof parsed.rivalsDivision === 'string' ? parsed.rivalsDivision : null);
        setDraftRivalsDivision(typeof parsed.rivalsDivision === 'string' ? parsed.rivalsDivision : '');
      }
      if (parsed.galleryLevel !== undefined) {
        setGalleryLevel(typeof parsed.galleryLevel === 'number' ? parsed.galleryLevel : null);
        setDraftGalleryLevel(
          typeof parsed.galleryLevel === 'number' ? String(parsed.galleryLevel) : ''
        );
      }
      if (parsed.dailySp !== undefined) {
        setDailySp(typeof parsed.dailySp === 'number' ? Math.min(850, parsed.dailySp) : null);
        setDraftDailySp(typeof parsed.dailySp === 'number' ? String(parsed.dailySp) : '');
      }
      if (parsed.clubName !== undefined) {
        setClubName(typeof parsed.clubName === 'string' ? parsed.clubName : null);
        setDraftClubName(typeof parsed.clubName === 'string' ? parsed.clubName : '');
      }
      setShowLaunchSyncModal(false);
      setCloudStatusBanner(
        `Imported Companion Web App JSON at T=0 (${t0Anchor.britishTimeFormatted}). Missing keys kept strictly blank (—).`
      );
    } catch {
      setCloudStatusBanner(
        'Invalid JSON format. Provide valid JSON with only the fields you want to set (e.g. {"coins": 35000}).'
      );
    }
  };

  // Voice dictation inside the Club Sync Modal
  const handleToggleSyncModalVoice = async () => {
    if (isRecordingSyncVoice) {
      syncMediaRecorderRef.current?.stop();
      setIsRecordingSyncVoice(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      syncAudioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) syncAudioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(syncAudioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribingSyncVoice(true);

        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = String(reader.result || '').split(',')[1];
            if (!base64Data) {
              setIsTranscribingSyncVoice(false);
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
              handleVoiceClubCommand(data.transcript);
            }
            setIsTranscribingSyncVoice(false);
          };
          reader.readAsDataURL(audioBlob);
        } catch {
          setIsTranscribingSyncVoice(false);
        }
      };

      syncMediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingSyncVoice(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  // Add a custom player to personal club (starts with unverified stats/price blank until verified)
  const handleAddCustomClubPlayer = () => {
    const trimmed = newCustomPlayerName.trim();
    if (!trimmed) return;
    const newEntry: UnverifiedCustomPlayer = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      rating: null,
      club2627: null,
      xboxSeriesSPrice: null,
      inClubInventory: true,
      inDuplicateStorage: false,
      verifiedReport: null,
      isVerifying: false,
    };
    setCustomClubPlayers((prev) => [newEntry, ...prev]);
    setNewCustomPlayerName('');
  };

  // Trigger Live FC 27 Xbox Series S Verification for an unverified custom player
  const handleVerifyCustomPlayer = async (customId: string, playerName: string) => {
    setCustomClubPlayers((prev) =>
      prev.map((p) => (p.id === customId ? { ...p, isVerifying: true } : p))
    );
    try {
      const res = await fetch('/api/gemini/verify-fc27-xbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          clientT0: t0Anchor.britishFullFormatted,
        }),
      });
      const data = await res.json();
      setCustomClubPlayers((prev) =>
        prev.map((p) =>
          p.id === customId
            ? {
                ...p,
                isVerifying: false,
                verifiedReport: data.text || 'Verification complete.',
              }
            : p
        )
      );
    } catch (err: any) {
      setCustomClubPlayers((prev) =>
        prev.map((p) =>
          p.id === customId
            ? {
                ...p,
                isVerifying: false,
                verifiedReport: `Verification failed: ${err.message}`,
              }
            : p
        )
      );
    }
  };

  // Switch domain tab automatically when Principal Domain toggles
  const handleSelectDomain = (domain: PrincipalDomain) => {
    setPrincipalDomain(domain);
    if (domain === 'GAMEPLAY') {
      setActiveTab('GAMEPLAY_LAB');
    } else if (activeTab === 'GAMEPLAY_LAB') {
      setActiveTab('CLUB_SYNC');
    }
  };

  // Sign in with Google (Firebase Auth + Google Drive Workspace scopes)
  const handleGoogleSignIn = async () => {
    try {
      setIsSyncingCloud(true);
      const { user, accessToken } = await googleSignIn();
      setCurrentUser(user);
      setHasDriveToken(Boolean(accessToken));
      await syncClubStateToFirestore({
        clubName,
        coins,
        fifaPoints,
        rivalsDivision,
        dailySp,
        galleryLevel,
        activeFormation: '4-2-1-3',
        antigravityVersion: t0Anchor.antigravityFirmware.version,
        fc27PatchVersion: t0Anchor.fc27PatchState.titleUpdateVersion,
        lastT0Anchor: t0Anchor.britishFullFormatted,
      });
      const files = await listFc27DriveBackups();
      setDriveFiles(files);
      setCloudStatusBanner(
        `Synced Xbox Series S club state to Firestore & connected Google Drive (${files.length} FC27 snapshots found).`
      );
    } catch (err: any) {
      setCloudStatusBanner(`Auth/Sync notice: ${err.message}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Save Snapshot to Firestore + Google Drive (preserving null for blank fields)
  const handleBackupToFirestoreAndDrive = async () => {
    const freshT0 = createTemporalAnchor(new Date());
    setT0Anchor(freshT0);
    setIsSyncingCloud(true);
    try {
      await syncClubStateToFirestore({
        clubName,
        coins,
        fifaPoints,
        rivalsDivision,
        dailySp,
        galleryLevel,
        activeFormation: '4-2-1-3',
        antigravityVersion: freshT0.antigravityFirmware.version,
        fc27PatchVersion: freshT0.fc27PatchState.titleUpdateVersion,
        lastT0Anchor: freshT0.britishFullFormatted,
      });

      if (hasDriveToken) {
        const fileName = `FC27_UT_XboxSeriesS_${freshT0.footballSeasonCode}_${freshT0.t0EpochMs}.json`;
        const snapshotPayload = {
          anchoredAtT0: freshT0.britishFullFormatted,
          consolePlatform: 'Xbox Series S',
          season: freshT0.footballSeasonCode,
          antigravityFirmware: freshT0.antigravityFirmware.version,
          fc27Patch: freshT0.fc27PatchState.titleUpdateVersion,
          clubName,
          coins,
          fifaPoints,
          rivalsDivision,
          dailySp,
          galleryLevel,
          ownedCatalogPlayerIds: players.filter((p) => p.inClubInventory).map((p) => p.id),
          duplicateStoragePlayerIds: players.filter((p) => p.inDuplicateStorage).map((p) => p.id),
          customClubPlayers,
        };
        await createFc27DriveSnapshot(fileName, snapshotPayload);
        const updatedFiles = await listFc27DriveBackups();
        setDriveFiles(updatedFiles);
        setCloudStatusBanner(
          `Saved Xbox Series S snapshot ${fileName} to Google Drive & synced Firestore at ${freshT0.britishTimeFormatted}.`
        );
      } else {
        setCloudStatusBanner(
          `Synced Xbox Series S state to Firestore at ${freshT0.britishTimeFormatted}. Sign in with Google to enable Drive snapshot files.`
        );
      }
    } catch (err: any) {
      setCloudStatusBanner(`Cloud sync error: ${err.message}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Confirmed Google Drive file deletion
  const handleConfirmDeleteDriveFile = async () => {
    if (!pendingDeleteDriveFile) return;
    setIsSyncingCloud(true);
    try {
      await deleteFc27DriveSnapshotConfirmed(pendingDeleteDriveFile.id);
      const updated = await listFc27DriveBackups();
      setDriveFiles(updated);
      setCloudStatusBanner(`Deleted snapshot "${pendingDeleteDriveFile.name}" from Google Drive.`);
      setPendingDeleteDriveFile(null);
    } catch (err: any) {
      setCloudStatusBanner(`Delete failed: ${err.message}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Trigger Smart-Routed Strategic Advisor (displays Model Tier, Latency ms, and Reason)
  const handleRunSmartAdvisor = async (title: string, taskPrompt: string) => {
    const freshT0 = createTemporalAnchor(new Date());
    setT0Anchor(freshT0);
    setIsThinkingAdvisor(true);

    try {
      const res = await fetch('/api/gemini/high-thinking-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: title,
          userQuery: taskPrompt,
          clubContext: clubContextForAi,
          clientT0: freshT0.britishFullFormatted,
          routingOverride: 'AUTO',
        }),
      });
      const data = await res.json();
      if (data.error) {
        setStrategyOutput({
          title: `${title} — Notice`,
          text: data.error,
          t0Stamp: freshT0.britishFullFormatted,
        });
      } else {
        setStrategyOutput({
          title,
          text: data.text,
          t0Stamp: freshT0.britishFullFormatted,
          telemetry: data.routingTelemetry,
        });
      }
    } catch (err: any) {
      setStrategyOutput({
        title: `${title} — Error`,
        text: `Failed to reach Strategic Advisor endpoint: ${err.message}`,
        t0Stamp: freshT0.britishFullFormatted,
      });
    } finally {
      setIsThinkingAdvisor(false);
    }
  };

  // Handle Voice Transcript Command from gemini-3.5-transcribe
  const handleVoiceClubCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();
    // Parse explicit coin mentions if spoken (e.g. "35000 coins" or "35k coins")
    const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\s*coins/);
    if (kMatch) {
      const val = Math.round(parseFloat(kMatch[1]) * 1000);
      setCoins(val);
      setDraftCoins(String(val));
    }
    if (lower.includes('sbc') || lower.includes('score')) {
      setPrincipalDomain('MENUS');
      setActiveTab('DUAL_SBCS');
    } else if (lower.includes('gallery') || lower.includes('rent')) {
      setPrincipalDomain('MENUS');
      setActiveTab('FUT_GALLERY');
    } else if (lower.includes('market') || lower.includes('price')) {
      setPrincipalDomain('MENUS');
      setActiveTab('CONSOLE_MARKET');
    } else if (lower.includes('gameplay') || lower.includes('role') || lower.includes('evo')) {
      setPrincipalDomain('GAMEPLAY');
      setActiveTab('GAMEPLAY_LAB');
    }
    setCloudStatusBanner(
      `Voice command transcribed ("${transcript}") at ${t0Anchor.britishTimeFormatted}.`
    );
  };

  // Derived deterministic calculations (<2ms, $0.00 cost)
  const ownedPlayersList = useMemo(
    () => players.filter((p) => p.inClubInventory && !p.inDuplicateStorage),
    [players]
  );

  const duplicateStorageList = useMemo(
    () => players.filter((p) => p.inDuplicateStorage),
    [players]
  );

  const activeSbc = useMemo(
    () => FC27_ACTIVE_SBCS.find((s) => s.id === selectedSbcId) || FC27_ACTIVE_SBCS[0],
    [selectedSbcId]
  );

  const streamlinedSolution = useMemo(
    () => solveStreamlinedSbcItemScore(activeSbc, players, useClubUntradeablesInSbc),
    [activeSbc, players, useClubUntradeablesInSbc]
  );

  const squadChemistry = useMemo(
    () =>
      ownedPlayersList.length > 0
        ? calculateSquadChemistry(ownedPlayersList.slice(0, 11))
        : null,
    [ownedPlayersList]
  );

  const selectedMarketPlayer = useMemo(
    () => players.find((p) => p.id === selectedMarketPlayerId) || players[0],
    [players, selectedMarketPlayerId]
  );

  const filteredMarketPlayers = useMemo(() => {
    if (marketFilter5G === 'UNDER_35K') {
      const budgetCap = coins ?? 35000;
      return players.filter((p) => p.consolePrice <= budgetCap);
    }
    if (marketFilter5G === 'HOLOGRAPHIC') {
      return players.filter((p) => p.holographicMultiplier > 1.0);
    }
    return players;
  }, [players, marketFilter5G, coins]);

  // Execute "Rent-and-Flip" Gallery Set Registration
  const handleExecuteRentAndFlip = (
    candidateId: string,
    playerName: string,
    netCoinDelta: number,
    galleryPoints: number
  ) => {
    if (registeredRentIds[candidateId]) return;
    setRegisteredRentIds((prev) => ({ ...prev, [candidateId]: true }));
    if (coins !== null) {
      setCoins(coins + netCoinDelta);
    }
    setCloudStatusBanner(
      `Xbox Series S Rent-and-Flip Logged: Registered ${playerName} permanently in FUT Gallery (+${galleryPoints} Gallery Pts) & relisted for +${netCoinDelta} Net Coins after 5% EA Tax.`
    );
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col pb-24 lg:pb-12">
      {/* TOP BAR CONTRACT: Strictly 3 Distinct Component Groups (Left Brand/Domain, Center T=0 Clock, Right Xbox Wallet/Auth) */}
      <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* ZONE 1 (Left): Brand Title + 2 Principal Domains Switcher (MENUS vs GAMEPLAY) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#00ff87] text-slate-950 font-extrabold flex items-center justify-center text-sm tracking-tight shrink-0">
                FC27
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white tracking-tight whitespace-nowrap">
                    FC 27 UT App
                  </span>
                  <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                    · Xbox Series S
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  {t0Anchor.footballSeasonCode} Season · Antigravity v{t0Anchor.antigravityFirmware.version}
                </div>
              </div>
            </div>

            {/* 2 Principal Domains Switcher */}
            <div className="flex items-center p-1 bg-[#111827] border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => handleSelectDomain('MENUS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                  principalDomain === 'MENUS'
                    ? 'bg-[#00ff87] text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1. MENUS (Club · SBC · Gallery · Xbox Market)
              </button>
              <button
                type="button"
                onClick={() => handleSelectDomain('GAMEPLAY')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                  principalDomain === 'GAMEPLAY'
                    ? 'bg-[#00ff87] text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                2. GAMEPLAY (Synthesis · Roles++ · Patch #3.1)
              </button>
            </div>
          </div>

          {/* ZONE 2 (Center): Live T=0 British Time Clock & 18:00 UK Content Drop Countdown */}
          <div className="hidden xl:flex items-center gap-3 bg-[#111827] border border-slate-800 rounded-lg px-3.5 py-2 text-xs">
            <Clock className="w-4 h-4 text-[#00ff87] shrink-0" />
            <div className="font-mono tabular-nums text-slate-200 whitespace-nowrap">
              <span className="text-slate-400">T=0 UK: </span>
              <strong>{t0Anchor.britishFullFormatted}</strong>
            </div>
            <span className="text-slate-600" aria-hidden="true">|</span>
            <div className="font-mono tabular-nums text-amber-400 whitespace-nowrap">
              18:00 Drop: <strong>{t0Anchor.countdownTo1800Drop.formatted}</strong>
            </div>
          </div>

          {/* ZONE 3 (Right): Blank-Safe Xbox Series S Wallet Summary + Sync Button + Google Auth */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowLaunchSyncModal(true)}
              className="hidden md:flex items-center gap-2.5 bg-[#111827] hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums transition-colors min-h-[38px]"
              title="Click to update or clear your Xbox Series S Club fields"
            >
              <span className="text-[#00ff87] font-bold whitespace-nowrap">
                Xbox Coins: {coins !== null ? coins.toLocaleString() : '—'}
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300 whitespace-nowrap">
                Div: {rivalsDivision ?? '—'}
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300 whitespace-nowrap">
                Gallery: {galleryLevel !== null ? `Lv.${galleryLevel}` : '—'}
              </span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncingCloud}
                  onClick={handleBackupToFirestoreAndDrive}
                  className="px-3 py-2 bg-[#111827] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-[#00ff87] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
                <button
                  type="button"
                  onClick={logoutUser}
                  title="Sign Out"
                  className="p-2 bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors min-h-[38px]"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="gsi-material-button"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Sign in with Google</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTAINER: Desktop Left Sidebar + Primary Content Canvas */}
      <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-6 px-4 lg:px-6 pt-5">
        {/* Desktop Navigation Sidebar */}
        <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col justify-between bg-[#111827] border border-slate-800 rounded-xl p-4 h-fit sticky top-20 space-y-6">
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
              {principalDomain === 'MENUS' ? 'Domain 1: Menus & Xbox Market' : 'Domain 2: On-Pitch Meta'}
            </div>

            <nav className="space-y-1.5">
              {[
                {
                  id: 'CLUB_SYNC',
                  label: 'My Xbox Club (Zero-Guess)',
                  domain: 'MENUS' as PrincipalDomain,
                  icon: Shield,
                },
                {
                  id: 'DUAL_SBCS',
                  label: 'Dual-Mode SBC Solver',
                  domain: 'MENUS' as PrincipalDomain,
                  icon: Layers,
                },
                {
                  id: 'FUT_GALLERY',
                  label: 'FUT Gallery & Rent-Flip',
                  domain: 'MENUS' as PrincipalDomain,
                  icon: Award,
                },
                {
                  id: 'CONSOLE_MARKET',
                  label: 'Xbox Series S Market (35k)',
                  domain: 'MENUS' as PrincipalDomain,
                  icon: TrendingUp,
                },
                {
                  id: 'GAMEPLAY_LAB',
                  label: 'Gameplay Synthesis & Roles++',
                  domain: 'GAMEPLAY' as PrincipalDomain,
                  icon: Zap,
                },
                {
                  id: 'ANTIGRAVITY_AI',
                  label: 'Smart Router & GenUI Skill',
                  domain: principalDomain,
                  icon: Cpu,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as ActiveTab);
                      if (item.id === 'GAMEPLAY_LAB') setPrincipalDomain('GAMEPLAY');
                      else if (item.id !== 'ANTIGRAVITY_AI') setPrincipalDomain('MENUS');
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors whitespace-nowrap shrink-0 min-h-[42px] ${
                      isActive
                        ? 'bg-[#00ff87] text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zero-Guessing & FC 27 Xbox Series S Guard Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="font-bold text-[#00ff87] flex items-center justify-between">
                <span>Zero-Guessing Guard</span>
                <span className="font-mono">FC 27 Xbox</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Confirmed Coins: <strong className="text-white font-mono">{coins !== null ? coins.toLocaleString() : '—'}</strong>. Unknown personal fields (Gallery Lv, Owned Cards, FP, Division) remain strictly <strong className="text-amber-300">blank (—)</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowLaunchSyncModal(true)}
                className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-semibold text-[11px] transition-colors"
              >
                Open Club Sync / Edit Fields
              </button>
            </div>
          </div>

          {/* ZenBook UX482 ScreenPad Plus Toggle */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => setScreenPadTickerOpen((v) => !v)}
              className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors min-h-[38px]"
            >
              <span className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-[#00ff87]" />
                <span>ZenBook ScreenPad+</span>
              </span>
              <span className="font-mono text-[11px] text-[#00ff87]">
                {screenPadTickerOpen ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </aside>

        {/* PRIMARY MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Mobile/Compact T=0 Temporal Strip */}
          <div className="xl:hidden bg-[#111827] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
            <span className="text-slate-200">
              T=0 UK: <strong className="text-[#00ff87]">{t0Anchor.britishFullFormatted}</strong>
            </span>
            <span className="text-amber-400">
              Xbox Coins: <strong>{coins !== null ? coins.toLocaleString() : '—'}</strong>
            </span>
          </div>

          {/* Cloud / Action Status Banner */}
          {cloudStatusBanner && (
            <div className="bg-[#111827] border border-[#00ff87]/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-slate-200">
              <span>{cloudStatusBanner}</span>
              <button
                type="button"
                onClick={() => setCloudStatusBanner(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Smart-Routed Strategic Output Drawer (Showing Tier, Latency in ms, and Reason) */}
          {strategyOutput && (
            <div className="bg-[#111827] border border-amber-400/50 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">{strategyOutput.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    Anchored: {strategyOutput.t0Stamp}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStrategyOutput(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {strategyOutput.telemetry && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-[#00ff87] flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {strategyOutput.telemetry.tierLabel} · Latency:{' '}
                    <strong>{strategyOutput.telemetry.latencyMs}ms</strong>
                  </span>
                  <span className="text-slate-300 font-sans">
                    {strategyOutput.telemetry.routingReason}
                  </span>
                </div>
              )}

              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {strategyOutput.text}
              </div>
            </div>
          )}

          {/* TAB 1: MY XBOX SERIES S CLUB (ZERO-GUESSING BLANK STATE + ONBOARDING) */}
          {activeTab === 'CLUB_SYNC' && (
            <div className="space-y-6">
              {/* Top KPI Bar (Max 4 cards in a row; unpopulated fields display strictly as '—') */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Xbox Series S Coin Balance</span>
                    <Coins className="w-4 h-4 text-[#00ff87]" />
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#00ff87]">
                    {coins !== null ? coins.toLocaleString() : '—'}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    FC Points: <strong>{fifaPoints !== null ? fifaPoints.toLocaleString() : '—'}</strong> · Club:{' '}
                    <strong>{clubName ?? '—'}</strong>
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Rivals Division & Daily SP</span>
                    <span className="font-mono text-amber-400">Cap: 850 SP</span>
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white">
                    {rivalsDivision ?? '—'}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Daily SP: <strong>{dailySp !== null ? `${dailySp} / 850 SP` : '— (Blank)'}</strong>
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>FUT Gallery Level (FC 27)</span>
                    <Award className="w-4 h-4 text-[#00ff87]" />
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white">
                    {galleryLevel !== null ? `Level ${galleryLevel}` : '—'}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Registered Flips: <strong>{Object.keys(registeredRentIds).length}</strong>
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>My Synced Club & Dup Storage</span>
                    <Layers className="w-4 h-4 text-[#00ff87]" />
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white">
                    {ownedPlayersList.length + customClubPlayers.length} Owned
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Dup Storage: <strong>{duplicateStorageList.length} Cards</strong> · Chem:{' '}
                    <strong>{squadChemistry ? `${squadChemistry.totalChemistry}/33` : '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Frictionless Club Sync & Partial Entry Banner */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-[#00ff87] font-semibold">
                    Zero-Hallucination Xbox Series S Club Profile (Confirmed: {coins !== null ? `${coins.toLocaleString()} Coins` : '—'})
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    All Unknown Personal Club Fields Remain Strictly Blank (—) Until You Provide Them
                  </h2>
                  <p className="text-xs text-slate-400">
                    We never guess your Gallery Level, FIFA Points, Rivals Division, or Owned Cards. Click below to fill in only what you want or sync via Web App JSON / Google Drive.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowLaunchSyncModal(true)}
                    className="px-3.5 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Open Xbox Club Sync Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBackupToFirestoreAndDrive}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px] disabled:opacity-50"
                  >
                    <Cloud className="w-4 h-4 text-[#00ff87]" />
                    <span>{isSyncingCloud ? 'Syncing...' : 'Save Blank-Safe State to Cloud'}</span>
                  </button>
                </div>
              </div>

              {/* My Owned Cards vs. FC 27 Xbox Series S Reference Catalog */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: My Personal Xbox Series S Club Inventory (Starts at 0 Cards) */}
                <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <div className="text-xs text-[#00ff87] font-semibold">
                      Personal Club Inventory (Zero Assumed Cards)
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Cards You Own & Custom FC 27 Xbox Verifier
                    </h3>
                  </div>

                  {/* Add Custom Owned Card with Live FC 27 Xbox Series S Verification */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCustomPlayerName}
                      onChange={(e) => setNewCustomPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomClubPlayer();
                      }}
                      placeholder="Add a player you own (unverified stats stay —)..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#00ff87] min-h-[38px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomClubPlayer}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[38px]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#00ff87]" />
                      <span>Add Card</span>
                    </button>
                  </div>

                  {ownedPlayersList.length === 0 &&
                  duplicateStorageList.length === 0 &&
                  customClubPlayers.length === 0 ? (
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-6 text-center space-y-2">
                      <div className="text-sm font-bold text-white">
                        Owned Cards: — (0 Cards Synced)
                      </div>
                      <p className="text-xs text-slate-400">
                        No cards are assumed or pre-filled in your club. Add a card above, import your Companion Web App JSON, or mark cards from the FC 27 Xbox Series S Catalog on the right.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {customClubPlayers.map((cp) => (
                        <div
                          key={cp.id}
                          className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-white text-sm">{cp.name}</span>
                              <div className="font-mono text-[11px] text-slate-400">
                                OVR: {cp.rating ?? '— (Blank)'} · 26–27 Club: {cp.club2627 ?? '— (Blank)'} · Xbox Price:{' '}
                                {cp.xboxSeriesSPrice !== null ? cp.xboxSeriesSPrice.toLocaleString() : '— (Blank)'}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={cp.isVerifying}
                              onClick={() => handleVerifyCustomPlayer(cp.id, cp.name)}
                              className="px-2.5 py-1.5 bg-[#00ff87] text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 whitespace-nowrap shrink-0"
                            >
                              <Search className="w-3 h-3" />
                              <span>{cp.isVerifying ? 'Verifying...' : 'Verify FC 27 Xbox'}</span>
                            </button>
                          </div>
                          {cp.verifiedReport && (
                            <div className="bg-slate-950 border border-slate-800 rounded p-2 text-[11px] text-slate-200 whitespace-pre-wrap">
                              {cp.verifiedReport}
                            </div>
                          )}
                        </div>
                      ))}

                      {[...ownedPlayersList, ...duplicateStorageList].map((p) => (
                        <div
                          key={p.id}
                          className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">
                              {p.rating} {p.name} ({p.club})
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {p.rarity} · Score: {p.effectiveItemScore} ({p.holographicMultiplier}x)
                            </div>
                          </div>
                          <span className="font-mono text-[11px] text-[#00ff87]">
                            {p.inDuplicateStorage ? 'In Dup Storage' : 'In My Club'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Google Drive Backups List (if signed in) */}
                  {driveFiles.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-slate-300">
                        Google Drive Xbox Series S Snapshots ({driveFiles.length})
                      </div>
                      {driveFiles.slice(0, 3).map((file) => (
                        <div
                          key={file.id}
                          className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="truncate">
                            <div className="font-mono text-white truncate">{file.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(file.modifiedTime).toLocaleString('en-GB')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteDriveFile(file)}
                            className="p-1.5 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                            title="Delete Drive Backup (Requires Confirmation)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: FC 27 Xbox Series S Reference Catalog (Strictly separated from owned club cards) */}
                <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-400">
                        FC 27 Xbox Series S Verified Reference Database (2026/27 FotMob Grounded)
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        Xbox Series S Market Catalog (Toggle Only Cards You Actually Own)
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-[#00ff87]">
                      Your Budget: {coins !== null ? `${coins.toLocaleString()} Coins` : '—'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2.5 pr-3 font-semibold">FC 27 Player (26–27 Club)</th>
                          <th className="py-2.5 px-2 font-semibold">Rarity & Score</th>
                          <th className="py-2.5 px-2 font-semibold">Xbox Series S Price</th>
                          <th className="py-2.5 pl-2 font-semibold text-right">Mark Ownership</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {players.map((p) => {
                          const affordable = coins !== null && p.consolePrice <= coins;
                          return (
                            <tr key={p.id} className="hover:bg-slate-900/50">
                              <td className="py-2.5 pr-3">
                                <div className="font-bold text-white">
                                  {p.rating} {p.name} ({p.position})
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {p.club} · {p.league} · Verified {p.seasonVerified}
                                </div>
                              </td>
                              <td className="py-2.5 px-2">
                                <span
                                  className={`font-semibold ${
                                    p.holographicMultiplier === 1.5
                                      ? 'text-[#00ff87]'
                                      : p.holographicMultiplier === 1.25
                                      ? 'text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  {p.rarity}
                                </span>
                                <div className="text-[11px] font-mono text-slate-400">
                                  {p.effectiveItemScore} pts ({p.holographicMultiplier}x)
                                </div>
                              </td>
                              <td className="py-2.5 px-2 font-mono tabular-nums">
                                <div className={affordable ? 'text-[#00ff87] font-bold' : 'text-slate-300'}>
                                  {p.consolePrice.toLocaleString()}
                                </div>
                                {affordable && (
                                  <div className="text-[10px] text-[#00ff87]">Fits 35k Budget</div>
                                )}
                              </td>
                              <td className="py-2.5 pl-2 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPlayers((prev) =>
                                        prev.map((item) =>
                                          item.id === p.id
                                            ? {
                                                ...item,
                                                inClubInventory: !item.inClubInventory,
                                                inDuplicateStorage: false,
                                              }
                                            : item
                                        )
                                      )
                                    }
                                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                      p.inClubInventory && !p.inDuplicateStorage
                                        ? 'bg-[#00ff87] text-slate-950 font-bold'
                                        : 'bg-slate-900 border border-slate-700 text-slate-300'
                                    }`}
                                  >
                                    {p.inClubInventory && !p.inDuplicateStorage ? 'Owned' : '+ Club'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPlayers((prev) =>
                                        prev.map((item) =>
                                          item.id === p.id
                                            ? {
                                                ...item,
                                                inDuplicateStorage: !item.inDuplicateStorage,
                                                inClubInventory: !item.inDuplicateStorage,
                                              }
                                            : item
                                        )
                                      )
                                    }
                                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                      p.inDuplicateStorage
                                        ? 'bg-amber-400 text-slate-950 font-bold'
                                        : 'bg-slate-900 border border-slate-700 text-slate-400'
                                    }`}
                                  >
                                    {p.inDuplicateStorage ? 'In Dup' : '+ Dup'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DUAL-MODE SBC SOLVER (CALIBRATED TO 35,000 XBOX SERIES S COINS & ZERO ASSUMED CARDS) */}
          {activeTab === 'DUAL_SBCS' && (
            <div className="space-y-6">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#00ff87] font-semibold">
                    Tier 0 (&lt;2ms Deterministic Math) + Tier 3 (Gemini 4 Argon HIGH Verification)
                  </div>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    Xbox Series S Dual-Mode SBC Solver (35,000 Coin Budget Aware)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Assumes <strong>0 owned cards</strong> unless you explicitly marked them in your club. Calculates exact Xbox Series S market cost using Regular (1.25x) & Pristine (1.50x) Holographic multipliers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isThinkingAdvisor}
                    onClick={() =>
                      handleRunSmartAdvisor(
                        `Xbox Series S SBC Plan: ${activeSbc.title}`,
                        `Solve ${activeSbc.title} (${activeSbc.category}) strictly for the Xbox Series S market. My current Coin balance is ${
                          coins !== null ? `${coins.toLocaleString()} Coins` : 'BLANK'
                        }. Do NOT assume I own any cards that are not listed in my clubContext. Tell me whether this SBC fits my 35,000 Coin budget and give the exact cheapest Holographic/Base combination.`
                      )
                    }
                    className="px-4 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px] disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isThinkingAdvisor ? 'Routing to Argon HIGH...' : 'Analyze SBC (Smart Router)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Active SBC Selector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FC27_ACTIVE_SBCS.map((sbc) => {
                  const selected = sbc.id === selectedSbcId;
                  const fitsBudget = coins !== null && sbc.estimatedMarketCost <= coins;
                  return (
                    <button
                      key={sbc.id}
                      type="button"
                      onClick={() => setSelectedSbcId(sbc.id)}
                      className={`text-left p-4 rounded-xl border transition-colors space-y-2 ${
                        selected
                          ? 'bg-[#111827] border-[#00ff87]'
                          : 'bg-[#111827]/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#00ff87]">{sbc.category}</span>
                        <span className={fitsBudget ? 'font-mono text-[#00ff87]' : 'font-mono text-amber-400'}>
                          {fitsBudget ? 'Fits 35k Budget' : 'Needs Fodder / >35k'}
                        </span>
                      </div>
                      <div className="text-base font-bold text-white">{sbc.title}</div>
                      <div className="text-xs text-slate-400">{sbc.rewardDescription}</div>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">
                          {sbc.mode === 'STREAMLINED'
                            ? `Target Score: ${sbc.targetItemScore}`
                            : `Min Rating: ${sbc.minSquadRating}`}
                        </span>
                        <span className="text-white">
                          Xbox Est: {sbc.estimatedMarketCost.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Deterministic Solution Output */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs text-[#00ff87] font-mono">
                      Tier 0 Local Deterministic Engine · Solved in {streamlinedSolution.executionTimeMs}ms · $0.00 Token Cost
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Optimal Xbox Series S Submission Recipe for {activeSbc.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-6 font-mono tabular-nums">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Cumulative Item Score</div>
                      <div className="text-xl font-bold text-[#00ff87]">
                        {streamlinedSolution.finalCumulativeScore} / {streamlinedSolution.targetScore}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Your Xbox Coins</div>
                      <div className="text-xl font-bold text-amber-400">
                        {coins !== null ? coins.toLocaleString() : '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Net Xbox Market Cost</div>
                      <div
                        className={`text-xl font-bold ${
                          coins !== null && streamlinedSolution.totalCoinsSpent <= coins
                            ? 'text-[#00ff87]'
                            : 'text-red-400'
                        }`}
                      >
                        {streamlinedSolution.totalCoinsSpent.toLocaleString()} Coins
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 pr-3 font-semibold">Step & Source</th>
                        <th className="py-2 px-3 font-semibold">Card & Rating</th>
                        <th className="py-2 px-3 font-semibold">Rarity & Multiplier</th>
                        <th className="py-2 px-3 font-semibold">Score Added</th>
                        <th className="py-2 pl-3 font-semibold text-right">Xbox Series S Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                      {streamlinedSolution.steps.map((step, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 pr-3 text-slate-300">
                            #{idx + 1} · {step.source}
                          </td>
                          <td className="py-2.5 px-3 font-sans font-bold text-white">
                            {step.rating} OVR {step.playerName}
                          </td>
                          <td className="py-2.5 px-3 text-[#00ff87]">
                            {step.rarity} ({step.holographicMultiplier}x)
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white">
                            +{step.effectiveScoreAdded} pts
                          </td>
                          <td className="py-2.5 pl-3 text-right text-amber-400">
                            {step.coinCost === 0
                              ? '0 Coins (Synced Club)'
                              : `${step.coinCost.toLocaleString()} Coins`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTHENTIC FUT GALLERY SET, TAG & "RENT-AND-FLIP" OPTIMIZER (<=35,000 COINS) */}
          {activeTab === 'FUT_GALLERY' && (
            <div className="space-y-6">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#00ff87] font-semibold">
                    Authentic EA Sports FC 27 FUT Gallery System · All Candidates Fit Your 35,000 Xbox Coin Budget
                  </div>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    FUT Gallery Set Tracker & Discard-Floor "Rent-and-Flip" Optimizer
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Your personal Gallery Level starts strictly blank (<strong>{galleryLevel !== null ? `Lv.${galleryLevel}` : '—'}</strong>) until you set it. With <strong>35,000 Coins</strong> on Xbox Series S, you can buy any of the ~10.5k Regular Holographic cards below near Quick Sell floor, register the permanent Gallery Set points, and flip for net profit after 5% EA Tax.
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="text-xs text-slate-400">Your Gallery Level</div>
                  <div className="text-2xl font-bold text-[#00ff87]">
                    {galleryLevel !== null ? `Level ${galleryLevel}` : '— (Blank)'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {FC27_GALLERY_SETS.map((set) => (
                  <div
                    key={set.id}
                    className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-xs text-[#00ff87] font-semibold">{set.category}</div>
                        <h3 className="text-base font-bold text-white mt-0.5">{set.setName}</h3>
                        <div className="text-xs text-slate-400 mt-1">{set.xpAndPackReward}</div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="text-xs text-slate-400">Your Set Progress</div>
                        <div className="text-sm font-bold text-white">
                          — / {set.totalCardsInSet} Cards
                        </div>
                      </div>
                    </div>

                    {/* Rent-and-Flip Discard Floor Candidates (All ~10.5k, fitting 35k budget!) */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-slate-300">
                        Xbox Series S "Rent-and-Flip" Candidates (All &le; 11,000 Coins — Fits Your 35k Budget):
                      </div>
                      {set.rentAndFlipCandidates.map((cand) => {
                        const isDone = Boolean(registeredRentIds[cand.playerId]);
                        return (
                          <div
                            key={cand.playerId}
                            className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 text-xs">
                              <div className="font-bold text-white text-sm">
                                {cand.rating} {cand.playerName}
                              </div>
                              <div className="font-mono text-slate-300">
                                Xbox Buy: <strong>{cand.consoleBuyPrice.toLocaleString()}</strong> (Discard Floor:{' '}
                                {cand.quickSellFloor.toLocaleString()}) → Resell:{' '}
                                <strong>{cand.recommendedResellPrice.toLocaleString()}</strong>
                              </div>
                              <div className="font-mono text-[#00ff87]">
                                5% Tax: -{cand.eaTax5Pct} · Net Profit: +{cand.netCoinDelta} Coins · +{cand.galleryPointsGained} Gallery Pts
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isDone}
                              onClick={() =>
                                handleExecuteRentAndFlip(
                                  cand.playerId,
                                  cand.playerName,
                                  cand.netCoinDelta,
                                  cand.galleryPointsGained
                                )
                              }
                              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                                isDone
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-[#00ff87] hover:bg-[#00e67a] text-slate-950'
                              }`}
                            >
                              {isDone ? 'Logged in Gallery' : 'Rent, Register & Flip'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: XBOX SERIES S CONSOLE MARKET, INTERACTIVE CHARTS & 5G INVESTMENTS */}
          {activeTab === 'CONSOLE_MARKET' && (
            <div className="space-y-6">
              {/* Player Selector Bar for Interactive Chart (Defaults to <=35,000 Coin Xbox targets) */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Xbox Series S Players:
                  </span>
                  {filteredMarketPlayers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedMarketPlayerId(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                        selectedMarketPlayer.id === p.id
                          ? 'bg-[#00ff87] text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {p.rating} {p.name} ({p.consolePrice.toLocaleString()})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                  {[
                    { id: 'UNDER_35K', label: 'Fits My 35k Budget (≤35,000)' },
                    { id: 'HOLOGRAPHIC', label: 'All Holographics' },
                    { id: 'ALL', label: 'All Xbox Catalog' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMarketFilter5G(f.id as any)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        marketFilter5G === f.id
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive SVG Price Chart + 5% EA Tax Calculator */}
              <InteractiveMarketChart
                player={selectedMarketPlayer}
                t0Formatted={t0Anchor.britishFullFormatted}
                isAnalyzingTrend={isThinkingAdvisor}
                onTrackInvestment={(player, buyPrice, targetSell) => {
                  setTrackedInvestments((prev) => [
                    {
                      id: `inv-${Date.now()}`,
                      playerName: `${player.name} (${player.rarity})`,
                      rating: player.rating,
                      rarity: player.rarity,
                      buyPrice,
                      targetSellPrice: targetSell,
                      quantity: 1,
                    },
                    ...prev,
                  ]);
                  setCloudStatusBanner(
                    `Logged ${player.name} (Xbox Buy: ${buyPrice.toLocaleString()} → Target: ${targetSell.toLocaleString()}) to your 5G Investment Ledger.`
                  );
                }}
                onAskGeminiTrend={(player) =>
                  handleRunSmartAdvisor(
                    `Xbox Series S Market Forecast: ${player.name}`,
                    `Analyze the 24H hourly and 7D Xbox Series S price trajectory for ${player.rating} OVR ${player.name} (${player.club}, ${player.rarity}, Xbox Buy-Now ${player.consolePrice} coins, Quick Sell floor ${player.quickSellDiscard} coins). My current Xbox Series S Coin balance is ${
                      coins !== null ? `${coins.toLocaleString()} Coins` : 'BLANK'
                    }. Provide a 5G-friendly mass-bidding entry price, exact break-even after 5% EA tax, and whether I can flip this card within my 35,000 Coin budget.`
                  )
                }
              />

              {/* Cheapest by Rating + Holographic Arbitrage Table & Blank-Start 5G Investment Ledger */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <div className="text-xs text-[#00ff87] font-semibold">
                      FUTBIN FC 27 Xbox Series S Fodder & Holographic Multiplier Matrix
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Cheapest by Rating & Holographic Arbitrage (83–88 All Fit Your 35k Budget)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 pr-2 font-semibold">OVR</th>
                          <th className="py-2 px-2 font-semibold">Base Gold (Score)</th>
                          <th className="py-2 px-2 font-semibold">Holographic (Score)</th>
                          <th className="py-2 px-2 font-semibold">Coins/Pt (Base vs Holo)</th>
                          <th className="py-2 pl-2 font-semibold">Xbox Series S Arbitrage Verdict</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                        {FC27_CHEAPEST_BY_RATING.map((tier) => {
                          const holoWins =
                            tier.coinsPerScoreHolographic < tier.coinsPerScoreStandard;
                          return (
                            <tr key={tier.rating}>
                              <td className="py-2.5 pr-2 font-bold text-white">{tier.rating}</td>
                              <td className="py-2.5 px-2 text-slate-300">
                                {tier.cheapestStandardGoldPrice.toLocaleString()} ({tier.standardItemScore} pts)
                              </td>
                              <td className="py-2.5 px-2 text-[#00ff87]">
                                {tier.cheapestHolographicPrice.toLocaleString()} ({tier.holographicItemScore} pts)
                              </td>
                              <td className="py-2.5 px-2">
                                <span className="text-slate-400">{tier.coinsPerScoreStandard}</span> vs{' '}
                                <strong className={holoWins ? 'text-[#00ff87]' : 'text-amber-400'}>
                                  {tier.coinsPerScoreHolographic}
                                </strong>
                              </td>
                              <td className="py-2.5 pl-2 font-sans text-slate-300">
                                {tier.arbitrageVerdict}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: 5G Connection-Aware Investment Ledger (Starts Empty — Zero Guessed Flips) */}
                <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <div className="text-xs text-amber-400 font-semibold">
                      Personal Xbox Series S 5G Trade Ledger (Zero Pre-Filled Trades)
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Your Active Bid-Flipping Positions (5% Tax Enforced)
                    </h3>
                  </div>

                  {trackedInvestments.length === 0 ? (
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-6 text-center space-y-2">
                      <div className="text-sm font-bold text-white">
                        Active Investments: — (0 Trades Logged)
                      </div>
                      <p className="text-xs text-slate-400">
                        We never pre-populate fake investments. Use the <strong>Track Flip & Price Alert</strong> button on the chart above to log a real Xbox Series S flip within your {coins !== null ? `${coins.toLocaleString()} Coin` : ''} budget.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trackedInvestments.map((inv) => {
                        const metrics = calculateEaTaxMetrics(inv.buyPrice, inv.targetSellPrice);
                        const totalNet = metrics.netProfit * inv.quantity;
                        return (
                          <div
                            key={inv.id}
                            className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-sm">
                                {inv.rating} {inv.playerName} (x{inv.quantity})
                              </span>
                              <span className="font-mono font-bold text-[#00ff87]">
                                +{totalNet.toLocaleString()} Net Coins
                              </span>
                            </div>
                            <div className="font-mono text-slate-300">
                              Xbox Buy: {inv.buyPrice.toLocaleString()} · Break-Even:{' '}
                              {metrics.breakEvenSalePrice.toLocaleString()} · Target:{' '}
                              {inv.targetSellPrice.toLocaleString()}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              5% EA Tax per card: -{metrics.eaTax.toLocaleString()} Coins · ROI: {metrics.roiPct}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOMAIN 2 — GAMEPLAY SYNTHESIS LAB, 31 ROLES++ & BRANCHING EVOLUTIONS */}
          {activeTab === 'GAMEPLAY_LAB' && (
            <GameplaySynthesisView
              t0Anchor={t0Anchor}
              players={players}
              isThinking={isThinkingAdvisor}
              onRunHighThinkingGameplay={handleRunSmartAdvisor}
            />
          )}

          {/* TAB 6: 5-TIER SMART ROUTER, ANTIGRAVITY v2.25 GenUI SKILL & VOICE SYNC */}
          {activeTab === 'ANTIGRAVITY_AI' && (
            <AntigravityMcpAndChatDrawer
              t0Anchor={t0Anchor}
              clubContextForAi={clubContextForAi}
              onVoiceClubCommand={handleVoiceClubCommand}
            />
          )}
        </main>
      </div>

      {/* ASUS ZENBOOK UX482 SCREENPAD PLUS SECONDARY TICKER BAR (12.6" 1920x515 Companion Strip) */}
      {screenPadTickerOpen && (
        <div className="hidden lg:block fixed bottom-0 inset-x-0 z-20 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800 px-6 py-2">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 text-xs font-mono tabular-nums">
            <div className="flex items-center gap-2 text-[#00ff87] shrink-0">
              <Monitor className="w-3.5 h-3.5" />
              <span className="font-bold">ZenBook ScreenPad+ (Xbox Series S · 35k Filter)</span>
            </div>
            <div className="flex items-center gap-5 overflow-x-auto text-slate-300">
              <span>
                My Xbox Coins: <strong className="text-[#00ff87]">{coins !== null ? coins.toLocaleString() : '—'}</strong>
              </span>
              <span>
                86 Regular Holo Fodder (238 Score): <strong className="text-[#00ff87]">10,900</strong> (Fits 35k!)
              </span>
              <span>
                88 Pristine Holo Fodder (465 Score): <strong className="text-amber-400">27,500</strong> (Fits 35k!)
              </span>
              <span>
                83 Alejandro Balde (FC Barcelona Evo): <strong className="text-[#00ff87]">8,400</strong> (Fits 35k!)
              </span>
            </div>
            <div className="text-slate-400 shrink-0">
              Patch: <strong className="text-white">{t0Anchor.fc27PatchState.titleUpdateVersion}</strong>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE THUMB-FRIENDLY BOTTOM NAVIGATION BAR (375px–430px Viewport Budget <=15%) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 grid grid-cols-6 gap-1">
        {[
          { id: 'CLUB_SYNC', label: 'My Club', icon: Shield },
          { id: 'DUAL_SBCS', label: 'SBCs', icon: Layers },
          { id: 'FUT_GALLERY', label: 'Gallery', icon: Award },
          { id: 'CONSOLE_MARKET', label: 'Xbox Mkt', icon: TrendingUp },
          { id: 'GAMEPLAY_LAB', label: 'Gameplay', icon: Zap },
          { id: 'ANTIGRAVITY_AI', label: 'Router/AI', icon: Cpu },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id as ActiveTab);
                if (item.id === 'GAMEPLAY_LAB') setPrincipalDomain('GAMEPLAY');
                else if (item.id !== 'ANTIGRAVITY_AI') setPrincipalDomain('MENUS');
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold transition-colors min-h-[44px] ${
                active ? 'text-[#00ff87] bg-[#00ff87]/10' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL 1: IMMEDIATE LAUNCH XBOX SERIES S CLUB SYNC MODAL (ZERO-GUESSING ONBOARDING) */}
      {showLaunchSyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-mono text-[#00ff87]">
                  Xbox Series S Console Market Only · Zero-Guessing Club Policy
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Sync Your EA Sports FC 27 Ultimate Team Profile
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your confirmed <strong>35,000 Coins</strong> is set. Any field you leave empty below will remain strictly <strong>blank (—)</strong>—we never guess your Gallery Level, FIFA Points, Rivals Division, or Owned Cards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLaunchSyncModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Onboarding Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'MANUAL_VOICE', label: '1. Manual / Voice Mic' },
                { id: 'WEB_APP_JSON', label: '2. Web App / Paletools JSON' },
                { id: 'BROWSER_MCP', label: '3. Antigravity /browser MCP' },
                { id: 'CLOUD_RESTORE', label: '4. Firestore / Google Drive' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSyncModalTab(t.id as any)}
                  className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors truncate min-h-[38px] ${
                    syncModalTab === t.id
                      ? 'bg-[#00ff87] text-slate-950 border-[#00ff87] font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Manual Partial Inputs & Voice Dictation */}
            {syncModalTab === 'MANUAL_VOICE' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">
                      Xbox Series S Coins (Confirmed: 35,000)
                    </label>
                    <input
                      type="number"
                      value={draftCoins}
                      onChange={(e) => setDraftCoins(e.target.value)}
                      placeholder="Leave empty to keep blank (—)"
                      className="w-full px-3 py-2 bg-slate-900 border border-[#00ff87]/60 rounded-lg font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Rivals Division (Optional — Leave empty for —)
                    </label>
                    <input
                      type="text"
                      value={draftRivalsDivision}
                      onChange={(e) => setDraftRivalsDivision(e.target.value)}
                      placeholder="— (Blank — Not Provided)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      FUT Gallery Level (Optional — Leave empty for —)
                    </label>
                    <input
                      type="number"
                      value={draftGalleryLevel}
                      onChange={(e) => setDraftGalleryLevel(e.target.value)}
                      placeholder="— (Blank — Not Provided)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      FIFA / FC Points (Optional — Leave empty for —)
                    </label>
                    <input
                      type="number"
                      value={draftFifaPoints}
                      onChange={(e) => setDraftFifaPoints(e.target.value)}
                      placeholder="— (Blank — Not Provided)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Daily SP Earned Today (Optional — Max 850)
                    </label>
                    <input
                      type="number"
                      value={draftDailySp}
                      onChange={(e) => setDraftDailySp(e.target.value)}
                      placeholder="— (Blank — Not Provided)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Club Name (Optional — Leave empty for —)
                    </label>
                    <input
                      type="text"
                      value={draftClubName}
                      onChange={(e) => setDraftClubName(e.target.value)}
                      placeholder="— (Blank — Not Provided)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-300">
                    Hands-Free Voice Dictation (<strong>gemini-3.5-transcribe</strong>):
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSyncModalVoice}
                    className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 ${
                      isRecordingSyncVoice
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    {isRecordingSyncVoice ? (
                      <Square className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-[#00ff87]" />
                    )}
                    <span>
                      {isRecordingSyncVoice
                        ? 'Stop Recording'
                        : isTranscribingSyncVoice
                        ? 'Transcribing...'
                        : 'Dictate Club Info'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Companion Web App / Paletools JSON Paste */}
            {syncModalTab === 'WEB_APP_JSON' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Paste your exported EA FC 27 Companion Web App / Paletools JSON below. Only keys present in your JSON will be updated; all other fields stay strictly blank (—).
                </p>
                <textarea
                  rows={5}
                  value={jsonImportText}
                  onChange={(e) => setJsonImportText(e.target.value)}
                  placeholder='{"coins": 35000}'
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00ff87]"
                />
                <button
                  type="button"
                  onClick={handleApplyJsonImport}
                  className="px-4 py-2 bg-[#00ff87] text-slate-950 font-bold text-xs rounded-lg"
                >
                  Parse & Apply JSON
                </button>
              </div>
            )}

            {/* Tab 3: Antigravity v2.25 /browser MCP Live DOM Inspection */}
            {syncModalTab === 'BROWSER_MCP' && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5 text-xs">
                <div className="font-bold text-[#00ff87]">
                  Antigravity v2.25 Native /browser + Chrome DevTools MCP Bridge
                </div>
                <p className="text-slate-300 leading-relaxed">
                  To inspect your live EA Sports FC 27 Companion Web App tab directly from Antigravity 2.25 Desktop App without manual typing or screenshots, run:
                </p>
                <pre className="bg-slate-900 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-amber-300 overflow-x-auto">
                  /browser --attach-devtools-mcp --port 9222 --extract-fc27-xbox-club
                </pre>
                <p className="text-slate-400">
                  Any attribute not visible in the current DOM snapshot remains strictly blank (—).
                </p>
              </div>
            )}

            {/* Tab 4: Cloud Restore (Firestore & Google Drive) */}
            {syncModalTab === 'CLOUD_RESTORE' && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 text-xs">
                <div className="font-bold text-white">
                  Restore from Firestore (ai-studio-fc27utapp-2a7c5f08-d758-4a0e-bf87-d352fd259607) & Google Drive
                </div>
                <p className="text-slate-400">
                  Sign in with Google to restore your saved Xbox Series S profile and list your Google Drive snapshots.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 bg-[#00ff87] text-slate-950 font-bold rounded-lg"
                >
                  {currentUser ? 'Refresh Cloud State' : 'Sign in with Google & Restore'}
                </button>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLaunchSyncModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg"
              >
                Continue with 35,000 Coins (Keep Others Blank —)
              </button>
              <button
                type="button"
                onClick={handleApplyPartialClubSync}
                className="px-4 py-2 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg"
              >
                Save Entered Fields (Leave Empty Boxes Blank)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Mandatory Confirmation Modal Before Deleting Google Drive Snapshot */}
      {pendingDeleteDriveFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-red-500/40 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">
                Confirm Google Drive Snapshot Deletion
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="font-mono text-white">{pendingDeleteDriveFile.name}</strong> from your Google Drive?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteDriveFile(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDriveFile}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
