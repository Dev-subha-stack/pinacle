/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  X, 
  Lock, 
  User as UserIcon, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert
} from "lucide-react";
import { SessionInfo } from "../types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SessionInfo | null;
  onProfileUpdate: (session: SessionInfo) => void;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function ProfileModal({ isOpen, onClose, currentUser, onProfileUpdate, onShowToast }: ProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setFullName(currentUser.fullName || currentUser.username);
      // Reset sensitive fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setLoading(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      onShowToast("Full Name cannot be empty", "error");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        onShowToast("Current password is required to change to a new password", "error");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        onShowToast("New passwords do not match", "error");
        return;
      }
      if (newPassword.length < 6) {
        onShowToast("New password must be at least 6 characters long", "error");
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("kb_token");
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword ? newPassword : undefined
        })
      });

      const result = await response.json();
      if (result.success && result.session) {
        onProfileUpdate(result.session);
        onShowToast(result.message || "Profile updated successfully!", "success");
        onClose();
      } else {
        onShowToast(result.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error(err);
      onShowToast("Connection error while updating profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div className="relative bg-[#1E293B] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in text-left">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-7 pb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-xl ${isAdmin ? "bg-red-500/10 text-red-400 border border-red-500/10" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"}`}>
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Profile Settings</h2>
              <p className="text-xs text-slate-400">
                {isAdmin ? "Manage administrator identity info." : "Update your personal ledger identity details."}
              </p>
            </div>
          </div>
          <div className="w-full h-[1px] bg-slate-800/80 mt-4"></div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-7 space-y-4">
          {/* Username (Read-Only) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Username (Unique Account Key)
            </label>
            <input
              type="text"
              disabled
              value={currentUser.username}
              className="w-full bg-slate-900/40 border border-slate-800 text-slate-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed font-mono"
            />
          </div>

          {/* Full Display Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Full Display Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Password Settings Section */}
          <div className="pt-2 border-t border-slate-800/60">
            <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Update Password</span>
            </h3>

            {isAdmin ? (
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-3 flex space-x-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  The primary administrator password is bound directly to server-side configuration environments (`ADMIN_PASSWORD`). To change it, update the system deployment environment variables.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Current Password */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password & Confirm Password Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New (Min. 6 chars)"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-sm py-3 px-4 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-900 text-slate-950 font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <UserCheck className="w-4 h-4 text-slate-950" />
              )}
              <span>{loading ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
