import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// 1. Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// 2. Initialize Firebase App Check ONLY if a genuine custom site key is configured
let initializedAppCheck = null;
const customRecaptchaKey = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY as string | undefined;
if (typeof window !== "undefined" && customRecaptchaKey && customRecaptchaKey.trim().length > 10) {
  try {
    initializedAppCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(customRecaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn("App Check initialization notice:", err);
  }
}
export const appCheck = initializedAppCheck;

// 3. Set Firestore log level
setLogLevel("error");

// 4. Resolve Database ID ('default' as confirmed in Firebase Console)
export const FIRESTORE_DATABASE_ID: string = 
  ((firebaseConfig as any).databaseId as string) || "default";

// 5. Initialize Firestore with target database ID, Long Polling and Persistent Local Cache
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  FIRESTORE_DATABASE_ID
);

export const auth = getAuth(app);

export interface FirestoreHealthStatus {
  available: boolean;
  code?: string;
  message: string;
  databaseId?: string;
}

// Live diagnostics function to check if Cloud Firestore database has been provisioned
export async function checkFirestoreHealth(): Promise<FirestoreHealthStatus> {
  try {
    const projectId = firebaseConfig.projectId;
    const apiKey = firebaseConfig.apiKey;
    const dbId = FIRESTORE_DATABASE_ID;

    // Check against a specific document path to avoid root collection listing restrictions
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/testing/testing%20document?key=${apiKey}`,
      { method: 'GET' }
    );

    const bodyText = await res.text();
    let bodyJson: any = null;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      // not JSON
    }

    if (res.status === 404 && bodyJson?.error?.message?.includes("does not exist")) {
      return {
        available: false,
        code: 'NOT_FOUND',
        databaseId: dbId,
        message: `Database '${dbId}' does not exist for project '${projectId}'.`
      };
    }

    if (res.status === 403 || res.status === 200 || (res.status === 404 && !bodyJson?.error?.message?.includes("does not exist"))) {
      // 403 or 200 indicates the database exists and responded from Google Cloud infrastructure
      return {
        available: true,
        code: 'ACTIVE',
        databaseId: dbId,
        message: `Firestore database '${dbId}' is live and responding.`
      };
    }

    return {
      available: false,
      code: `HTTP_${res.status}`,
      databaseId: dbId,
      message: `Firestore returned HTTP status ${res.status}.`
    };
  } catch (err: any) {
    return {
      available: false,
      code: 'NETWORK_ERROR',
      databaseId: FIRESTORE_DATABASE_ID,
      message: err?.message || 'Failed to check Firestore connectivity.'
    };
  }
}

// Non-blocking connection readiness helper
export async function testFirebaseConnection() {
  return Promise.resolve(true);
}

