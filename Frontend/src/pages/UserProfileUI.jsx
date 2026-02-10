import React, { useState } from 'react';
import { 
  User, Lock, Bell, CreditCard, LogOut, ChevronLeft, 
  Camera, Check, AlertTriangle
} from 'lucide-react';

export default function UserProfileUI() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Handle the "Save" simulation
  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate network request
    setTimeout(() => {
      setIsSaving(false);
      triggerToast();
    }, 1500);
  };

  // Handle Toast Notification
  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  ];

  return (
    <div className="bg-[#0f172a] text-white min-h-screen overflow-x-hidden selection:bg-purple-500/30 font-sans relative">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>
        {/* Noise Overlay */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 glass h-20 flex items-center border-b border-white/5 backdrop-blur-xl bg-slate-900/60">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-cyan-400 rounded-lg blur opacity-40 group-hover:opacity-100 transition-opacity"></div>
              {/* Logo SVG */}
              <svg className="w-10 h-10 relative z-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="url(#nav-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
                <defs>
                  <linearGradient id="nav-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a855f7"/>
                    <stop offset="1" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">CollabCanvas</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors relative">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <Bell className="w-5 h-5 text-slate-300" />
            </button>
            <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10 flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="container mx-auto px-6 pt-32 pb-12 relative z-10 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR */}
        <aside className="w-full md:w-64 flex-shrink-0 animate-slide-in">
          <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sticky top-32">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-purple-500 to-cyan-500 avatar-glow mb-4 relative group cursor-pointer">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full rounded-full bg-slate-900" alt="Avatar" />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold">Felix B.</h2>
              <p className="text-sm text-slate-400">@felix_creates</p>
              <div className="mt-3 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/20">
                Pro Plan
              </div>
            </div>

            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${
                    activeTab === tab.id 
                      ? 'bg-purple-500/15 text-purple-400 border-l-2 border-purple-500' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-white/5">
              <button className="w-full text-left px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium flex items-center gap-3">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-1">Edit Profile</h2>
                <p className="text-slate-400 text-sm mb-8">Update your personal information and public profile.</p>

                {/* Banner */}
                <div className="h-32 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 w-full mb-8 relative group cursor-pointer overflow-hidden border border-white/5">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                    <span className="px-4 py-2 rounded-lg bg-black/50 backdrop-blur text-sm font-medium border border-white/10 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Change Banner
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">First Name</label>
                      <input type="text" defaultValue="Felix" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Last Name</label>
                      <input type="text" defaultValue="Bennett" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                      <input type="text" defaultValue="felix_creates" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Bio</label>
                    <textarea rows="4" defaultValue="Digital artist and frontend developer passionate about creating stunning user experiences." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"></textarea>
                    <p className="text-xs text-slate-500 text-right">0 / 250</p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-bold text-white shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-1">Security Settings</h2>
                <p className="text-slate-400 text-sm mb-8">Manage your password and account security.</p>
                
                <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Current Password</label>
                    <input type="password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">New Password</label>
                      <input type="password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Confirm Password</label>
                      <input type="password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>Changing your password will sign you out of all other devices.</p>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isSaving} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white transition-all disabled:opacity-70">
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="glass bg-slate-900/40 border border-red-500/20 backdrop-blur-xl rounded-2xl p-8">
                <h3 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-slate-400 text-sm mb-6">Permanently delete your account and all of your content.</p>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-500">Once you delete your account, there is no going back.</div>
                  <button className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-bold">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in h-full flex items-center justify-center">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-12 text-center w-full max-w-2xl">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Notifications</h3>
                <p className="text-slate-400 mt-2">Manage your email and push notification preferences here.</p>
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="animate-fade-in h-full flex items-center justify-center">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-12 text-center w-full max-w-2xl">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold">Billing & Plans</h3>
                <p className="text-slate-400 mt-2">View your receipts and manage your Pro Plan subscription.</p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- TOAST NOTIFICATION --- */}
      <div 
        className={`fixed bottom-8 right-8 bg-slate-800 border border-green-500/50 text-white px-6 py-4 rounded-xl shadow-2xl transition-all duration-500 flex items-center gap-3 z-50 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'
        }`}
      >
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={4} />
        </div>
        <div>
          <h4 className="font-bold text-sm">Success!</h4>
          <p className="text-xs text-slate-400">Your profile has been updated.</p>
        </div>
      </div>
    </div>
  );
}