/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  CheckCheck, 
  Share2, 
  Calendar, 
  ShieldCheck, 
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search
} from "lucide-react";

export function Screenshots() {
  const [activeTab, setActiveTab] = useState(0);

  const screens = [
    {
      title: "Digital Ledger Book",
      desc: "Track daily customer accounts, debit & credit balances with real-time totals.",
      component: (
        <div className="w-full h-full bg-slate-50 flex flex-col font-sans select-none">
          {/* Mock Status Bar */}
          <div className="bg-emerald-700 text-white text-[10px] px-3 py-1 flex justify-between items-center font-mono">
            <span>KhatBook LTE</span>
            <div className="flex items-center space-x-1">
              <span>94%</span>
              <div className="w-3 h-2 border border-white rounded-xs bg-white"></div>
            </div>
          </div>
          {/* Mock App Header */}
          <div className="bg-emerald-600 text-white px-3 py-2.5 flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-sm">
                KB
              </div>
              <div>
                <h4 className="text-[13px] font-bold leading-tight">My Business Ledger</h4>
                <p className="text-[10px] text-emerald-100">Active • 128 Customers</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Search className="w-4 h-4 text-emerald-100" />
              <Bell className="w-4 h-4 text-emerald-100" />
            </div>
          </div>

          {/* Quick Balance Summary */}
          <div className="m-3 p-3 bg-white rounded-xl shadow-xs border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Total You Will Get</p>
              <h3 className="text-lg font-bold text-emerald-600">₹42,850</h3>
            </div>
            <div className="w-[1px] h-8 bg-slate-200"></div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Total You Will Give</p>
              <h3 className="text-lg font-bold text-red-500">₹8,400</h3>
            </div>
          </div>

          {/* Search bar inside mockup */}
          <div className="mx-3 mb-2 bg-slate-100 rounded-lg px-2 py-1 flex items-center space-x-1">
            <Search className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400">Search customers...</span>
          </div>

          {/* Customer list */}
          <div className="flex-1 overflow-y-auto px-3 space-y-2">
            {[
              { name: "Ramesh Kumar", type: "get", amt: "₹14,500", date: "2 hours ago", initial: "RK", color: "bg-orange-100 text-orange-700" },
              { name: "Priya Sharma", type: "get", amt: "₹5,200", date: "Yesterday", initial: "PS", color: "bg-blue-100 text-blue-700" },
              { name: "Krishna Kirana Store", type: "give", amt: "₹8,400", date: "3 days ago", initial: "KK", color: "bg-indigo-100 text-indigo-700" },
              { name: "Rajesh Hardware", type: "get", amt: "₹23,150", date: "5 days ago", initial: "RH", color: "bg-purple-100 text-purple-700" }
            ].map((cust, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100 flex justify-between items-center shadow-2xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full ${cust.color} flex items-center justify-center font-semibold text-xs`}>
                    {cust.initial}
                  </div>
                  <div>
                    <h5 className="text-[12px] font-bold text-slate-800">{cust.name}</h5>
                    <p className="text-[9px] text-slate-400">{cust.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[12px] font-bold ${cust.type === "get" ? "text-emerald-600" : "text-red-500"}`}>
                    {cust.amt}
                  </span>
                  <p className="text-[8px] text-slate-400">
                    {cust.type === "get" ? "You will get" : "You will give"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom ledger controls */}
          <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-2 gap-2">
            <button className="bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold py-2 rounded-lg flex items-center justify-center space-x-1 border border-red-200 cursor-pointer">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>GAVE ₹ (DEBIT)</span>
            </button>
            <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[11px] font-bold py-2 rounded-lg flex items-center justify-center space-x-1 border border-emerald-200 cursor-pointer">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>GOT ₹ (CREDIT)</span>
            </button>
          </div>
        </div>
      )
    },
    {
      title: "WhatsApp Reminders",
      desc: "Send free payment links, auto-reminders and PDF bills over SMS and WhatsApp.",
      component: (
        <div className="w-full h-full bg-slate-50 flex flex-col font-sans select-none">
          {/* Mock Status Bar */}
          <div className="bg-emerald-800 text-white text-[10px] px-3 py-1 flex justify-between items-center font-mono">
            <span>KhatBook LTE</span>
            <div className="flex items-center space-x-1">
              <span>94%</span>
              <div className="w-3 h-2 border border-white rounded-xs bg-white"></div>
            </div>
          </div>
          {/* Whatsapp Mock Header */}
          <div className="bg-emerald-700 text-white px-3 py-2 flex items-center space-x-2 shadow-md">
            <div className="w-7 h-7 rounded-full bg-emerald-900 flex items-center justify-center font-semibold text-xs">
              RK
            </div>
            <div>
              <h4 className="text-[12px] font-bold leading-tight">Ramesh Kumar</h4>
              <p className="text-[9px] text-emerald-100">Online</p>
            </div>
          </div>

          <div className="flex-1 p-3 flex flex-col justify-end space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Outgoing WhatsApp reminder preview */}
            <div className="max-w-[85%] self-end bg-emerald-100 text-slate-800 p-2.5 rounded-lg rounded-tr-none shadow-xs text-[11px]">
              <p className="font-bold text-emerald-800 mb-1">📢 PAYMENT REMINDER</p>
              <p className="mb-2">Dear Ramesh Kumar, your ledger balance at **Saraswati Kirana** has an outstanding amount of **₹14,500**.</p>
              <p className="mb-2">Kindly clear this amount at your earliest. You can pay online using this secure UPI link:</p>
              <div className="bg-white p-2 rounded border border-emerald-200 flex items-center justify-between mt-1">
                <span className="text-emerald-700 font-bold font-mono text-[9px]">upi://pay?pa=saraswati@okaxis</span>
                <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm font-bold">PAY</span>
              </div>
              <div className="flex justify-end items-center space-x-1 mt-1 text-slate-400 text-[8px]">
                <span>10:42 AM</span>
                <CheckCheck className="w-3 h-3 text-emerald-600" />
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h5 className="text-[11px] font-bold text-slate-700">Quick Share Settings:</h5>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 border border-slate-100 bg-slate-50 rounded flex items-center space-x-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium text-slate-600">Send WhatsApp</span>
                </div>
                <div className="p-2 border border-slate-100 bg-slate-50 rounded flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-medium text-slate-600">Schedule Alert</span>
                </div>
              </div>
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded text-[11px] font-bold flex items-center justify-center space-x-1 cursor-pointer">
                <span>Send Manual SMS Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Business Reports",
      desc: "Generate professional PDF daybooks, business profit summaries, and GST reports.",
      component: (
        <div className="w-full h-full bg-slate-50 flex flex-col font-sans select-none">
          {/* Mock Status Bar */}
          <div className="bg-emerald-700 text-white text-[10px] px-3 py-1 flex justify-between items-center font-mono">
            <span>KhatBook LTE</span>
            <div className="flex items-center space-x-1">
              <span>94%</span>
              <div className="w-3 h-2 border border-white rounded-xs bg-white"></div>
            </div>
          </div>
          {/* App Header */}
          <div className="bg-emerald-600 text-white px-3 py-2.5 flex justify-between items-center shadow-md">
            <h4 className="text-[13px] font-bold">Financial Analytics</h4>
            <div className="flex space-x-2 text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full font-semibold">
              <span>JULY 2026</span>
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {/* Visual analytics chart */}
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-[11px] font-bold text-slate-700">Weekly Flow Analysis</h5>
                <span className="text-[9px] text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +18.4%
                </span>
              </div>
              
              {/* Custom Mini Bar Chart using CSS */}
              <div className="h-24 flex items-end justify-between px-2 pt-4">
                {[
                  { label: "Mon", h: "40%", val: "₹12K" },
                  { label: "Tue", h: "75%", val: "₹24K" },
                  { label: "Wed", h: "60%", val: "₹18K" },
                  { label: "Thu", h: "90%", val: "₹31K" },
                  { label: "Fri", h: "45%", val: "₹15K" },
                  { label: "Sat", h: "85%", val: "₹28K" },
                  { label: "Sun", h: "30%", val: "₹8K" },
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 space-y-1">
                    <span className="text-[7px] text-slate-400 font-mono">{bar.val}</span>
                    <div className="w-4 bg-emerald-500 rounded-t-sm" style={{ height: bar.h }}></div>
                    <span className="text-[8px] text-slate-500 font-semibold">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Business PDF Exports */}
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs space-y-2">
              <h5 className="text-[11px] font-bold text-slate-700">Download Business Statements</h5>
              
              {[
                { name: "Current Month Day Book", desc: "PDF statement of daily credits" },
                { name: "Customer Balance Summary", desc: "Excell/PDF list of outstanding dues" },
                { name: "Full Business GST Report", desc: "Tax compliant CSV export" }
              ].map((doc, idx) => (
                <div key={idx} className="p-2 border border-slate-50 hover:bg-slate-50 rounded-lg flex justify-between items-center cursor-pointer">
                  <div>
                    <h6 className="text-[10px] font-bold text-slate-800">{doc.name}</h6>
                    <p className="text-[8px] text-slate-400">{doc.desc}</p>
                  </div>
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                    <ArrowDownLeft className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-8 px-4" id="screenshots-section">
      {/* Left side info description */}
      <div className="w-full lg:w-5/12 space-y-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android App Interactive Tour</span>
        </div>
        
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Manage your business records with a single tap
        </h2>
        
        <p className="text-slate-400 leading-relaxed text-sm lg:text-base">
          KhataIndex is a professional digital ledger designed to help local merchants, small business owners, and wholesale traders record credit and cash payments safely and securely.
        </p>

        {/* Dynamic Selector Bullets */}
        <div className="space-y-4">
          {screens.map((sc, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start space-x-4 cursor-pointer ${
                activeTab === i
                  ? "bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/5"
                  : "bg-[#1E293B]/20 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                activeTab === i ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400 border border-slate-700/50"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${activeTab === i ? "text-emerald-400" : "text-white"}`}>
                  {sc.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {sc.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right side Android Frame Mockup */}
      <div className="w-full lg:w-6/12 flex justify-center items-center">
        <div className="relative w-[320px] h-[640px] bg-slate-950 rounded-[42px] p-3.5 shadow-2xl border-4 border-slate-800 flex flex-col">
          {/* Ear Speaker piece */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-5 w-20 h-4 bg-slate-950 rounded-full flex justify-center items-center z-20">
            {/* Front Camera hole */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 ml-1"></div>
          </div>
          
          {/* Side Buttons */}
          <div className="absolute -left-1.5 top-28 w-1 h-12 bg-slate-800 rounded-r-md"></div>
          <div className="absolute -right-1.5 top-28 w-1 h-16 bg-slate-800 rounded-l-md"></div>
          <div className="absolute -right-1.5 top-48 w-1 h-10 bg-slate-800 rounded-l-md"></div>

          {/* Core Screen Container */}
          <div className="w-full h-full rounded-[30px] overflow-hidden bg-white relative flex flex-col border border-slate-900/10">
            {screens[activeTab].component}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-slate-800 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
