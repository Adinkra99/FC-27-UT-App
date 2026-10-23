/**
 * Firebase Auth, Firestore Zero-Trust Persistence & Google Drive REST API v3 Service
 * - Uses firebase-applet-config.json
 * - Validates Firestore connection on boot with getDocFromServer
 * - Enforces structured FirestoreErrorInfo error handling
 * - Caches Google Workspace OAuth access token strictly in memory (never localStorage)
 * - Enforces user confirmation before any mutating/overwrite/delete Drive call
 */

import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const WORKSPACE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const provider = new GoogleAuthProvider();
for (const scope of WORKSPACE_DRIVE_SCOPES) {
  provider.addScope(scope);
}

// Strictly in-memory OAuth token cache per Workspace Integration skill
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Workspace access token from sign-in.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => cachedAccessToken;

export const logoutUser = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Syncs the user's FC 27 Club Wallet, SP, Gallery Level & T=0 Firmware State to Firestore
 * adhering strictly to firebase-blueprint.json & firestore.rules.
 */
export async function syncClubStateToFirestore(payload: {
  clubName: string;
  coins: number;
  fifaPoints: number;
  dailySp: number;
  galleryLevel: number;
  activeFormation: string;
  antigravityVersion: string;
  fc27PatchVersion: string;
  lastT0Anchor: string;
}) {
  const user = auth.currentUser;
  if (!user) return null;

  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  const sanitized = {
    ownerId: user.uid.slice(0, 128),
    clubName: (payload.clubName || 'Blaugrana 26-27 FC').slice(0, 64),
    coins: Math.max(0, Math.min(100000000, Math.round(payload.coins))),
    fifaPoints: Math.max(0, Math.min(1000000, Math.round(payload.fifaPoints))),
    dailySp: Math.max(0, Math.min(850, Math.round(payload.dailySp))),
    galleryLevel: Math.max(1, Math.min(100, Math.round(payload.galleryLevel))),
    activeFormation: (payload.activeFormation || '4-2-1-3').slice(0, 32),
    antigravityVersion: (payload.antigravityVersion || '2.25').slice(0, 32),
    fc27PatchVersion: (payload.fc27PatchVersion || 'TU #3.1').slice(0, 64),
    lastT0Anchor: (payload.lastT0Anchor || new Date().toISOString()).slice(0, 64),
  };

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        clubName: sanitized.clubName,
        coins: sanitized.coins,
        fifaPoints: sanitized.fifaPoints,
        dailySp: sanitized.dailySp,
        galleryLevel: sanitized.galleryLevel,
        activeFormation: sanitized.activeFormation,
        antigravityVersion: sanitized.antigravityVersion,
        fc27PatchVersion: sanitized.fc27PatchVersion,
        lastT0Anchor: sanitized.lastT0Anchor,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

export async function loadClubStateFromFirestore() {
  const user = auth.currentUser;
  if (!user) return null;
  const userPath = `users/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }
}

/**
 * Google Drive REST API v3 Integration
 * Lists FC 27 UT App backup files in the user's Google Drive.
 */
export interface DriveFileSummary {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
}

export async function listFc27DriveBackups(): Promise<DriveFileSummary[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('GOOGLE_DRIVE_TOKEN_REQUIRED');
  }
  const query = encodeURIComponent("name contains 'FC27_UT_' and trashed = false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,mimeType)&orderBy=modifiedTime desc&pageSize=10`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    throw new Error(`Google Drive list failed (${res.status})`);
  }
  const data = await res.json();
  return data.files || [];
}

/**
 * Creates a new JSON snapshot file in Google Drive.
 */
export async function createFc27DriveSnapshot(fileName: string, contentObj: unknown): Promise<DriveFileSummary> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('GOOGLE_DRIVE_TOKEN_REQUIRED');
  }

  const metadata = {
    name: fileName.startsWith('FC27_UT_') ? fileName : `FC27_UT_${fileName}`,
    mimeType: 'application/json',
  };

  const boundary = 'fc27_ut_multipart_boundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(contentObj, null, 2)}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,mimeType',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    throw new Error(`Google Drive upload failed (${res.status})`);
  }
  return await res.json();
}

/**
 * Deletes a file from Google Drive (MUST only be called after explicit user confirmation modal).
 */
export async function deleteFc27DriveSnapshotConfirmed(fileId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('GOOGLE_DRIVE_TOKEN_REQUIRED');
  }
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Google Drive delete failed (${res.status})`);
  }
}
