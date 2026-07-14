/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";
import { APKRelease, AppStats, User, SessionInfo } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Unified Session Store in memory (token -> sessionInfo)
const activeSessions = new Map<string, SessionInfo>();

// Resolve directories
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_PATH = path.join(DATA_DIR, "database.json");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to parse cookies
function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0].trim();
    const value = parts.slice(1).join("=").trim();
    if (name) cookies[name] = decodeURIComponent(value);
  });
  return cookies;
}

// Secure Hashing function using node crypto
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "KhataIndexSaltSecretKey!").digest("hex");
}

// Database Helpers
function readDB(): { releases: APKRelease[]; users: User[] } {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = {
        releases: [
          {
            id: "v1-0-0",
            version: "v1.0.0",
            fileName: "khataindex_v1.0.0.apk",
            fileSize: 15414022, // ~14.7 MB
            changelog: "• Initial launch of KhataIndex digital ledger\n• Seamless credit & debit tracking for small and medium merchants\n• Direct customer communications via SMS and WhatsApp reminders\n• Safe offline-first architecture with manual backup toggles\n• Beautiful visual analytics, outstanding balance indicators, and high-contrast styling",
            uploadDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
            downloadCount: 142,
            isLatest: true,
            isVisible: true
          }
        ],
        users: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");

      // Write mock APK payload so the file download works instantly
      const mockApkPath = path.join(UPLOADS_DIR, "khataindex_v1.0.0.apk");
      if (!fs.existsSync(mockApkPath)) {
        fs.writeFileSync(mockApkPath, "Mock KhataIndex APK Build payload v1.0.0 - Android Ledger Utility", "utf-8");
      }

      return initialData;
    }

    const content = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(content);
    if (!data.users) {
      data.users = [];
    }
    return data;
  } catch (error) {
    console.error("Failed to read database, returning default fallback:", error);
    return { releases: [], users: [] };
  }
}

function writeDB(data: { releases: APKRelease[]; users: User[] }) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database:", error);
  }
}

// Configure file upload using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Sanitize and construct file name
    const versionClean = (req.body.version || "update").replace(/[^a-zA-Z0-9]/g, "-");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e4);
    cb(null, `khataindex_${versionClean}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".apk") {
      return cb(new Error("File validation failed: Only .apk files are supported"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 80 * 1024 * 1024, // 80 MB file size limit
  },
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authorization check middleware
function getSessionInfo(req: express.Request): SessionInfo | null {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies["session_token"] || "";
  }
  return token ? activeSessions.get(token) || null : null;
}

function checkIsAdmin(req: express.Request): boolean {
  const session = getSessionInfo(req);
  return session ? session.role === "admin" : false;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!checkIsAdmin(req)) {
    return res.status(401).json({ success: false, message: "Unauthorized: Admin session required" });
  }
  next();
}

// API Routes

// Unified Auth: Register a regular user
app.post("/api/auth/register", (req, res) => {
  const { username, password, fullName } = req.body;

  if (!username || !username.trim() || !password || !password.trim()) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  const cleanUsername = username.trim().toLowerCase();
  const adminUser = (process.env.ADMIN_USERNAME || "admin").toLowerCase();

  if (cleanUsername === adminUser) {
    return res.status(400).json({ success: false, message: "Username 'admin' is a reserved system identifier" });
  }

  const db = readDB();
  const exists = db.users.some((u) => u.username.toLowerCase() === cleanUsername);
  if (exists) {
    return res.status(400).json({ success: false, message: "Username is already registered" });
  }

  const newUser: User = {
    username: username.trim(),
    passwordHash: hashPassword(password),
    fullName: fullName?.trim() || username.trim(),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  return res.json({
    success: true,
    message: "User registered successfully! You can now log in."
  });
});

// Unified Auth: Login (for both user and admin roles)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim() || !password || !password.trim()) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  const cleanUsername = username.trim();
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "KhataIndexSecureAdminPassword";

  // 1. Check if admin credentials
  if (cleanUsername.toLowerCase() === adminUser.toLowerCase() && password === adminPass) {
    const sessionToken = "kb_token_adm_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    activeSessions.set(sessionToken, { username: adminUser, role: "admin", fullName: "Administrator" });

    // Set cookie
    res.setHeader(
      "Set-Cookie",
      `session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
    );

    return res.json({
      success: true,
      token: sessionToken,
      role: "admin",
      username: adminUser,
      fullName: "Administrator",
      message: "Admin authentication successful"
    });
  }

  // 2. Check if registered user credentials
  const db = readDB();
  const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());

  if (user) {
    const hashedInput = hashPassword(password);
    if (user.passwordHash === hashedInput) {
      const sessionToken = "kb_token_usr_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      activeSessions.set(sessionToken, { username: user.username, role: "user", fullName: user.fullName });

      // Set cookie
      res.setHeader(
        "Set-Cookie",
        `session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
      );

      return res.json({
        success: true,
        token: sessionToken,
        role: "user",
        username: user.username,
        fullName: user.fullName || user.username,
        message: "User logged in successfully"
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password"
  });
});

// Unified Auth: Check Session
app.get("/api/auth/check-session", (req, res) => {
  const session = getSessionInfo(req);
  if (session) {
    res.json({ success: true, session });
  } else {
    res.json({ success: false, message: "No active session found" });
  }
});

// Unified Auth: Update Profile (Full Name & Password updates)
app.post("/api/auth/update-profile", (req, res) => {
  const session = getSessionInfo(req);
  if (!session) {
    return res.status(401).json({ success: false, message: "Unauthorized: Active session required" });
  }

  const { fullName, currentPassword, newPassword } = req.body;

  // If Admin role
  if (session.role === "admin") {
    // Admin only changes session name, as password and username are configured via environment
    if (newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Administrator password is managed securely via server environment variables and cannot be updated dynamically." 
      });
    }

    if (fullName && fullName.trim()) {
      session.fullName = fullName.trim();
      const authHeader = req.headers.authorization;
      let token = "";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else {
        const cookies = parseCookies(req.headers.cookie);
        token = cookies["session_token"] || "";
      }
      if (token) {
        activeSessions.set(token, { ...session, fullName: fullName.trim() });
      }
      return res.json({ 
        success: true, 
        message: "Admin display name updated successfully!", 
        session: { ...session, fullName: fullName.trim() } 
      });
    }

    return res.status(400).json({ success: false, message: "No valid fields to update" });
  }

  // If Regular User role
  const db = readDB();
  const userIndex = db.users.findIndex((u) => u.username.toLowerCase() === session.username.toLowerCase());
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User account not found in database" });
  }

  const user = db.users[userIndex];

  // If password update requested
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: "Current password is required to set a new password" });
    }
    const hashedCurrent = hashPassword(currentPassword);
    if (user.passwordHash !== hashedCurrent) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
    }
    user.passwordHash = hashPassword(newPassword);
  }

  // If full name update requested
  if (fullName && fullName.trim()) {
    user.fullName = fullName.trim();
  }

  // Save updates to database
  db.users[userIndex] = user;
  writeDB(db);

  // Sync current active session
  session.fullName = user.fullName;
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies["session_token"] || "";
  }
  if (token) {
    activeSessions.set(token, session);
  }

  return res.json({
    success: true,
    message: "Profile updated successfully!",
    session
  });
});

// Unified Auth: Logout
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies["session_token"] || "";
  }

  if (token) {
    activeSessions.delete(token);
  }

  // Clear cookie
  res.setHeader(
    "Set-Cookie",
    "session_token=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );

  res.json({ success: true, message: "Logged out successfully" });
});

// Admin Authentication: Login (legacy wrapper)
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "KhataIndexSecureAdminPassword";

  if (username === adminUser && password === adminPass) {
    const sessionToken = "kb_token_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    activeSessions.set(sessionToken, { username: adminUser, role: "admin", fullName: "Administrator" });

    // Set cookie
    res.setHeader(
      "Set-Cookie",
      `session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
    );

    return res.json({
      success: true,
      token: sessionToken,
      message: "Admin authentication successful"
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid administrator username or password"
  });
});

// Admin Authentication: Check Session (legacy wrapper)
app.get("/api/admin/check-session", (req, res) => {
  const isAdmin = checkIsAdmin(req);
  res.json({ success: isAdmin });
});

// Admin Authentication: Logout (legacy wrapper)
app.post("/api/admin/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies["session_token"] || "";
  }

  if (token) {
    activeSessions.delete(token);
  }

  // Clear cookie
  res.setHeader(
    "Set-Cookie",
    "session_token=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );

  res.json({ success: true, message: "Logged out successfully" });
});

// GET Releases (Visible only for public, all for Admin)
app.get("/api/releases", (req, res) => {
  const db = readDB();
  const isAdmin = checkIsAdmin(req);

  if (isAdmin) {
    // Return all records for the admin dashboard
    return res.json({ success: true, data: db.releases });
  } else {
    // Filter out invisible releases for public users
    const visibleReleases = db.releases.filter((r) => r.isVisible);
    return res.json({ success: true, data: visibleReleases });
  }
});

// GET Platform Distribution Statistics
app.get("/api/stats", (req, res) => {
  const db = readDB();
  const totalDownloads = db.releases.reduce((sum, r) => sum + r.downloadCount, 0);
  const visibleReleases = db.releases.filter((r) => r.isVisible);
  const latestRelease = visibleReleases.find((r) => r.isLatest) || db.releases.find((r) => r.isLatest);

  const stats: AppStats = {
    totalDownloads,
    totalReleases: db.releases.length,
    latestVersion: latestRelease ? latestRelease.version : "N/A",
    lastUpdated: latestRelease ? latestRelease.uploadDate : new Date().toISOString()
  };

  res.json({ success: true, data: stats });
});

// Admin: Upload APK and create new release record
app.post("/api/admin/upload", requireAdmin, (req, res) => {
  upload.single("apk")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please select an APK file to upload" });
    }

    const { version, changelog } = req.body;
    if (!version || !version.trim()) {
      // Remove file on failure to prevent orphan files
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Version number is required" });
    }

    const cleanVersion = version.trim();
    const db = readDB();

    // Check if version already exists
    const existingIndex = db.releases.findIndex((r) => r.version.toLowerCase() === cleanVersion.toLowerCase());
    if (existingIndex !== -1) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: `Version ${cleanVersion} already exists` });
    }

    // Set previous releases isLatest to false
    db.releases.forEach((r) => {
      r.isLatest = false;
    });

    const newRelease: APKRelease = {
      id: "v" + cleanVersion.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase(),
      version: cleanVersion,
      fileName: req.file.filename,
      fileSize: req.file.size,
      changelog: changelog || "",
      uploadDate: new Date().toISOString(),
      downloadCount: 0,
      isLatest: true,
      isVisible: true
    };

    db.releases.unshift(newRelease); // Add to the front of list
    writeDB(db);

    res.json({ success: true, data: newRelease, message: "Version published successfully!" });
  });
});

// Admin: Toggle visibility of older versions
app.put("/api/admin/releases/:id/visibility", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { isVisible } = req.body;

  if (typeof isVisible !== "boolean") {
    return res.status(400).json({ success: false, message: "isVisible state must be a boolean" });
  }

  const db = readDB();
  const releaseIndex = db.releases.findIndex((r) => r.id === id);

  if (releaseIndex === -1) {
    return res.status(404).json({ success: false, message: "Release record not found" });
  }

  db.releases[releaseIndex].isVisible = isVisible;
  writeDB(db);

  res.json({ success: true, data: db.releases[releaseIndex], message: "Visibility updated" });
});

// Admin: Delete an APK release
app.delete("/api/admin/releases/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const releaseIndex = db.releases.findIndex((r) => r.id === id);

  if (releaseIndex === -1) {
    return res.status(404).json({ success: false, message: "Release record not found" });
  }

  const release = db.releases[releaseIndex];
  const filePath = path.join(UPLOADS_DIR, release.fileName);

  // Delete physical file
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Error deleting file ${filePath}:`, err);
  }

  // Remove from DB
  db.releases.splice(releaseIndex, 1);

  // If we deleted the latest, designate the next visible as latest
  if (release.isLatest && db.releases.length > 0) {
    db.releases[0].isLatest = true;
  }

  writeDB(db);
  res.json({ success: true, message: "Release successfully deleted" });
});

// GET: Direct APK File Download Handler
app.get("/api/download/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const isAdmin = checkIsAdmin(req);

  const release = db.releases.find((r) => r.id === id);

  if (!release) {
    return res.status(404).send("Error: The requested APK release does not exist.");
  }

  if (!release.isVisible && !isAdmin) {
    return res.status(403).send("Error: Access denied. This APK version has been archived by the administrator.");
  }

  const filePath = path.join(UPLOADS_DIR, release.fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Error: The physical APK file was not found on the server storage.");
  }

  // Increment download count
  release.downloadCount += 1;
  writeDB(db);

  // Set response headers for APK distribution
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", `attachment; filename="khataindex_${release.version}.apk"`);
  res.setHeader("Content-Length", release.fileSize.toString());

  // Stream file
  res.sendFile(filePath);
});

// GET: Download Latest Release APK directly
app.get("/api/download-latest", (req, res) => {
  const db = readDB();
  const visibleReleases = db.releases.filter((r) => r.isVisible);
  const latestRelease = visibleReleases.find((r) => r.isLatest) || db.releases.find((r) => r.isLatest);

  if (!latestRelease) {
    return res.status(404).send("Error: No APK releases have been published yet.");
  }

  const filePath = path.join(UPLOADS_DIR, latestRelease.fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Error: The latest APK release file was not found on server storage.");
  }

  // Increment download count
  latestRelease.downloadCount += 1;
  writeDB(db);

  // Set response headers for APK distribution
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", `attachment; filename="khataindex_${latestRelease.version}.apk"`);
  res.setHeader("Content-Length", latestRelease.fileSize.toString());

  // Stream file
  res.sendFile(filePath);
});

// Setup Vite & Frontend static routing
async function initServer() {
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
    console.log(`[KhataIndex Server] Running full-stack APK distribution at http://0.0.0.0:${PORT}`);
  });
}

initServer();
