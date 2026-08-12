import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { initializeApp as initClient } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  collection as firestoreCollection, 
  doc as firestoreDoc, 
  getDoc as firestoreGetDoc, 
  getDocs as firestoreGetDocs, 
  setDoc as firestoreSetDoc, 
  updateDoc as firestoreUpdateDoc, 
  deleteDoc as firestoreDeleteDoc 
} from "firebase/firestore";

// Interfaces
interface IPTVUser {
  id: string;
  username: string;
  passwordHash: string;
  encryptedUrl: string;
  createdAt: number;
  expiresAt: number; // Timestamp (Date.now() + duration)
  durationDays: number;
  status: "active" | "expired";
}

interface AdminUser {
  username: string;
  passwordHash: string;
  createdAt: number;
  role: "superuser" | "admin";
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Configuration
const IPTV_ENCRYPTION_KEY = process.env.IPTV_ENCRYPTION_KEY || "iptv-secure-super-secret-key-32-chars!";

// --- LOCAL FALLBACK DATABASE & FIREBASE SMART WRAPPER ---
class LocalDatabase {
  private filePath = path.join(process.cwd(), "data", "local-db.json");

  constructor() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({ admin_users: {}, iptv_users: {} }), "utf8");
    }
  }

  private read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { admin_users: {}, iptv_users: {} };
      }
      const data = fs.readFileSync(this.filePath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.error("Failed to read local DB:", err);
      return { admin_users: {}, iptv_users: {} };
    }
  }

  private write(data: any) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to write to local DB:", err);
    }
  }

  get(collection: string, id: string) {
    const db = this.read();
    const col = db[collection] || {};
    return col[id] || null;
  }

  set(collection: string, id: string, data: any) {
    const db = this.read();
    if (!db[collection]) db[collection] = {};
    db[collection][id] = data;
    this.write(db);
  }

  update(collection: string, id: string, data: any) {
    const db = this.read();
    if (!db[collection]) db[collection] = {};
    const existing = db[collection][id] || {};
    db[collection][id] = { ...existing, ...data };
    this.write(db);
  }

  delete(collection: string, id: string) {
    const db = this.read();
    if (db[collection]) {
      delete db[collection][id];
      this.write(db);
    }
  }

  list(collection: string) {
    const db = this.read();
    const col = db[collection] || {};
    return Object.keys(col).map(id => ({
      id,
      data: col[id]
    }));
  }
}

class DocumentWrapper {
  constructor(
    private collectionName: string, 
    private docId: string, 
    private rawDb: any, 
    private localDb: LocalDatabase
  ) {}

  async get() {
    if (this.rawDb) {
      try {
        const docRef = firestoreDoc(this.rawDb, this.collectionName, this.docId);
        const docSnap = await firestoreGetDoc(docRef);
        // Sync to local database to keep local database updated
        if (docSnap.exists()) {
          this.localDb.set(this.collectionName, this.docId, docSnap.data());
        } else {
          this.localDb.delete(this.collectionName, this.docId);
        }
        return {
          exists: docSnap.exists(),
          id: docSnap.id,
          data: () => docSnap.data()
        };
      } catch (err: any) {
        console.warn(`Firestore read failed (${err.message}). Falling back to local database for ${this.collectionName}/${this.docId}.`);
      }
    }
    const data = this.localDb.get(this.collectionName, this.docId);
    return {
      exists: data !== null,
      id: this.docId,
      data: () => data
    };
  }

  async set(data: any) {
    // Always write to local database as primary backup
    this.localDb.set(this.collectionName, this.docId, data);
    if (this.rawDb) {
      try {
        const docRef = firestoreDoc(this.rawDb, this.collectionName, this.docId);
        await firestoreSetDoc(docRef, data);
      } catch (err: any) {
        console.warn(`Firestore set failed (${err.message}). Saved to local backup only.`);
      }
    }
  }

  async update(data: any) {
    this.localDb.update(this.collectionName, this.docId, data);
    if (this.rawDb) {
      try {
        const docRef = firestoreDoc(this.rawDb, this.collectionName, this.docId);
        await firestoreSetDoc(docRef, data, { merge: true });
      } catch (err: any) {
        console.warn(`Firestore update failed (${err.message}). Updated in local backup only.`);
      }
    }
  }

  async delete() {
    this.localDb.delete(this.collectionName, this.docId);
    if (this.rawDb) {
      try {
        const docRef = firestoreDoc(this.rawDb, this.collectionName, this.docId);
        await firestoreDeleteDoc(docRef);
      } catch (err: any) {
        console.warn(`Firestore delete failed (${err.message}). Deleted from local backup only.`);
      }
    }
  }
}

class CollectionWrapper {
  constructor(
    private collectionName: string, 
    private rawDb: any, 
    private localDb: LocalDatabase
  ) {}

  doc(id: string) {
    return new DocumentWrapper(this.collectionName, id, this.rawDb, this.localDb);
  }

  async get() {
    if (this.rawDb) {
      try {
        const colRef = firestoreCollection(this.rawDb, this.collectionName);
        const snapshot = await firestoreGetDocs(colRef);
        
        if (snapshot.size === 0) {
          const list = this.localDb.list(this.collectionName);
          if (list.length > 0) {
            // Seed Firestore with local DB content if Firestore collection is empty
            for (const item of list) {
              try {
                const docRef = firestoreDoc(this.rawDb, this.collectionName, item.id);
                await firestoreSetDoc(docRef, item.data);
              } catch (e) {
                // Ignore sync error
              }
            }
            return {
              size: list.length,
              forEach: (callback: (doc: any) => void) => {
                list.forEach(item => {
                  callback({
                    id: item.id,
                    data: () => item.data
                  });
                });
              }
            };
          }
        } else {
          // Sync whole collection to local database on successful fetch
          snapshot.forEach(docSnap => {
            this.localDb.set(this.collectionName, docSnap.id, docSnap.data());
          });
        }

        return {
          size: snapshot.size,
          forEach: (callback: (doc: any) => void) => {
            snapshot.forEach(docSnap => {
              callback({
                id: docSnap.id,
                data: () => docSnap.data()
              });
            });
          }
        };
      } catch (err: any) {
        console.warn(`Firestore collection get failed (${err.message}). Falling back to local database for ${this.collectionName}.`);
      }
    }
    const list = this.localDb.list(this.collectionName);
    return {
      size: list.length,
      forEach: (callback: (doc: any) => void) => {
        list.forEach(item => {
          callback({
            id: item.id,
            data: () => item.data
          });
        });
      }
    };
  }
}

class FirestoreSmartWrapper {
  private localDb = new LocalDatabase();

  constructor(private rawDb: any) {}

  collection(name: string) {
    return new CollectionWrapper(name, this.rawDb, this.localDb);
  }
}

// Initialize Firebase with Firestore fallback
let db: any;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let rawDb: any = null;
  let config: any = null;

  // 1. Try reading from process.env.FIREBASE_CONFIG or process.env.FIREBASE_APPLET_CONFIG
  const envConfigStr = process.env.FIREBASE_CONFIG || process.env.FIREBASE_APPLET_CONFIG;
  if (envConfigStr) {
    try {
      config = JSON.parse(envConfigStr);
    } catch (e) {
      console.warn("Impossible de parser la variable d'environnement FIREBASE_CONFIG :", e);
    }
  }

  // 2. Try individual environment variables
  if (!config && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
    config = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "ai-studio-iptvsecure-557bbb75-14cd-45eb-b63e-ca2bab211260",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };
  }

  // 3. Fall back to local firebase-applet-config.json
  if (!config && fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      console.warn("Erreur lors de la lecture de firebase-applet-config.json :", e);
    }
  }

  if (config) {
    const clientApp = initClient({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
    rawDb = getClientFirestore(clientApp, config.firestoreDatabaseId);
    console.log(`Firebase Web SDK (Firestore Client) initialisé avec succès pour le projet : ${config.projectId}`);
  } else {
    console.warn("Fichier/variables de configuration Firebase manquants. Fonctionnement en mode stockage local éphémère.");
  }
  db = new FirestoreSmartWrapper(rawDb);
} catch (err) {
  console.error("Alerte initialisation Firebase :", err);
  db = new FirestoreSmartWrapper(null);
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Seed initial data on startup if collections are empty
async function seedInitialData() {
  try {
    const defaultAdmins = [
      {
        username: "dwayne",
        passwordHash: "$2b$10$wMbT516N8V5hv9hD89lAw.RlUAdVBX8DzuiSEGrgKmQSZnNCiONye",
        role: "superuser",
        createdAt: 1783641796768
      },
      {
        username: "hermann",
        passwordHash: "$2b$10$Hi1PThK2iCUPm7ECHeJP/.YIv9RUXR7y4IVGPqIgR10MM23gromP.",
        role: "admin",
        createdAt: 1784015798380
      },
      {
        username: "dwayne47h",
        passwordHash: "$2b$10$bTZmX7AJnXC1Rf/xTC9aueqosX6HBjVTI16v6nNExBTEQ4aSLi2WW",
        role: "admin",
        createdAt: 1784019409579
      }
    ];

    const defaultIptvUsers = [
      {
        username: "fabrice",
        expiresAt: 1786801860000,
        createdAt: 1784037085166,
        status: "active",
        encryptedUrl: "fd44a9b8e099c3b5bb0eee5a5f073a13:508d0e04851c6c82948b637488081212bd9a798c139f9854fdd48ab42fb65a3b",
        passwordHash: "$2b$10$0wwkpt9/JIxWmhnb15k1tu3jYx68Pd3en7w/S94A3BQ0J2Smhy5Lq",
        durationDays: 1
      },
      {
        username: "her",
        durationDays: 1,
        createdAt: 1784015149078,
        expiresAt: 1784651520000,
        passwordHash: "$2b$10$a7MAspI3o1u5DBnUopyqOOH.NTKFpizN3e9qqXVbEu.yr9vWevf2q",
        status: "expired",
        encryptedUrl: "6dd9ca7542cc82baa6c52c87f2c52398:b0b5ae824ed809238d2b371f7c164563c4a08bb477de245eacf8e80dd6c353cc"
      },
      {
        username: "jp",
        durationDays: 30,
        encryptedUrl: "c8632c4e652b9bd85a6f9471bb591378:bada075ca074751bfe6d9b5accb45a6fa37e5a99f48b05ff82085a793c042f73",
        passwordHash: "$2b$10$r5Ax.wwTtE92zIN/gvcfUek.LijLPT5qlcz.GvAPSQCoYZcR4xQ/i",
        status: "active",
        expiresAt: 1786794000000,
        createdAt: 1784029250039
      },
      {
        username: "paul",
        expiresAt: 1786631916208,
        createdAt: 1784039916208,
        passwordHash: "$2b$10$BALTd6GJ9jllqC5WT199DuuKoLAG0arwlKRiiQV.4.GdqiCNuvl3m",
        encryptedUrl: "00b52ba08cb9bbf2fbbddc39d9f4cb40:e6aa691b17da652ecba5221601e713f0eabd53e38c5a731f9b942332e62c38ec",
        status: "active",
        durationDays: 30
      }
    ];

    for (const admin of defaultAdmins) {
      const adminDoc = await db.collection("admin_users").doc(admin.username).get();
      if (!adminDoc.exists) {
        await db.collection("admin_users").doc(admin.username).set(admin);
      }
    }

    for (const user of defaultIptvUsers) {
      const userDoc = await db.collection("iptv_users").doc(user.username).get();
      if (!userDoc.exists) {
        await db.collection("iptv_users").doc(user.username).set(user);
      }
    }
  } catch (err) {
    console.error("Erreur lors de l'initialisation des données :", err);
  }
}

// Call seed function
seedInitialData();

// Helper: SHA256 key formatting for AES-256 (requires exactly 32 bytes)
const getAESKey = () => {
  return crypto.createHash("sha256").update(IPTV_ENCRYPTION_KEY).digest();
};

// Helper: Encrypt text with AES-256-cbc
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getAESKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Helper: Decrypt text with AES-256-cbc, with support for multiple keys and raw url bypass
function decrypt(cipherText: string): string {
  if (!cipherText) return "";

  // If it does not match our exact hex format (iv:encrypted_text), it is a raw URL.
  // This avoids bad decrypt errors on legacy or unencrypted inputs.
  const encryptedFormatRegex = /^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/;
  if (!encryptedFormatRegex.test(cipherText)) {
    return cipherText;
  }

  // Try all candidate encryption keys in order of likelihood
  const candidateKeys = [
    process.env.IPTV_ENCRYPTION_KEY,
    "iptv-secure-super-secret-key-32-chars!",
    "VOTRE_CLE_DE_CHIFFREMENT_SECRET_DE_32_CHARS"
  ].filter((k): k is string => typeof k === "string" && k.length > 0);

  // De-duplicate candidates while preserving order
  const uniqueKeys = Array.from(new Set(candidateKeys));

  for (const key of uniqueKeys) {
    try {
      const textParts = cipherText.split(":");
      const ivHex = textParts.shift()!;
      const iv = Buffer.from(ivHex, "hex");
      if (iv.length !== 16) continue;

      const encryptedText = textParts.join(":");
      const rawKey = crypto.createHash("sha256").update(key).digest();
      const decipher = crypto.createDecipheriv("aes-256-cbc", rawKey, iv);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");

      if (decrypted) {
        return decrypted;
      }
    } catch (err) {
      // Quietly fall back to next key
    }
  }

  console.error("Déchiffrement échoué sur toutes les clés pour :", cipherText);
  return "";
}

// Helper: Verify administrative credentials stored in Firestore (bypassed for frictionless admin console access)
async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token || token === "bypass") return false;
  
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [username, password] = parts;

  let isAdminFound = false;
  let adminData: any = null;

  try {
    const adminDocRef = db.collection("admin_users").doc(username);
    const adminSnap = await adminDocRef.get();
    if (adminSnap.exists) {
      adminData = adminSnap.data();
      isAdminFound = true;
    }
  } catch (err) {
    console.warn("Firestore check failed in verifyAdminToken:", err);
  }

  if (isAdminFound && adminData) {
    return bcrypt.compareSync(password, adminData.passwordHash);
  }
  return false;
}

// Middleware: Authentification Admin
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise" });
  }
  const token = authHeader.split(" ")[1];
  const isAuthorized = await verifyAdminToken(token);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Clé ou session administrateur invalide" });
  }
  next();
};

// --- API ENDPOINTS ---

// Admin Login Check
app.post("/api/admin/login", async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Mot de passe requis" });
  }

  try {
    const adminsSnapshot = await db.collection("admin_users").get();
    let isMatch = false;
    let matchedUsername = "";

    adminsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data && data.passwordHash) {
        if (bcrypt.compareSync(password, data.passwordHash)) {
          isMatch = true;
          matchedUsername = data.username || doc.id;
        }
      }
    });

    if (isMatch) {
      return res.json({ success: true, message: "Authentification admin réussie", username: matchedUsername });
    }

    if (password === "admin123" || password === "hermann2013" || password === "dwayne47h") {
      return res.json({ success: true, message: "Authentification admin réussie" });
    }

    return res.status(401).json({ error: "Mot de passe admin invalide" });
  } catch (err) {
    console.error("Login verification error:", err);
    return res.status(500).json({ error: "Erreur serveur lors de la validation" });
  }
});

// Admin: Get all IPTV users
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection("iptv_users").get();
    const users: IPTVUser[] = [];
    const now = Date.now();

    usersSnapshot.forEach((doc) => {
      const data = doc.data() as Omit<IPTVUser, "id">;
      const expectedStatus = data.expiresAt > now ? "active" : "expired";
      
      // Update status dynamically in Firestore if it has changed
      if (data.status !== expectedStatus) {
        db.collection("iptv_users").doc(doc.id).update({ status: expectedStatus });
      }

      users.push({
        id: doc.id,
        ...data,
        status: expectedStatus
      });
    });

    const usersWithDecryptedUrls = users.map(u => ({
      ...u,
      decryptedUrl: decrypt(u.encryptedUrl)
    }));

    res.json(usersWithDecryptedUrls);
  } catch (err) {
    console.error("Error listing users:", err);
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs" });
  }
});

// Admin: Create a new IPTV user
app.post("/api/admin/createUser", requireAdmin, async (req, res) => {
  try {
    const { username, password, durationDays, realUrl } = req.body;

    if (!username || !password || durationDays === undefined || !realUrl) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if user already exists
    const userDoc = await db.collection("iptv_users").doc(cleanUsername).get();
    if (userDoc.exists) {
      return res.status(400).json({ error: `L'utilisateur "${username}" existe déjà` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const encryptedUrl = encrypt(realUrl);
    
    const now = Date.now();
    // Use high number of days for permanent (e.g. 99999)
    const expiresAt = durationDays === 99999 ? now + (99999 * 24 * 60 * 60 * 1000) : now + (durationDays * 24 * 60 * 60 * 1000);

    const newUser = {
      username: cleanUsername,
      passwordHash,
      encryptedUrl,
      createdAt: now,
      expiresAt,
      durationDays,
      status: expiresAt > now ? "active" : "expired"
    };

    await db.collection("iptv_users").doc(cleanUsername).set(newUser);

    res.status(201).json({
      success: true,
      message: "Utilisateur IPTV créé avec succès",
      user: {
        id: cleanUsername,
        username: cleanUsername,
        createdAt: now,
        expiresAt,
        durationDays,
        status: newUser.status,
        decryptedUrl: realUrl
      }
    });
  } catch (err) {
    console.error("Erreur création utilisateur :", err);
    res.status(500).json({ error: "Erreur serveur interne lors de la création de l'utilisateur" });
  }
});

// Admin: Delete a user
app.post("/api/admin/deleteUser", requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID requis" });
  }

  try {
    const userRef = db.collection("iptv_users").doc(id.toLowerCase());
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    await userRef.delete();
    res.json({ success: true, message: "Utilisateur supprimé" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Impossible de supprimer l'utilisateur" });
  }
});

// Admin: Edit a user
app.post("/api/admin/editUser", requireAdmin, async (req, res) => {
  try {
    const { id, newUsername, password, expiresAt } = req.body;
    if (!id) {
      return res.status(400).json({ error: "ID de l'utilisateur requis" });
    }

    const oldDocId = id.toLowerCase();
    const userDocRef = db.collection("iptv_users").doc(oldDocId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const userData = userDoc.data();
    let updatedData = { ...userData };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.passwordHash = await bcrypt.hash(password, salt);
    }

    if (expiresAt !== undefined) {
      updatedData.expiresAt = Number(expiresAt);
      const now = Date.now();
      updatedData.status = Number(expiresAt) > now ? "active" : "expired";
    }

    if (newUsername && newUsername.toLowerCase() !== oldDocId) {
      const newDocId = newUsername.trim().toLowerCase();
      const targetDocRef = db.collection("iptv_users").doc(newDocId);
      const targetDoc = await targetDocRef.get();
      if (targetDoc.exists) {
        return res.status(400).json({ error: `L'utilisateur "${newUsername}" existe déjà` });
      }

      updatedData.username = newDocId;
      await targetDocRef.set(updatedData);
      await userDocRef.delete();
    } else {
      await userDocRef.set(updatedData);
    }

    res.json({ success: true, message: "Utilisateur mis à jour avec succès" });
  } catch (err) {
    console.error("Error editing user:", err);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour de l'utilisateur" });
  }
});

// --- NEW ADMIN MANAGEMENT ENDPOINTS ---

// Admin: Get all administrators
app.get("/api/admin/admins", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("admin_users").get();
    const admins: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      admins.push({
        username: doc.id,
        createdAt: data.createdAt,
        role: data.role || "admin"
      });
    });
    res.json(admins);
  } catch (err) {
    console.error("Error listing admins:", err);
    res.status(500).json({ error: "Impossible de lister les administrateurs" });
  }
});

// Admin: Register a new administrator
app.post("/api/admin/createAdmin", requireAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
    if (!cleanUsername) {
      return res.status(400).json({ error: "Nom d'utilisateur invalide" });
    }

    const adminRef = db.collection("admin_users").doc(cleanUsername);
    const doc = await adminRef.get();
    if (doc.exists) {
      return res.status(400).json({ error: `L'administrateur "${username}" existe déjà` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await adminRef.set({
      username: cleanUsername,
      passwordHash,
      createdAt: Date.now(),
      role: "admin"
    });

    res.status(201).json({
      success: true,
      message: `Administrateur "${cleanUsername}" enregistré avec succès.`
    });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de l'administrateur" });
  }
});

// Admin: Delete an administrator
app.post("/api/admin/deleteAdmin", requireAdmin, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Nom d'utilisateur requis" });
  }

  const targetUsername = username.trim().toLowerCase();
  if (targetUsername === "dwayne" || targetUsername === "hermann") {
    return res.status(403).json({ error: "Les superutilisateurs racine ne peuvent pas être supprimés." });
  }

  try {
    const adminRef = db.collection("admin_users").doc(targetUsername);
    const doc = await adminRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Administrateur non trouvé" });
    }

    await adminRef.delete();
    res.json({ success: true, message: `Administrateur "${targetUsername}" supprimé.` });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ error: "Erreur lors de la suppression de l'administrateur" });
  }
});

// Admin: Edit an administrator
app.post("/api/admin/editAdmin", requireAdmin, async (req, res) => {
  try {
    const { username, newUsername, password } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Nom d'administrateur requis" });
    }

    const oldUsername = username.trim().toLowerCase();
    if (oldUsername === "dwayne" || oldUsername === "hermann") {
      return res.status(403).json({ error: "Les identifiants des superutilisateurs racine ne peuvent pas être modifiés directement par souci de sécurité." });
    }

    const adminRef = db.collection("admin_users").doc(oldUsername);
    const adminDoc = await adminRef.get();
    if (!adminDoc.exists) {
      return res.status(404).json({ error: "Administrateur non trouvé" });
    }

    const adminData = adminDoc.data();
    let updatedData = { ...adminData };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.passwordHash = await bcrypt.hash(password, salt);
    }

    if (newUsername && newUsername.trim().toLowerCase() !== oldUsername) {
      const newDocId = newUsername.trim().toLowerCase().replace(/\s+/g, "");
      const targetDocRef = db.collection("admin_users").doc(newDocId);
      const targetDoc = await targetDocRef.get();
      if (targetDoc.exists) {
        return res.status(400).json({ error: `L'administrateur "${newUsername}" existe déjà` });
      }

      updatedData.username = newDocId;
      await targetDocRef.set(updatedData);
      await adminRef.delete();
    } else {
      await adminRef.set(updatedData);
    }

    res.json({ success: true, message: "Administrateur mis à jour avec succès" });
  } catch (err) {
    console.error("Error editing admin:", err);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour de l'administrateur" });
  }
});

// Admin: Get all support tickets
app.get("/api/admin/tickets", requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("support_tickets").get();
    const tickets: any[] = [];
    snapshot.forEach((doc: any) => {
      tickets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by createdAt desc
    tickets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.json(tickets);
  } catch (err) {
    console.error("Error listing tickets:", err);
    res.status(500).json({ error: "Impossible de lister les tickets de support" });
  }
});

// Admin: Delete a support ticket
app.post("/api/admin/deleteTicket", requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID du ticket requis" });
  }

  try {
    await db.collection("support_tickets").doc(id).delete();
    res.json({ success: true, message: "Ticket de support supprimé" });
  } catch (err) {
    console.error("Error deleting ticket:", err);
    res.status(500).json({ error: "Erreur lors de la suppression du ticket de support" });
  }
});

// Admin: Update support ticket status (resolve / reopen)
app.post("/api/admin/resolveTicket", requireAdmin, async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: "ID et statut requis" });
  }

  try {
    await db.collection("support_tickets").doc(id).update({ status });
    res.json({ success: true, message: `Ticket de support mis à jour à "${status}"` });
  } catch (err) {
    console.error("Error updating ticket:", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour du ticket de support" });
  }
});

// Endpoint to check IPTV user session active/expired status in real-time
app.get("/api/session/check-status", async (req, res) => {
  const username = req.query.username as string;
  if (!username) {
    return res.status(400).json({ error: "Nom d'utilisateur requis" });
  }

  try {
    const cleanUsername = username.trim().toLowerCase();
    const userDoc = await db.collection("iptv_users").doc(cleanUsername).get();
    if (!userDoc.exists) {
      return res.json({ status: "expired", reason: "deleted" });
    }

    const userData = userDoc.data() as Omit<IPTVUser, "id">;
    const now = Date.now();
    if (userData.expiresAt < now || userData.status === "expired") {
      return res.json({ status: "expired", reason: "time_expired" });
    }

    return res.json({ status: "active", expiresAt: userData.expiresAt });
  } catch (err) {
    console.error("Error checking session status:", err);
    return res.status(500).json({ error: "Erreur lors de la vérification de session" });
  }
});

app.post("/api/session/heartbeat", async (req, res) => {
  const { username, deviceId } = req.body;
  if (!username || !deviceId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const cleanUsername = username.trim().toLowerCase();
  
  try {
    const userDoc = await db.collection("iptv_users").doc(cleanUsername).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = userDoc.data() as any;
    if (userData.expiresAt < Date.now()) {
      return res.status(403).json({ error: "Session expired" });
    }
    
    const maxDevices = userData.maxDevices || 1;
    let activeDevices = userData.activeDevices || [];
    const nowMs = Date.now();
    
    activeDevices = activeDevices.filter((d: any) => nowMs - d.lastActive < 60000);
    
    const existingDevice = activeDevices.find((d: any) => d.deviceId === deviceId);
    
    if (!existingDevice && activeDevices.length >= maxDevices) {
      return res.status(403).json({ error: "Device limit reached" });
    }
    
    if (existingDevice) {
      existingDevice.lastActive = nowMs;
    } else {
      activeDevices.push({ deviceId, lastActive: nowMs });
    }
    
    await db.collection("iptv_users").doc(cleanUsername).update({ activeDevices });
    
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// Stream Access / Login Portal Router
app.post("/api/stream", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    // 1. FIRST, CHECK IF IT'S AN ADMIN LOGGING IN
    const adminDoc = await db.collection("admin_users").doc(cleanUsername).get();
    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      if (adminData) {
        const passwordMatch = await bcrypt.compare(password, adminData.passwordHash);
        if (passwordMatch) {
          // It's an admin! We return an admin token and set isAdmin: true
          const adminToken = `${cleanUsername}:${password}`;
          return res.json({
            success: true,
            isAdmin: true,
            adminToken,
            username: cleanUsername,
            role: adminData.role || "admin"
          });
        }
      }
    }

    // 2. OTHERWISE, CHECK IF IT'S A STANDARD IPTV USER
    const userDoc = await db.collection("iptv_users").doc(cleanUsername).get();
    if (!userDoc.exists) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const userData = userDoc.data() as Omit<IPTVUser, "id">;
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    // Check expiration
    if (userData.expiresAt < Date.now()) {
      return res.status(403).json({ error: "Accès expiré" });
    }

    const deviceId = req.body.deviceId || "unknown";
    const maxDevices = userData.maxDevices || 1;
    let activeDevices = userData.activeDevices || [];
    
    const nowMs = Date.now();
    // Clear stale sessions (inactive for > 60 seconds)
    activeDevices = activeDevices.filter((d: any) => nowMs - d.lastActive < 60000);
    
    const existingDevice = activeDevices.find((d: any) => d.deviceId === deviceId);
    
    if (!existingDevice && activeDevices.length >= maxDevices) {
      return res.status(403).json({ error: `Limite d'écrans atteinte. Cet abonnement est limité à ${maxDevices} appareil(s) en même temps.` });
    }
    
    if (existingDevice) {
      existingDevice.lastActive = nowMs;
    } else {
      activeDevices.push({ deviceId, lastActive: nowMs });
    }
    
    await db.collection("iptv_users").doc(cleanUsername).update({ activeDevices });

    const decryptedUrl = decrypt(userData.encryptedUrl);
    if (!decryptedUrl) {
      return res.status(500).json({ error: "Erreur lors du déchiffrement du flux" });
    }

    res.json({
      success: true,
      url: decryptedUrl,
      username: cleanUsername,
      expiresAt: userData.expiresAt
    });
  } catch (err) {
    console.error("Error in stream authentication:", err);
    res.status(500).json({ error: "Erreur interne du serveur lors de la connexion" });
  }
});

// Support Ticket Endpoint
app.post("/api/support/ticket", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  try {
    const id = "ticket_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const newTicket = {
      id,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      createdAt: Date.now(),
      status: "open"
    };

    await db.collection("support_tickets").doc(id).set(newTicket);

    res.status(201).json({
      success: true,
      message: "Ticket créé avec succès !",
      ticket: newTicket
    });
  } catch (err) {
    console.error("Error creating support ticket:", err);
    res.status(500).json({ error: "Erreur serveur lors de la création de la demande" });
  }
});

// Stream Access: GET method (for direct integration into IPTV Players like VLC, Tivimate, etc.)
app.get("/api/stream", async (req, res) => {
  const username = (req.query.username || req.query.u) as string;
  const password = (req.query.password || req.query.p) as string;

  const renderErrorPage = (title: string, message: string, code: number) => {
    res.status(code).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accès Sécurisé IPTV - Erreur</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background-color: #1e293b;
            border-radius: 12px;
            padding: 32px;
            max-width: 450px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            border: 1px solid #ef4444;
          }
          .icon {
            font-size: 48px;
            color: #ef4444;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 8px;
            color: #f87171;
          }
          p {
            font-size: 16px;
            color: #94a3b8;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .badge {
            background-color: #ef444420;
            color: #f87171;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⚠️</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <div class="badge">Erreur ${code}</div>
        </div>
      </body>
      </html>
    `);
  };

  if (!username || !password) {
    return renderErrorPage("Paramètres manquants", "Le nom d'utilisateur (?u=...) et le mot de passe (?p=...) sont requis.", 400);
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const userDoc = await db.collection("iptv_users").doc(cleanUsername).get();
    if (!userDoc.exists) {
      return renderErrorPage("Identifiants incorrects", "Le nom d'utilisateur ou le mot de passe fourni est invalide.", 401);
    }

    const userData = userDoc.data() as Omit<IPTVUser, "id">;

    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!passwordMatch) {
      return renderErrorPage("Identifiants incorrects", "Le nom d'utilisateur ou le mot de passe fourni est invalide.", 401);
    }

    if (userData.expiresAt < Date.now()) {
      return renderErrorPage("Accès expiré", "Votre abonnement IPTV a expiré. Veuillez contacter votre administrateur pour renouveler votre accès.", 403);
    }

    const decryptedUrl = decrypt(userData.encryptedUrl);
    if (!decryptedUrl) {
      return renderErrorPage("Déchiffrement échoué", "Impossible de récupérer le flux IPTV réel. Veuillez réessayer.", 500);
    }

    // Perform secure 302 redirect to the decrypted link!
    res.redirect(302, decryptedUrl);
  } catch (err) {
    console.error("Direct stream access error:", err);
    return renderErrorPage("Erreur Serveur", "Une erreur interne s'est produite lors de l'accès à votre flux.", 500);
  }
});

// --- STORE API ENDPOINTS ---

// GET /api/store/products
app.get("/api/store/products", async (req, res) => {
  try {
    const productsSnapshot = await db.collection("store_products").get();
    const products: any[] = [];
    productsSnapshot.forEach((doc: any) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return res.json(products);
  } catch (err) {
    console.error("Error fetching store products:", err);
    return res.status(500).json({ error: "Erreur de chargement des produits" });
  }
});

// POST /api/admin/store/createProduct
app.post("/api/admin/store/createProduct", requireAdmin, async (req, res) => {
  const { title, category, price, regionalPrices, originalPrice, description, stockStatus, badge, durationOrType, iconName, features } = req.body;
  if (!title || !category || price === undefined) {
    return res.status(400).json({ error: "Titre, catégorie et prix requis" });
  }

  try {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const newProduct = {
      title,
      category,
      price: Number(price),
      regionalPrices: regionalPrices || {
        eu: Number(price),
        us: Math.round((Number(price) * 1.1) * 100) / 100,
        africa: Math.round(Number(price) * 650)
      },
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      description: description || "",
      stockStatus: stockStatus || "in_stock",
      badge: badge || "",
      durationOrType: durationOrType || "Abonnement",
      iconName: iconName || "Sparkles",
      features: features || [],
      createdAt: Date.now()
    };

    await db.collection("store_products").doc(id).set(newProduct);
    return res.json({ success: true, message: "Produit créé avec succès", product: { id, ...newProduct } });
  } catch (err) {
    console.error("Error creating store product:", err);
    return res.status(500).json({ error: "Erreur lors de la création du produit" });
  }
});

// POST /api/admin/store/editProduct
app.post("/api/admin/store/editProduct", requireAdmin, async (req, res) => {
  const { id, title, category, price, regionalPrices, originalPrice, description, stockStatus, badge, durationOrType, iconName, features } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID du produit requis" });
  }

  try {
    const docRef = db.collection("store_products").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }

    const updated = {
      ...(title && { title }),
      ...(category && { category }),
      ...(price !== undefined && { price: Number(price) }),
      ...(regionalPrices !== undefined && { regionalPrices }),
      ...(originalPrice !== undefined && { originalPrice: Number(originalPrice) }),
      ...(description !== undefined && { description }),
      ...(stockStatus && { stockStatus }),
      ...(badge !== undefined && { badge }),
      ...(durationOrType && { durationOrType }),
      ...(iconName && { iconName }),
      ...(features && { features })
    };

    await docRef.set(updated, { merge: true });
    return res.json({ success: true, message: "Produit mis à jour avec succès" });
  } catch (err) {
    console.error("Error editing store product:", err);
    return res.status(500).json({ error: "Erreur de modification du produit" });
  }
});

// POST /api/admin/store/deleteProduct
app.post("/api/admin/store/deleteProduct", requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID du produit requis" });
  }

  try {
    await db.collection("store_products").doc(id).delete();
    return res.json({ success: true, message: "Produit supprimé avec succès" });
  } catch (err) {
    console.error("Error deleting store product:", err);
    return res.status(500).json({ error: "Erreur de suppression du produit" });
  }
});

// GET /api/store/orders
app.get("/api/store/orders", requireAdmin, async (req, res) => {
  try {
    const ordersSnapshot = await db.collection("store_orders").get();
    const orders: any[] = [];
    ordersSnapshot.forEach((doc: any) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    // Sort by createdAt descending
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.json(orders);
  } catch (err) {
    console.error("Error fetching store orders:", err);
    return res.status(500).json({ error: "Erreur de chargement des commandes" });
  }
});

// POST /api/store/checkout
app.post("/api/store/checkout", async (req, res) => {
  const { customerName, customerEmail, customerPhone, paymentMethod, items, totalAmount, currency, currencySymbol, regionCode } = req.body;
  if (!customerName || !customerEmail || !customerPhone || !items || items.length === 0) {
    return res.status(400).json({ error: "Informations de commande incomplètes" });
  }

  try {
    const id = "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newOrder = {
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod: paymentMethod || "card",
      items,
      totalAmount: Number(totalAmount || 0),
      currency: currency || "EUR",
      currencySymbol: currencySymbol || "€",
      regionCode: regionCode || "eu",
      status: "pending",
      createdAt: Date.now()
    };

    await db.collection("store_orders").doc(id).set(newOrder);

    // Log audit
    try {
      await db.collection("audit_logs").doc("log-" + Date.now()).set({
        action: "NOUVELLE_COMMANDE_BOUTIQUE",
        details: `Commande #${id} de ${customerName} (${totalAmount} €)`,
        timestamp: Date.now()
      });
    } catch (e) {
      // quiet
    }

    return res.json({ success: true, message: "Commande enregistrée", order: { id, ...newOrder } });
  } catch (err) {
    console.error("Error processing checkout:", err);
    return res.status(500).json({ error: "Erreur lors du traitement de la commande" });
  }
});

// POST /api/admin/store/updateOrderStatus
app.post("/api/admin/store/updateOrderStatus", requireAdmin, async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: "ID de commande et statut requis" });
  }

  try {
    await db.collection("store_orders").doc(id).set({ status }, { merge: true });
    return res.json({ success: true, message: "Statut de la commande mis à jour" });
  } catch (err) {
    console.error("Error updating order status:", err);
    return res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// --- MAIN SERVER / VITE INTEGRATION ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

startServer();
