import dotenv from "dotenv";
import firebaseAdmin from "firebase-admin";

dotenv.config();

let firebaseInstance: firebaseAdmin.app.App | null = null;

export const initializeFirebase = () => {
  try {
    // If already initialized, return existing instance
    if (firebaseInstance) {
      return firebaseInstance;
    }

    // Validate required environment variables
    const requiredEnvVars = [
      "FIREBASE_project_id",
      "FIREBASE_client_email",
      "FIREBASE_private_key",
      "FIREBASE_storage_bucket",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    const adminConfig = {
      credential: firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_project_id,
        clientEmail: process.env.FIREBASE_client_email,
        privateKey: process.env.FIREBASE_private_key?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_storage_bucket,
    };

    firebaseInstance = firebaseAdmin.initializeApp(adminConfig);
    return firebaseInstance;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Firebase initialization failed: ${errorMessage}`);
  }
};

export const getStorageBucket = () => {
  const app = initializeFirebase();
  return app.storage().bucket();
};
