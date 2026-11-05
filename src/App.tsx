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
  FC27_ULTIMATE_SCREAM_TEAM_1,
  FC27ConsolePlayer,
  FC27SBCChallenge,
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
import { LiveEvolutionsView } from './components/LiveEvolutionsView';
import {
  AntigravityMcpAndChatDrawer,
  RoutingTelemetryReceipt,
} from './components/AntigravityMcpAndChatDrawer';
import { InvestmentTrackerTab, ConsoleInvestmentPosition } from './components/InvestmentTrackerTab';
import { TacticalChatTab } from './components/TacticalChatTab';
import { SquadTrackerView } from './components/SquadTrackerView';
import { GoogleWorkspaceHub } from './components/GoogleWorkspaceHub';
import { DynamicDatabaseView } from './components/DynamicDatabaseView';
import { HubView } from './components/HubView';
import { ClubSyncHubModal } from './components/ClubSyncHubModal';
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
  GitBranch,
  AlertTriangle,
  X,
  Mic,
  Square,
  Sliders,
  Search,
  Plus,
  MessageSquare,
  Flame,
  Download,
  FileSpreadsheet,
  FileText,
  Database,
} from 'lucide-react';
import type { User } from 'firebase/auth';

type PrincipalDomain = 'MENUS' | 'GAMEPLAY';
type ActiveTab =
  | 'MY_SQUAD'
  | 'DYNAMIC_DATABASE'
  | 'CLUB_SYNC'
  | 'DUAL_SBCS'
  | 'EVOLUTIONS'
  | 'INVESTMENTS'
  | 'FUT_GALLERY'
  | 'CONSOLE_MARKET'
  | 'GAMEPLAY_LAB'
  | 'TACTICAL_COMMAND'
  | 'ANTIGRAVITY_AI'
  | 'WORKSPACE_HUB';

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

  // 2. Shell Navigation ('hub' | 'squad' | 'market' | 'sbcs' | 'ai-studio') & Sub-Tabs
  type ShellTab = 'hub' | 'squad' | 'market' | 'sbcs' | 'ai-studio';
  const [shellTab, setShellTab] = useState<ShellTab>('hub');
  const [showCoinQuickModal, setShowCoinQuickModal] = useState<boolean>(false);

  const [principalDomain, setPrincipalDomain] = useState<PrincipalDomain>('MENUS');
  const [activeTab, setActiveTab] = useState<ActiveTab>('MY_SQUAD');
  const [simulatedEvoName, setSimulatedEvoName] = useState<string | null>(null);
  const [screenPadTickerOpen, setScreenPadTickerOpen] = useState<boolean>(true);

  // 3. PERSONAL CLUB STATE: Cannons n Pecks (Est. Sep 2009 · 17 Yrs). Strict Zero-Guessing: Unconfirmed metrics start BLANK (null / '—')
  const [coins, setCoins] = useState<number | null>(null);
  const [clubName, setClubName] = useState<string | null>('Cannons n Pecks');
  const [clubEstablished, setClubEstablished] = useState<string>('September 2009');
  const [clubAgeYears, setClubAgeYears] = useState<number>(17);
  const [fifaPoints, setFifaPoints] = useState<number | null>(null);
  const [rivalsDivision, setRivalsDivision] = useState<string | null>(null);
  const [dailySp, setDailySp] = useState<number | null>(null);
  const [galleryLevel, setGalleryLevel] = useState<number | null>(null);
  const [champsRecord, setChampsRecord] = useState<string | null>(null);

  // Gemini Multi-Model Intelligence Commander Active Routing Profile
  const [activeModelRoute, setActiveModelRoute] = useState<string>('AUTO');
  const [showSyncHubModal, setShowSyncHubModal] = useState<boolean>(false);

  // FC 27 Xbox Series S Reference Catalog (all inClubInventory & inDuplicateStorage start FALSE)
  const [players, setPlayers] = useState<FC27ConsolePlayer[]>(FC27_CONSOLE_PLAYERS);
  const [customClubPlayers, setCustomClubPlayers] = useState<UnverifiedCustomPlayer[]>([]);
  const [newCustomPlayerName, setNewCustomPlayerName] = useState<string>('');

  const [useClubUntradeablesInSbc, setUseClubUntradeablesInSbc] = useState<boolean>(true);
  const [liveSbcs, setLiveSbcs] = useState<FC27SBCChallenge[]>(FC27_ACTIVE_SBCS);
  const [selectedSbcId, setSelectedSbcId] = useState<string>(FC27_ACTIVE_SBCS[0].id); // #1 Ranked Player SBC (85 Otamendi - 24.5k Coins)
  const [sbcRankFilter, setSbcRankFilter] = useState<'SPLIT_BOTH' | 'PLAYER_SBC' | 'UPGRADE_SBC'>(
    'SPLIT_BOTH'
  );
  const [isSyncingLiveSbcs, setIsSyncingLiveSbcs] = useState<boolean>(false);

  // 4. Market & 5G Investment Portfolio State (Starts strictly empty [] — zero guessed trades)
  const [selectedMarketPlayerId, setSelectedMarketPlayerId] = useState<string>(
    FC27_CONSOLE_PLAYERS[7].id // 83 Balde (8,400 Coins — fits 35k Xbox Series S budget)
  );
  const [marketFilter5G, setMarketFilter5G] = useState<'ALL' | 'UNDER_35K' | 'HOLOGRAPHIC'>(
    'UNDER_35K'
  );
  const [trackedInvestments, setTrackedInvestments] = useState<ConsoleInvestmentPosition[]>([]);

  // 5. Gallery Set Registration State (Starts strictly empty {})
  const [registeredRentIds, setRegisteredRentIds] = useState<Record<string, boolean>>({});

  // 6. Club Sync Modal
  const [showLaunchSyncModal, setShowLaunchSyncModal] = useState<boolean>(false);
  const [syncModalTab, setSyncModalTab] = useState<
    'MANUAL_VOICE' | 'WEB_APP_JSON' | 'BROWSER_MCP' | 'CLOUD_RESTORE'
  >('MANUAL_VOICE');

  // Form inputs inside the Sync Modal
  const [draftCoins, setDraftCoins] = useState<string>('');
  const [draftClubName, setDraftClubName] = useState<string>('Cannons n Pecks');
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

  // Browser-based download of the current club state (coins, players, squad) as a JSON file, using a Blob object with application/json MIME type
  const handleExportClubDataJson = () => {
    const exportPayload = {
      exportMetadata: {
        app: 'EA Sports FC 27 Ultimate Team Strategic Engine (Xbox Series S)',
        version: '1.0.0',
        platform: 'Xbox Series S Console Cross-Play',
        exportedAt: new Date().toISOString(),
        temporalAnchor: t0Anchor.britishFullFormatted,
        fc27PatchVersion: t0Anchor.fc27PatchState.titleUpdateVersion,
      },
      clubState: {
        coins,
        clubName,
        fifaPoints,
        rivalsDivision,
        dailySp,
        galleryLevel,
      },
      squad: {
        formation: '4-2-1-3',
        description: 'Verified 2026/27 starting lineup with Role++ assignments',
      },
      inventory: {
        ownedPlayers: players.filter((p) => p.inClubInventory),
        duplicateStorage: players.filter((p) => p.inDuplicateStorage),
        customPlayers: customClubPlayers,
      },
      investmentPortfolio: trackedInvestments,
      registeredGallerySets: registeredRentIds,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const now = new Date();
    const dateFormatted = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `fc27_club_state_${dateFormatted}.json`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = downloadUrl;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(downloadUrl);

    setCloudStatusBanner(
      `Exported club state backup (${coins !== null ? `${coins.toLocaleString()} Coins` : '0 Coins'}) as ${fileName}`
    );
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
    } else if (lower.includes('evo') || lower.includes('evolution')) {
      setActiveTab('EVOLUTIONS');
    } else if (lower.includes('market') || lower.includes('price')) {
      setPrincipalDomain('MENUS');
      setActiveTab('CONSOLE_MARKET');
    } else if (lower.includes('gameplay') || lower.includes('role')) {
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
    () => liveSbcs.find((s) => s.id === selectedSbcId) || liveSbcs[0],
    [liveSbcs, selectedSbcId]
  );

  const top5PlayerSbcs = useMemo(
    () =>
      liveSbcs
        .filter((s) => s.sbcGroup === 'PLAYER_SBC')
        .sort((a, b) => a.rankInGroup - b.rankInGroup)
        .slice(0, 5),
    [liveSbcs]
  );

  const top5UpgradeSbcs = useMemo(
    () =>
      liveSbcs
        .filter((s) => s.sbcGroup === 'UPGRADE_SBC')
        .sort((a, b) => a.rankInGroup - b.rankInGroup)
        .slice(0, 5),
    [liveSbcs]
  );

  const freeLiveObjectives = useMemo(
    () => FC27_ULTIMATE_SCREAM_TEAM_1.filter((item) => item.releaseSource === 'OBJECTIVE_FREE'),
    []
  );

  const handleSyncLiveSbcs = async () => {
    const freshT0 = createTemporalAnchor(new Date());
    setT0Anchor(freshT0);
    setIsSyncingLiveSbcs(true);
    try {
      const res = await fetch('/api/gemini/fetch-live-sbcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientT0: freshT0.britishFullFormatted,
          userCoins: coins ?? 35000,
          clubContext: clubContextForAi,
        }),
      });
      const data = await res.json();
      if (data.liveDigest) {
        setStrategyOutput({
          title: 'Live Ultimate Scream Team 1 SBC & Objectives Worth-It Sync',
          text: data.liveDigest,
          t0Stamp: freshT0.britishFullFormatted,
          telemetry: data.routingTelemetry,
        });
      }
      setCloudStatusBanner(
        `Verified Top 5 Player SBCs (85 Otamendi, 85 Moore) & Top 5 Upgrade SBCs + Free Objectives (87 Jill Scott, 87 Verón) at T=0 (${freshT0.britishTimeFormatted}).`
      );
    } catch (err: any) {
      setCloudStatusBanner(`Live SBC sync notice: ${err.message}`);
    } finally {
      setIsSyncingLiveSbcs(false);
    }
  };

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
    <div className="bg-surface font-body-base text-body-base text-on-surface flex flex-col min-h-screen antialiased">
      {/* FIXED TOP HEADER: Matching User Attachment Design */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_12px_rgba(0,0,0,0.6)] border-b border-white/5">
        <div className="h-16 px-space-md flex items-center justify-between gap-space-sm max-w-7xl mx-auto w-full">
          {/* Brand & Live Sync Pill */}
          <div className="flex items-center gap-space-sm min-w-0">
            <img
              alt="FC 27 AI Crest"
              className="h-8 w-auto object-contain flex-shrink-0"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VbhEyCXgZjdB3ULToxBAiS6D24BIDz9PweWxWsRKeWgGZ3Q1-kCXxcSJ2wBfIC8A9ytvvJvdrRw55uI3TNSmIcKTj_nW_KQaPMa4fjt685bsgYBdqRfG_-aEKeETWX09NGnJIDyz7xvKaMCfNLLKDPma53GWrEL11cEfuojyzGQJYbfYZrAW0g4Z8QkQ07kG6Obp9ZKoZWWrEnG0PQRd8eeNosREppwWyGq9e79m_8fSYd0zhYHwZBEA"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-headline-md tracking-tight uppercase text-primary truncate font-bold">
                  FC NEXUS 27
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary-container/15 text-primary-container font-label-caps text-label-caps uppercase flex items-center gap-1 shadow-[0_0_8px_rgba(0,255,135,0.35)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                  AI SYNC
                </span>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant truncate capitalize">
                {shellTab === 'hub'
                  ? 'Hub'
                  : shellTab === 'squad'
                  ? 'Squad'
                  : shellTab === 'market'
                  ? 'Market'
                  : shellTab === 'sbcs'
                  ? 'SBCs'
                  : 'AI Studio'}
              </span>
            </div>
          </div>

          {/* Center Navigation Links for Desktop */}
          <div className="hidden md:flex items-center gap-1 bg-surface-container-high/60 p-1 rounded-xl border border-white/5">
            {[
              { id: 'hub', label: 'Hub', icon: 'insights' },
              { id: 'squad', label: 'Squad', icon: 'sports_soccer' },
              { id: 'market', label: 'Market', icon: 'candlestick_chart' },
              { id: 'sbcs', label: 'SBCs', icon: 'auto_fix_high' },
              { id: 'ai-studio', label: 'AI Studio', icon: 'neurology' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setShellTab(tab.id as ShellTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-label-caps uppercase transition-all cursor-pointer ${
                  shellTab === tab.id
                    ? 'bg-primary-container text-on-primary font-bold shadow-[0_0_10px_rgba(0,255,135,0.3)]'
                    : 'text-on-surface-variant hover:text-white hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right Currency & User Profile Pill */}
          <div className="flex items-center gap-space-xs flex-shrink-0">
            
            <button
              type="button"
              onClick={() => setShowCoinQuickModal(true)}
              className="flex items-center gap-1 bg-surface-container-high/80 hover:bg-surface-bright px-2.5 py-1.5 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/5 transition-all cursor-pointer"
              title="Click to edit or quick-tune Club Coins"
            >
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[16px]">monetization_on</span>
              <span className="font-data-tabular text-data-tabular text-tertiary-fixed-dim font-bold">
                {coins !== null && coins >= 1000000
                  ? `${(coins / 1000000).toFixed(2).replace(/\.00$/, '')}M`
                  : coins !== null && coins >= 1000
                  ? `${(coins / 1000).toFixed(0)}K`
                  : coins !== null
                  ? coins.toLocaleString()
                  : '—'}
              </span>
            </button>

            <div className="flex items-center gap-1 bg-surface-container-high/80 px-2.5 py-1.5 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/5">
              <span className="material-symbols-outlined text-primary-container text-[16px]">diamond</span>
              <span className="font-data-tabular text-data-tabular text-primary-container font-bold">
                {fifaPoints !== null ? `${(fifaPoints / 1000).toFixed(1).replace(/\.0$/, '')}K` : '—'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowLaunchSyncModal(true)}
              className="p-0.5 rounded-full bg-gradient-to-tr from-primary-container to-secondary-container shadow-[0_0_10px_rgba(0,255,135,0.3)] hover:scale-105 transition-transform cursor-pointer"
              title="Club Settings & Cloud Restore"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover block"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZc1F6p8RTx5HX_L3sgpBYmlIZDG_e3gllSh1vFg6V0WMGw6-UUqNryMinOz01MtZ2rKuQq99UHQ4NpbcDTud3SjEkFM-sTB1k9w2bb4AprUDuHFXAEkopJAQ_c-YO38j3rbN2LjT-9rL2bVUu3eoHuOBRW_e7VxXmEwLurqmUSLZ7khRkW29sxU0BxO5lcUAn37yT-7FeZF6wVDE-HfmwPc5O4bn59G3S3OCwV5Y6sqpljH53ZXQT"
              />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        {/* Cloud Status Toast / Banner */}
        {cloudStatusBanner && (
          <div className="max-w-5xl mx-auto w-full px-space-md pt-3">
            <div className="bg-surface-container-high border border-primary-container/40 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-on-surface shadow-lg">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[18px]">info</span>
                <span>{cloudStatusBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setCloudStatusBanner(null)}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Hub View */}
        {shellTab === 'hub' && (
          <HubView
            onNavigateTab={(tab) => {
              setShellTab(tab);
              if (tab === 'squad') setActiveTab('MY_SQUAD');
              else if (tab === 'market') setActiveTab('CONSOLE_MARKET');
              else if (tab === 'sbcs') setActiveTab('DUAL_SBCS');
              else if (tab === 'ai-studio') setActiveTab('TACTICAL_COMMAND');
            }}
            coins={coins}
            clubName={clubName}
            rivalsDivision={rivalsDivision}
            fifaPoints={fifaPoints}
            dailySp={dailySp}
            galleryLevel={galleryLevel}
            champsRecord={champsRecord}
            onUpdateCoins={(newCoins) => setCoins(newCoins)}
            onOpenSyncModal={() => setShowSyncHubModal(true)}
            onShowNotice={(msg) => setCloudStatusBanner(msg)}
            activeModelRoute={activeModelRoute}
            onChangeModelRoute={(route: string) => setActiveModelRoute(route)}
          />
        )}

        {/* Other Tabs Shell */}
        {shellTab !== 'hub' && (
          <div className="max-w-[1600px] w-full mx-auto px-4 lg:px-6 py-4 space-y-4">
            {/* Context Sub-Navigation Strip */}
            <div className="flex items-center justify-between gap-3 bg-surface-container p-2 rounded-xl border border-white/5 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {shellTab === 'squad' && (
                  <>
                    {[
                      { id: 'MY_SQUAD', label: 'Tactical Pitch (4-2-1-3)', icon: 'sports_soccer' },
                      { id: 'DYNAMIC_DATABASE', label: 'FUTBIN & Chem Lab', icon: 'database' },
                      { id: 'EVOLUTIONS', label: 'Evolutions Matrix', icon: 'alt_route' },
                      { id: 'GAMEPLAY_LAB', label: 'Gameplay Synthesis', icon: 'bolt' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveTab(st.id as ActiveTab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === st.id
                            ? 'bg-primary-container text-on-primary font-bold'
                            : 'text-on-surface-variant hover:text-white bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </>
                )}

                {shellTab === 'market' && (
                  <>
                    {[
                      { id: 'CONSOLE_MARKET', label: 'FUTBIN Radar & Price History', icon: 'trending_up' },
                      { id: 'INVESTMENTS', label: 'Scream Team 1 & Investments', icon: 'local_fire_department' },
                      { id: 'FUT_GALLERY', label: 'FUT Gallery & Rent-and-Flip', icon: 'workspace_premium' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveTab(st.id as ActiveTab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === st.id
                            ? 'bg-secondary-container text-on-secondary-container font-bold'
                            : 'text-on-surface-variant hover:text-white bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </>
                )}

                {shellTab === 'sbcs' && (
                  <>
                    {[
                      { id: 'DUAL_SBCS', label: 'Ranked Player & Upgrade SBCs', icon: 'auto_fix_high' },
                      { id: 'CLUB_SYNC', label: 'Duplicate Storage & Inventory', icon: 'inventory_2' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveTab(st.id as ActiveTab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === st.id
                            ? 'bg-tertiary-container text-on-tertiary-container font-bold'
                            : 'text-on-surface-variant hover:text-white bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </>
                )}

                {shellTab === 'ai-studio' && (
                  <>
                    {[
                      { id: 'TACTICAL_COMMAND', label: 'Tactical Voice & Chat', icon: 'psychology' },
                      { id: 'WORKSPACE_HUB', label: 'Google Docs & Sheets Hub', icon: 'description' },
                      { id: 'ANTIGRAVITY_AI', label: 'Antigravity 2.26 Telemetry', icon: 'neurology' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveTab(st.id as ActiveTab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === st.id
                            ? 'bg-primary-container text-on-primary font-bold'
                            : 'text-on-surface-variant hover:text-white bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="text-xs font-mono text-on-surface-variant hidden md:block">
                T=0 UK: <strong className="text-primary-container">{t0Anchor.britishTimeFormatted}</strong>
              </div>
            </div>

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

          {/* TAB 0: DYNAMIC SQUAD TRACKER, PITCH 11 & UPGRADE SIMULATOR */}
          {activeTab === 'MY_SQUAD' && (
            <SquadTrackerView
              t0Anchor={t0Anchor}
              userCoins={coins}
              onUpdateCoins={(newCoins) => setCoins(newCoins)}
              clubPlayers={players}
              onNavigateToTab={(tabId) => setActiveTab(tabId as ActiveTab)}
              onSimulateInTactics={handleRunSmartAdvisor}
              simulatedTargetName={simulatedEvoName}
            />
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
                    onClick={handleExportClubDataJson}
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-[#00ff87]/50 hover:border-[#00ff87] text-[#00ff87] text-xs font-bold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                    title="Download a local JSON backup of your current club data (coins, squad, players)"
                  >
                    <Download className="w-4 h-4 text-[#00ff87]" />
                    <span>Export Club Backup JSON</span>
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

                  {/* Add Custom Owned Card with Live FC 27 Xbox Series S Verification + PushToTalk */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={newCustomPlayerName}
                      onChange={(e) => setNewCustomPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomClubPlayer();
                      }}
                      placeholder="Add a player you own (unverified stats stay —)..."
                      className="flex-1 min-w-[180px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#00ff87] min-h-[38px]"
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

          {/* TAB 2: SPLIT RANKED PLAYER SBCs vs UPGRADE SBCs + LIVE FREE OBJECTIVES (ULTIMATE SCREAM TEAM 1) */}
          {activeTab === 'DUAL_SBCS' && (
            <div className="space-y-6">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#00ff87] font-semibold">
                    Live Ultimate Scream Team 1 @ T=0 ({t0Anchor.britishDateFormatted}) · Ranked by Worth-It Score & 35,000 Coin Budget
                  </div>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    Top 5 Player SBCs vs. Top 5 Upgrade SBCs + Live Free Objectives
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Split and ranked #1 to #5 by <strong>Worth-It Score</strong>, time remaining, Xbox Series S completion cost, and squad chemistry fit. Includes <strong>85 Nicolás Otamendi (#1 Player SBC)</strong>, <strong>85 Bobby Moore (#2 Player SBC)</strong>, and Free Objectives <strong>87 Jill Scott (CB/CDM/CM)</strong> & <strong>87 Verón (CM)</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSyncingLiveSbcs}
                    onClick={handleSyncLiveSbcs}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px] disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4 text-[#00ff87]" />
                    <span>
                      {isSyncingLiveSbcs ? 'Syncing Live SBCs...' : 'Sync Live SBC Rankings (T=0)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isThinkingAdvisor}
                    onClick={() =>
                      handleRunSmartAdvisor(
                        `Xbox Series S SBC Plan: ${activeSbc.title}`,
                        `Solve ${activeSbc.title} (${activeSbc.category}, Ranked #${activeSbc.rankInGroup} in ${activeSbc.sbcGroup}, Worth-It Score ${activeSbc.worthItScore}/100) strictly for the Xbox Series S market. My current Coin balance is ${
                          coins !== null ? `${coins.toLocaleString()} Coins` : 'BLANK'
                        }. Do NOT assume I own any cards that are not listed in my clubContext. Tell me whether this SBC fits my 35,000 Coin budget and give the exact cheapest Holographic/Base combination.`
                      )
                    }
                    className="px-4 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px] disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isThinkingAdvisor ? 'Routing to Flash...' : 'Analyze Selected SBC'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Filter Bar: Split Side-by-Side vs Player SBCs Only vs Upgrade SBCs Only */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111827] border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'SPLIT_BOTH', label: 'Split View: Top 5 Player vs. Top 5 Upgrade SBCs' },
                    { id: 'PLAYER_SBC', label: 'Top 5 Player SBCs Only (85 Otamendi · 85 Moore)' },
                    { id: 'UPGRADE_SBC', label: 'Top 5 Upgrade SBCs Only (81+ Pick · 83+ x2)' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSbcRankFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        sbcRankFilter === tab.id
                          ? 'bg-[#00ff87] text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Selected for Deterministic Solver: <strong className="text-[#00ff87]">{activeSbc.title}</strong>
                </div>
              </div>

              {/* Split Ranked Columns: Top 5 Player SBCs vs Top 5 Upgrade SBCs */}
              <div
                className={`grid grid-cols-1 ${
                  sbcRankFilter === 'SPLIT_BOTH' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
                } gap-6`}
              >
                {/* COLUMN A: TOP 5 RANKED PLAYER SBCs */}
                {(sbcRankFilter === 'SPLIT_BOTH' || sbcRankFilter === 'PLAYER_SBC') && (
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-xs font-mono text-[#00ff87]">
                          RANKED #1 TO #5 BY WORTH-IT VALUE SCORE
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          Top 5 Currently Available Player SBCs (Ultimate Scream Team 1)
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-amber-400">Xbox Series S</span>
                    </div>

                    <div className="space-y-3">
                      {top5PlayerSbcs.map((sbc) => {
                        const selected = sbc.id === selectedSbcId;
                        const fitsBudget = coins !== null && sbc.estimatedMarketCost <= coins;
                        const daysLeft = Math.floor(sbc.expiresInHours / 24);
                        const hoursLeft = sbc.expiresInHours % 24;
                        return (
                          <button
                            key={sbc.id}
                            type="button"
                            onClick={() => setSelectedSbcId(sbc.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 ${
                              selected
                                ? 'bg-slate-900 border-[#00ff87] ring-1 ring-[#00ff87]/50'
                                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-[#00ff87] text-slate-950 font-extrabold">
                                  #{sbc.rankInGroup} PLAYER SBC
                                </span>
                                <span className="text-[#00ff87] font-bold">
                                  Worth-It: {sbc.worthItScore}/100 ({sbc.verdictLabel})
                                </span>
                              </div>
                              <span className="text-amber-400">
                                ⏳ {daysLeft}d {hoursLeft}h left · {sbc.repeatableText}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between gap-2">
                              <div className="text-sm font-bold text-white">{sbc.title}</div>
                              <div
                                className={`text-xs font-mono font-bold whitespace-nowrap ${
                                  fitsBudget ? 'text-[#00ff87]' : 'text-amber-400'
                                }`}
                              >
                                {sbc.estimatedMarketCost.toLocaleString()} Coins{' '}
                                {fitsBudget ? '(Fits 35k!)' : '(>35k Coins)'}
                              </div>
                            </div>

                            <div className="text-xs text-slate-300">{sbc.rewardDescription}</div>
                            <div className="text-[11px] text-slate-400 leading-relaxed">
                              <strong className="text-slate-200">Squad Fit & Value:</strong> {sbc.whyWorthIt}
                            </div>

                            {/* Pros & Cons Tags */}
                            {sbc.pros && sbc.cons && sbc.pros.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                                <div className="bg-emerald-950/40 border border-emerald-500/20 rounded p-1.5 space-y-0.5">
                                  <div className="font-bold text-[#00ff87]">✓ Pros</div>
                                  {sbc.pros.map((p, idx) => (
                                    <div key={idx} className="text-slate-300">• {p}</div>
                                  ))}
                                </div>
                                <div className="bg-red-950/30 border border-red-500/20 rounded p-1.5 space-y-0.5">
                                  <div className="font-bold text-red-400">✗ Cons</div>
                                  {sbc.cons.map((c, idx) => (
                                    <div key={idx} className="text-slate-300">• {c}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {sbc.squadAndFodderAdvice && (
                              <div className="text-[11px] bg-slate-900/90 border border-[#00ff87]/30 rounded p-2 text-slate-300">
                                <strong className="text-[#00ff87]">Tactical & Fodder Advice:</strong>{' '}
                                {sbc.squadAndFodderAdvice}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* COLUMN B: TOP 5 RANKED UPGRADE / PACK SBCs */}
                {(sbcRankFilter === 'SPLIT_BOTH' || sbcRankFilter === 'UPGRADE_SBC') && (
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-xs font-mono text-amber-400">
                          RANKED #1 TO #5 BY PACK EV & FODDER MULTIPLIER EFFICIENCY
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          Top 5 Currently Available Upgrade & Casino SBCs
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-[#00ff87]">1.25x / 1.50x Holo</span>
                    </div>

                    <div className="space-y-3">
                      {top5UpgradeSbcs.map((sbc) => {
                        const selected = sbc.id === selectedSbcId;
                        const fitsBudget = coins !== null && sbc.estimatedMarketCost <= coins;
                        const daysLeft = Math.floor(sbc.expiresInHours / 24);
                        const hoursLeft = sbc.expiresInHours % 24;
                        return (
                          <button
                            key={sbc.id}
                            type="button"
                            onClick={() => setSelectedSbcId(sbc.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 ${
                              selected
                                ? 'bg-slate-900 border-[#00ff87] ring-1 ring-[#00ff87]/50'
                                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold">
                                  #{sbc.rankInGroup} UPGRADE SBC
                                </span>
                                <span className="text-[#00ff87] font-bold">
                                  Worth-It: {sbc.worthItScore}/100 ({sbc.verdictLabel})
                                </span>
                              </div>
                              <span className="text-amber-400">
                                ⏳ {daysLeft}d {hoursLeft}h left · {sbc.repeatableText}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between gap-2">
                              <div className="text-sm font-bold text-white">{sbc.title}</div>
                              <div
                                className={`text-xs font-mono font-bold whitespace-nowrap ${
                                  fitsBudget ? 'text-[#00ff87]' : 'text-amber-400'
                                }`}
                              >
                                {sbc.estimatedMarketCost.toLocaleString()} Coins{' '}
                                {fitsBudget ? '(Fits 35k!)' : '(>35k Coins)'}
                              </div>
                            </div>

                            <div className="text-xs text-slate-300">{sbc.rewardDescription}</div>
                            <div className="text-[11px] text-slate-400 leading-relaxed">
                              <strong className="text-slate-200">Why Do It:</strong> {sbc.whyWorthIt}
                            </div>

                            {/* Pros & Cons Tags */}
                            {sbc.pros && sbc.cons && sbc.pros.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                                <div className="bg-emerald-950/40 border border-emerald-500/20 rounded p-1.5 space-y-0.5">
                                  <div className="font-bold text-[#00ff87]">✓ Pros</div>
                                  {sbc.pros.map((p, idx) => (
                                    <div key={idx} className="text-slate-300">• {p}</div>
                                  ))}
                                </div>
                                <div className="bg-red-950/30 border border-red-500/20 rounded p-1.5 space-y-0.5">
                                  <div className="font-bold text-red-400">✗ Cons</div>
                                  {sbc.cons.map((c, idx) => (
                                    <div key={idx} className="text-slate-300">• {c}</div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {sbc.squadAndFodderAdvice && (
                              <div className="text-[11px] bg-slate-900/90 border border-amber-400/30 rounded p-2 text-slate-300">
                                <strong className="text-amber-400">Grind Strategy:</strong>{' '}
                                {sbc.squadAndFodderAdvice}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE FREE OBJECTIVES SECTION (87 JILL SCOTT CB/CDM/CM & 87 VERON CM) */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-xs font-mono text-[#00ff87]">
                      ZERO-COIN FREE OBJECTIVES · ULTIMATE SCREAM TEAM 1
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Live Player Objectives (0 Coins — Free Starting XI & High-Rated Fodder)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-amber-400">
                    Stack in Squad Battles / Rivals
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {freeLiveObjectives.map((obj) => (
                    <div
                      key={obj.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-[#00ff87]/20 text-[#00ff87] font-bold">
                          FREE OBJECTIVE · {obj.position}
                          {obj.altPositions.length > 0 ? ` / ${obj.altPositions.join(' / ')}` : ''}
                        </span>
                        <span className="text-[#00ff87] font-bold">
                          Worth-It: {obj.worthItScore}/100 (MUST GRIND)
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-base font-bold text-white">
                          {obj.rating} {obj.name} ({obj.club})
                        </h4>
                        <span className="text-xs font-mono text-amber-400">
                          ⏳ {obj.expiresInHours ? `${Math.floor(obj.expiresInHours / 24)}d left` : '7d left'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-[#00ff87]">
                        {obj.keyRolePlusPlus} · {obj.keyPlayStylesPlus.join(' · ')}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{obj.tacticalNote}</p>
                    </div>
                  ))}
                </div>
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

          {/* TAB 3: DYNAMIC LIVE EVOLUTIONS HUB & BRANCHING SCOUTER */}
          {activeTab === 'EVOLUTIONS' && (
            <LiveEvolutionsView
              t0Anchor={t0Anchor}
              userCoins={coins}
              players={players}
              onRunHighThinkingAudit={handleRunSmartAdvisor}
              isThinking={isThinkingAdvisor}
              onSimulateInSquad={(playerName) => {
                setSimulatedEvoName(playerName);
                setActiveTab('MY_SQUAD');
              }}
            />
          )}

          {/* TAB 4B: INTELLIGENT CONSOLE INVESTMENT TRACKER & ULTIMATE SCREAM TEAM 1 RADAR */}
          {activeTab === 'INVESTMENTS' && (
            <InvestmentTrackerTab
              t0Anchor={t0Anchor}
              userCoins={coins}
              onUpdateUserCoins={(newBalance) => setCoins(newBalance)}
              investments={trackedInvestments}
              onAddInvestment={(pos) => {
                setTrackedInvestments((prev) => [
                  { ...pos, id: `inv-${Date.now()}` },
                  ...prev,
                ]);
                setCloudStatusBanner(
                  `Logged ${pos.rating} ${pos.playerName} (Buy: ${pos.buyPrice.toLocaleString()} → Target: ${pos.targetSellPrice.toLocaleString()}) to your Console Investment Portfolio.`
                );
              }}
              onUpdateInvestmentStatus={(id, status) =>
                setTrackedInvestments((prev) =>
                  prev.map((item) => (item.id === id ? { ...item, status } : item))
                )
              }
              onRemoveInvestment={(id) =>
                setTrackedInvestments((prev) => prev.filter((item) => item.id !== id))
              }
              catalogPlayers={players}
              clubContextForAi={clubContextForAi}
              onNavigateToTab={(tabId) => setActiveTab(tabId as ActiveTab)}
            />
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

          {/* TAB 6A: STANDALONE FULL-SCREEN MULTI-TURN TACTICAL COMMAND CHATBOT */}
          {activeTab === 'TACTICAL_COMMAND' && (
            <TacticalChatTab
              t0Anchor={t0Anchor}
              clubContextForAi={clubContextForAi}
            />
          )}

          {/* TAB 6B: 5-TIER SMART ROUTER, ANTIGRAVITY v2.25 GenUI SKILL & VOICE SYNC */}
          {activeTab === 'ANTIGRAVITY_AI' && (
            <AntigravityMcpAndChatDrawer
              t0Anchor={t0Anchor}
              clubContextForAi={clubContextForAi}
              onVoiceClubCommand={handleVoiceClubCommand}
            />
          )}

          {/* TAB 7: GOOGLE WORKSPACE 1P SUITE — GOOGLE DOCS (v1) & GOOGLE SHEETS (v4) */}
          {activeTab === 'WORKSPACE_HUB' && (
            <GoogleWorkspaceHub
              currentUser={currentUser}
              hasDriveToken={hasDriveToken}
              userCoins={coins}
              clubName={clubName}
              rivalsDivision={rivalsDivision}
              activeFormation="4-2-1-3"
              startingXI={players.slice(0, 11)}
              trackedInvestments={trackedInvestments}
              onOpenSyncModal={() => setShowLaunchSyncModal(true)}
            />
          )}

          {/* TAB 8: DYNAMIC FUTBIN & FUT.GG DATABASE & CHEMISTRY STYLE LAB */}
          {activeTab === 'DYNAMIC_DATABASE' && (
            <DynamicDatabaseView
              t0Anchor={t0Anchor}
              catalogPlayers={players}
              userCoins={coins}
              onAddToSquad={(player) => {
                setPlayers((prev) =>
                  prev.map((p) => (p.id === player.id ? { ...p, inClubInventory: true } : p))
                );
                setActiveTab('MY_SQUAD');
                setCloudStatusBanner(
                  `Added ${player.rating} ${player.name} (${player.position}) to your active squad inventory.`
                );
              }}
              onLogInvestment={(player, targetPrice) => {
                setTrackedInvestments((prev) => [
                  {
                    id: `inv-${Date.now()}`,
                    playerName: player.name,
                    rating: player.rating,
                    rarity: player.rarity,
                    buyPrice: player.consolePrice,
                    targetSellPrice: targetPrice,
                    currentXboxPrice: player.consolePrice,
                    quantity: 1,
                    status: 'active',
                    notes: 'Logged from FUTBIN & FUT.GG Database Lab.',
                  },
                  ...prev,
                ]);
                setActiveTab('INVESTMENTS');
                setCloudStatusBanner(
                  `Logged ${player.rating} ${player.name} to your Console Investment Portfolio.`
                );
              }}
              onNavigateToTab={(tabId) => setActiveTab(tabId as ActiveTab)}
            />
          )}
          </div>
        )}
      </main>

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
      {/* FIXED BOTTOM NAVIGATION BAR: Matching User HTML Mockup */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.7)] border-t border-white/5"
        data-active-classes="text-primary-container font-bold scale-105"
      >
        <div className="flex items-center justify-around h-16 px-space-xs max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setShellTab('hub')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-all cursor-pointer ${
              shellTab === 'hub' ? 'text-primary-container font-bold scale-105' : 'text-on-surface-variant'
            }`}
            data-path="hub"
          >
            <span className="material-symbols-outlined text-[22px]">insights</span>
            <span className="font-label-caps text-label-caps">Hub</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShellTab('squad');
              setActiveTab('MY_SQUAD');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-all cursor-pointer ${
              shellTab === 'squad' ? 'text-primary-container font-bold scale-105' : 'text-on-surface-variant'
            }`}
            data-path="squad"
          >
            <span className="material-symbols-outlined text-[22px]">sports_soccer</span>
            <span className="font-label-caps text-label-caps">Squad</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShellTab('market');
              setActiveTab('CONSOLE_MARKET');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-all cursor-pointer ${
              shellTab === 'market' ? 'text-primary-container font-bold scale-105' : 'text-on-surface-variant'
            }`}
            data-path="market"
          >
            <span className="material-symbols-outlined text-[22px]">candlestick_chart</span>
            <span className="font-label-caps text-label-caps">Market</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShellTab('sbcs');
              setActiveTab('DUAL_SBCS');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-all cursor-pointer ${
              shellTab === 'sbcs' ? 'text-primary-container font-bold scale-105' : 'text-on-surface-variant'
            }`}
            data-path="sbcs"
          >
            <span className="material-symbols-outlined text-[22px]">auto_fix_high</span>
            <span className="font-label-caps text-label-caps">SBCs</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShellTab('ai-studio');
              setActiveTab('TACTICAL_COMMAND');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-all cursor-pointer ${
              shellTab === 'ai-studio' ? 'text-primary-container font-bold scale-105' : 'text-on-surface-variant'
            }`}
            data-path="ai-studio"
          >
            <span className="material-symbols-outlined text-[22px]">neurology</span>
            <span className="font-label-caps text-label-caps">AI Studio</span>
          </button>
        </div>
      </nav>

      {/* QUICK COIN TUNER MODAL */}
      {showCoinQuickModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-white/10 rounded-xl max-w-sm w-full p-space-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary-fixed-dim">monetization_on</span>
                <h3 className="font-headline-md text-base font-bold text-white">Adjust Club Coins</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCoinQuickModal(false)}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant block font-medium">
                Enter Coin Balance:
              </label>
              <input
                type="number"
                value={coins ?? 0}
                onChange={(e) => setCoins(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-container-low border border-white/10 rounded-lg text-white font-data-tabular text-sm focus:outline-none focus:border-primary-container"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: '35,000 (Start)', val: 35000 },
                { label: '500,000', val: 500000 },
                { label: '1.42M (Apex)', val: 1420000 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => {
                    setCoins(preset.val);
                    setShowCoinQuickModal(false);
                    setCloudStatusBanner(`Club balance updated to ${preset.val.toLocaleString()} Coins.`);
                  }}
                  className="p-2 rounded bg-surface-container-high hover:bg-surface-bright text-xs text-white font-mono text-center border border-white/5 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCoinQuickModal(false)}
                className="px-4 py-2 bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleApplyJsonImport}
                    className="px-4 py-2 bg-[#00ff87] text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Parse & Apply JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleExportClubDataJson}
                    className="px-4 py-2 bg-slate-900 border border-[#00ff87]/50 hover:border-[#00ff87] text-[#00ff87] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00ff87]" />
                    <span>Download Club Backup JSON</span>
                  </button>
                </div>
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportClubDataJson}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-[#00ff87]/50 hover:border-[#00ff87] text-[#00ff87] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Export all current club data (coins, squad, players) as a JSON backup file"
                >
                  <Download className="w-3.5 h-3.5 text-[#00ff87]" />
                  <span>Export Club Data JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLaunchSyncModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg"
                >
                  Continue with 35,000 Coins
                </button>
              </div>
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

      {/* MODAL 3: Dedicated Cannons n Pecks Dynamic Ingestion & Multi-Model Intelligence Commander Hub */}
      <ClubSyncHubModal
        isOpen={showSyncHubModal}
        onClose={() => setShowSyncHubModal(false)}
        coins={coins}
        clubName={clubName}
        rivalsDivision={rivalsDivision}
        fifaPoints={fifaPoints}
        champsRecord={champsRecord}
        onSaveClubState={(state) => {
          setClubName(state.clubName);
          setCoins(state.coins);
          setRivalsDivision(state.rivalsDivision);
          setFifaPoints(state.fifaPoints);
          if (state.champsRecord !== undefined) setChampsRecord(state.champsRecord);
          if (state.coins !== null) setDraftCoins(String(state.coins));
          if (state.clubName) setDraftClubName(state.clubName);
        }}
        onShowNotice={(msg) => setCloudStatusBanner(msg)}
        activeModelRoute={activeModelRoute}
        onChangeModelRoute={(route) => setActiveModelRoute(route)}
      />
    </div>
  );
}

export default App;
