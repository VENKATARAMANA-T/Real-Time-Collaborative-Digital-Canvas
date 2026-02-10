import React, { useState } from 'react';
import { 
  User, Lock, Bell, CreditCard, LogOut, ChevronLeft, 
  Camera, Check, AlertTriangle, Copy, Mail, Eye, EyeOff, 
  Zap, Shield, Download, Settings, MoreVertical, X, ArrowRight
} from 'lucide-react';

export default function UserProfileUI() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showPassword, setShowPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Toast handler
  const showToastMsg = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Copy to clipboard
  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToastMsg('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle the "Save" simulation
  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      showToastMsg('Profile updated successfully!', 'success');
      setEditMode(false);
    }, 1500);
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  ];

  const Toast = () => {
    if (!showToast) return null;
    return (
      <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-in ${
        toastType === 'success' 
          ? 'bg-green-500 text-white' 
          : toastType === 'error'
          ? 'bg-red-500 text-white'
          : 'bg-blue-500 text-white'
      }`}>
        <Check className="w-5 h-5" />
        <span className="font-medium">{toastMessage}</span>
      </div>
    );
  };

  return (
    <div className="bg-[#0f172a] text-white min-h-screen overflow-x-hidden selection:bg-purple-500/30 font-sans relative">
      <Toast />
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 glass h-20 flex items-center border-b border-white/5 backdrop-blur-xl bg-slate-900/60">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer hover:drop-shadow-lg transition-all">
            <div className="w-10 h-10 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-cyan-400 rounded-lg blur opacity-40 group-hover:opacity-100 transition-opacity"></div>
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
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-purple-500 transition-all relative group">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <Bell className="w-5 h-5 text-slate-300 group-hover:text-purple-400 transition-colors" />
            </button>
            <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-sm font-medium transition-all border border-white/10 hover:border-purple-500 flex items-center gap-2 group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
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
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-purple-500 to-cyan-500 avatar-glow mb-4 relative group cursor-pointer transform transition-transform hover:scale-110">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full rounded-full bg-slate-900" alt="Avatar" />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold">Felix B.</h2>
              <p className="text-sm text-slate-400">@felix_creates</p>
              <div className="mt-3 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Pro Plan
              </div>
            </div>

            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-all transform hover:translate-x-1 ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-purple-500/15 to-cyan-500/15 text-purple-400 border-l-2 border-purple-500 shadow-lg' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-white/5">
              <button className="w-full text-left px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-medium flex items-center gap-3 group">
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in space-y-6">
              {/* Header Card */}
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-1">Edit Profile</h2>
                    <p className="text-slate-400 text-sm">Update your personal information and public profile.</p>
                  </div>
                  <button 
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      editMode 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                    }`}
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {/* Banner */}
                <div className="h-32 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 w-full mb-8 relative group cursor-pointer overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                    <span className="px-4 py-2 rounded-lg bg-black/50 backdrop-blur text-sm font-medium border border-white/10 flex items-center gap-2 transform group-hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" /> Change Banner
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <label className="text-xs font-semibold text-slate-400 uppercase">First Name</label>
                      <input 
                        type="text" 
                        defaultValue="Felix" 
                        disabled={!editMode}
                        className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                          editMode 
                            ? 'border-slate-700 hover:border-purple-500 cursor-text' 
                            : 'border-slate-700/50 cursor-not-allowed opacity-75'
                        }`} 
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Last Name</label>
                      <input 
                        type="text" 
                        defaultValue="Bennett" 
                        disabled={!editMode}
                        className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                          editMode 
                            ? 'border-slate-700 hover:border-purple-500 cursor-text' 
                            : 'border-slate-700/50 cursor-not-allowed opacity-75'
                        }`} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                      <input 
                        type="text" 
                        defaultValue="felix_creates" 
                        disabled={!editMode}
                        className={`w-full bg-slate-900/50 border rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                          editMode 
                            ? 'border-slate-700 hover:border-purple-500 cursor-text' 
                            : 'border-slate-700/50 cursor-not-allowed opacity-75'
                        }`} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Bio</label>
                    <textarea 
                      rows="4" 
                      defaultValue="Digital artist and frontend developer passionate about creating stunning user experiences." 
                      disabled={!editMode}
                      className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                        editMode 
                          ? 'border-slate-700 hover:border-purple-500 cursor-text' 
                          : 'border-slate-700/50 cursor-not-allowed opacity-75'
                      }`}
                    ></textarea>
                    <p className="text-xs text-slate-500 text-right">0 / 250</p>
                  </div>

                  {editMode && (
                    <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white shadow-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-bold text-white shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Account Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 group hover:border-purple-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold">Email Address</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">felix.bennett@example.com</p>
                  <button 
                    onClick={() => handleCopy('felix.bennett@example.com', 'email')}
                    className="w-full px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 text-sm font-medium transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <Copy className={`w-4 h-4 transition-transform ${copiedField === 'email' ? 'scale-0' : 'scale-100'}`} />
                    {copiedField === 'email' ? 'Copied!' : 'Copy Email'}
                  </button>
                </div>

                <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold">Account Status</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">Pro Plan • Active</p>
                  <button className="w-full px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <ArrowRight className="w-4 h-4" /> Manage Plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="animate-fade-in space-y-6">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-1">Security Settings</h2>
                <p className="text-slate-400 text-sm mb-8">Manage your password and account security.</p>
                
                <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">New Password</label>
                      <input type="password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Confirm Password</label>
                      <input type="password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm group hover:bg-yellow-500/15 transition-all">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 group-hover:animate-bounce" />
                    <p>Changing your password will sign you out of all other devices.</p>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => showToastMsg('Password reset cancelled', 'success')} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold text-white transition-all disabled:opacity-70 shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed">
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-400" />
                    <div>
                      <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
                      <p className="text-sm text-slate-400">Add extra layer of security to your account</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">Enabled</span>
                </div>
                <button className="px-6 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all text-sm font-bold">
                  Manage 2FA
                </button>
              </div>
              
              {/* Danger Zone */}
              <div className="glass bg-slate-900/40 border border-red-500/20 backdrop-blur-xl rounded-2xl p-8">
                <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-slate-400 text-sm mb-6">Permanently delete your account and all of your content.</p>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-500">Once you delete your account, there is no going back.</div>
                  <button onClick={() => showToastMsg('Delete account function called', 'error')} className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-bold">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in space-y-6">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-1">Notification Preferences</h2>
                <p className="text-slate-400 text-sm mb-8">Manage your email and push notification settings.</p>

                <div className="space-y-4 max-w-2xl">
                  {[
                    { title: 'Email Notifications', desc: 'Receive updates about your account activity', enabled: true },
                    { title: 'Project Updates', desc: 'Get notified when projects are shared', enabled: true },
                    { title: 'Marketing Emails', desc: 'Learn about new features and promotions', enabled: false },
                    { title: 'Weekly Digest', desc: 'Summary of your activity each week', enabled: true },
                  ].map((notif, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-white/5 hover:border-purple-500/30 transition-all group">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{notif.title}</h4>
                        <p className="text-sm text-slate-400">{notif.desc}</p>
                      </div>
                      <button
                        onClick={() => showToastMsg(`${notif.title} notification ${notif.enabled ? 'disabled' : 'enabled'}`, 'success')}
                        className={`relative w-12 h-7 rounded-full transition-all ml-4 flex-shrink-0 ${
                          notif.enabled ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${notif.enabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="animate-fade-in space-y-6">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-1">Billing & Plans</h2>
                <p className="text-slate-400 text-sm mb-8">Manage your subscription and payment methods.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { name: 'Free', price: '$0', features: ['5 Projects', 'Basic Support', '1GB Storage'] },
                    { name: 'Pro', price: '$29', features: ['Unlimited Projects', 'Priority Support', '1TB Storage'], current: true },
                    { name: 'Enterprise', price: 'Custom', features: ['Custom Features', '24/7 Support', 'Unlimited Storage'] },
                  ].map((plan, i) => (
                    <div key={i} className={`rounded-xl border transition-all transform hover:scale-105 ${
                      plan.current 
                        ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 shadow-lg shadow-purple-500/20 p-6' 
                        : 'border-white/10 bg-slate-900/40 hover:border-purple-500/50 p-6'
                    }`}>
                      {plan.current && <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full inline-block mb-3">Current Plan</span>}
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-3xl font-bold text-purple-400 mb-6">{plan.price}/mo</p>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f, j) => (
                          <li key={j} className="text-sm text-slate-400 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" /> {f}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => showToastMsg(`${plan.name} plan action clicked`, 'success')} className={`w-full py-2 rounded-lg font-semibold transition-all ${
                        plan.current 
                          ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                          : 'bg-purple-600 text-white hover:bg-purple-500'
                      }`}>
                        {plan.current ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Receipts */}
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5" /> Recent Receipts
                  </h3>
                  <div className="space-y-3">
                    {[
                      { date: 'Feb 9, 2026', amount: '$29.00', status: 'Paid' },
                      { date: 'Jan 9, 2026', amount: '$29.00', status: 'Paid' },
                      { date: 'Dec 9, 2025', amount: '$29.00', status: 'Paid' },
                    ].map((receipt, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-white/5 hover:border-purple-500/30 transition-all group">
                        <div>
                          <p className="font-semibold">{receipt.date}</p>
                          <p className="text-sm text-slate-400">{receipt.amount}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">{receipt.status}</span>
                          <button onClick={() => showToastMsg('Downloading receipt...', 'success')} className="p-2 hover:bg-slate-700 rounded-lg transition-all group-hover:bg-purple-500/20 group-hover:text-purple-400">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounce-in { 0%, 100% { opacity: 0; transform: scale(0.95) translateY(20px); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes blob { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
        .animate-blob { animation: blob 7s infinite; }
        .glass { background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(10px); }
        .avatar-glow { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
      `}</style>
    </div>
  );
}
