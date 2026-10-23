import React, { useState, useEffect, useMemo } from 'react';
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
import { AntigravityMcpAndChatDrawer } from './components/AntigravityMcpAndChatDrawer';
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
  RefreshCw,
  Monitor,
  LogOut,
  Plus,
  Coins,
  Zap,
  AlertTriangle,
  X,
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

  // 3. Club Wallet, Inventory & Season 2 SP Cap (850 SP/day)
  const [clubName, setClubName] = useState<string>('Blaugrana 26-27 FC');
  const [coins, setCoins] = useState<number>(642500);
  const [fifaPoints, setFifaPoints] = useState<number>(1600);
  const [dailySp, setDailySp] = useState<number>(650);
  const [galleryLevel, setGalleryLevel] = useState<number>(18);
  const [players, setPlayers] = useState<FC27ConsolePlayer[]>(FC27_CONSOLE_PLAYERS);
  const [useClubUntradeablesInSbc, setUseClubUntradeablesInSbc] = useState<boolean>(true);
  const [selectedSbcId, setSelectedSbcId] = useState<string>(FC27_ACTIVE_SBCS[0].id);

  // 4. Market & 5G Investment Portfolio State
  const [selectedMarketPlayerId, setSelectedMarketPlayerId] = useState<string>(
    FC27_CONSOLE_PLAYERS[0].id
  );
  const [marketFilter5G, setMarketFilter5G] = useState<'ALL' | 'HOLOGRAPHIC' | 'BARCELONA'>('ALL');
  const [trackedInvestments, setTrackedInvestments] = useState<TrackedInvestment[]>([
    {
      id: 'inv-1',
      playerName: 'Dani Olmo (Regular Holographic)',
      rating: 86,
      rarity: 'Regular Holographic (1.25x)',
      buyPrice: 10600,
      targetSellPrice: 12500,
      quantity: 4,
    },
    {
      id: 'inv-2',
      playerName: 'William Saliba (Pristine Holographic)',
      rating: 88,
      rarity: 'Pristine Holographic (1.50x)',
      buyPrice: 27500,
      targetSellPrice: 32500,
      quantity: 2,
    },
  ]);

  // 5. Gallery Set Registration State
  const [registeredRentIds, setRegisteredRentIds] = useState<Record<string, boolean>>({});

  // 6. Firebase Auth, Firestore Sync & Google Drive REST API v3 State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState<boolean>(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileSummary[]>([]);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudStatusBanner, setCloudStatusBanner] = useState<string | null>(null);
  const [pendingDeleteDriveFile, setPendingDeleteDriveFile] = useState<DriveFileSummary | null>(
    null
  );

  // 7. Web App JSON Importer Modal
  const [showJsonImportModal, setShowJsonImportModal] = useState<boolean>(false);
  const [jsonImportText, setJsonImportText] = useState<string>('');

  // 8. Gemini 4 Argon (High-Thinking) Strategic Output Drawer
  const [isThinkingArgon, setIsThinkingArgon] = useState<boolean>(false);
  const [argonStrategyOutput, setArgonStrategyOutput] = useState<{
    title: string;
    text: string;
    t0Stamp: string;
  } | null>(null);

  // Initialize Firebase Auth & load persisted Firestore state
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setCurrentUser(user);
        setHasDriveToken(Boolean(token));
        try {
          const data = await loadClubStateFromFirestore();
          if (data) {
            if (typeof data.clubName === 'string') setClubName(data.clubName);
            if (typeof data.coins === 'number') setCoins(data.coins);
            if (typeof data.fifaPoints === 'number') setFifaPoints(data.fifaPoints);
            if (typeof data.dailySp === 'number') setDailySp(data.dailySp);
            if (typeof data.galleryLevel === 'number') setGalleryLevel(data.galleryLevel);
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
        `Synced club wallet to Firestore & connected Google Drive (${files.length} FC27 snapshots found).`
      );
    } catch (err: any) {
      setCloudStatusBanner(`Auth/Sync notice: ${err.message}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Save Snapshot to Firestore + Google Drive
  const handleBackupToFirestoreAndDrive = async () => {
    const freshT0 = createTemporalAnchor(new Date());
    setT0Anchor(freshT0);
    setIsSyncingCloud(true);
    try {
      await syncClubStateToFirestore({
        clubName,
        coins,
        fifaPoints,
        dailySp,
        galleryLevel,
        activeFormation: '4-2-1-3',
        antigravityVersion: freshT0.antigravityFirmware.version,
        fc27PatchVersion: freshT0.fc27PatchState.titleUpdateVersion,
        lastT0Anchor: freshT0.britishFullFormatted,
      });

      if (hasDriveToken) {
        const fileName = `FC27_UT_ClubBackup_${freshT0.footballSeasonCode}_${freshT0.t0EpochMs}.json`;
        const snapshotPayload = {
          anchoredAtT0: freshT0.britishFullFormatted,
          season: freshT0.footballSeasonCode,
          antigravityFirmware: freshT0.antigravityFirmware.version,
          fc27Patch: freshT0.fc27PatchState.titleUpdateVersion,
          clubName,
          coins,
          fifaPoints,
          dailySp,
          galleryLevel,
          clubInventoryCount: players.filter((p) => p.inClubInventory).length,
          duplicateStorageCount: players.filter((p) => p.inDuplicateStorage).length,
          players: players.map((p) => ({
            id: p.id,
            name: p.name,
            rating: p.rating,
            club: p.club,
            rarity: p.rarity,
            inClubInventory: p.inClubInventory,
            inDuplicateStorage: p.inDuplicateStorage,
          })),
        };
        await createFc27DriveSnapshot(fileName, snapshotPayload);
        const updatedFiles = await listFc27DriveBackups();
        setDriveFiles(updatedFiles);
        setCloudStatusBanner(
          `Saved snapshot ${fileName} to Google Drive & synced Firestore at ${freshT0.britishTimeFormatted}.`
        );
      } else {
        setCloudStatusBanner(
          `Synced club wallet to Firestore at ${freshT0.britishTimeFormatted}. Sign in with Google again to grant Drive file backup access.`
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

  // Trigger Gemini 4 Argon (ThinkingLevel.HIGH) Advisor
  const handleRunHighThinkingAdvisor = async (title: string, taskPrompt: string) => {
    const freshT0 = createTemporalAnchor(new Date());
    setT0Anchor(freshT0);
    setIsThinkingArgon(true);

    try {
      const clubContext = {
        clubName,
        coins,
        fifaPoints,
        dailySp: `${dailySp}/850 SP`,
        galleryLevel,
        startingCore: players
          .filter((p) => p.inClubInventory && !p.inDuplicateStorage)
          .map((p) => `${p.rating} ${p.name} (${p.club}, ${p.rarity}, ${p.effectiveItemScore} pts)`),
        duplicateStorage: players
          .filter((p) => p.inDuplicateStorage)
          .map((p) => `${p.rating} ${p.name} (${p.rarity}, ${p.effectiveItemScore} pts)`),
      };

      const res = await fetch('/api/gemini/high-thinking-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: title,
          userQuery: taskPrompt,
          clubContext,
          clientT0: freshT0.britishFullFormatted,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setArgonStrategyOutput({
          title: `${title} — Notice`,
          text: data.error,
          t0Stamp: freshT0.britishFullFormatted,
        });
      } else {
        setArgonStrategyOutput({
          title,
          text: data.text,
          t0Stamp: freshT0.britishFullFormatted,
        });
      }
    } catch (err: any) {
      setArgonStrategyOutput({
        title: `${title} — Error`,
        text: `Failed to reach Gemini 4 Argon endpoint: ${err.message}`,
        t0Stamp: freshT0.britishFullFormatted,
      });
    } finally {
      setIsThinkingArgon(false);
    }
  };

  // Parse Web App JSON Import (Paletools / FUTClubAnalyzer / Custom JSON)
  const handleApplyJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonImportText);
      if (typeof parsed.coins === 'number') setCoins(parsed.coins);
      if (typeof parsed.fifaPoints === 'number') setFifaPoints(parsed.fifaPoints);
      if (typeof parsed.dailySp === 'number') setDailySp(Math.min(850, parsed.dailySp));
      if (typeof parsed.clubName === 'string') setClubName(parsed.clubName);
      setShowJsonImportModal(false);
      setCloudStatusBanner(
        `Imported EA FC 27 Companion Web App JSON dump at T=0 (${t0Anchor.britishTimeFormatted}).`
      );
    } catch {
      setCloudStatusBanner(
        'Invalid JSON format. Expected keys like {"clubName": "...", "coins": 720000, "dailySp": 750}.'
      );
    }
  };

  // Handle Voice Transcript Command from gemini-3.5-transcribe
  const handleVoiceClubCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();
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
    setCloudStatusBanner(`Voice command transcribed ("${transcript}") at ${t0Anchor.britishTimeFormatted}.`);
  };

  // Derived deterministic calculations (<2ms)
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
      calculateSquadChemistry(
        players.filter((p) => p.inClubInventory && !p.inDuplicateStorage).slice(0, 8)
      ),
    [players]
  );

  const selectedMarketPlayer = useMemo(
    () =>
      players.find((p) => p.id === selectedMarketPlayerId) ||
      players[0],
    [players, selectedMarketPlayerId]
  );

  const filteredMarketPlayers = useMemo(() => {
    if (marketFilter5G === 'HOLOGRAPHIC') {
      return players.filter((p) => p.holographicMultiplier > 1.0);
    }
    if (marketFilter5G === 'BARCELONA') {
      return players.filter((p) => p.club === 'FC Barcelona');
    }
    return players;
  }, [players, marketFilter5G]);

  // Execute "Rent-and-Flip" Gallery Set Registration
  const handleExecuteRentAndFlip = (
    candidateId: string,
    playerName: string,
    netCoinDelta: number,
    galleryPoints: number
  ) => {
    if (registeredRentIds[candidateId]) return;
    setRegisteredRentIds((prev) => ({ ...prev, [candidateId]: true }));
    setCoins((prev) => prev + netCoinDelta);
    setGalleryLevel((prev) => Math.min(100, prev + (galleryPoints >= 300 ? 1 : 0)));
    setCloudStatusBanner(
      `Rent-and-Flip Executed: Registered ${playerName} permanently in FUT Gallery (+${galleryPoints} Gallery Pts) & relisted for +${netCoinDelta} Net Coins after 5% EA Tax.`
    );
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col pb-24 lg:pb-12">
      {/* TOP BAR CONTRACT: Strictly 3 Distinct Component Groups (Left Brand/Domain, Center T=0 Clock, Right Wallet/Auth) */}
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
                  <span className="text-[11px] font-mono text-[#00ff87] bg-[#00ff87]/10 border border-[#00ff87]/30 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                    Antigravity v{t0Anchor.antigravityFirmware.version}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  {t0Anchor.footballSeasonCode} Season · FotMob & FUTBIN 27 Console Verified
                </div>
              </div>
            </div>

            {/* 2 Principal Domains Pill Switcher */}
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
                1. MENUS (Club · SBC · Gallery · Market)
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

          {/* ZONE 3 (Right): Compact Wallet Summary + Official Sign in with Google Button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 bg-[#111827] border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums">
              <span className="text-[#00ff87] font-bold whitespace-nowrap">
                {coins.toLocaleString()} Coins
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-amber-400 font-semibold whitespace-nowrap">
                {dailySp}/850 SP
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300 whitespace-nowrap">
                Gallery Lv.{galleryLevel}
              </span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncingCloud}
                  onClick={handleBackupToFirestoreAndDrive}
                  className="px-3 py-2 bg-[#111827] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-[#00ff87] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isSyncingCloud ? 'Syncing...' : 'Sync Drive & Cloud'}</span>
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
              {principalDomain === 'MENUS' ? 'Domain 1: Menus & Market' : 'Domain 2: On-Pitch Meta'}
            </div>

            <nav className="space-y-1.5">
              {[
                {
                  id: 'CLUB_SYNC',
                  label: 'Club, Sync & Match Stacker',
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
                  label: 'Console Market & 5G Flips',
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
                  label: 'Antigravity v2.25 & AI Chat',
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

            {/* Anti-Autoregressive 2026-27 Transfer Guard Status Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="font-bold text-[#00ff87] flex items-center justify-between">
                <span>Anti-Bias Transfer Law</span>
                <span className="font-mono">{t0Anchor.footballSeasonShort}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Grounded via FotMob & FUTBIN 27 Console: <strong className="text-white">Rodri</strong> is verified at <strong className="text-amber-300">FC Barcelona</strong> (LaLiga). Zero FC 24/25/26 legacy leakage.
              </p>
              <div className="pt-1 border-t border-slate-800 font-mono text-[11px] text-slate-300">
                Squad Chem: <strong className="text-[#00ff87]">{squadChemistry.totalChemistry}/33</strong>
              </div>
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
              18:00 Drop: <strong>{t0Anchor.countdownTo1800Drop.formatted}</strong>
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

          {/* Gemini 4 Argon (ThinkingLevel.HIGH) Tactical Output Drawer */}
          {argonStrategyOutput && (
            <div className="bg-[#111827] border border-amber-400/50 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    {argonStrategyOutput.title} (Gemini 4 Argon · ThinkingLevel.HIGH)
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    Anchored: {argonStrategyOutput.t0Stamp}
                  </span>
                  <button
                    type="button"
                    onClick={() => setArgonStrategyOutput(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {argonStrategyOutput.text}
              </div>
            </div>
          )}

          {/* TAB 1: CLUB, SYNC & 850 SP MATCH STACKER */}
          {activeTab === 'CLUB_SYNC' && (
            <div className="space-y-6">
              {/* Top KPI Bar (Max 4 cards in a row, max 3 data points per card) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Console Coin Balance</span>
                    <Coins className="w-4 h-4 text-[#00ff87]" />
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#00ff87]">
                    {coins.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {fifaPoints.toLocaleString()} FC Points · {clubName}
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Daily Match SP Cap (FC 27)</span>
                    <span className="font-mono text-amber-400">Max 850/Day</span>
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white">
                    {dailySp} <span className="text-sm text-slate-400">/ 850 SP</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {850 - dailySp} SP remaining before daily cap
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>SBC Duplicate Storage</span>
                    <Layers className="w-4 h-4 text-[#00ff87]" />
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white">
                    {players.filter((p) => p.inDuplicateStorage).length} Cards
                  </div>
                  <div className="text-xs text-[#00ff87] font-mono">
                    {players
                      .filter((p) => p.inDuplicateStorage)
                      .reduce((acc, p) => acc + p.effectiveItemScore, 0)}{' '}
                    Zero-Coin Item Score Ready
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Starting Core Chemistry</span>
                    <CheckCircle2 className="w-4 h-4 text-[#00ff87]" />
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#00ff87]">
                    {squadChemistry.totalChemistry} / 33
                  </div>
                  <div className="text-xs text-slate-400">
                    FC Barcelona (Rodri/Yamal/Pedri) + Real Madrid
                  </div>
                </div>
              </div>

              {/* Frictionless Club Sync Bar (Web App JSON + Google Drive + Voice) */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-[#00ff87] font-semibold">
                    Zero-Screenshot Club Synchronization (Antigravity v{t0Anchor.antigravityFirmware.version} /browser MCP Ready)
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    Sync EA FC 27 Companion Web App Inventory, Coins, Evolutions & Google Drive Backups
                  </h2>
                  <p className="text-xs text-slate-400">
                    Import Paletools / FUTClubAnalyzer Web App JSON dumps, sync to Google Drive REST API v3, or use Voice Mic transcription.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowJsonImportModal(true)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                  >
                    <Upload className="w-4 h-4 text-[#00ff87]" />
                    <span>Import Web App JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBackupToFirestoreAndDrive}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px] disabled:opacity-50"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>{isSyncingCloud ? 'Syncing...' : 'Backup to Google Drive'}</span>
                  </button>
                </div>
              </div>

              {/* Multi-Objective Match Stacker & 2026/27 Verified Club Roster */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Multi-Objective Match Stacker (850 SP Pacing) */}
                <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">
                        FC 27 Season Ladder Pacing (850 SP/Day Cap)
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        Multi-Objective "Match Stacker" (4 Matches = 3 Rewards)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDailySp((prev) => Math.min(850, prev + 75))}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-[#00ff87] rounded-md whitespace-nowrap shrink-0"
                    >
                      +75 SP Match Win
                    </button>
                  </div>

                  <div className="space-y-3">
                    {FC27_MATCH_STACKER_OBJECTIVES.map((obj) => (
                      <div
                        key={obj.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#00ff87]">{obj.sourceGroup}</span>
                          <span className="font-mono text-amber-400">
                            +{obj.spReward} SP · {obj.matchesRemaining} Matches
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white">{obj.title}</div>
                        <p className="text-xs text-slate-400">{obj.requirementText}</p>
                        <div className="text-xs text-slate-200 font-mono pt-1 border-t border-slate-800">
                          Squad Overlap: <strong className="text-[#00ff87]">{obj.requiredPlayersFilter}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Google Drive Backups List (if signed in) */}
                  {driveFiles.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-slate-300">
                        Google Drive FC 27 Club Snapshots ({driveFiles.length})
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

                {/* Right: 2026/27 Verified Club Inventory & SBC Duplicate Storage Table */}
                <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-400">
                        FotMob 2026/27 Roster Grounded · Holographic Multipliers Active
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        Club Inventory & SBC Duplicate Storage
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Click "Dup Storage" to toggle SBC priority
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2.5 pr-3 font-semibold">Player (26–27 Club)</th>
                          <th className="py-2.5 px-2 font-semibold">Rarity & Holo</th>
                          <th className="py-2.5 px-2 font-semibold">Item Score</th>
                          <th className="py-2.5 px-2 font-semibold">Console Price</th>
                          <th className="py-2.5 pl-2 font-semibold text-right">Storage State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {players.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 pr-3">
                              <div className="font-bold text-white">
                                {p.rating} {p.name} ({p.position})
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {p.club} · {p.league} · {p.nation}
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
                                {p.holographicMultiplier}x Score Mult
                              </div>
                            </td>
                            <td className="py-2.5 px-2 font-mono tabular-nums">
                              <strong className="text-white">{p.effectiveItemScore}</strong>
                              <span className="text-slate-400 text-[11px]"> ({p.baseItemScore} base)</span>
                            </td>
                            <td className="py-2.5 px-2 font-mono tabular-nums text-[#00ff87]">
                              {p.consolePrice.toLocaleString()}
                            </td>
                            <td className="py-2.5 pl-2 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setPlayers((prev) =>
                                    prev.map((item) =>
                                      item.id === p.id
                                        ? { ...item, inDuplicateStorage: !item.inDuplicateStorage }
                                        : item
                                    )
                                  )
                                }
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                  p.inDuplicateStorage
                                    ? 'bg-amber-400/20 border border-amber-400 text-amber-300'
                                    : 'bg-slate-900 border border-slate-700 text-slate-300'
                                }`}
                              >
                                {p.inDuplicateStorage ? 'In Dup Storage (0 Coins)' : 'Active Club XI'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DUAL-MODE SBC SOLVER (STREAMLINED ITEM SCORE & 11-PLAYER PUZZLE) */}
          {activeTab === 'DUAL_SBCS' && (
            <div className="space-y-6">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#00ff87] font-semibold">
                    FC 27 Dual-Mode SBC Engine (&lt;2ms Deterministic Item Score + Holographic Multiplier Solver)
                  </div>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    Streamlined SBC Item Score Optimizer & 11-Player Chemistry Puzzle Solver
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Exhausts untradeable SBC Duplicate Storage first, then exploits Regular Holographic (1.25x) & Pristine Holographic (1.50x) market anomalies.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useClubUntradeablesInSbc}
                      onChange={(e) => setUseClubUntradeablesInSbc(e.target.checked)}
                      className="accent-[#00ff87]"
                    />
                    <span>Include Club Untradeables (≤86 OVR)</span>
                  </label>

                  <button
                    type="button"
                    disabled={isThinkingArgon}
                    onClick={() =>
                      handleRunHighThinkingAdvisor(
                        `SBC Strategy: ${activeSbc.title}`,
                        `Solve ${activeSbc.title} (${activeSbc.category}). Target Item Score: ${activeSbc.targetItemScore || '11-Player 86 Rated Squad'}. Provide exact step-by-step submissions using my Duplicate Storage and the cheapest Console Holographic multipliers.`
                      )
                    }
                    className="px-4 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 min-h-[40px] disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isThinkingArgon ? 'Running Argon HIGH...' : 'Verify SBC with Gemini 4 Argon'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Active SBC Selector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FC27_ACTIVE_SBCS.map((sbc) => {
                  const selected = sbc.id === selectedSbcId;
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
                        <span className="font-mono text-slate-400">Expires {sbc.expiresInHours}h</span>
                      </div>
                      <div className="text-base font-bold text-white">{sbc.title}</div>
                      <div className="text-xs text-slate-400">{sbc.rewardDescription}</div>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-400">
                          {sbc.mode === 'STREAMLINED'
                            ? `Target Score: ${sbc.targetItemScore}`
                            : `Min Rating: ${sbc.minSquadRating} · Chem: ${sbc.minChemistry}/33`}
                        </span>
                        <span className="text-white">
                          Est: {sbc.estimatedMarketCost.toLocaleString()}
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
                    <div className="text-xs text-slate-400 font-mono">
                      Solved in {streamlinedSolution.executionTimeMs}ms (0 LLM Tokens Used for Math)
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Optimal Submission Recipe for {activeSbc.title}
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
                      <div className="text-xs text-slate-400">Coins Saved (Club/Dup)</div>
                      <div className="text-xl font-bold text-amber-400">
                        {streamlinedSolution.totalCoinsSavedFromClub.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Net Market Spend</div>
                      <div className="text-xl font-bold text-white">
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
                        <th className="py-2 pl-3 font-semibold text-right">Net Coin Cost</th>
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
                            {step.coinCost === 0 ? '0 Coins (Free)' : `${step.coinCost.toLocaleString()} Coins`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTHENTIC FUT GALLERY SET, TAG & "RENT-AND-FLIP" OPTIMIZER */}
          {activeTab === 'FUT_GALLERY' && (
            <div className="space-y-6">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#00ff87] font-semibold">
                    Authentic EA Sports FC 27 FUT Gallery Permanent Collection System (100+ Sets, Grades & Tags)
                  </div>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    FUT Gallery Set Tracker & Discard-Floor "Rent-and-Flip" Optimizer
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    In FC 27, cards stay permanently recorded in your Gallery even after you sell them. Buy near Quick Sell floor, register the Set/Tag points, and immediately flip for net profit after 5% EA Tax.
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="text-xs text-slate-400">Current Gallery Level</div>
                  <div className="text-2xl font-bold text-[#00ff87]">Level {galleryLevel} / 100</div>
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
                        <div className="text-xs text-amber-400">Grade: {set.currentGrade}</div>
                        <div className="text-sm font-bold text-white">
                          {set.registeredCount} / {set.totalCardsInSet} Cards
                        </div>
                      </div>
                    </div>

                    {/* Tag Bonuses */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-400">Set Tag Multipliers:</div>
                      <div className="flex flex-wrap gap-2">
                        {set.tagBonuses.map((tb) => (
                          <span
                            key={tb.tagName}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                              tb.unlocked
                                ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {tb.tagName}: {tb.multiplierText}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rent-and-Flip Discard Floor Candidates */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-800">
                      <div className="text-xs font-semibold text-slate-300">
                        "Rent-and-Flip" Discard Floor Candidates (5% EA Tax Accounted):
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
                                Buy: <strong>{cand.consoleBuyPrice.toLocaleString()}</strong> (Discard Floor:{' '}
                                {cand.quickSellFloor.toLocaleString()}) → Resell:{' '}
                                <strong>{cand.recommendedResellPrice.toLocaleString()}</strong>
                              </div>
                              <div className="font-mono text-[#00ff87]">
                                5% Tax: -{cand.eaTax5Pct} · Net Flip Profit: +{cand.netCoinDelta} Coins · +{cand.galleryPointsGained} Gallery Pts
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
                              {isDone ? 'Registered in Gallery' : 'Rent, Register & Flip'}
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

          {/* TAB 4: CONSOLE MARKET, INTERACTIVE CHARTS & 5G INVESTMENTS */}
          {activeTab === 'CONSOLE_MARKET' && (
            <div className="space-y-6">
              {/* Player Selector Bar for Interactive Chart */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Select Console Player for 24H/7D Chart:
                  </span>
                  {filteredMarketPlayers.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedMarketPlayerId(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                        selectedMarketPlayer.id === p.id
                          ? 'bg-[#00ff87] text-slate-950'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {p.rating} {p.name} ({p.club})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                  {[
                    { id: 'ALL', label: 'All Console Meta' },
                    { id: 'HOLOGRAPHIC', label: 'Holographics (1.25x/1.50x)' },
                    { id: 'BARCELONA', label: 'FC Barcelona 26–27' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMarketFilter5G(f.id as any)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        marketFilter5G === f.id
                          ? 'bg-amber-400 text-slate-950'
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
                isAnalyzingTrend={isThinkingArgon}
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
                    `Added ${player.name} (Buy: ${buyPrice.toLocaleString()} → Target: ${targetSell.toLocaleString()}) to 5G Investment Ledger.`
                  );
                }}
                onAskGeminiTrend={(player) =>
                  handleRunHighThinkingAdvisor(
                    `Console Market & 5G Trend Forecast: ${player.name}`,
                    `Analyze the 24H hourly and 7D console price trajectory for ${player.rating} OVR ${player.name} (${player.club}, ${player.rarity}, current price ${player.consolePrice} coins, Quick Sell floor ${player.quickSellDiscard} coins). Provide a 5G-friendly mass-bidding entry price, exact break-even after 5% EA tax, and optimal exit window around the 18:00 UK drop.`
                  )
                }
              />

              {/* Cheapest by Rating + Holographic Arbitrage Table & 5G Investment Ledger */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <div className="text-xs text-[#00ff87] font-semibold">
                      FUTBIN FC 27 Console Fodder & Holographic Multiplier Matrix
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Cheapest by Rating & Holographic Arbitrage (Coins per Item Score Point)
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
                          <th className="py-2 pl-2 font-semibold">Arbitrage Verdict</th>
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

                {/* Right: 5G Connection-Aware Investment Ledger */}
                <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <div className="text-xs text-amber-400 font-semibold">
                      5G Connection-Aware Trading (Zero 59th-Minute Latency Sniping)
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Active Bid-Flipping & Out-of-Packs Ledger (5% Tax Enforced)
                    </h3>
                  </div>

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
                            Buy: {inv.buyPrice.toLocaleString()} · Break-Even:{' '}
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
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOMAIN 2 — GAMEPLAY SYNTHESIS LAB, 31 ROLES++ & BRANCHING EVOLUTIONS */}
          {activeTab === 'GAMEPLAY_LAB' && (
            <GameplaySynthesisView
              t0Anchor={t0Anchor}
              players={players}
              isThinking={isThinkingArgon}
              onRunHighThinkingGameplay={handleRunHighThinkingAdvisor}
            />
          )}

          {/* TAB 6: ANTIGRAVITY v2.25 MCP HUB, VOICE TRANSCRIBE & MULTI-TURN GEMINI CHAT */}
          {activeTab === 'ANTIGRAVITY_AI' && (
            <AntigravityMcpAndChatDrawer
              t0Anchor={t0Anchor}
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
              <span className="font-bold">ZenBook UX482 ScreenPad+ Strip</span>
            </div>
            <div className="flex items-center gap-5 overflow-x-auto text-slate-300">
              <span>
                91 Rodri (FC Barcelona Pristine 1.5x): <strong className="text-[#00ff87]">284,000</strong> (+4.8%)
              </span>
              <span>
                89 Lamine Yamal (FC Barcelona): <strong className="text-[#00ff87]">348,000</strong> (+6.2%)
              </span>
              <span>
                88 Pristine Holo Fodder (465 Score): <strong className="text-amber-400">27,500</strong> (59.1 Coins/Pt)
              </span>
              <span>
                86 Regular Holo Fodder (238 Score): <strong className="text-[#00ff87]">10,900</strong> (Near Discard!)
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
          { id: 'CLUB_SYNC', label: 'Club', icon: Shield },
          { id: 'DUAL_SBCS', label: 'SBCs', icon: Layers },
          { id: 'FUT_GALLERY', label: 'Gallery', icon: Award },
          { id: 'CONSOLE_MARKET', label: 'Market', icon: TrendingUp },
          { id: 'GAMEPLAY_LAB', label: 'Gameplay', icon: Zap },
          { id: 'ANTIGRAVITY_AI', label: 'AI & MCP', icon: Cpu },
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

      {/* MODAL 1: Web App JSON Importer */}
      {showJsonImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Import EA FC 27 Companion Web App JSON
              </h3>
              <button
                type="button"
                onClick={() => setShowJsonImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Paste your exported Companion Web App JSON payload (or click "Load Sample Dump") to sync your coin balance, FC points, and daily SP immediately.
            </p>
            <textarea
              rows={5}
              value={jsonImportText}
              onChange={(e) => setJsonImportText(e.target.value)}
              placeholder='{"clubName": "Blaugrana 26-27 FC", "coins": 785000, "fifaPoints": 2200, "dailySp": 790}'
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00ff87]"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setJsonImportText(
                    JSON.stringify(
                      {
                        clubName: 'Blaugrana 26-27 FC (Web App Sync)',
                        coins: 785000,
                        fifaPoints: 2200,
                        dailySp: 790,
                      },
                      null,
                      2
                    )
                  )
                }
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg"
              >
                Load Sample Dump
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowJsonImportModal(false)}
                  className="px-3 py-2 bg-slate-900 text-xs text-slate-400 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyJsonImport}
                  className="px-4 py-2 bg-[#00ff87] text-slate-950 font-bold text-xs rounded-lg"
                >
                  Apply Sync
                </button>
              </div>
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
