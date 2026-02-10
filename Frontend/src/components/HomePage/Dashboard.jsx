import React from 'react';

export default function Dashboard({ isOpen, userName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#0f172a] overflow-y-auto animate-fade-up">
      <nav className="h-20 border-b border-slate-800 flex items-center px-8 justify-between bg-slate-900/50 sticky top-0 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#dash-logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="url(#dash-logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="url(#dash-logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="dash-logo-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-bold text-lg hidden md:block">Dashboard</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-sm text-slate-400">Online</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-right hidden md:block">
              <div className="text-sm font-bold text-white">{userName}</div>
              <div className="text-xs text-slate-400">Pro Plan</div>
            </span>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} className="w-10 h-10 rounded-full border border-slate-600" alt="Avatar" />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              Good Evening!
              <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" />
                </svg>
              </span>
            </h1>
            <p className="text-slate-400">
              You have <span className="text-white font-bold">12 tasks</span> pending for this week.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors text-sm font-medium">
              Import
            </button>
            <button className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-sm font-medium flex items-center gap-2">
              <span>+</span> New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl glass-card hover:bg-white/5 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/20 text-purple-300 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 21l6-6" />
                  <path d="M3 7l7 7" />
                  <path d="M14 3l7 7" />
                  <path d="M14 10l7-7" />
                </svg>
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">+12%</span>
            </div>
            <p className="text-slate-400 text-sm">Total Projects</p>
            <p className="text-3xl font-bold mt-1">24</p>
          </div>

          <div className="p-6 rounded-2xl glass-card hover:bg-white/5 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="9" cy="8" r="3" />
                  <circle cx="17" cy="9" r="3" />
                  <path d="M3 19c0-3 3-5 6-5" />
                  <path d="M13 19c0-3 3-5 6-5" />
                </svg>
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">+5%</span>
            </div>
            <p className="text-slate-400 text-sm">Active Members</p>
            <p className="text-3xl font-bold mt-1">1,204</p>
          </div>

          <div className="p-6 rounded-2xl glass-card hover:bg-white/5 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-500/20 text-orange-300 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-700/50 px-2 py-1 rounded">0%</span>
            </div>
            <p className="text-slate-400 text-sm">Server Uptime</p>
            <p className="text-3xl font-bold mt-1">99.9%</p>
          </div>

          <div className="p-6 rounded-2xl glass-card hover:bg-white/5 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-pink-500/20 text-pink-300 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">+24%</span>
            </div>
            <p className="text-slate-400 text-sm">Total Views</p>
            <p className="text-3xl font-bold mt-1">45.2k</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
            Recent Projects
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl overflow-hidden glass-card cursor-pointer group border border-slate-700 hover:border-purple-500 transition-colors">
              <div className="h-40 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/50 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1 group-hover:text-purple-400 transition-colors">Website Redesign 2024</h3>
                <p className="text-sm text-slate-500">
                  Edited 2 hours ago by <span className="text-slate-300">Alex</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card cursor-pointer group border border-slate-700 hover:border-cyan-500 transition-colors">
              <div className="h-40 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/50 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1 group-hover:text-cyan-400 transition-colors">Q1 Marketing Assets</h3>
                <p className="text-sm text-slate-500">
                  Edited 1 day ago by <span className="text-slate-300">Sarah</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card cursor-pointer group border border-slate-700 hover:border-orange-500 transition-colors">
              <div className="h-40 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/50 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1 group-hover:text-orange-400 transition-colors">Analytics Report</h3>
                <p className="text-sm text-slate-500">
                  Edited 3 days ago by <span className="text-slate-300">Mike</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
