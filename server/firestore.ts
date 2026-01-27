import { initializeApp, applicationDefault, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
// Uses GOOGLE_APPLICATION_CREDENTIALS environment variable or default credentials
if (getApps().length === 0) {
  // Check if we are in a local environment with a specific service account path
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    // Fallback to Application Default Credentials (good for Cloud Run/GCP)
    // OR if GOOGLE_APPLICATION_CREDENTIALS env var is set
    initializeApp({
      credential: applicationDefault()
    });
  }
}

export const db = getFirestore();
export const auth = getAuth();
db.settings({ ignoreUndefinedProperties: true });
