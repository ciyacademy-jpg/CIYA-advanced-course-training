import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

export const RECAPTCHA_SITE_KEY = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_RECAPTCHA_SITE_KEY || "6LdbLnktAAAAAIGDPn9vKp2OXp_sg2HsAEvyH0Za";

// 1. Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// 2. Initialize Firebase App Check BEFORE any other Firebase services start
let initializedAppCheck = null;
if (typeof window !== "undefined" && RECAPTCHA_SITE_KEY) {
  try {
    initializedAppCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn("AppCheck initialization notice:", err);
  }
}
export const appCheck = initializedAppCheck;

// 3. Initialize subsequent Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connection check helper
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    // Gracefully handle offline or network connectivity notices in sandbox environment
    console.info("Firestore status: operating in standard or cached mode.");
  }
}
