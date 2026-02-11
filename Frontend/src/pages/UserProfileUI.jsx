import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { userAPI } from '../services/api';
import { 
  User, Lock, Bell, CreditCard, LogOut, ChevronLeft, 
  Camera, Check, AlertTriangle, X
} from 'lucide-react';

export default function UserProfileUI() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Flash message state
  const [flashMessage, setFlashMessage] = useState({ show: false, type: '', message: '' });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  // Flash message handler
  const showFlash = (type, message) => {
    setFlashMessage({ show: true, type, message });
    setTimeout(() => {
      setFlashMessage({ show: false, type: '', message: '' });
    }, 5000);
  };

  const closeFlash = () => {
    setFlashMessage({ show: false, type: '', message: '' });
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedData = await userAPI.updateProfile(user.id, {
        username,
        email,
      });

      // Update local storage
      const updatedUser = { ...user, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      showFlash('success', 'Profile updated successfully!');
      
      // Update context if needed
      window.location.reload(); // Reload to update auth context
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile';
      showFlash('error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showFlash('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showFlash('error', 'Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);

    try {
      await userAPI.updatePassword(user.id, {
        oldPassword,
        newPassword,
      });

      showFlash('success', 'Password updated successfully!');
      
      // Clear form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update password';
      showFlash('error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  ];

  return (
    <div className="bg-[#0f172a] text-white min-h-screen overflow-x-hidden selection:bg-purple-500/30 font-sans relative">
      
      {/* --- FLASH MESSAGE --- */}
      {flashMessage.show && (
        <div className="fixed top-24 right-8 z-50 animate-slideDown">
          <div className={`p-4 rounded-lg border flex items-start gap-3 min-w-[300px] shadow-2xl ${
            flashMessage.type === 'success' 
              ? 'bg-green-500/20 border-green-500/50 text-green-300' 
              : 'bg-red-500/20 border-red-500/50 text-red-300'
          }`}>
            <div className="flex items-start flex-1 gap-3">
              {flashMessage.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm">{flashMessage.message}</span>
            </div>
            <button onClick={closeFlash} className="hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 glass h-20 flex items-center border-b border-white/5 backdrop-blur-xl bg-slate-900/60">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
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
            <button 
              onClick={() => setActiveTab('notifications')}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors relative"
            >
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <Bell className="w-5 h-5 text-slate-300" />
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
            >
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
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-purple-500 to-cyan-500 mb-4 relative group cursor-pointer">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
                  {username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold">{username}</h2>
              <p className="text-sm text-slate-400">{email}</p>
              <div className="mt-3 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/20">
                Free Plan
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
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium flex items-center gap-3"
              >
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
                <p className="text-slate-400 text-sm mb-8">Update your personal information and account details.</p>

                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" 
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Email Address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" 
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Account Status</label>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold border border-green-500/20">
                        Active
                      </div>
                      <span className="text-slate-400 text-sm">Your account is in good standing</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-bold text-white shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : 'Save Changes'}
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
                
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Current Password</label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all" 
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all" 
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Confirm Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all" 
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>Changing your password will sign you out of all other devices.</p>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition-all"
                    >
                      Clear
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving} 
                      className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : 'Update Password'}
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
            <div className="animate-fade-in">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-1">Notification Preferences</h2>
                <p className="text-slate-400 text-sm mb-8">Manage how you receive notifications and updates.</p>

                <div className="space-y-6 max-w-2xl">
                  {/* Email Notifications */}
                  <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white mb-1">Email Notifications</h3>
                        <p className="text-sm text-slate-400">Receive updates via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Canvas Updates */}
                  <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white mb-1">Canvas Updates</h3>
                        <p className="text-sm text-slate-400">Notifications when collaborators edit your canvas</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Meeting Reminders */}
                  <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white mb-1">Meeting Reminders</h3>
                        <p className="text-sm text-slate-400">Get reminded about upcoming collaboration sessions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                    <Bell className="w-5 h-5 flex-shrink-0" />
                    <p>Notification settings are saved automatically</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="animate-fade-in">
              <div className="glass bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-1">Billing & Plans</h2>
                <p className="text-slate-400 text-sm mb-8">Manage your subscription and billing information.</p>

                {/* Current Plan */}
                <div className="p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-xl mb-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Free Plan</h3>
                      <p className="text-slate-400 text-sm">Basic features for personal use</p>
                    </div>
                    <div className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg font-bold text-sm">
                      Current Plan
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>5 Canvases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>2 Collaborators per canvas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Basic support</span>
                    </div>
                  </div>
                </div>

                {/* Upgrade Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pro Plan */}
                  <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-xl hover:border-purple-500/50 transition-all">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-white mb-2">Pro Plan</h3>
                      <div className="text-3xl font-bold text-purple-400 mb-1">$9.99<span className="text-sm text-slate-400">/month</span></div>
                      <p className="text-sm text-slate-400">For professional creators</p>
                    </div>
                    <div className="space-y-3 mb-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Unlimited canvases</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>10 Collaborators per canvas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Priority support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Advanced features</span>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-all">
                      Upgrade to Pro
                    </button>
                  </div>

                  {/* Team Plan */}
                  <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-xl hover:border-cyan-500/50 transition-all">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-white mb-2">Team Plan</h3>
                      <div className="text-3xl font-bold text-cyan-400 mb-1">$29.99<span className="text-sm text-slate-400">/month</span></div>
                      <p className="text-sm text-slate-400">For teams and organizations</p>
                    </div>
                    <div className="space-y-3 mb-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Everything in Pro</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Unlimited collaborators</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>Team analytics</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>24/7 support</span>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white transition-all">
                      Upgrade to Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
