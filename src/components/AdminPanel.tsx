/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Lock, 
  Upload, 
  FileCode, 
  Trash2, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Download, 
  CheckCircle, 
  X, 
  RefreshCw, 
  Layers, 
  LogOut,
  Sliders,
  Settings,
  Info
} from "lucide-react";
import { APKRelease, AppStats, SessionInfo } from "../types";

interface AdminPanelProps {
  releases: APKRelease[];
  stats: AppStats;
  currentUser: SessionInfo | null;
  onLogin: (token: string, session: SessionInfo) => void;
  onLogout: () => void;
  onRefresh: () => void;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
  onOpenLogin: (initialTab?: "login" | "register") => void;
  onSwitchToDownload: () => void;
}

export function AdminPanel({ 
  releases, 
  stats, 
  currentUser, 
  onLogin, 
  onLogout, 
  onRefresh, 
  onShowToast,
  onOpenLogin,
  onSwitchToDownload
}: AdminPanelProps) {
  
  // Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Upload States
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop State
  const [isDragOver, setIsDragOver] = useState(false);

  // Action Loading states
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  // Handle administrator authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      onShowToast("Please enter both username and password", "error");
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();
      if (result.success && result.token) {
        onLogin(result.token, { username: username, role: "admin", fullName: "Administrator" });
        onShowToast("Admin logged in successfully", "success");
      } else {
        onShowToast(result.message || "Invalid credentials", "error");
      }
    } catch (err) {
      console.error(err);
      onShowToast("Connection error while authenticating", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processSelectedFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "apk") {
      onShowToast("File rejection: Only .apk files are supported", "error");
      return;
    }
    setFile(selectedFile);
    onShowToast(`File selected: ${selectedFile.name}`, "info");

    // Automatically attempt to parse version number if present in filename
    const match = selectedFile.name.match(/v?(\d+\.\d+\.\d+)/i);
    if (match && match[1] && !version) {
      setVersion(match[1]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const clearFileSelection = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Version Publish Upload
  const handlePublishRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      onShowToast("Please upload an APK file first", "error");
      return;
    }
    if (!version.trim()) {
      onShowToast("Please specify the version number (e.g. 1.2.0)", "error");
      return;
    }

    setUploading(true);
    onShowToast("Uploading APK build to secure storage...", "info");

    try {
      const formData = new FormData();
      formData.append("apk", file);
      formData.append("version", version.trim());
      formData.append("changelog", changelog);

      const token = localStorage.getItem("kb_token");
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        onShowToast("New version published successfully!", "success");
        clearFileSelection();
        setVersion("");
        setChangelog("");
        onRefresh();
      } else {
        onShowToast(result.message || "Upload failed", "error");
      }
    } catch (err) {
      console.error(err);
      onShowToast("Connection error while uploading", "error");
    } finally {
      setUploading(false);
    }
  };

  // Toggle Visibility status
  const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
    setToggleLoadingId(id);
    try {
      const token = localStorage.getItem("kb_token");
      const response = await fetch(`/api/admin/releases/${id}/visibility`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isVisible: !currentVisible })
      });

      const result = await response.json();
      if (result.success) {
        onShowToast(`Version updated successfully`, "success");
        onRefresh();
      } else {
        onShowToast(result.message || "Failed to update visibility", "error");
      }
    } catch (err) {
      console.error(err);
      onShowToast("Network error updating release settings", "error");
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Delete Release Record & File
  const handleDeleteRelease = async (id: string, versionString: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete KhatBook ${versionString}?\nThis action will erase the APK file permanently and cannot be undone.`)) {
      return;
    }

    setDeleteLoadingId(id);
    try {
      const token = localStorage.getItem("kb_token");
      const response = await fetch(`/api/admin/releases/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      const result = await response.json();
      if (result.success) {
        onShowToast(`Version ${versionString} deleted successfully`, "success");
        onRefresh();
      } else {
        onShowToast(result.message || "Failed to delete release", "error");
      }
    } catch (err) {
      console.error(err);
      onShowToast("Network error deleting release record", "error");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Format Helper Units
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "N/A";
    }
  };

  // 1. SECURE LOGIN GATEWAY
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-[#1E293B]/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm shadow-2xl space-y-6 text-left relative overflow-hidden animate-fade-in">
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>

          <div className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/15">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Administrator Access Required</h2>
            {currentUser ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                You are currently signed in as <strong className="text-emerald-400">{currentUser.fullName || currentUser.username}</strong> (Verified Merchant). 
                The Admin Dashboard is restricted to platform administrators only.
              </p>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Please log in with an administrator account to upload and manage KhataIndex software releases.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {!currentUser ? (
              <button
                onClick={() => onOpenLogin("login")}
                className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                <span>Admin Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onLogout();
                  setTimeout(() => {
                    onOpenLogin("login");
                  }, 200);
                }}
                className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 animate-pulse" />
                <span>Switch to Admin Account</span>
              </button>
            )}

            <button
              onClick={onSwitchToDownload}
              className="w-full bg-slate-950/60 hover:bg-slate-950/90 text-slate-400 hover:text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 border border-slate-800/80 transition-colors cursor-pointer"
            >
              <span>Back to Download Page</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-500 leading-relaxed pt-2 border-t border-slate-800/60">
            For security, regular accounts do not have upload privileges.
          </p>
        </div>
      </div>
    );
  }

  // Calculate download stats distributions for beautiful custom inline charts
  const totalDownloadsSum = releases.reduce((sum, r) => sum + r.downloadCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-12 text-left">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">KhataIndex Software Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Secure admin portal to deploy Android APK builds, monitor active downloads, and toggle versions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-800 border border-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors cursor-pointer"
            title="Refresh Server Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Sessions</span>
          </button>
        </div>
      </div>

      {/* 2. STATS ANALYTICS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1E293B]/20 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Downloads</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <h3 className="text-2xl font-extrabold text-white">{stats.totalDownloads}</h3>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center border border-emerald-500/10">
              <TrendingUp className="w-3 h-3 mr-0.5" /> All-time
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Combined hits across all visible releases.</p>
        </div>

        <div className="bg-[#1E293B]/20 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Published Versions</p>
          <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalReleases}</h3>
          <p className="text-[10px] text-slate-400 mt-2">Historical APK files hosted in database.</p>
        </div>

        <div className="bg-[#1E293B]/20 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Current Version</p>
          <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">KhataIndex {stats.latestVersion}</h3>
          <p className="text-[10px] text-slate-400 mt-2">Marked latest active distribution target.</p>
        </div>

        <div className="bg-[#1E293B]/20 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Last Deployment Date</p>
          <h3 className="text-base font-bold text-slate-200 mt-2 truncate">
            {stats.lastUpdated ? formatDate(stats.lastUpdated) : "N/A"}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Date when last update went live.</p>
        </div>
      </section>

      {/* 3. CORE TWO COLUMN: PUBLISH BUILD VS ANALYTICS CHARTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: APK Upload Dashboard */}
        <div className="lg:col-span-7 bg-[#1E293B]/20 p-6 rounded-3xl border border-slate-800/80 shadow-md space-y-6">
          <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
            <Upload className="w-5 h-5" />
            <h2 className="text-lg font-extrabold text-white">Publish APK Update</h2>
          </div>

          <form onSubmit={handlePublishRelease} className="space-y-5">
            {/* Drag & Drop Area */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Android .APK Build File
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                  isDragOver 
                    ? "border-emerald-500 bg-emerald-500/5 scale-[1.01]" 
                    : file 
                      ? "border-emerald-500/30 bg-slate-950/20" 
                      : "border-slate-800 hover:border-slate-700 hover:bg-slate-950/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".apk"
                  className="hidden"
                />

                {file ? (
                  <div className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xs">
                    <div className="flex items-center space-x-3 text-left">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/15">
                        <FileCode className="w-6 h-6" />
                      </div>
                      <div className="max-w-[200px] sm:max-w-xs truncate">
                        <p className="text-sm font-bold text-slate-100 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Size: {formatBytes(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFileSelection();
                      }}
                      className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/15">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">Drag & Drop APK here, or click to browse</p>
                      <p className="text-xs text-slate-400 mt-1">Accepts strictly Android .apk files (Max 80MB)</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Version Input fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Version Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. v1.2.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              <div className="flex items-end">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/15 flex items-center space-x-2 text-emerald-400 text-xs font-semibold w-full">
                  <CheckCircle className="w-4 h-4" />
                  <span>Will mark as the "Latest Active" download</span>
                </div>
              </div>
            </div>

            {/* Changelog description input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Release Notes / Changelog
              </label>
              <textarea
                rows={4}
                placeholder="• Bug fixes and ledger optimization&#10;• Faster UPI payment links generation&#10;• Secure PDF reports backup..."
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors font-sans leading-relaxed"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-900 text-slate-950 font-extrabold text-sm py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-99"
            >
              {uploading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{uploading ? "Uploading & Encrypting File..." : "Publish Version Live"}</span>
            </button>
          </form>
        </div>

        {/* Right: Distribution Analytics Shares */}
        <div className="lg:col-span-5 bg-[#1E293B]/20 p-6 rounded-3xl border border-slate-800/80 shadow-md space-y-6">
          <div className="flex items-center space-x-2 text-teal-400 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5" />
            <h2 className="text-lg font-extrabold text-white">Version Analytics</h2>
          </div>

          <div className="space-y-5">
            <p className="text-xs text-slate-400">
              Visual overview of install market share across all active and legacy versions.
            </p>

            {releases.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm">No download data available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {releases.map((release) => {
                  const sharePercentage = totalDownloadsSum > 0 
                    ? Math.round((release.downloadCount / totalDownloadsSum) * 100) 
                    : 0;

                  return (
                    <div key={release.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2 font-bold text-slate-300">
                          <span>v{release.version}</span>
                          {release.isLatest && (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20">Latest</span>
                          )}
                          {!release.isVisible && (
                            <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded border border-slate-700/50">Archived</span>
                          )}
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {release.downloadCount} downloads ({sharePercentage}%)
                        </span>
                      </div>

                      {/* Custom visual progress bar */}
                      <div className="w-full bg-slate-950/50 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            release.isLatest 
                              ? "bg-gradient-to-r from-emerald-400 to-teal-500" 
                              : "bg-slate-600"
                          }`}
                          style={{ width: `${Math.max(sharePercentage, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-4 bg-slate-950/30 rounded-2xl border border-slate-800 mt-4">
              <div className="flex items-start space-x-3">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-300">Storage Optimization</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                    To maintain lightning-fast response times, you are recommended to archive older unused releases, freeing up container space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 4. MANAGE AND DEPLOY APK VERSIONS LIST */}
      <section className="bg-[#1E293B]/20 p-6 rounded-3xl border border-slate-800/80 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Layers className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-extrabold text-white">Manage Published Builds</h2>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold border border-slate-700/50">
            {releases.length} total releases
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wide">
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Date Uploaded</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Downloads</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {releases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No versions published yet. Use the dashboard to release your first APK build!
                  </td>
                </tr>
              ) : (
                releases.map((release) => (
                  <tr key={release.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>v{release.version}</span>
                        {release.isLatest && (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                            LATEST LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[150px] truncate">{release.fileName}</p>
                    </td>
                    
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {formatDate(release.uploadDate)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                      {formatBytes(release.fileSize)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="flex items-center space-x-1">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-200">{release.downloadCount}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        release.isVisible 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-slate-800 text-slate-400 border-slate-700/50"
                      }`}>
                        {release.isVisible ? "Visible to Users" : "Hidden / Archived"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Toggle visibility */}
                        <button
                          onClick={() => handleToggleVisibility(release.id, release.isVisible)}
                          disabled={toggleLoadingId === release.id}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            release.isVisible 
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700/50 hover:text-white" 
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                          }`}
                          title={release.isVisible ? "Archive version (hide from page)" : "Publish version (show on page)"}
                        >
                          {toggleLoadingId === release.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : release.isVisible ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>

                        {/* Direct Download for admin troubleshooting */}
                        <a
                          href={`/api/download/${release.id}`}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700/50 rounded-lg hover:text-white cursor-pointer"
                          title="Direct Download APK File"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Delete Release */}
                        <button
                          onClick={() => handleDeleteRelease(release.id, release.version)}
                          disabled={deleteLoadingId === release.id}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors cursor-pointer"
                          title="Delete release permanently"
                        >
                          {deleteLoadingId === release.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
