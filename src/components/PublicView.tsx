/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { 
  Download, 
  QrCode, 
  Info, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  History, 
  ArrowRight,
  RefreshCw,
  Clock,
  Cpu,
  Smartphone,
  Lock
} from "lucide-react";
import { APKRelease, AppStats, SessionInfo, AppScreenshot } from "../types";
import { Screenshots } from "./Screenshots";

interface PublicViewProps {
  releases: APKRelease[];
  stats: AppStats;
  screenshots: AppScreenshot[];
  loading: boolean;
  currentUser: SessionInfo | null;
  onOpenLogin: (initialTab?: "login" | "register") => void;
  onRefresh: () => void;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function PublicView({ releases, stats, screenshots, loading, currentUser, onOpenLogin, onRefresh, onShowToast }: PublicViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  const latestRelease = releases.find((r) => r.isLatest && r.isVisible) || releases.find((r) => r.isVisible);

  useEffect(() => {
    if (latestRelease) {
      const url = `${window.location.origin}/api/download/${latestRelease.id}`;
      setDownloadUrl(url);
      
      // Generate secure QR Code pointing to this specific file download
      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0F172A", // Deep slate dark matching the sleek theme
          light: "#ffffff",
        },
      })
        .then((dataUrl) => {
          setQrCodeUrl(dataUrl);
        })
        .catch((err) => {
          console.error("Error generating QR code:", err);
        });
    }
  }, [latestRelease]);

  const handleDownload = (releaseId: string, version: string) => {
    if (!currentUser) {
      onShowToast("Authentication required: Please sign in or register to download the APK.", "info");
      onOpenLogin("login");
      return;
    }
    setDownloading(true);
    onShowToast(`Starting download for KhataIndex ${version}...`, "info");
    
    // Create an anchor and click it to trigger file stream
    const link = document.createElement("a");
    link.href = `/api/download/${releaseId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Simulate standard download start spinner and clear
    setTimeout(() => {
      setDownloading(false);
      onShowToast(`KhataIndex ${version} downloaded! Check your downloads.`, "success");
    }, 2000);
  };

  const handleDownloadLatest = () => {
    if (!latestRelease) {
      onShowToast("No active releases available for download", "error");
      return;
    }
    handleDownload(latestRelease.id, latestRelease.version);
  };

  // Helper functions for units formatting
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
      });
    } catch (e) {
      return "Recently";
    }
  };

  // Other visible versions (excluding the latest one shown in hero)
  const previousReleases = releases.filter(
    (r) => r.isVisible && (!latestRelease || r.id !== latestRelease.id)
  );

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION & DIRECT DOWNLOAD */}
      <section className="relative overflow-hidden bg-[#1E293B]/30 border border-slate-800/80 text-white py-16 px-4 sm:px-6 rounded-3xl mx-2 md:mx-4 mt-6" id="download-section">
        {/* Subtle background glows */}
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Virus-Free & Google Play Protected</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
                Download <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">KhataIndex</span> App
              </h1>
              
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
                Replace your offline paper ledger registers with a secure digital index. Keep business records safe, receive detailed credit summaries, and request payments securely with a direct link.
              </p>

              {latestRelease ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Big Download Button */}
                    <button
                      onClick={handleDownloadLatest}
                      disabled={downloading}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-800 text-slate-950 font-extrabold text-sm sm:text-base px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl flex items-center justify-center space-x-3 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer group"
                    >
                      {downloading ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                      ) : !currentUser ? (
                        <Lock className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
                      ) : (
                        <Download className="w-5 h-5 text-slate-950 group-hover:translate-y-0.5 transition-transform" />
                      )}
                      <span>
                        {downloading ? "Downloading..." : !currentUser ? "Sign In to Download" : "Download Latest APK"}
                      </span>
                    </button>

                    {/* App Specs Card Inline */}
                    <div className="flex items-center justify-between sm:justify-start sm:space-x-4 px-4 py-3 sm:py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Version</p>
                        <p className="text-sm font-extrabold text-white">{latestRelease.version}</p>
                      </div>
                      <div className="hidden sm:block w-[1px] h-6 bg-slate-800"></div>
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">File Size</p>
                        <p className="text-sm font-extrabold text-white">{formatBytes(latestRelease.fileSize)}</p>
                      </div>
                      <div className="hidden sm:block w-[1px] h-6 bg-slate-800"></div>
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Released</p>
                        <p className="text-sm font-extrabold text-white">{formatDate(latestRelease.uploadDate)}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Secure connection. APK file signed by KhataIndex developer keys.</span>
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                  <p className="text-emerald-400 font-bold mb-1">Getting ready...</p>
                  <p className="text-slate-400 text-sm">
                    No active software releases have been published yet. Log in to the administrator portal to upload the first `.apk` build file.
                  </p>
                </div>
              )}
            </div>

            {/* Right QR Code Column */}
            <div className="hidden lg:flex lg:col-span-5 flex-col items-center justify-center">
              {latestRelease && qrCodeUrl ? (
                <div className="bg-slate-950/40 p-5 rounded-3xl shadow-xl border border-slate-800 flex flex-col items-center max-w-[280px]">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 relative group">
                    <img
                      src={qrCodeUrl}
                      alt="Scan to Download APK"
                      className="w-48 h-48 rounded-lg select-none"
                    />
                    <div className="absolute inset-0 bg-slate-950/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none">
                      <QrCode className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-white font-extrabold text-sm mt-4 text-center leading-tight">
                    Scan to Download on Phone
                  </h3>
                  <p className="text-slate-400 text-[11px] text-center mt-1 leading-snug">
                    Open your mobile camera or QR scanner to download the APK directly onto your device.
                  </p>
                </div>
              ) : (
                <div className="w-52 h-52 rounded-3xl bg-slate-950/40 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <QrCode className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-xs">QR Code unavailable without active release</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 2. MOBILE-FIRST EXPLAINER WIDGETS */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E293B]/20 p-6 rounded-2xl border border-slate-800/60 shadow-xs flex items-start space-x-4 text-left">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Direct Android Install</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              No Play Store account required. Download our official client directly, open the file, and tap "Install".
            </p>
          </div>
        </div>

        <div className="bg-[#1E293B]/20 p-6 rounded-2xl border border-slate-800/60 shadow-xs flex items-start space-x-4 text-left">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/15">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">High-Speed Offline Code</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Optimized for 2G/3G networks, KhataIndex operates fully offline with automatic local database synchronization.
            </p>
          </div>
        </div>

        <div className="bg-[#1E293B]/20 p-6 rounded-2xl border border-slate-800/60 shadow-xs flex items-start space-x-4 text-left">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Verified Security SHA</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Our APK build is cryptographically locked and safe, avoiding telemetry tracking or unauthorized background permissions.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SCREENSHOTS CAROUSEL & INTERACTIVE DEMO */}
      <section className="bg-[#1E293B]/10 border border-slate-800/50 py-12 rounded-3xl mx-2 md:mx-4">
        <div className="max-w-7xl mx-auto px-4">
          <Screenshots screenshots={screenshots} />
        </div>
      </section>

      {/* 4. RELEASE NOTES / CHANGELOG */}
      {latestRelease && (
        <section className="max-w-4xl mx-auto px-4 text-left" id="changelog-section">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center space-x-2 text-emerald-400 mb-1.5 font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Changelog Details</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              What's New in KhataIndex {latestRelease.version}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Published on {formatDate(latestRelease.uploadDate)}
            </p>
          </div>

          <div className="bg-[#1E293B]/30 p-6 md:p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
              {latestRelease.changelog || "No release notes provided for this version."}
            </div>
          </div>
        </section>
      )}

      {/* 5. MANAGE PREVIOUS VERSIONS (ARCHIVE) */}
      {previousReleases.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 text-left pb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-white">Previous Releases</h3>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-semibold border border-slate-700/50">
              {previousReleases.length} Archived {previousReleases.length === 1 ? "Version" : "Versions"}
            </span>
          </div>

          <div className="space-y-3">
            {previousReleases.map((release) => (
              <div
                key={release.id}
                className="bg-[#1E293B]/20 hover:bg-[#1E293B]/40 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-slate-800 text-slate-300 rounded-lg mt-0.5 border border-slate-700/50">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">Version {release.version}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({formatBytes(release.fileSize)})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Uploaded on {formatDate(release.uploadDate)} • {release.downloadCount} downloads
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleDownload(release.id, release.version)}
                    className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition-all border border-slate-700/50 cursor-pointer"
                  >
                    {!currentUser ? (
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{!currentUser ? "Unlock & Download" : "Download APK"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer Branding */}
      <footer className="border-t border-slate-800 py-12 text-center text-slate-500 text-xs space-y-4 max-w-7xl mx-auto px-4">
        <p className="font-semibold text-slate-400">KhataIndex software distribution is maintained officially for verified Android APK builds.</p>
        <p>© 2026 KhataIndex Inc. All rights reserved. Google Play and Android are trademarks of Google LLC.</p>
      </footer>
    </div>
  );
}
