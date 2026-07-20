/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { PublicView } from "./components/PublicView";
import { AdminPanel } from "./components/AdminPanel";
import { LoginModal } from "./components/LoginModal";
import { ProfileModal } from "./components/ProfileModal";
import { APKRelease, AppStats, SessionInfo } from "./types";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  X, 
  RefreshCw
} from "lucide-react";

export default function App() {
  // Views & Routing State
  const [isAdminView, setIsAdminView] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionInfo | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalInitialTab, setLoginModalInitialTab] = useState<"login" | "register">("login");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Theme State ("dark" | "light")
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("kb_theme") as "dark" | "light") || "dark";
  });

  // Apply theme class to document root
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("kb_theme", theme);
  }, [theme]);

  // App Data State
  const [releases, setReleases] = useState<APKRelease[]>([]);
  const [screenshots, setScreenshots] = useState<import("./types").AppScreenshot[]>([]);
  const [stats, setStats] = useState<AppStats>({
    totalDownloads: 0,
    totalReleases: 0,
    latestVersion: "N/A",
    lastUpdated: ""
  });
  const [loading, setLoading] = useState(true);

  // Custom Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    id: number;
  } | null>(null);

  // Display toast alerts
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToast({ message, type, id });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync state & load data from express
  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("kb_token");
      
      // Fetch releases (authenticated if token exists)
      const releasesRes = await fetch("/api/releases", {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      const releasesData = await releasesRes.json();
      if (releasesData.success) {
        setReleases(releasesData.data);
      }

      // Fetch statistics
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch screenshots
      const screenshotsRes = await fetch("/api/screenshots");
      const screenshotsData = await screenshotsRes.json();
      if (screenshotsData.success) {
        setScreenshots(screenshotsData.data);
      }
    } catch (err) {
      console.error("Failed to load backend releases:", err);
      showToast("Could not connect to database, operating on local state.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Check active user or admin login sessions
  const verifySession = async () => {
    const token = localStorage.getItem("kb_token");
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const res = await fetch("/api/auth/check-session", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (result.success && result.session) {
        setCurrentUser(result.session);
      } else {
        // Clear invalid token
        localStorage.removeItem("kb_token");
        setCurrentUser(null);
      }
    } catch (e) {
      console.error(e);
      setCurrentUser(null);
    }
  };

  // Browser-native router detection
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/admin" || hash === "#admin") {
        setIsAdminView(true);
      } else {
        setIsAdminView(false);
      }
    };

    handleUrlRouting();
    verifySession();
    loadData();

    window.addEventListener("popstate", handleUrlRouting);
    return () => window.removeEventListener("popstate", handleUrlRouting);
  }, []);

  // Sync releases when auth changes
  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Navigation switching handler
  const handleToggleView = () => {
    const targetIsAdmin = !isAdminView;
    setIsAdminView(targetIsAdmin);
    
    // Update address bar path
    if (targetIsAdmin) {
      window.history.pushState({}, "", "/admin");
    } else {
      window.history.pushState({}, "", "/");
    }
  };

  const handleLoginSuccess = (token: string, session: SessionInfo) => {
    localStorage.setItem("kb_token", token);
    setCurrentUser(session);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("kb_token");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("kb_token");
    setCurrentUser(null);
    setIsAdminView(false);
    window.history.pushState({}, "", "/");
    showToast("Logged out from session", "info");
  };

  const handleOpenLogin = (initialTab: "login" | "register" = "login") => {
    setLoginModalInitialTab(initialTab);
    setIsLoginModalOpen(true);
  };

  const handleProfileUpdate = (updatedSession: SessionInfo) => {
    setCurrentUser(updatedSession);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased">
      {/* Dynamic Header Navbar */}
      <Navbar 
        isAdminView={isAdminView} 
        onToggleView={handleToggleView} 
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === "light" ? "dark" : "light")}
      />

      {/* Main Core Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        {loading && releases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-slate-400 text-sm font-semibold">Synchronizing with KhataIndex Cloud...</p>
          </div>
        ) : isAdminView ? (
          <AdminPanel 
            releases={releases} 
            stats={stats} 
            screenshots={screenshots}
            currentUser={currentUser}
            onLogin={handleLoginSuccess}
            onLogout={handleLogout}
            onRefresh={loadData}
            onShowToast={showToast}
            onOpenLogin={handleOpenLogin}
            onSwitchToDownload={() => {
              setIsAdminView(false);
              window.history.pushState({}, "", "/");
            }}
          />
        ) : (
          <PublicView 
            releases={releases} 
            stats={stats} 
            screenshots={screenshots}
            loading={loading}
            currentUser={currentUser}
            onOpenLogin={handleOpenLogin}
            onRefresh={loadData}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* UNIFIED LOGIN / REGISTER MODAL */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={showToast}
        initialTab={loginModalInitialTab}
      />

      {/* USER PROFILE SETTINGS MODAL */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdate={handleProfileUpdate}
        onShowToast={showToast}
      />

      {/* FLOATING TOAST SYSTEM */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in pointer-events-auto">
          <div className={`p-4 rounded-2xl border flex items-start space-x-3 shadow-xl max-w-sm transition-all duration-300 ${
            toast.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
              : toast.type === "error" 
                ? "bg-red-50 border-red-200 text-red-950" 
                : "bg-blue-50 border-blue-200 text-blue-950"
          }`}>
            <div className="mt-0.5">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
              {toast.type === "error" && <XCircle className="w-5 h-5 text-red-600" />}
              {toast.type === "info" && <AlertCircle className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {toast.type === "success" ? "Success" : toast.type === "error" ? "Error Alert" : "System Notification"}
              </p>
              <p className="text-sm font-semibold mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
