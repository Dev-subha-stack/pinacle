/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { APKRelease, User, AppScreenshot } from "../types";

let supabaseInstance: SupabaseClient | null = null;
let isInitialized = false;

/**
 * Lazy initialization of Supabase SDK.
 * This guarantees the server will not crash on startup if environment variables are not yet set.
 */
export function getSupabase(): SupabaseClient | null {
  if (isInitialized) {
    return supabaseInstance;
  }

  let supabaseUrl = "https://mcxxgadazmcfrzdadswn.supabase.co";
  let supabaseServiceKey = "sb_publishable__z_kHl6M5xRckLm13fKXFA_EEl2zOCk";

  if (supabaseUrl) {
    supabaseUrl = supabaseUrl.replace(/^["']|["']$/g, '').trim();
    // Auto-fix if user only provided the project ID or missing protocol
    if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      if (supabaseUrl.includes('.')) {
        supabaseUrl = 'https://' + supabaseUrl;
      } else {
        supabaseUrl = `https://${supabaseUrl}.supabase.co`;
      }
    }
  }
  if (supabaseServiceKey) {
    supabaseServiceKey = supabaseServiceKey.replace(/^["']|["']$/g, '').trim();
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "⚠️ Supabase credentials are not fully configured in environment variables.\n" +
      "Falling back to local file-based database (database.json) for local development/preview.\n" +
      "To connect live Supabase: Define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) in your settings."
    );
    isInitialized = true;
    supabaseInstance = null;
    return null;
  }

  try {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Unrecognized Supabase API key format')) return;
      originalWarn(...args);
    };
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    console.warn = originalWarn;
    console.log("⚡ Successfully connected to Supabase!");
  } catch (error) {
    console.error("❌ Failed to initialize Supabase SDK:", error);
    supabaseInstance = null;
  }

  isInitialized = true;
  return supabaseInstance;
}

// Map database snake_case to applet camelCase
function mapReleaseToApp(row: any): APKRelease {
  return {
    id: row.id,
    version: row.version,
    fileName: row.file_name || row.fileName || "",
    fileSize: Number(row.file_size || row.fileSize || 0),
    changelog: row.changelog || "",
    uploadDate: row.upload_date || row.uploadDate || new Date().toISOString(),
    downloadCount: Number(row.download_count || row.downloadCount || 0),
    isLatest: row.is_latest !== undefined ? row.is_latest : (row.isLatest || false),
    isVisible: row.is_visible !== undefined ? row.is_visible : (row.isVisible || false),
  };
}

function mapReleaseToDb(release: APKRelease) {
  return {
    id: release.id,
    version: release.version,
    file_name: release.fileName,
    file_size: release.fileSize,
    changelog: release.changelog,
    upload_date: release.uploadDate,
    download_count: release.downloadCount,
    is_latest: release.isLatest,
    is_visible: release.isVisible,
  };
}

function mapUserToApp(row: any): User {
  return {
    username: row.username,
    passwordHash: row.password_hash || row.passwordHash || "",
    fullName: row.full_name || row.fullName || "",
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

function mapUserToDb(user: User) {
  return {
    username: user.username.toLowerCase(),
    password_hash: user.passwordHash,
    full_name: user.fullName || "",
    created_at: user.createdAt,
  };
}

function mapScreenshotToApp(row: any): AppScreenshot {
  return {
    id: row.id,
    title: row.title || "",
    desc: row.description || row.desc || "",
    imageUrl: row.image_url || row.imageUrl || "",
    order: Number(row.order_idx || row.order || 0),
  };
}

function mapScreenshotToDb(screenshot: AppScreenshot) {
  return {
    id: screenshot.id,
    title: screenshot.title,
    description: screenshot.desc,
    image_url: screenshot.imageUrl,
    order_idx: screenshot.order,
  };
}

/**
 * Sync helper: Pull all releases and users from Supabase. Falling back to local file if disabled/errored.
 */
export async function syncFromSupabase(): Promise<{ releases: APKRelease[]; users: User[]; screenshots: AppScreenshot[] } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // 1. Fetch releases
    const { data: releasesData, error: releasesError } = await supabase
      .from("releases")
      .select("*");
    
    if (releasesError) {
      if (releasesError.message?.includes("fetch failed") || String(releasesError).includes("fetch failed")) {
        // silent fallback
        supabaseInstance = null; // Disable future queries
        return null;
      }
      console.warn("⚠️ Releases table query error (it may not exist yet in Supabase):", releasesError.message);
    }

    // 2. Fetch users
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("*");

    if (usersError) {
      if (usersError.message?.includes("fetch failed") || String(usersError).includes("fetch failed")) {
        supabaseInstance = null;
        return null;
      }
      console.warn("⚠️ Users table query error (it may not exist yet in Supabase):", usersError.message);
    }

    // 3. Fetch screenshots
    const { data: screenshotsData, error: screenshotsError } = await supabase
      .from("screenshots")
      .select("*");

    if (screenshotsError) {
      if (screenshotsError.message?.includes("fetch failed") || String(screenshotsError).includes("fetch failed")) {
        supabaseInstance = null;
        return null;
      }
      console.warn("⚠️ Screenshots table query error (it may not exist yet in Supabase):", screenshotsError.message);
    }

    const releases = (releasesData || []).map(mapReleaseToApp);
    const users = (usersData || []).map(mapUserToApp);
    const screenshots = (screenshotsData || []).map(mapScreenshotToApp);

    return { releases, users, screenshots };
  } catch (error: any) {
    if (error?.message?.includes("fetch failed") || String(error).includes("fetch failed") || error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED") {
      // silent fallback
      supabaseInstance = null;
      return null;
    }
    console.error("❌ Failed to fetch data from Supabase:", error);
    return null;
  }
}

/**
 * Save / update a single release in Supabase.
 */
export async function saveReleaseToSupabase(release: APKRelease): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const dbRow = mapReleaseToDb(release);
    const { error } = await supabase
      .from("releases")
      .upsert(dbRow, { onConflict: "id" });

    if (error) {
      if (error.message?.includes("fetch failed") || String(error).includes("fetch failed")) {
        supabaseInstance = null;
        return false;
      }
      console.error(`❌ Supabase error saving release ${release.id}:`, error.message);
      return false;
    }
    return true;
  } catch (error: any) {
    if (error?.message?.includes("fetch failed") || String(error).includes("fetch failed")) {
      supabaseInstance = null; return false;
    }
    console.error(`❌ Failed to save release ${release.id} to Supabase:`, error);
    return false;
  }
}

/**
 * Save / update a single user in Supabase.
 */
export async function saveUserToSupabase(user: User): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const dbRow = mapUserToDb(user);
    const { error } = await supabase
      .from("users")
      .upsert(dbRow, { onConflict: "username" });

    if (error) {
      if (error.message?.includes("fetch failed") || String(error).includes("fetch failed")) {
        supabaseInstance = null;
        return false;
      }
      console.error(`❌ Supabase error saving user ${user.username}:`, error.message);
      return false;
    }
    return true;
  } catch (error: any) {
    if (error?.message?.includes("fetch failed") || String(error).includes("fetch failed")) {
      supabaseInstance = null; return false;
    }
    console.error(`❌ Failed to save user ${user.username} to Supabase:`, error);
    return false;
  }
}

/**
 * Save / update a single screenshot in Supabase.
 */
export async function saveScreenshotToSupabase(screenshot: AppScreenshot): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const dbRow = mapScreenshotToDb(screenshot);
    const { error } = await supabase
      .from("screenshots")
      .upsert(dbRow, { onConflict: "id" });

    if (error) {
      if (error.message?.includes("fetch failed") || String(error).includes("fetch failed")) {
        supabaseInstance = null;
        return false;
      }
      console.error(`❌ Supabase error saving screenshot ${screenshot.id}:`, error.message);
      return false;
    }
    return true;
  } catch (error: any) {
    if (error?.message?.includes("fetch failed") || String(error).includes("fetch failed")) {
      supabaseInstance = null; return false;
    }
    console.error(`❌ Failed to save screenshot ${screenshot.id} to Supabase:`, error);
    return false;
  }
}

/**
 * Delete a screenshot from Supabase
 */
export async function deleteScreenshotFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("screenshots")
      .delete()
      .eq("id", id);
    if (error) {
      if (error.message?.includes("fetch failed") || String(error).includes("fetch failed")) {
        supabaseInstance = null;
        return false;
      }
      console.error(`❌ Supabase error deleting screenshot ${id}:`, error.message);
      return false;
    }
    return true;
  } catch (error: any) {
    if (error?.message?.includes("fetch failed") || String(error).includes("fetch failed")) {
      supabaseInstance = null; return false;
    }
    console.error(`❌ Failed to delete screenshot ${id} from Supabase:`, error);
    return false;
  }
}
