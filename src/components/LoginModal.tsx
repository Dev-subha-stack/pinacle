/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  X, 
  Lock, 
  UserPlus, 
  User as UserIcon, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { SessionInfo } from "../types";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, session: SessionInfo) => void;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
  initialTab?: "login" | "register";
}

export function LoginModal({ isOpen, onClose, onLoginSuccess, onShowToast, initialTab = "login" }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Reset inputs
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setLoading(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      onShowToast("Username and password are required", "error");
      return;
    }

    if (activeTab === "register") {
      if (password !== confirmPassword) {
        onShowToast("Passwords do not match", "error");
        return;
      }
      if (password.length < 6) {
        onShowToast("Password must be at least 6 characters long", "error");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password: password,
            fullName: fullName.trim() || undefined
          })
        });

        const result = await response.json();
        if (result.success) {
          onShowToast("Account created successfully! Logging in...", "success");
          
          // Auto-login after registration
          const loginResponse = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: username.trim(),
              password: password
            })
          });
          const loginResult = await loginResponse.json();
          if (loginResult.success && loginResult.token) {
            onLoginSuccess(loginResult.token, {
              username: loginResult.username,
              role: loginResult.role,
              fullName: loginResult.fullName
            });
            onClose();
          } else {
            // If auto-login fails, switch to login tab
            setActiveTab("login");
            setPassword("");
            setConfirmPassword("");
          }
        } else {
          onShowToast(result.message || "Registration failed", "error");
        }
      } catch (err) {
        console.error(err);
        onShowToast("Connection error while registering", "error");
      } finally {
        setLoading(false);
      }
    } else {
      // Login handling
      setLoading(true);
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password: password
          })
        });

        const result = await response.json();
        if (result.success && result.token) {
          onLoginSuccess(result.token, {
            username: result.username,
            role: result.role,
            fullName: result.fullName
          });
          onShowToast(`Welcome back, ${result.fullName || result.username}!`, "success");
          onClose();
        } else {
          onShowToast(result.message || "Invalid username or password", "error");
        }
      } catch (err) {
        console.error(err);
        onShowToast("Connection error while logging in", "error");
      } finally {
        setLoading(false);
      }
    }
  };

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

        {/* Header Tabs */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex space-x-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "register"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          {activeTab === "register" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Biswajit Roy"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeTab === "register" ? "At least 6 characters" : "••••••••••••"}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {activeTab === "register" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-900 text-slate-950 font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10 mt-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : activeTab === "register" ? (
              <UserPlus className="w-4 h-4 text-slate-950" />
            ) : (
              <Lock className="w-4 h-4 text-slate-950" />
            )}
            <span>
              {loading 
                ? "Processing..." 
                : activeTab === "register" 
                  ? "Create User Account" 
                  : "Sign In"}
            </span>
          </button>
        </form>

        <div className="bg-slate-950/40 p-4 border-t border-slate-800/80 text-center text-[11px] text-slate-400 leading-relaxed">
          {activeTab === "login" ? (
            <p>
              Use registered credentials or type the master <strong className="text-slate-300">admin</strong> username to gain administrator access.
            </p>
          ) : (
            <p>
              User accounts allow secure distribution checks, download logs, and full access to official APK releases.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
