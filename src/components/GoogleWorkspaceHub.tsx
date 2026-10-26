import React, { useState, useEffect } from 'react';
import {
  FileText,
  Table,
  Plus,
  ExternalLink,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Database,
  Coins,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { PushToTalkButton } from './PushToTalkButton';
import { User } from 'firebase/auth';
import {
  GoogleDocItem,
  GoogleSheetItem,
  DocSection,
  MasterSpreadsheetPayload,
  createFc27TacticalDoc,
  createFc27MasterSpreadsheet,
  listGoogleDocs,
  listGoogleSheets,
  appendNoteToGoogleDoc,
  appendInvestmentToSpreadsheet,
  readSpreadsheetRange,
  deleteWorkspaceFileConfirmed,
} from '../services/googleDocsAndSheetsService';
import {
  googleSignIn,
  logoutUser,
  getAccessToken,
} from '../services/firebaseAndDriveService';
import { FC27ConsolePlayer } from '../data/fc27ConsoleData';
import { ConsoleInvestmentPosition } from './InvestmentTrackerTab';

interface GoogleWorkspaceHubProps {
  currentUser: User | null;
  hasDriveToken: boolean;
  userCoins: number | null;
  clubName: string | null;
  rivalsDivision: string | null;
  activeFormation: string;
  startingXI: FC27ConsolePlayer[];
  trackedInvestments: ConsoleInvestmentPosition[];
  onOpenSyncModal?: () => void;
}

export function GoogleWorkspaceHub({
  currentUser,
  hasDriveToken,
  userCoins,
  clubName,
  rivalsDivision,
  activeFormation,
  startingXI,
  trackedInvestments,
}: GoogleWorkspaceHubProps) {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'SHEETS' | 'DOCS' | 'SETUP'>('SHEETS');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Lists state
  const [sheetsList, setSheetsList] = useState<GoogleSheetItem[]>([]);
  const [docsList, setDocsList] = useState<GoogleDocItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active preview
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetPreviewData, setSheetPreviewData] = useState<any[][] | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Quick Append Form State
  const [quickPlayerName, setQuickPlayerName] = useState<string>('Alejandro Balde');
  const [quickPlayerOvr, setQuickPlayerOvr] = useState<number>(83);
  const [quickBuyPrice, setQuickBuyPrice] = useState<number>(8400);
  const [quickTargetPrice, setQuickTargetPrice] = useState<number>(11500);

  // Append note to Doc state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docNoteHeading, setDocNoteHeading] = useState<string>('Match Day Scouting Note');
  const [docNoteBody, setDocNoteBody] = useState<string>('');

  // Mandatory Workspace Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'CREATE_SHEET' | 'CREATE_DOC' | 'APPEND_ROW' | 'APPEND_DOC' | 'DELETE_FILE';
    targetId?: string;
    targetName?: string;
    payload?: any;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'CREATE_SHEET',
  });

  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  const isAuthenticated = Boolean(currentUser && hasDriveToken);

  // Auto-load files on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadWorkspaceFiles();
    }
  }, [isAuthenticated]);

  const loadWorkspaceFiles = async () => {
    setIsLoadingList(true);
    setStatusMessage(null);
    try {
      const [sheets, docs] = await Promise.allSettled([
        listGoogleSheets(),
        listGoogleDocs(),
      ]);

      if (sheets.status === 'fulfilled') {
        setSheetsList(sheets.value);
        if (sheets.value.length > 0 && !selectedSheetId) {
          setSelectedSheetId(sheets.value[0].id);
          previewSheet(sheets.value[0].id);
        }
      }
      if (docs.status === 'fulfilled') {
        setDocsList(docs.value);
        if (docs.value.length > 0 && !selectedDocId) {
          setSelectedDocId(docs.value[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching Workspace files:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to list Workspace files.' });
    } finally {
      setIsLoadingList(false);
    }
  };

  const previewSheet = async (spreadsheetId: string) => {
    setIsLoadingPreview(true);
    try {
      const values = await readSpreadsheetRange(spreadsheetId, "'Investment Tracker & EA Tax'!A1:H15");
      setSheetPreviewData(values);
    } catch (err) {
      // Try default range
      try {
        const fallback = await readSpreadsheetRange(spreadsheetId, 'A1:H15');
        setSheetPreviewData(fallback);
      } catch (e) {
        setSheetPreviewData(null);
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await googleSignIn();
      setStatusMessage({ type: 'success', text: 'Connected to Google Workspace with Docs & Sheets scopes.' });
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err?.message || 'Failed to sign in with Google Workspace.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    setSheetsList([]);
    setDocsList([]);
    setSheetPreviewData(null);
    setStatusMessage({ type: 'success', text: 'Signed out from Google Workspace.' });
  };

  // 1. Create Master Spreadsheet trigger (triggers confirmation modal)
  const promptCreateMasterSpreadsheet = () => {
    const defaultTitle = `FC27_Master_Club_Ledger_${new Date().toISOString().slice(0, 10)}`;
    setConfirmDialog({
      isOpen: true,
      title: 'Create Google Sheet in your Google Drive?',
      description: `This will create a new Google Spreadsheet titled "${defaultTitle}" with 3 dedicated tabs:\n1. "Investment Tracker & EA Tax" (Automated formulas for 5% EA transfer tax and break-even calculations)\n2. "Starting XI & Roles++" (${startingXI.length} players with 2026/27 clubs and PlayStyles+)\n3. "FUT Fodder & SBC Index" (Current Xbox Series S cheapest BIN benchmarks).`,
      actionType: 'CREATE_SHEET',
      payload: { title: defaultTitle },
    });
  };

  // 2. Create Tactical Dossier Doc trigger (triggers confirmation modal)
  const promptCreateTacticalDoc = (docType: 'TACTICAL_DOSSIER' | 'SCOUTING_REPORT') => {
    const defaultTitle =
      docType === 'TACTICAL_DOSSIER'
        ? `FC27_Tactical_Director_Dossier_${new Date().toISOString().slice(0, 10)}`
        : `FC27_Xbox_Scouting_Report_35k_${new Date().toISOString().slice(0, 10)}`;

    const description =
      docType === 'TACTICAL_DOSSIER'
        ? `This will create a new Google Doc in your Google Drive containing your complete Starting XI analysis (${activeFormation}), 31 Roles++ allocations, AcceleRATE 2.0 sprint physics notes, and dual-mode SBC recommendations.`
        : `This will create a new Google Doc analyzing your Xbox Series S squad's weakest link and scouting 2 immediate meta upgrades within your confirmed 35,000 Coin budget.`;

    setConfirmDialog({
      isOpen: true,
      title: 'Create Google Doc in your Google Drive?',
      description,
      actionType: 'CREATE_DOC',
      payload: { title: defaultTitle, docType },
    });
  };

  // 3. Prompt Append Row
  const promptAppendRow = () => {
    if (!selectedSheetId) return;
    const sheetName = sheetsList.find((s) => s.id === selectedSheetId)?.name || 'selected spreadsheet';
    setConfirmDialog({
      isOpen: true,
      title: 'Append Trade Row to Google Sheet?',
      description: `This will write a new trade entry for ${quickPlayerName} (${quickPlayerOvr} OVR, Buy: ${quickBuyPrice.toLocaleString()} coins, Target: ${quickTargetPrice.toLocaleString()} coins) to "${sheetName}".`,
      actionType: 'APPEND_ROW',
      targetId: selectedSheetId,
      targetName: sheetName,
      payload: {
        playerName: quickPlayerName,
        rating: quickPlayerOvr,
        buyPrice: quickBuyPrice,
        targetSellPrice: quickTargetPrice,
      },
    });
  };

  // 4. Prompt Append Doc Note
  const promptAppendDoc = () => {
    if (!selectedDocId || !docNoteBody.trim()) return;
    const docName = docsList.find((d) => d.id === selectedDocId)?.name || 'selected document';
    setConfirmDialog({
      isOpen: true,
      title: 'Append Tactical Note to Google Doc?',
      description: `This will append the note "${docNoteHeading}" to "${docName}".`,
      actionType: 'APPEND_DOC',
      targetId: selectedDocId,
      targetName: docName,
      payload: {
        heading: docNoteHeading,
        body: docNoteBody,
      },
    });
  };

  // 5. Prompt Delete File
  const promptDeleteFile = (fileId: string, fileName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete File from Google Drive?',
      description: `Are you sure you want to delete "${fileName}"? This action cannot be undone.`,
      actionType: 'DELETE_FILE',
      targetId: fileId,
      targetName: fileName,
    });
  };

  // Execute Confirmed Operation
  const executeConfirmedAction = async () => {
    setIsExecutingAction(true);
    setStatusMessage(null);
    try {
      if (confirmDialog.actionType === 'CREATE_SHEET') {
        const payload: MasterSpreadsheetPayload = {
          clubName: clubName || undefined,
          coins: userCoins || 35000,
          formation: activeFormation,
          chemistryScore: 33,
          startingXI: startingXI.map((p) => ({
            name: p.name,
            rating: p.rating,
            position: p.position,
            club: p.club,
            league: p.league,
            nation: p.nation,
            rolePlusPlus: p.roles.find((r) => r.tier === 'Role++')?.roleName,
            playStylesPlus: p.playStylesPlus,
            consolePrice: p.consolePrice,
          })),
          investments: trackedInvestments.map((inv) => ({
            id: inv.id,
            playerName: inv.playerName,
            rating: inv.rating,
            buyPrice: inv.buyPrice,
            targetSellPrice: inv.targetSellPrice,
            status: (inv.status === 'sold'
              ? 'SOLD'
              : inv.status === 'target_hit'
              ? 'LISTED'
              : 'HOLDING') as 'HOLDING' | 'LISTED' | 'SOLD',
            notes: inv.notes,
          })),
        };

        const result = await createFc27MasterSpreadsheet(confirmDialog.payload.title, payload);
        setStatusMessage({
          type: 'success',
          text: `Spreadsheet "${result.title}" created successfully!`,
        });
        await loadWorkspaceFiles();
        setSelectedSheetId(result.spreadsheetId);
        await previewSheet(result.spreadsheetId);
      } else if (confirmDialog.actionType === 'CREATE_DOC') {
        const docSections: DocSection[] = [
          {
            heading: 'Executive Tactical Director Summary',
            body: `Starting Formation: ${activeFormation} | Chemistry Structure: 33/33\nConfirmed Liquid Capital: ${(userCoins || 35000).toLocaleString()} Xbox Series S Coins.\nOperating Season: 2026/27 (Strictly FotMob Grounded — Rodri at FC Barcelona, Mbappé at Real Madrid).\nKey Directive: Maintain zero-coin fodder burn in Streamlined SBCs while preserving liquid coins for key Evolution branches.`,
          },
          {
            heading: 'Starting XI Roster & 31 Roles++ Allocation',
            body: startingXI
              .map(
                (p, idx) =>
                  `${idx + 1}. [${p.position}] ${p.name} (${p.rating} OVR) — Club: ${p.club} | Role++: ${
                    p.roles.find((r) => r.tier === 'Role++')?.roleName || 'Standard Role'
                  } | PS+: ${(p.playStylesPlus || []).join(', ') || 'None'}`
              )
              .join('\n'),
          },
          {
            heading: 'EA Tax Strategy & Investment Protocols',
            body: `All card transactions adhere to the mandatory 5% EA Transfer Tax formula:\nNet Return = (Sale Price * 0.95) - Buy Price\nBreak-Even Requirement = Buy Price / 0.95\nFUT Gallery Rent-and-Flip Protocol: Acquire Set cards at discard floor, register permanent Tag XP, and re-list at break-even to recover 100% of liquid coin reserves.`,
          },
          {
            heading: 'FUTBIN & FUT.GG Grounded Market Scouting',
            body: `Top Tier-1 Target under 35,000 Coins: Alejandro Balde (83 OVR, ~8,400 Coins) — Strong link to Rodri (FC Barcelona), eligible for Titans Wingback Evolution.\nTop Tier-2 Progressive Target: Eduardo Camavinga (84 OVR, ~14,500 Coins) — Box-to-Box++ midfield engine.\nAlways monitor 18:00 UK Content Drop for holographic multiplier fodder shifts (1.25x Regular Holo <=87 / 1.50x Pristine Holo >=88).`,
          },
        ];

        const result = await createFc27TacticalDoc(confirmDialog.payload.title, docSections);
        setStatusMessage({
          type: 'success',
          text: `Google Doc "${result.title}" created successfully!`,
        });
        await loadWorkspaceFiles();
        setSelectedDocId(result.documentId);
      } else if (confirmDialog.actionType === 'APPEND_ROW' && confirmDialog.targetId) {
        await appendInvestmentToSpreadsheet(confirmDialog.targetId, confirmDialog.payload);
        setStatusMessage({
          type: 'success',
          text: `Added trade row for ${confirmDialog.payload.playerName} to spreadsheet.`,
        });
        await previewSheet(confirmDialog.targetId);
      } else if (confirmDialog.actionType === 'APPEND_DOC' && confirmDialog.targetId) {
        await appendNoteToGoogleDoc(
          confirmDialog.targetId,
          confirmDialog.payload.heading,
          confirmDialog.payload.body
        );
        setStatusMessage({
          type: 'success',
          text: `Note appended to Google Doc successfully.`,
        });
        setDocNoteBody('');
      } else if (confirmDialog.actionType === 'DELETE_FILE' && confirmDialog.targetId) {
        await deleteWorkspaceFileConfirmed(confirmDialog.targetId);
        setStatusMessage({
          type: 'success',
          text: `Deleted "${confirmDialog.targetName}" from Google Drive.`,
        });
        await loadWorkspaceFiles();
        if (selectedSheetId === confirmDialog.targetId) {
          setSelectedSheetId(null);
          setSheetPreviewData(null);
        }
        if (selectedDocId === confirmDialog.targetId) {
          setSelectedDocId(null);
        }
      }
    } catch (err: any) {
      console.error('Error executing Workspace action:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Operation failed.' });
    } finally {
      setIsExecutingAction(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#0b1320] border border-[#1e293b] rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#00ff87]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#38bdf8]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded bg-[#00ff87]/15 text-[#00ff87] text-xs font-mono font-bold tracking-wider border border-[#00ff87]/30 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                GOOGLE WORKSPACE 1P SUITE
              </span>
              <span className="px-2.5 py-1 rounded bg-[#38bdf8]/15 text-[#38bdf8] text-xs font-mono border border-[#38bdf8]/30">
                DOCS v1 · SHEETS v4 · DRIVE v3
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Google Docs & Sheets Tactical Command Hub
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Export and synchronize your Starting XI, 31 Roles++, verified 2026/27 transfers, and 5% EA Tax
              investment portfolio directly into live Google Docs & Sheets.
            </p>
          </div>

          {/* Auth Button or Account Status */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="gsi-material-button flex items-center gap-3 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5 block"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </div>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00ff87]/20 border border-[#00ff87]/50 flex items-center justify-center text-[#00ff87] font-bold text-xs">
                  {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    {currentUser?.email || 'Connected'}
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff87]" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Docs & Sheets Active
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-2 text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87]'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Selection Bar */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveWorkspaceTab('SHEETS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeWorkspaceTab === 'SHEETS'
                ? 'bg-[#00ff87] text-slate-950 shadow-md font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            Google Sheets (Investment Ledger & Squad Master)
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px]">
              {sheetsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveWorkspaceTab('DOCS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeWorkspaceTab === 'DOCS'
                ? 'bg-[#38bdf8] text-slate-950 shadow-md font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Google Docs (Tactical Dossiers & Scouting Briefs)
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px]">
              {docsList.length}
            </span>
          </button>

          <div className="ml-auto">
            <button
              onClick={loadWorkspaceFiles}
              disabled={isLoadingList || !isAuthenticated}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Refresh Workspace Files"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Google Sheets Tab View */}
      {activeWorkspaceTab === 'SHEETS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Actions & Available Spreadsheets */}
          <div className="space-y-4">
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Table className="w-4 h-4 text-[#00ff87]" />
                FC 27 Master Spreadsheet Actions
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Generate a live multi-tab Google Sheet pre-loaded with formulas for the 5% EA Tax, Starting XI
                breakdown, and fodder pricing benchmarks.
              </p>

              <button
                onClick={promptCreateMasterSpreadsheet}
                disabled={!isAuthenticated || isExecutingAction}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#10b981] hover:brightness-110 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create FC 27 Master Spreadsheet
              </button>

              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>Pre-Configured Tabs:</span>
                  <span className="text-[#00ff87]">3 Sheets</span>
                </div>
                <div className="text-slate-400">• Tab 1: Investment Tracker (5% EA Tax & Break-Even)</div>
                <div className="text-slate-400">• Tab 2: Starting XI ({startingXI.length} Players & Roles++)</div>
                <div className="text-slate-400">• Tab 3: FUT Fodder & SBC Multipliers (1.25x / 1.50x)</div>
              </div>
            </div>

            {/* Quick Append Row Card */}
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-[#00ff87]" />
                Log Trade to Selected Sheet
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Player Name</label>
                  <input
                    type="text"
                    value={quickPlayerName}
                    onChange={(e) => setQuickPlayerName(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff87]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono">OVR Rating</label>
                    <input
                      type="number"
                      value={quickPlayerOvr}
                      onChange={(e) => setQuickPlayerOvr(parseInt(e.target.value, 10) || 83)}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff87]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Buy Price (Coins)</label>
                    <input
                      type="number"
                      value={quickBuyPrice}
                      onChange={(e) => setQuickBuyPrice(parseInt(e.target.value, 10) || 0)}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff87]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Target Sell Price (Coins)</label>
                  <input
                    type="number"
                    value={quickTargetPrice}
                    onChange={(e) => setQuickTargetPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff87]"
                  />
                </div>

                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>5% EA Tax:</span>
                    <span className="text-amber-400">-{Math.floor(quickTargetPrice * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Break-Even:</span>
                    <span className="text-slate-400">{Math.ceil(quickBuyPrice / 0.95).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Net Profit:</span>
                    <span className="text-[#00ff87]">
                      +{(Math.floor(quickTargetPrice * 0.95) - quickBuyPrice).toLocaleString()} Coins
                    </span>
                  </div>
                </div>

                <button
                  onClick={promptAppendRow}
                  disabled={!isAuthenticated || !selectedSheetId || isExecutingAction}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 text-[#00ff87]" />
                  Append Row to Sheet
                </button>
              </div>
            </div>

            {/* List of FC 27 Google Sheets */}
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Your Google Sheets ({sheetsList.length})
                </span>
                <button
                  onClick={loadWorkspaceFiles}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              {sheetsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No FC 27 Google Sheets found in your Google Drive.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {sheetsList.map((sheet) => (
                    <div
                      key={sheet.id}
                      onClick={() => {
                        setSelectedSheetId(sheet.id);
                        previewSheet(sheet.id);
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedSheetId === sheet.id
                          ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5">
                          <Table className="w-3.5 h-3.5 text-[#00ff87] shrink-0" />
                          {sheet.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(sheet.modifiedTime).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={sheet.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-slate-400 hover:text-[#00ff87] rounded hover:bg-slate-800"
                          title="Open in Google Sheets"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteFile(sheet.id, sheet.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                          title="Delete from Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Spreadsheet Inspector / Viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-5 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00ff87] animate-pulse" />
                  <span className="text-sm font-bold text-white">
                    {selectedSheetId
                      ? sheetsList.find((s) => s.id === selectedSheetId)?.name || 'Spreadsheet Inspector'
                      : 'Live Google Sheet Preview'}
                  </span>
                </div>

                {selectedSheetId && (
                  <div className="flex items-center gap-2">
                    <a
                      href={sheetsList.find((s) => s.id === selectedSheetId)?.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open in Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {isLoadingPreview ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-16">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#00ff87]" />
                  <span className="text-xs">Fetching spreadsheet cells via Google Sheets API v4...</span>
                </div>
              ) : sheetPreviewData && sheetPreviewData.length > 0 ? (
                <div className="flex-1 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                        {sheetPreviewData[0]?.map((col: any, idx: number) => (
                          <th key={idx} className="p-2.5 font-semibold text-slate-300 whitespace-nowrap">
                            {String(col)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {sheetPreviewData.slice(1).map((row: any[], rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-slate-900/40 transition-colors">
                          {row.map((cell: any, cellIdx: number) => (
                            <td key={cellIdx} className="p-2.5 whitespace-nowrap">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  <Table className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-400">No Spreadsheet Selected</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Select an existing Google Sheet from the list on the left, or create an authentic FC 27
                    Master Spreadsheet to track trades, starting squad, and fodder indices.
                  </p>
                  <button
                    onClick={promptCreateMasterSpreadsheet}
                    disabled={!isAuthenticated}
                    className="mt-4 px-4 py-2 rounded-lg bg-[#00ff87]/20 border border-[#00ff87]/40 text-[#00ff87] text-xs font-bold hover:bg-[#00ff87]/30 transition-colors"
                  >
                    + Create Master Spreadsheet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Google Docs Tab View */}
      {activeWorkspaceTab === 'DOCS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Create Documents & Document Browser */}
          <div className="space-y-4">
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#38bdf8]" />
                Google Docs Tactical Reports
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Generate professional tactical dossiers and market scouting briefings formatted for the Google
                Docs API v1.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => promptCreateTacticalDoc('TACTICAL_DOSSIER')}
                  disabled={!isAuthenticated || isExecutingAction}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] hover:brightness-110 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Generate Tactical Dossier Doc
                </button>

                <button
                  onClick={() => promptCreateTacticalDoc('SCOUTING_REPORT')}
                  disabled={!isAuthenticated || isExecutingAction}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs transition-colors disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Generate 35k Coin Scouting Brief
                </button>
              </div>
            </div>

            {/* Append Note to Selected Doc */}
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Append Note to Selected Doc
                </h3>
                <PushToTalkButton
                  compact
                  label="Dictate Note"
                  onTranscript={(text) => {
                    setDocNoteBody((prev) => (prev ? `${prev} ${text}` : text));
                  }}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Note Heading</label>
                  <input
                    type="text"
                    value={docNoteHeading}
                    onChange={(e) => setDocNoteHeading(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Note Content</label>
                  <textarea
                    rows={3}
                    value={docNoteBody}
                    onChange={(e) => setDocNoteBody(e.target.value)}
                    placeholder="Enter tactical observation, patch reaction, or match result..."
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#38bdf8] resize-none"
                  />
                </div>

                <button
                  onClick={promptAppendDoc}
                  disabled={!isAuthenticated || !selectedDocId || !docNoteBody.trim() || isExecutingAction}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Append Note to Document
                </button>
              </div>
            </div>

            {/* List of FC 27 Google Docs */}
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Your Google Docs ({docsList.length})
                </span>
                <button
                  onClick={loadWorkspaceFiles}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              {docsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No FC 27 Google Docs found in your Google Drive.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {docsList.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedDocId === doc.id
                          ? 'bg-[#38bdf8]/10 border-[#38bdf8]/40 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                          {doc.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(doc.modifiedTime).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={doc.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-slate-400 hover:text-[#38bdf8] rounded hover:bg-slate-800"
                          title="Open in Google Docs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteFile(doc.id, doc.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                          title="Delete from Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Google Doc Info & Live Template Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-5 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#38bdf8] animate-pulse" />
                  <span className="text-sm font-bold text-white">
                    {selectedDocId
                      ? docsList.find((d) => d.id === selectedDocId)?.name || 'Document Overview'
                      : 'Google Docs Tactical Dossier Generator'}
                  </span>
                </div>

                {selectedDocId && (
                  <div className="flex items-center gap-2">
                    <a
                      href={docsList.find((d) => d.id === selectedDocId)?.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open in Google Docs</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Document Mockup Preview Container */}
              <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-6 font-sans text-slate-300 overflow-y-auto max-h-[600px] shadow-inner">
                <div className="border-b border-slate-800 pb-4 mb-4">
                  <div className="text-[11px] text-[#38bdf8] font-mono uppercase tracking-wider mb-1">
                    EA SPORTS FC 27 ULTIMATE TEAM · PRO CONSOLE EDITION (XBOX SERIES S)
                  </div>
                  <h1 className="text-xl font-black text-white">
                    {selectedDocId
                      ? docsList.find((d) => d.id === selectedDocId)?.name
                      : 'Executive Tactical Dossier & Market Analysis'}
                  </h1>
                  <div className="text-xs text-slate-500 font-mono mt-1">
                    T=0 Grounded Anchor: {new Date().toUTCString()} · Europe/London British Time
                  </div>
                </div>

                <div className="space-y-6 text-xs leading-relaxed">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                      <span className="text-[#38bdf8]">■</span> EXECUTIVE TACTICAL DIRECTOR SUMMARY
                    </h3>
                    <p className="text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
                      Active Formation: <strong className="text-white">{activeFormation}</strong> | Chemistry
                      Score: <strong className="text-[#00ff87]">33/33</strong> | Liquid Reserve:{' '}
                      <strong className="text-white">
                        {(userCoins || 35000).toLocaleString()} Xbox Series S Coins
                      </strong>
                      .<br />
                      Operating in Season 2026/27 with verified transfers (Rodri at FC Barcelona, Kylian Mbappé
                      at Real Madrid). Zero legacy FC 24/25/26 mechanics. Dual-mode Streamlined SBCs utilize
                      holographic multipliers (1.25x Regular ≤87 / 1.50x Pristine ≥88) to preserve liquid coins.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                      <span className="text-[#38bdf8]">■</span> STARTING XI & 31 ROLES++ ALLOCATIONS
                    </h3>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {startingXI.slice(0, 5).map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800/60"
                        >
                          <span className="text-[#38bdf8] font-bold">[{p.position}]</span>
                          <span className="text-white font-medium">{p.name} ({p.rating} OVR)</span>
                          <span className="text-slate-400">{p.club}</span>
                          <span className="text-[#00ff87]">
                            {p.roles.find((r) => r.tier === 'Role++')?.roleName || 'Standard Role'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                      <span className="text-[#38bdf8]">■</span> 5% EA TAX FORMULA & TRANSFER DISCIPLINE
                    </h3>
                    <p className="text-slate-400">
                      Every market flip or card liquidation enforces the mandatory 5% EA tax calculation:
                      <code className="block mt-1 p-2 rounded bg-slate-900 font-mono text-[#00ff87]">
                        Net Coins Recovered = (Sale Price × 0.95) - Purchase Price
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MANDATORY WORKSPACE CONFIRMATION MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1320] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {confirmDialog.title}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Google Workspace User Authorization
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {confirmDialog.description}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                disabled={isExecutingAction}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={isExecutingAction}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#10b981] hover:brightness-110 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
              >
                {isExecutingAction ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm & Proceed</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
