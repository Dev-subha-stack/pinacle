/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BookOpen, Shield, ArrowLeftRight, LogOut, Settings, Sun, Moon } from "lucide-react";
import { SessionInfo } from "../types";

interface NavbarProps {
  isAdminView: boolean;
  onToggleView: () => void;
  currentUser: SessionInfo | null;
  onLogout: () => void;
  onOpenLogin: (initialTab?: "login" | "register") => void;
  onOpenProfile: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function Navbar({ 
  isAdminView, 
  onToggleView, 
  currentUser, 
  onLogout, 
  onOpenLogin, 
  onOpenProfile,
  theme,
  onToggleTheme
}: NavbarProps) {
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* KhataIndex Brand Logo */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" onClick={() => { if (isAdminView) onToggleView(); }}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight leading-none">Khata<span className="text-emerald-400">Index</span></span>
              <span className="hidden sm:inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 leading-none">
                Official Distribution
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400 font-medium mt-0.5">Safe & Secure APK Portal</p>
          </div>
        </div>

        {/* Navigation Quick Controls */}
        <div className="flex items-center space-x-4">
          {/* Section links (only visible on client view) */}
          {!isAdminView && (
            <div className="hidden md:flex items-center space-x-6 mr-2 text-sm font-semibold text-slate-400">
              <a href="#download-section" className="hover:text-emerald-400 transition-colors">Download</a>
              <a href="#screenshots-section" className="hover:text-emerald-400 transition-colors">App Tour</a>
              <a href="#changelog-section" className="hover:text-emerald-400 transition-colors">Releases</a>
            </div>
          )}

          {/* User Session status area */}
          {currentUser ? (
            <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-950/40 border border-slate-800/80 p-1.5 sm:pr-3.5 pr-1.5 rounded-2xl">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-xs">
                {getInitials(currentUser.fullName || currentUser.username)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase leading-none">
                  {currentUser.role === "admin" ? "System Admin" : "Verified Merchant"}
                </p>
                <p className="text-xs font-bold text-white leading-tight mt-0.5">
                  {currentUser.fullName || currentUser.username}
                </p>
              </div>
              
              <div className="w-[1px] h-5 bg-slate-800 hidden sm:block mx-1"></div>

              <button
                onClick={onOpenProfile}
                title="Profile Settings"
                className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={onLogout}
                title="Logout from session"
                className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenLogin("login")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700/50 shadow-sm transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenLogin("register")}
                className="hidden sm:block bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to High-Contrast Light Mode"}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-amber-500" /> : <Sun className="w-4 h-4 text-yellow-400" />}
          </button>

          {/* Portal Switcher */}
          {isAdminView ? (
            <button
              onClick={onToggleView}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Go To Download Page</span>
            </button>
          ) : (
            // Show Admin Dashboard button - if admin role is active, goes straight to panel. Otherwise, prompts login
            <button
              onClick={() => {
                if (currentUser && currentUser.role === "admin") {
                  onToggleView();
                } else if (currentUser && currentUser.role === "user") {
                  // User is logged in but doesn't have Admin. Show toast or switch and let AdminPanel handle error
                  onToggleView();
                } else {
                  // Guest: open Login Modal directly with prompt
                  onOpenLogin("login");
                }
              }}
              className="bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 border border-slate-700/40 shadow-sm transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Admin Panel</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
