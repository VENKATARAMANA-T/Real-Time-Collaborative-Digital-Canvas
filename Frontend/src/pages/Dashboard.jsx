import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { userAPI, canvasAPI, meetingAPI, folderAPI, notificationAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket.js';

const ACTIVITY_ICON_MAP = {
  REGISTER_USER:         { icon: 'person_add',         color: 'text-green-400',   border: 'border-green-500/20', bg: 'bg-green-500/10' },
  LOGIN_SUCCESS:         { icon: 'login',              color: 'text-blue-400',    border: 'border-blue-500/20',  bg: 'bg-blue-500/10' },
  LOGOUT:                { icon: 'logout',             color: 'text-slate-400',   border: 'border-slate-500/20', bg: 'bg-slate-500/10' },
  PASSWORD_RESET_REQUEST:{ icon: 'key',                color: 'text-yellow-400',  border: 'border-yellow-500/20',bg: 'bg-yellow-500/10' },
  PASSWORD_RESET_SUCCESS:{ icon: 'shield',             color: 'text-emerald-400', border: 'border-emerald-500/20',bg: 'bg-emerald-500/10' },
  UPDATE_PROFILE:        { icon: 'manage_accounts',    color: 'text-purple-400',  border: 'border-purple-500/20',bg: 'bg-purple-500/10' },
  CREATE_CANVAS:         { icon: 'note_add',           color: 'text-cyan-400',    border: 'border-cyan-500/20',  bg: 'bg-cyan-500/10' },
  DELETE_CANVAS:         { icon: 'delete_forever',     color: 'text-red-400',     border: 'border-red-500/20',   bg: 'bg-red-500/10' },
  RENAME_CANVAS:         { icon: 'edit_note',          color: 'text-orange-400',  border: 'border-orange-500/20',bg: 'bg-orange-500/10' },
  UPDATE_CANVAS:         { icon: 'save',               color: 'text-sky-400',     border: 'border-sky-500/20',   bg: 'bg-sky-500/10' },
  DUPLICATE_CANVAS:      { icon: 'content_copy',       color: 'text-indigo-400',  border: 'border-indigo-500/20',bg: 'bg-indigo-500/10' },
  IMPORT_CANVAS:         { icon: 'upload_file',        color: 'text-violet-400',  border: 'border-violet-500/20',bg: 'bg-violet-500/10' },
  CREATE_FOLDER:         { icon: 'create_new_folder',  color: 'text-emerald-400', border: 'border-emerald-500/20',bg: 'bg-emerald-500/10' },
  DELETE_FOLDER:         { icon: 'folder_delete',      color: 'text-red-400',     border: 'border-red-500/20',   bg: 'bg-red-500/10' },
  TOGGLE_FAVORITE:       { icon: 'star',               color: 'text-yellow-400',  border: 'border-yellow-500/20',bg: 'bg-yellow-500/10' },
  EXPORT_CANVAS:         { icon: 'download',           color: 'text-teal-400',    border: 'border-teal-500/20',  bg: 'bg-teal-500/10' },
  RESTORE_VERSION:       { icon: 'history',            color: 'text-amber-400',   border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
  JOIN_ROOM:             { icon: 'group_add',          color: 'text-green-400',   border: 'border-green-500/20', bg: 'bg-green-500/10' },
  LEAVE_ROOM:            { icon: 'group_remove',       color: 'text-slate-400',   border: 'border-slate-500/20', bg: 'bg-slate-500/10' },
  TOGGLE_THEME:          { icon: 'palette',            color: 'text-pink-400',    border: 'border-pink-500/20',  bg: 'bg-pink-500/10' },
  VIEW_WALKTHROUGH:      { icon: 'menu_book',          color: 'text-blue-300',    border: 'border-blue-300/20',  bg: 'bg-blue-300/10' },
  SEARCH_HELP:           { icon: 'search',             color: 'text-slate-300',   border: 'border-slate-300/20', bg: 'bg-slate-300/10' },
  SUBMIT_FEEDBACK:       { icon: 'chat',               color: 'text-purple-400',  border: 'border-purple-500/20',bg: 'bg-purple-500/10' },
};

const ACTIVITY_LABELS = {
  REGISTER_USER: 'Registered',
  LOGIN_SUCCESS: 'Login',
  LOGOUT: 'Logout',
  PASSWORD_RESET_REQUEST: 'Password Reset Requested',
  PASSWORD_RESET_SUCCESS: 'Password Reset',
  UPDATE_PROFILE: 'Profile Updated',
  CREATE_CANVAS: 'Canvas Created',
  DELETE_CANVAS: 'Canvas Deleted',
  RENAME_CANVAS: 'Canvas Renamed',
  UPDATE_CANVAS: 'Canvas Saved',
  DUPLICATE_CANVAS: 'Canvas Duplicated',
  IMPORT_CANVAS: 'Canvas Imported',
  CREATE_FOLDER: 'Folder Created',
  DELETE_FOLDER: 'Folder Deleted',
  TOGGLE_FAVORITE: 'Toggled Favorite',
  EXPORT_CANVAS: 'Canvas Exported',
  RESTORE_VERSION: 'Version Restored',
  JOIN_ROOM: 'Joined Room',
  LEAVE_ROOM: 'Left Room',
  TOGGLE_THEME: 'Theme Changed',
  VIEW_WALKTHROUGH: 'Viewed Walkthrough',
  SEARCH_HELP: 'Searched Help',
  SUBMIT_FEEDBACK: 'Feedback Submitted',
};

const timeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}hr ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return `${months}mo ago`;
};

const formatTimestamp = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

export default function Dashboard() {
    const { user, updateUser, logout } = useAuth();
    // Setup socket for activity updates
    const socket = useSocket({ userId: user?._id || user?.id, username: user?.username });
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('recent');
  const [activeView, setActiveView] = useState('home');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [canvasFilter, setCanvasFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchReady, setSearchReady] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [flash, setFlash] = useState(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedCanvases, setSavedCanvases] = useState([]);
  const [isLoadingCanvases, setIsLoadingCanvases] = useState(false);
  const [showJoinMeeting, setShowJoinMeeting] = useState(false);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [createMeetingMode, setCreateMeetingMode] = useState('instant');
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [joinMeetingPassword, setJoinMeetingPassword] = useState('');
  const [joinAudioEnabled, setJoinAudioEnabled] = useState(true);
  const [joinVideoEnabled, setJoinVideoEnabled] = useState(true);
  const [createAudioEnabled, setCreateAudioEnabled] = useState(true);
  const [createVideoEnabled, setCreateVideoEnabled] = useState(true);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [meetingTransition, setMeetingTransition] = useState({ active: false, label: '' });
  const [activeJoinMeetingId, setActiveJoinMeetingId] = useState(null);
  const [activeJoinAudio, setActiveJoinAudio] = useState(true);
  const [activeJoinVideo, setActiveJoinVideo] = useState(true);
  const [cancelConfirmMeetingId, setCancelConfirmMeetingId] = useState(null);
  const [inviteMeeting, setInviteMeeting] = useState(null);
  const notifAudioCtxRef = useRef(null);
  const [joinMeetingFlash, setJoinMeetingFlash] = useState(null);
  const [createMeetingFlash, setCreateMeetingFlash] = useState(null);
  const [instantMeetingDetails, setInstantMeetingDetails] = useState(null);
  const [scheduledMeetingDetails, setScheduledMeetingDetails] = useState(null);
  const [isInstantGenerating, setIsInstantGenerating] = useState(false);
  const [isScheduledGenerating, setIsScheduledGenerating] = useState(false);
  const [meetingName, setMeetingName] = useState('');

  // Real meetings data
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [endedMeetings, setEndedMeetings] = useState([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);

  const [currentMenuCanvasId, setCurrentMenuCanvasId] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameCanvasId, setRenameCanvasId] = useState(null);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [showCreateCanvasModal, setShowCreateCanvasModal] = useState(false);
  const [createCanvasName, setCreateCanvasName] = useState('');
  const [createCanvasError, setCreateCanvasError] = useState('');
  const [createCanvasCardMessage, setCreateCanvasCardMessage] = useState('');
  const [isOperating, setIsOperating] = useState(false);
  const [folders, setFolders] = useState([]);
  const [folderCanvases, setFolderCanvases] = useState([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [defaultFolderId, setDefaultFolderId] = useState(null);
  const [currentMenuFolderId, setCurrentMenuFolderId] = useState(null);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState(null);
  const [isOperatingFolder, setIsOperatingFolder] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Notification state (meeting reminders only)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search debounce: show loading briefly then results
  useEffect(() => {
    const q = searchQuery.replace(/\s+/g, ' ').trim();
    if (!q) { setIsSearching(false); setSearchReady(false); return; }
    setIsSearching(true);
    setSearchReady(false);
    const timer = setTimeout(() => { setIsSearching(false); setSearchReady(true); }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clear search when switching views
  useEffect(() => { setSearchQuery(''); }, [activeView]);

  useEffect(() => {
    if (user) {
      setProfileUsername(user.username || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Fetch persisted notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const data = await notificationAPI.getAll();
        const notifs = (data.notifications || []).map((n) => ({
          _id: n._id,
          meetingId: n.meetingId,
          name: n.meetingName,
          startTime: n.startTime,
          read: n.read,
          createdAt: n.createdAt
        }));
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
  }, [user]);

  // Fetch activity logs
  useEffect(() => {
    const fetchActivityLogs = async () => {
      if (!user) return;
      const userId = user._id || user.id;
      if (!userId) return;
      setIsLoadingActivity(true);
      try {
        const data = await userAPI.getActivityLogs(userId);
        setActivityLogs(data.logs || []);
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      } finally {
        setIsLoadingActivity(false);
      }
    };
    fetchActivityLogs();

    if (socket) {
      socket.on('activity_update', (payload) => {
        if (payload && payload.userId === (user._id || user.id)) {
          fetchActivityLogs();
        }
      });
      return () => {
        socket.off('activity_update');
      };
    }
  }, [user, socket]);

  // ─── Real-time meeting reminder notifications via socket ───
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      console.log('[Dashboard] meeting_reminder received:', data);
      setNotifications((prev) => {
        // Avoid duplicates
        if (prev.some((n) => n._id === data._id)) return prev;
        return [{ ...data, read: false }, ...prev];
      });
      setUnreadCount((c) => c + 1);
      playNotificationSound();
    };
    socket.on('meeting_reminder', handler);
    return () => { socket.off('meeting_reminder', handler); };
  }, [socket]);

  const markNotificationRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // ─── Meeting fetch logic (simplified, direct fetch) ───
  const pollTimerRef = useRef(null);

  // Direct fetch function — always calls API fresh
  const doFetchMeetings = async () => {
    if (!user) return;
    try {
      const data = await meetingAPI.getMyMeetings();
      console.log('[Dashboard] fetchMeetings => active:', data.active?.length, 'upcoming:', data.upcoming?.length, 'ended:', data.ended?.length);
      setActiveMeetings(data.active || []);
      setUpcomingMeetings(data.upcoming || []);
      setEndedMeetings(data.ended || []);
      return data;
    } catch (err) {
      console.error('[Dashboard] Failed to fetch meetings:', err);
      return null;
    }
  };

  // On mount: detect meetingJustEnded, switch tab, fetch meetings, poll if needed
  useEffect(() => {
    if (!user) return;

    const cameFromEndedMeeting = location?.state?.meetingJustEnded === true || sessionStorage.getItem('meetingJustEnded') === 'true';

    if (cameFromEndedMeeting) {
      console.log('[Dashboard] Detected meetingJustEnded! Switching to completed tab.');
      setActiveTab('completed');
      // Clear both navigation state and sessionStorage flag
      sessionStorage.removeItem('meetingJustEnded');
      window.history.replaceState({}, document.title);
    }

    // Initial fetch
    setIsLoadingMeetings(true);
    doFetchMeetings().finally(() => setIsLoadingMeetings(false));

    // If coming from an ended meeting, poll every 1.5s for 12 seconds
    // This handles any DB propagation delay and ensures data shows up
    if (cameFromEndedMeeting) {
      let attempts = 0;
      const maxAttempts = 8;
      pollTimerRef.current = setInterval(async () => {
        attempts++;
        console.log(`[Dashboard] Polling for ended meetings (attempt ${attempts}/${maxAttempts})`);
        const data = await doFetchMeetings();
        if ((data?.ended?.length > 0) || attempts >= maxAttempts) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          if (data?.ended?.length > 0) {
            console.log('[Dashboard] Found ended meetings, stopping poll.');
          }
        }
      }, 1500);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // Socket-based real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      console.log('[Dashboard] meeting_update received via socket — refetching');
      doFetchMeetings();
    };
    socket.on('meeting_update', handler);
    return () => { socket.off('meeting_update', handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Window focus / visibility refetch
  useEffect(() => {
    const refetch = () => doFetchMeetings();
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    const fetchCanvases = async () => {
      if (!user) return;
      setIsLoadingCanvases(true);
      try {
        const canvases = await canvasAPI.getAll();
        setSavedCanvases(canvases || []);
      } catch (error) {
        console.error('Failed to fetch canvases:', error);
      } finally {
        setIsLoadingCanvases(false);
      }
    };
    fetchCanvases();

    // Refetch when window regains focus (user comes back from PaintApp)
    const handleFocus = () => {
      fetchCanvases();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!user) return;
      setIsLoadingFolders(true);
      try {
        // Backend getFolders auto-creates "Personal Sketches" if missing
        const allFolders = await folderAPI.getAll();
        setFolders(allFolders || []);
        
        // Find the default folder for reference
        const personalFolder = allFolders.find(f => f.name === 'Personal Sketches');
        if (personalFolder) setDefaultFolderId(personalFolder._id);
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      } finally {
        setIsLoadingFolders(false);
      }
    };
    fetchFolders();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside any menu (canvas or folder)
      const canvasMenus = document.querySelectorAll('[data-canvas-menu]');
      const canvasButtons = document.querySelectorAll('[data-canvas-menu-button]');
      const folderMenus = document.querySelectorAll('[data-folder-menu]');
      const folderButtons = document.querySelectorAll('[data-folder-menu-button]');
      
      let clickedOutsideCanvas = true;
      let clickedOutsideFolder = true;
      
      canvasMenus.forEach(menu => {
        if (menu.contains(e.target)) clickedOutsideCanvas = false;
      });
      canvasButtons.forEach(btn => {
        if (btn.contains(e.target)) clickedOutsideCanvas = false;
      });
      
      folderMenus.forEach(menu => {
        if (menu.contains(e.target)) clickedOutsideFolder = false;
      });
      folderButtons.forEach(btn => {
        if (btn.contains(e.target)) clickedOutsideFolder = false;
      });
      
      if (clickedOutsideCanvas) {
        setCurrentMenuCanvasId(null);
      }
      if (clickedOutsideFolder) {
        setCurrentMenuFolderId(null);
      }
    };
    
    if (currentMenuCanvasId || currentMenuFolderId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [currentMenuCanvasId, currentMenuFolderId]);

  const isRealCanvas = (canvas) => {
    // Real canvases from database have ObjectId format (24 hex chars)
    return /^[0-9a-f]{24}$/i.test(canvas.id);
  };

  // Fetch canvases for active folder
  useEffect(() => {
    const fetchFolderCanvases = async () => {
      if (!activeFolderId) {
        setFolderCanvases([]);
        return;
      }
      try {
        const canvases = await folderAPI.getCanvases(activeFolderId);
        setFolderCanvases(canvases || []);
      } catch (error) {
        console.error('Failed to fetch folder canvases:', error);
      }
    };
    fetchFolderCanvases();
  }, [activeFolderId]);

  const allCanvases = savedCanvases.map(cv => ({
    id: cv._id,
    title: cv.title || 'Untitled Canvas',
    edited: new Date(cv.updatedAt).toLocaleString(),
    folder: cv.folder ? folders.find(f => f._id === cv.folder)?.name || 'Personal Sketches' : 'Personal Sketches',
    tag: cv.isMeetingCanvas ? 'Meeting' : 'Private',
    tagColor: cv.isMeetingCanvas ? 'amber' : 'emerald',
    border: cv.isMeetingCanvas ? 'border-b-amber-400/60' : 'border-b-emerald-400/60',
    preview: cv.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23111827' width='400' height='200'/%3E%3C/svg%3E",
    isMeetingCanvas: cv.isMeetingCanvas || false
  }));
  const activeFolder = folders.find((folder) => folder._id === activeFolderId) || null;
  const activeFolderCanvases = folderCanvases.map(cv => ({
    id: cv._id,
    title: cv.title || 'Untitled Canvas',
    edited: new Date(cv.updatedAt).toLocaleString(),
    folder: activeFolder?.name || '',
    tag: cv.isMeetingCanvas ? 'Meeting' : 'Private',
    tagColor: cv.isMeetingCanvas ? 'amber' : 'emerald',
    border: cv.isMeetingCanvas ? 'border-b-amber-400/60' : 'border-b-emerald-400/60',
    preview: cv.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23111827' width='400' height='200'/%3E%3C/svg%3E",
    isMeetingCanvas: cv.isMeetingCanvas || false
  }));

  const filterCanvases = (canvases) => {
    if (canvasFilter === 'meeting') {
      return canvases.filter((canvas) => canvas.isMeetingCanvas);
    }
    if (canvasFilter === 'private') {
      return canvases.filter((canvas) => !canvas.isMeetingCanvas);
    }
    if (canvasFilter === 'recent') {
      return canvases.slice(0, 4);
    }
    return canvases;
  };

  const filteredAllCanvases = filterCanvases(allCanvases);
  const filteredFolderCanvases = filterCanvases(activeFolderCanvases);

  const displayName = user?.username || user?.name || 'User';
  const avatarUrl = user?.profileImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1G-Hn3vTP4BF8Tw65GNWLXCvphxit-gjaQaTS4e4417fPSGMKmx5zWr3w71xhaFli15vvoNhXAQzFsZhbXrYJnyiMAASvjonWiMDpUrf74kM00j8LO0v8ZIeWjxaTbQuwyPqYZPfUeaOJ0wxlWWLxz3b8aKfJIiOrN14CKccdESbzqpgCNmOz0yLKqEPnT9TLpYA75qsT7GKR2uA3ES71XLf46HSiL3x1oGxqtIPUL_bm67_UVcIPd6dxq-bs8_hsxaiualJBX4s';
  const accountCreatedAt = user?.createdAt || user?.createAt;
  const accountCreatedLabel = accountCreatedAt
    ? new Date(accountCreatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const showFlash = (type, message, scope = 'general') => {
    setFlash({ type, message, scope });
    window.setTimeout(() => setFlash(null), 3000);
  };

  const showMeetingFlash = (setter, message) => {
    setter(message);
    window.setTimeout(() => setter(null), 3000);
  };

  const handleOpenJoinMeeting = () => {
    setJoinMeetingId('');
    setJoinMeetingPassword('');
    setJoinAudioEnabled(true);
    setJoinVideoEnabled(true);
    setJoinMeetingFlash(null);
    setShowJoinMeeting(true);
  };

  const handleOpenCreateMeeting = async () => {
    setCreateMeetingMode('instant');
    setCreateAudioEnabled(true);
    setCreateVideoEnabled(true);
    setScheduleDate('');
    setScheduleTime('');
    setScheduleError('');
    setInstantMeetingDetails(null);
    setScheduledMeetingDetails(null);
    setCreateMeetingFlash(null);
    setMeetingName('');
    setShowCreateMeeting(true);

    setIsInstantGenerating(true);
    try {
      // Generate credentials for instant meeting (no DB creation)
      const data = await meetingAPI.generateCredentials();
      setInstantMeetingDetails({
        id: data.meetingId,
        password: data.password,
        shareLink: data.shareLink,
        linkToken: data.linkToken,
        meetingDbId: null,
        role: 'host',
        permission: 'edit',
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to generate credentials:', error);
      showMeetingFlash(setCreateMeetingFlash, 'Failed to generate meeting credentials');
      setInstantMeetingDetails(null);
    } finally {
      setIsInstantGenerating(false);
    }
  };

  const startMeetingTransition = (label, onComplete) => {
    setMeetingTransition({ active: true, label });
    window.setTimeout(() => {
      setMeetingTransition({ active: false, label: '' });
      onComplete();
    }, 1100);
  };

  const handleCancelMeeting = async (meetingDbId) => {
    try {
      await meetingAPI.cancel(meetingDbId);
      setActiveMeetings((prev) => prev.filter((m) => m._id !== meetingDbId));
      setUpcomingMeetings((prev) => prev.filter((m) => m._id !== meetingDbId));
    } catch (error) {
      console.error('Failed to cancel meeting:', error);
    } finally {
      setCancelConfirmMeetingId(null);
    }
  };

  const playNotificationSound = () => {
    try {
      if (!notifAudioCtxRef.current) notifAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = notifAudioCtxRef.current;
      const now = ctx.currentTime;
      // Two-tone "ding-dong" doorbell style notification
      const tones = [
        { freq: 830, start: 0, dur: 0.15 },
        { freq: 660, start: 0.18, dur: 0.22 },
      ];
      tones.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.45, now + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    } catch (_) { /* audio not available */ }
  };

  const navigateToMeeting = (meetingData, mediaState) => {
    // Handle both object and string formats for meetingData
    const meetingId = typeof meetingData === 'string' 
      ? meetingData 
      : (meetingData?.id || meetingData?.meetingId || '');
    
    const trimmedId = meetingId?.trim?.() || meetingId;
    const path = trimmedId ? `/meeting/${trimmedId}` : '/meeting';
    
    // Build state with proper password handling
    const state = {
      ...mediaState,
      meetingId: meetingId,
      // Priority: meetingData object password > mediaState password
      meetingPassword: (typeof meetingData === 'object' && meetingData?.password) 
        ? meetingData.password 
        : mediaState?.meetingPassword
    };
    
    navigate(path, { state });
  };

  const handleJoinMeetingSubmit = async () => {
    if (!joinMeetingId.trim() || !joinMeetingPassword.trim()) {
      showMeetingFlash(setJoinMeetingFlash, 'Invalid meeting details');
      return;
    }

    try {
      const data = await meetingAPI.join(joinMeetingId.trim(), joinMeetingPassword.trim());
      setShowJoinMeeting(false);
      startMeetingTransition('Joining meeting...', () =>
        navigateToMeeting(data.meetingId, {
          audioEnabled: joinAudioEnabled,
          videoEnabled: joinVideoEnabled,
          meetingDbId: data.meetingDbId,
          role: data.role,
          permission: data.permission,
          meetingPassword: joinMeetingPassword.trim()
        })
      );
    } catch (error) {
      const msg = error?.response?.data?.message || 'Invalid meeting details';
      showMeetingFlash(setJoinMeetingFlash, msg);
    }
  };

  const validateSchedule = () => {
    if (!scheduleDate || !scheduleTime) {
      return 'Please select date and time.';
    }
    const selected = new Date(`${scheduleDate}T${scheduleTime}`);
    if (Number.isNaN(selected.getTime())) {
      return 'Please select a valid date and time.';
    }
    if (selected <= new Date()) {
      return 'Please choose a future date and time.';
    }
    return '';
  };

  const handleGenerateScheduledMeeting = async () => {
    if (!meetingName.trim()) {
      setScheduleError('Please enter a meeting name.');
      setScheduledMeetingDetails(null);
      return;
    }
    const validationError = validateSchedule();
    if (validationError) {
      setScheduleError(validationError);
      setScheduledMeetingDetails(null);
      return;
    }
    setScheduleError('');
    setIsScheduledGenerating(true);
    try {
      // Create scheduled meeting in DB with pending status
      const data = await meetingAPI.create({
        name: meetingName.trim(),
        scheduledDate: scheduleDate,
        scheduledTime: scheduleTime
      });
      setScheduledMeetingDetails({
        id: data.meetingId,
        password: data.password,
        shareLink: data.shareLink,
        meetingDbId: data.meetingDbId,
        role: 'host',
        permission: 'edit',
        status: 'pending',
        scheduledDate: scheduleDate,
        scheduledTime: scheduleTime
      });
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to generate meeting details';
      showMeetingFlash(setCreateMeetingFlash, msg);
    } finally {
      setIsScheduledGenerating(false);
    }
  };

  const handleInstantJoin = async () => {
    if (!meetingName.trim()) {
      showMeetingFlash(setCreateMeetingFlash, 'Please enter a meeting name');
      return;
    }
    setIsInstantGenerating(true);
    
    try {
      // If credentials exist but not in DB, create the meeting
      if (instantMeetingDetails && !instantMeetingDetails?.meetingDbId) {
        const data = await meetingAPI.createInstant({
          meetingId: instantMeetingDetails.id,
          password: instantMeetingDetails.password,
          name: meetingName.trim(),
          linkToken: instantMeetingDetails.linkToken
        });
        const meetingData = {
          id: data.meetingId,
          password: data.password,
          shareLink: data.shareLink,
          meetingDbId: data.meetingDbId,
          role: data.role,
          permission: data.permission,
          status: data.status
        };
        setInstantMeetingDetails(meetingData);
        
        // Enter the meeting
        setShowCreateMeeting(false);
        startMeetingTransition('Entering meeting...', () =>
          navigateToMeeting(meetingData, {
            audioEnabled: createAudioEnabled,
            videoEnabled: createVideoEnabled,
            meetingDbId: meetingData.meetingDbId,
            role: meetingData.role || 'host',
            permission: meetingData.permission || 'edit',
            meetingPassword: meetingData.password
          })
        );
      }
    } catch (error) {
      console.error('Error:', error);
      const msg = error?.response?.data?.message || 'Failed to create meeting';
      showMeetingFlash(setCreateMeetingFlash, msg);
      setIsInstantGenerating(false);
    }
  };

  const shouldShowFlash =
    !!flash &&
    (flash.scope === 'general' ||
      (activeView === 'settings' && flash.scope === `settings-${settingsTab}`));

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    if (!user?._id && !user?.id) {
      showFlash('error', 'User not available. Please log in again.', 'settings-profile');
      return;
    }
    try {
      setIsProfileSaving(true);
      const userId = user._id || user.id;
      const updated = await userAPI.updateProfile(userId, {
        username: profileUsername.trim(),
        email: profileEmail.trim(),
      });
      const nextUser = { ...user, ...updated };
      updateUser(nextUser);
      showFlash('success', 'Profile updated successfully.', 'settings-profile');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile.';
      showFlash('error', message, 'settings-profile');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    if (!user?._id && !user?.id) {
      showFlash('error', 'User not available. Please log in again.', 'settings-password');
      return;
    }
    if (!oldPassword || !newPassword || !confirmPassword) {
      showFlash('error', 'Please fill in all password fields.', 'settings-password');
      return;
    }
    if (newPassword !== confirmPassword) {
      showFlash('error', 'New passwords do not match.', 'settings-password');
      return;
    }
    if (newPassword.length < 6) {
      showFlash('error', 'Password must be at least 6 characters.', 'settings-password');
      return;
    }
    try {
      setIsPasswordSaving(true);
      const userId = user._id || user.id;
      const response = await userAPI.updatePassword(userId, {
        oldPassword,
        newPassword,
      });
      showFlash('success', response.message || 'Password updated successfully.', 'settings-password');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password.';
      showFlash('error', message, 'settings-password');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    if (!deletePassword) {
      showFlash('error', 'Password is required to delete your account', 'settings-account');
      return;
    }

    setIsDeleting(true);
    try {
      await userAPI.deleteAccount(deletePassword);
      // Backend automatically clears the cookies
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      // Redirect silently to home without flash message
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      setIsDeleting(false);
      setDeletePassword('');
      const errorMsg = error.response?.data?.message || 'Failed to delete account';
      showFlash('error', errorMsg, 'settings-account');
      setShowDeleteModal(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    // logout() from AuthContext will handle the redirect to home page
  };

  const handleHelpClick = () => {
    navigate('/help');
  };

  const showCreateCanvasCardFlash = (message) => {
    setCreateCanvasCardMessage(message);
    window.setTimeout(() => setCreateCanvasCardMessage(''), 3000);
  };

  const handleNewCanvas = () => {
    setCreateCanvasName('');
    setCreateCanvasError('');
    setCreateCanvasCardMessage('');
    setShowCreateCanvasModal(true);
  };

  const handleCreateCanvas = async () => {
    const trimmedName = createCanvasName.trim();
    if (!trimmedName) {
      setCreateCanvasError('Canvas name is required');
      return;
    }

    const normalizedName = trimmedName.toLowerCase();
    const isDuplicate = savedCanvases.some((cv) =>
      (cv.title || '').trim().toLowerCase() === normalizedName
    );

    if (isDuplicate) {
      setCreateCanvasError('Filename already exists');
      showCreateCanvasCardFlash('Filename already exists');
      return;
    }

    try {
      const username = user?.username || 'User';
      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.width = 400;
      badgeCanvas.height = 200;
      const badgeCtx = badgeCanvas.getContext('2d');
      badgeCtx.fillStyle = '#1d7ff2';
      badgeCtx.fillRect(0, 0, 400, 200);
      badgeCtx.fillStyle = '#ffffff';
      badgeCtx.font = 'bold 48px Arial';
      badgeCtx.textAlign = 'center';
      badgeCtx.textBaseline = 'middle';
      badgeCtx.fillText(username, 200, 100);
      const thumbnail = badgeCanvas.toDataURL('image/png');

      // Use activeFolderId if in folder view, otherwise use defaultFolderId
      const folderId = activeFolderId || defaultFolderId;

      const newCanvas = await canvasAPI.create({
        title: trimmedName,
        folderId: folderId,
        data: {
          elements: [],
          canvasSize: { width: 1920, height: 1080 },
          pixelData: null
        },
        thumbnail
      });

      if (newCanvas?._id) {
        setShowCreateCanvasModal(false);
        setCreateCanvasName('');
        setCreateCanvasError('');
        navigate(`/paint/${newCanvas._id}`);
      }
    } catch (error) {
      console.error('Failed to create canvas:', error);
      showFlash('error', 'Failed to create canvas');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showFlash('error', 'Folder name cannot be empty');
      return;
    }

    try {
      const folder = await folderAPI.create({ name: newFolderName.trim() });
      setFolders([...folders, folder]);
      setShowCreateFolderModal(false);
      setNewFolderName('');
      showFlash('success', 'Folder created successfully');
    } catch (error) {
      console.error('Failed to create folder:', error);
      showFlash('error', error.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleRenameFolder = async (folderId, newName) => {
    if (!newName.trim()) {
      showFlash('error', 'Folder name cannot be empty');
      return;
    }

    try {
      setIsOperatingFolder(true);
      await folderAPI.update(folderId, { name: newName.trim() });
      
      // Refresh folders list
      const updatedFolders = await folderAPI.getAll();
      setFolders(updatedFolders || []);
      
      setShowRenameFolderModal(false);
      setRenameFolderId(null);
      setNewFolderName('');
      setCurrentMenuFolderId(null);
      showFlash('success', 'Folder renamed successfully');
    } catch (error) {
      console.error('Failed to rename folder:', error);
      showFlash('error', error.response?.data?.message || 'Failed to rename folder');
    } finally {
      setIsOperatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    // Prevent deleting the default "Personal Sketches" folder
    if (folderId === defaultFolderId) {
      showFlash('error', 'Cannot delete the default folder');
      return;
    }

    try {
      setIsOperatingFolder(true);
      await folderAPI.delete(folderId);
      
      // Refresh folders list
      const updatedFolders = await folderAPI.getAll();
      setFolders(updatedFolders || []);
      
      // Refresh canvases list since canvases in the folder are also deleted
      const canvases = await canvasAPI.getAll();
      setSavedCanvases(canvases || []);
      
      // If we're viewing the deleted folder, go back to main view
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }
      
      setCurrentMenuFolderId(null);
      showFlash('success', 'Folder and its contents deleted successfully');
    } catch (error) {
      console.error('Failed to delete folder:', error);
      showFlash('error', error.response?.data?.message || 'Failed to delete folder');
    } finally {
      setIsOperatingFolder(false);
    }
  };

  const handleRenameCanvas = async (canvasId, newName) => {
    if (!newName.trim()) {
      showFlash('error', 'Canvas name cannot be empty');
      return;
    }

    try {
      setIsOperating(true);
      await canvasAPI.update(canvasId, { title: newName.trim() });
      
      // Refresh the canvases list
      const canvases = await canvasAPI.getAll();
      setSavedCanvases(canvases || []);
      
      setShowRenameModal(false);
      setRenameCanvasId(null);
      setNewCanvasName('');
      setCurrentMenuCanvasId(null);
      showFlash('success', 'Canvas renamed successfully');
    } catch (error) {
      console.error('Failed to rename canvas:', error);
      showFlash('error', 'Failed to rename canvas');
    } finally {
      setIsOperating(false);
    }
  };

  const handleDeleteCanvas = async (canvasId) => {
    try {
      setIsOperating(true);
      await canvasAPI.delete(canvasId);
      
      // Refresh the canvases list
      const canvases = await canvasAPI.getAll();
      setSavedCanvases(canvases || []);
      
      setCurrentMenuCanvasId(null);
      showFlash('success', 'Canvas deleted successfully');
    } catch (error) {
      console.error('Failed to delete canvas:', error);
      showFlash('error', 'Failed to delete canvas');
    } finally {
      setIsOperating(false);
    }
  };

  const handleDuplicateCanvas = async (canvasId) => {
    try {
      setIsOperating(true);
      await canvasAPI.duplicate(canvasId);
      
      // Refresh the canvases list
      const canvases = await canvasAPI.getAll();
      setSavedCanvases(canvases || []);
      
      setCurrentMenuCanvasId(null);
      showFlash('success', 'Canvas duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate canvas:', error);
      showFlash('error', 'Failed to duplicate canvas');
    } finally {
      setIsOperating(false);
    }
  };

  return (
    <div className="dark bg-[#0f172a] text-slate-100 font-display transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap');
        body { font-family: 'Manrope', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .activity-line::before { content: ''; position: absolute; left: 23px; top: 48px; bottom: -24px; width: 2px; background-color: #2d3a4b; }
        .activity-item:last-child .activity-line::before { display: none; }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 flex-shrink-0 bg-[#111827] border-r border-[#1f2a3b] flex flex-col">
          <div className="p-6 flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-icons text-white text-xl font-bold">dashboard_customize</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight">CollabCanvas</span>
          </div>
          <nav className="flex-1 px-4 space-y-1 mt-4">
            <button
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeView === 'home' ? 'bg-[#1a2b4a] text-white' : 'text-slate-400 hover:bg-[#1a2b4a] hover:text-white'
              }`}
              onClick={() => setActiveView('home')}
              type="button"
            >
              <span className="material-icons mr-3">home</span>
              Home
            </button>
            <button
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeView === 'canvases'
                  ? 'bg-[#1a2b4a] hover:text-white'
                  : 'text-slate-400 hover:bg-[#1a2b4a] hover:text-white'
              }`}
              onClick={() => setActiveView('canvases')}
              type="button"
            >
              <span className="material-icons mr-3">grid_view</span>
              My Canvases
            </button>
            <button
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeView === 'meetings'
                  ? 'bg-[#1a2b4a] hover:text-white'
                  : 'text-slate-400 hover:bg-[#1a2b4a] hover:text-white'
              }`}
              onClick={() => setActiveView('meetings')}
              type="button"
            >
              <span className="material-icons mr-3">video_call</span>
              Meetings
            </button>
            <button
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeView === 'notifications'
                  ? 'bg-[#1a2b4a] hover:text-white'
                  : 'text-slate-400 hover:bg-[#1a2b4a] hover:text-white'
              }`}
              onClick={() => setActiveView('notifications')}
              type="button"
            >
              <span className="material-icons mr-3">notifications</span>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeView === 'activity'
                  ? 'bg-[#1a2b4a] hover:text-white'
                  : 'text-slate-400 hover:bg-[#1a2b4a] hover:text-white'
              }`}
              onClick={() => setActiveView('activity')}
              type="button"
            >
              <span className="material-symbols-outlined mr-3">history</span>
              Activity
            </button>
            <button
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                activeView === 'settings'
                  ? 'bg-[#1a2b4a] hover:text-white'
                  : 'text-slate-400 hover:bg-[#1a2b4a] hover:text-white'
              }`}
              onClick={() => setActiveView('settings')}
              type="button"
            >
              <span className="material-icons mr-3">settings</span>
              Settings
            </button>
          </nav>
          <div className="p-4 mt-auto">
            <button
              className="w-full mb-3 flex items-center px-4 py-3 text-sm font-medium text-slate-400 hover:bg-[#1a2b4a] hover:text-white transition-all rounded-xl"
              onClick={handleLogout}
              type="button"
            >
              <span className="material-icons mr-3">logout</span>
              Logout
            </button>
            <div className="p-4 bg-[#0f172a] rounded-xl border border-[#1f2a3b]">
              <div className="flex items-center space-x-3 mb-3">
                <img alt="User profile avatar icon" className="w-10 h-10 rounded-full border-2 border-primary" src={avatarUrl} />
                <div>
                  <p className="text-sm font-bold ">{displayName}</p>
                  <p className="text-xs text-slate-400">Pro Plan</p>
                </div>
              </div>
              <button className="w-full py-2 px-4 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all">
                Upgrade
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeView === 'home' ? (
            <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-[#0f172a] border-b border-[#1f2a3b]">
              <div className="flex-1 max-w-xl">
                <div className="relative group">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                  <input
                    className="w-full pl-10 pr-4 py-2 bg-[#111827] border border-[#1f2a3b] focus:border-primary focus:ring-0 rounded-xl text-sm transition-all text-slate-200"
                    placeholder="Search for Canvases or Meetings..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  className="p-2 text-slate-400 hover:bg-[#111827] rounded-full transition-all relative"
                  onClick={() => setActiveView('notifications')}
                  type="button"
                >
                  <span className="material-icons">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-[#0f172a]">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  className="p-2 text-slate-400 hover:bg-[#111827] rounded-full transition-all"
                  onClick={handleHelpClick}
                  type="button"
                >
                  <span className="material-icons">help_outline</span>
                </button>
              </div>
            </header>
          ) : activeView === 'meetings' ? (
            <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-[#0f172a] border-b border-[#1f2a3b]">
              <div className="flex-1 max-w-xl">
                <div className="relative group">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                  <input
                    className="w-full pl-10 pr-4 py-2 bg-[#111827] border border-[#1f2a3b] focus:border-primary focus:ring-0 rounded-xl text-sm transition-all text-slate-200"
                    placeholder="Search for Meetings..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </header>
          ) : activeView === 'notifications' ? (
            <header className="h-16 flex-shrink-0 flex items-center px-8 bg-[#1a242f] border-b border-[#2d3a4b]">
              <div className="flex items-center">
                <h2 className="text-xl font-bold">Notifications</h2>
              </div>
            </header>
          ) : activeView === 'activity' ? (
            <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-[#1a242f] border-b border-[#2d3a4b]">
              <div className="flex items-center space-x-6">
                <h2 className="text-xl font-bold">User Activity Log</h2>
              </div>
              <div className="flex items-center space-x-4"></div>
            </header>
          ) : activeView === 'settings' ? (
            <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-[#1a242f] border-b border-[#2d3a4b]">
              <div className="flex items-center space-x-6">
                <h2 className="text-xl font-bold">Settings</h2>
              </div>
              <div className="flex items-center space-x-4"></div>
            </header>
          ) : activeFolder ? (
            <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-[#1a242f] border-b border-[#2d3a4b]">
              <div className="flex-1 max-w-xl">
                <div className="flex items-center text-sm font-medium">
                  <button
                    className="text-slate-400 hover:text-white transition-colors"
                    onClick={() => setActiveFolderId(null)}
                    type="button"
                  >
                    My Canvases
                  </button>
                  <span className="material-icons text-slate-600 text-sm mx-2">chevron_right</span>
                  <span className="text-white font-bold">{activeFolder.name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4"></div>
            </header>
          ) : (
            <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-[#0f172a] border-b border-[#1f2a3b]">
              <div className="flex-1 max-w-xl">
                <div className="relative group">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                  <input
                    className="w-full pl-10 pr-4 py-2 bg-[#111827] border border-[#1f2a3b] focus:border-primary focus:ring-0 rounded-xl text-sm transition-all text-slate-200"
                    placeholder="Search for Canvases..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </header>
          )}

          <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
            {isLoggingOut && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0f172a]/70 backdrop-blur-md">
                <div className="flex items-center gap-3 rounded-xl border border-[#1f2a3b] bg-[#111827] px-5 py-3 text-sm text-slate-200 shadow-xl">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                  Logging out...
                </div>
              </div>
            )}
            {shouldShowFlash && (
              <div
                className={`mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
                  flash.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                }`}
              >
                <span>{flash.message}</span>
                <button
                  className="text-xs font-semibold uppercase tracking-widest"
                  onClick={() => setFlash(null)}
                  type="button"
                >
                  Close
                </button>
              </div>
            )}
            {activeView === 'home' ? (
              <>
                {(() => {
                  const q = searchQuery.replace(/\s+/g, ' ').trim().toLowerCase();
                  if (q && isSearching) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative w-12 h-12 mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-[#1f2a3b]"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-slate-400 text-sm">Searching...</p>
                      </div>
                    );
                  }
                  if (q && searchReady) {
                    const matchedCanvases = savedCanvases.filter(c => (c.title || '').toLowerCase().includes(q));
                    const matchedMeetings = [...activeMeetings, ...upcomingMeetings, ...endedMeetings].filter(m => (m.name || '').toLowerCase().includes(q) || (m.meetingId || '').toLowerCase().includes(q));
                    const noResults = matchedCanvases.length === 0 && matchedMeetings.length === 0;
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-sm text-slate-400">
                            Results for "<span className="text-white font-semibold">{searchQuery.trim()}</span>"
                            <span className="ml-2 text-slate-500">({matchedCanvases.length + matchedMeetings.length} found)</span>
                          </p>
                          <button className="text-xs text-slate-400 hover:text-white transition-colors" onClick={() => setSearchQuery('')} type="button">
                            <span className="material-icons text-sm align-middle mr-1">close</span>Clear search
                          </button>
                        </div>
                        {noResults ? (
                          <div className="text-center py-20">
                            <span className="material-icons text-5xl text-slate-700 mb-3 block">search_off</span>
                            <p className="text-slate-400 text-lg font-medium">No results found</p>
                            <p className="text-slate-600 text-sm mt-1">Try a different search term</p>
                          </div>
                        ) : (
                          <>
                            {matchedCanvases.length > 0 && (
                              <section className="mb-10">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Canvases ({matchedCanvases.length})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {matchedCanvases.map((canvas) => (
                                    <div key={canvas._id} className={`group bg-[#111827] border border-[#1f2a3b] rounded-xl overflow-hidden hover:shadow-lg transition-all border-b-4 ${canvas.isMeetingCanvas ? 'border-b-amber-400/60' : 'border-b-emerald-400/60'}`}>
                                      <div className="h-40 bg-[#0b1220] relative overflow-hidden">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${canvas.isMeetingCanvas ? 'from-amber-500/10' : 'from-emerald-500/10'} to-transparent`}></div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-blue-600/30 transition-all" onClick={() => navigate(canvas.isMeetingCanvas ? `/meeting-canvas/${canvas._id}` : `/paint/${canvas._id}`)} type="button">Open Editor</button>
                                        </div>
                                        <img alt={`${canvas.title} Preview`} className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none" src={canvas.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23111827' width='400' height='200'/%3E%3C/svg%3E"} />
                                        {canvas.isMeetingCanvas && (
                                          <div className="absolute top-3 right-3 z-10"><span className="px-2 py-1 bg-[#101922]/80 text-[10px] font-bold rounded border uppercase text-amber-400 border-amber-400/30">Meeting</span></div>
                                        )}
                                      </div>
                                      <div className="p-4">
                                        <h4 className="font-bold text-sm truncate mb-1">{canvas.title || 'Untitled Canvas'}</h4>
                                        <div className="flex items-center text-xs text-slate-500 space-x-2">
                                          <span className="material-icons text-sm">schedule</span>
                                          <span>{new Date(canvas.updatedAt).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}
                            {matchedMeetings.length > 0 && (
                              <section>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Meetings ({matchedMeetings.length})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {matchedMeetings.map((meeting) => (
                                    <div key={meeting._id} className={`group bg-[#1a242f] border border-[#2d3a4b] rounded-xl p-5 hover:shadow-lg transition-all border-l-4 ${meeting.status === 'live' ? 'border-l-emerald-500' : meeting.status === 'ended' ? 'border-l-slate-600' : 'border-l-primary'}`}>
                                      <div className="flex justify-between items-start mb-3">
                                        <div className={`w-10 h-10 ${meeting.status === 'live' ? 'bg-emerald-500/10 text-emerald-500' : meeting.status === 'ended' ? 'bg-slate-500/10 text-slate-500' : 'bg-primary/10 text-primary'} rounded-lg flex items-center justify-center`}>
                                          <span className="material-icons">{meeting.status === 'live' ? 'videocam' : meeting.status === 'ended' ? 'history' : 'event_available'}</span>
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${meeting.status === 'live' ? 'bg-emerald-900/30 text-emerald-400' : meeting.status === 'ended' ? 'bg-slate-800 text-slate-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                          {meeting.status === 'live' ? 'Live' : meeting.status === 'ended' ? 'Ended' : 'Scheduled'}
                                        </span>
                                      </div>
                                      <h4 className="font-bold text-base mb-1 text-start">{meeting.name}</h4>
                                      <p className="text-xs text-slate-500 mb-3">ID: {meeting.meetingId}</p>
                                      <div className="flex items-center justify-between pt-3 border-t border-[#2d3a4b]">
                                        <span className="text-xs text-slate-500"><span className="material-icons text-sm mr-1 align-middle">group</span>{meeting.participants?.length || 0}</span>
                                        <button className="text-primary text-xs font-bold hover:underline" type="button" onClick={() => {
                                          if (meeting.status === 'ended') { navigate(`/meeting-notes/${meeting._id}`); }
                                          else { navigate(`/meeting/${meeting.meetingId}`, { state: { meetingDbId: meeting._id, meetingId: meeting.meetingId, role: meeting.isHost ? 'host' : 'participant', permission: meeting.isHost ? 'edit' : 'view', status: meeting.status } }); }
                                        }}>
                                          {meeting.status === 'ended' ? 'View Notes' : meeting.status === 'live' ? 'Join Now' : 'View Details'} <span className="material-icons text-sm ml-1 align-middle">arrow_forward</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                {!searchQuery.replace(/\s+/g, ' ').trim() && (
                <>
                <section className="mb-10 text-start">
                  <h1 className="text-3xl font-bold mb-2 ">Welcome back, {displayName}</h1>
                  <p className="text-slate-400">Ready to visualize your next big idea?</p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <button
                className="group relative overflow-hidden p-6 bg-[#1d7ff2] rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30"
                onClick={handleNewCanvas}
                type="button"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-icons text-8xl text-white">add_box</span>
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                    <span className="material-icons text-white">add</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">New Canvas</h3>
                  <p className="text-white/70 text-sm">Start a blank project from scratch</p>
                  {createCanvasCardMessage && (
                    <p className="mt-3 text-xs font-semibold text-rose-100/90 bg-rose-500/30 inline-flex px-2 py-1 rounded">
                      {createCanvasCardMessage}
                    </p>
                  )}
                </div>
              </button>
              <button
                className="group relative overflow-hidden p-6 bg-[#5450dd] rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30"
                onClick={handleOpenCreateMeeting}
                type="button"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-icons text-8xl text-white">video_call</span>
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                    <span className="material-icons text-white">groups</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Create Meeting</h3>
                  <p className="text-white/70 text-sm">Instant collaboration with your team</p>
                </div>
              </button>
              <button
                className="group relative overflow-hidden p-6 bg-[#15938c] rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30"
                onClick={handleOpenJoinMeeting}
                type="button"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-icons text-8xl text-white">login</span>
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                    <span className="material-icons text-white">sensors</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Join Meeting</h3>
                  <p className="text-white/70 text-sm">Enter a room code or invite link</p>
                </div>
              </button>
            </section>

            <section>
              <div className="flex items-center space-x-8 mb-6 border-b border-[#1f2a3b]">
                <button
                  className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'recent'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('recent')}
                  type="button"
                >
                  Recent Canvases
                </button>
                <button
                  className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'upcoming'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('upcoming')}
                  type="button"
                >
                  Upcoming Meetings
                </button>
                <button
                  className={`pb-4 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'completed'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('completed')}
                  type="button"
                >
                  Completed
                </button>
              </div>

              {activeTab === 'recent' && (() => {
                const q = searchQuery.replace(/\s+/g, ' ').trim().toLowerCase();
                const recentCanvases = savedCanvases.slice(0, 4).filter(c => !q || (c.title || '').toLowerCase().includes(q));
                return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recentCanvases.map((canvas) => (
                    <div key={canvas._id} className={`group bg-[#111827] border border-[#1f2a3b] rounded-xl overflow-hidden hover:shadow-lg transition-all border-b-4 ${canvas.isMeetingCanvas ? 'border-b-amber-400/60' : 'border-b-emerald-400/60'}`}>
                      <div className="h-40 bg-[#0b1220] relative overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${canvas.isMeetingCanvas ? 'from-amber-500/10' : 'from-emerald-500/10'} to-transparent`}></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                          <button
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-blue-600/30 transition-all"
                            onClick={() => navigate(canvas.isMeetingCanvas ? `/meeting-canvas/${canvas._id}` : `/paint/${canvas._id}`)}
                            type="button"
                          >
                            Open Editor
                          </button>
                        </div>
                        <img
                          alt={`${canvas.title} Preview`}
                          className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500"
                          src={canvas.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23111827' width='400' height='200'/%3E%3C/svg%3E"}
                        />
                        {canvas.isMeetingCanvas && (
                          <div className="absolute top-3 right-3 z-10">
                            <span className="px-2 py-1 bg-[#101922]/80 text-[10px] font-bold rounded border uppercase text-amber-400 border-amber-400/30">
                              Meeting
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm truncate">{canvas.title || 'Untitled Canvas'}</h4>
                          <div className="relative">
                            <button 
                              className="text-slate-500 hover:text-primary transition-colors"
                              data-canvas-menu-button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentMenuCanvasId(currentMenuCanvasId === canvas._id ? null : canvas._id);
                              }}
                            >
                              <span className="material-icons text-lg">more_vert</span>
                            </button>
                            {currentMenuCanvasId === canvas._id && (
                              <div 
                                className="absolute right-0 top-full mt-2 bg-[#101922] border border-[#2d3a4b] rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden"
                                data-canvas-menu
                              >
                                <button
                                  className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-[#1a242f] hover:text-primary flex items-center space-x-3 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenameCanvasId(canvas._id);
                                    setNewCanvasName(canvas.title);
                                    setShowRenameModal(true);
                                    setCurrentMenuCanvasId(null);
                                  }}
                                >
                                  <span className="material-icons text-sm">edit</span>
                                  <span className="font-medium">Rename</span>
                                </button>
                                <button
                                  className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-[#1a242f] hover:text-primary flex items-center space-x-3 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateCanvas(canvas._id);
                                  }}
                                  disabled={isOperating}
                                >
                                  <span className="material-icons text-sm">content_copy</span>
                                  <span className="font-medium">Duplicate</span>
                                </button>
                                <div className="border-t border-[#2d3a4b]"></div>
                                <button
                                  className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-[#1a242f] hover:text-rose-300 flex items-center space-x-3 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCanvas(canvas._id);
                                  }}
                                  disabled={isOperating}
                                >
                                  <span className="material-icons text-sm">delete</span>
                                  <span className="font-medium">Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 space-x-2">
                          <span className="material-icons text-sm">schedule</span>
                          <span>{new Date(canvas.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentCanvases.length === 0 && (
                    <div className="col-span-4 text-center py-12">
                      <p className="text-slate-500">{searchQuery.trim() ? 'No canvases match your search.' : 'No canvases yet. Create your first canvas!'}</p>
                    </div>
                  )}
                </div>
                );
              })()}

              {activeTab === 'upcoming' && (() => {
                const q = searchQuery.replace(/\s+/g, ' ').trim().toLowerCase();
                const filteredMeetings = [...activeMeetings, ...upcomingMeetings].filter(m => !q || (m.name || '').toLowerCase().includes(q) || (m.meetingId || '').toLowerCase().includes(q));
                return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingMeetings ? (
                    <div className="col-span-3 text-center py-12">
                      <span className="material-icons animate-spin text-primary text-3xl">refresh</span>
                      <p className="text-slate-500 mt-2">Loading meetings...</p>
                    </div>
                  ) : filteredMeetings.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <span className="material-icons text-slate-600 text-4xl block mb-2">event_busy</span>
                      <p className="text-slate-500">{q ? 'No meetings match your search.' : 'No upcoming meetings. Schedule one to get started!'}</p>
                    </div>
                  ) : (
                    filteredMeetings.map((meeting) => (
                      <div key={meeting._id} className={`group bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-lg transition-all border-l-4 ${meeting.status === 'live' ? 'border-l-emerald-500' : 'border-l-primary'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 ${meeting.status === 'live' ? 'bg-emerald-500/10' : 'bg-primary/10'} rounded-lg flex items-center justify-center ${meeting.status === 'live' ? 'text-emerald-500' : 'text-primary'}`}>
                            <span className="material-icons">{meeting.status === 'live' ? 'videocam' : 'event_available'}</span>
                          </div>
                          <span className={`px-2 py-1 ${meeting.status === 'live' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'} text-[10px] font-bold rounded uppercase`}>
                            {meeting.status === 'live' ? 'Live Now' : 'Scheduled'}
                          </span>
                        </div>
                        <h4 className="font-bold text-base mb-1 text-start">{meeting.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          Meeting ID: {meeting.meetingId}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                          <div className="flex items-center text-xs text-slate-500">
                            <span className="material-icons text-sm mr-1">group</span>
                            {meeting.participants?.length || 0} participant{(meeting.participants?.length || 0) !== 1 ? 's' : ''}
                          </div>
                          <button
                            className="text-primary text-xs font-bold hover:underline flex items-center"
                            type="button"
                            onClick={() => navigate(`/meeting/${meeting.meetingId}`, {
                              state: {
                                meetingDbId: meeting._id,
                                meetingId: meeting.meetingId,
                                role: meeting.isHost ? 'host' : 'participant',
                                permission: meeting.isHost ? 'edit' : 'view',
                                status: meeting.status
                              }
                            })}
                          >
                            {meeting.status === 'live' ? 'Join Now' : 'View Details'} <span className="material-icons text-sm ml-1">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                );
              })()}

              {activeTab === 'completed' && (() => {
                const q = searchQuery.replace(/\s+/g, ' ').trim().toLowerCase();
                const completedMeetings = endedMeetings.filter(m => !q || (m.name || '').toLowerCase().includes(q) || (m.meetingId || '').toLowerCase().includes(q));
                return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-slate-500">{completedMeetings.length} completed meeting{completedMeetings.length !== 1 ? 's' : ''}</p>
                    <button
                      className="text-xs text-slate-400 hover:text-primary flex items-center gap-1 transition-colors"
                      type="button"
                      onClick={() => { setIsLoadingMeetings(true); doFetchMeetings().finally(() => setIsLoadingMeetings(false)); }}
                    >
                      <span className={`material-icons text-sm ${isLoadingMeetings ? 'animate-spin' : ''}`}>refresh</span>
                      Refresh
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingMeetings ? (
                    <div className="col-span-3 text-center py-12">
                      <span className="material-icons animate-spin text-primary text-3xl">refresh</span>
                      <p className="text-slate-500 mt-2">Loading meetings...</p>
                    </div>
                  ) : completedMeetings.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <span className="material-icons text-slate-600 text-4xl block mb-2">history</span>
                      <p className="text-slate-500">{q ? 'No completed meetings match your search.' : 'No completed meetings yet.'}</p>
                    </div>
                  ) : (
                    completedMeetings.map((meeting) => (
                      <div key={meeting._id} className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                            <span className="material-icons">history</span>
                          </div>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase">
                            {meeting.endTime ? new Date(meeting.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Ended'}
                            {meeting.startTime && meeting.endTime ? ` · ${Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / 60000)}m` : ''}
                          </span>
                        </div>
                        <h4 className="font-bold text-base mb-1 text-start">{meeting.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          Meeting ID: {meeting.meetingId}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                          <div className="flex items-center text-xs text-slate-500">
                            <span className="material-icons text-sm mr-1">group</span>
                            {meeting.participants?.length || 0} participant{(meeting.participants?.length || 0) !== 1 ? 's' : ''}
                          </div>
                          <button
                            className="text-primary text-xs font-bold hover:underline flex items-center"
                            type="button"
                            onClick={() => navigate(`/meeting-notes/${meeting._id}`)}
                          >
                            View Notes <span className="material-icons text-sm ml-1">description</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                </>
                );
              })()}

              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Today's Schedule</h3>
                  <button className="text-primary text-sm font-bold hover:underline" onClick={() => setActiveView('meetings')}>View All Meetings</button>
                </div>
                <div className="space-y-3">
                  {[...activeMeetings, ...upcomingMeetings].length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500 text-sm">No meetings scheduled.</p>
                    </div>
                  ) : (
                    [...activeMeetings, ...upcomingMeetings].slice(0, 3).map((meeting) => (
                      <div key={meeting._id} className="flex items-center justify-between p-4 bg-[#111827] border border-[#1f2a3b] rounded-xl group hover:border-primary transition-all">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${meeting.status === 'live' ? 'bg-emerald-500/10' : 'bg-primary/10'} rounded-lg flex items-center justify-center ${meeting.status === 'live' ? 'text-emerald-400' : 'text-primary'}`}>
                            <span className="material-icons text-xl">{meeting.status === 'live' ? 'videocam' : 'event'}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-start">{meeting.name}</h4>
                            <p className="text-xs text-slate-500 text-start">
                              {meeting.status === 'live' ? 'Live Now' : meeting.startTime ? new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled'} · {meeting.participants?.length || 0} participants
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {meeting.status === 'live' ? (
                            <button
                              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all"
                              onClick={() => navigate(`/meeting/${meeting.meetingId}`, {
                                state: {
                                  meetingDbId: meeting._id,
                                  meetingId: meeting.meetingId,
                                  role: meeting.isHost ? 'host' : 'participant',
                                  permission: meeting.isHost ? 'edit' : 'view',
                                  status: meeting.status
                                }
                              })}
                            >
                              Join Now
                            </button>
                          ) : (
                            <button className="px-4 py-2 border border-[#1f2a3b] text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed">
                              Upcoming
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
                </section>
                </>
                )}
              </>
            ) : activeView === 'meetings' ? (
              <>
                {(() => {
                  const q = searchQuery.replace(/\s+/g, ' ').trim().toLowerCase();
                  if (q && isSearching) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative w-12 h-12 mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-[#1f2a3b]"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-slate-400 text-sm">Searching...</p>
                      </div>
                    );
                  }
                  if (q && searchReady) {
                    const allMeetings = [...activeMeetings, ...upcomingMeetings, ...endedMeetings];
                    const matchedMeetings = allMeetings.filter(m => (m.name || '').toLowerCase().includes(q) || (m.meetingId || '').toLowerCase().includes(q));
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-sm text-slate-400">Results for "<span className="text-white font-semibold">{searchQuery.trim()}</span>" <span className="ml-2 text-slate-500">({matchedMeetings.length} found)</span></p>
                          <button className="text-xs text-slate-400 hover:text-white transition-colors" onClick={() => setSearchQuery('')} type="button"><span className="material-icons text-sm align-middle mr-1">close</span>Clear search</button>
                        </div>
                        {matchedMeetings.length === 0 ? (
                          <div className="text-center py-20">
                            <span className="material-icons text-5xl text-slate-700 mb-3 block">search_off</span>
                            <p className="text-slate-400 text-lg font-medium">No meetings found</p>
                            <p className="text-slate-600 text-sm mt-1">Try a different search term</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {matchedMeetings.map((meeting) => (
                              <div key={meeting._id} className={`group bg-[#1a242f] border border-[#2d3a4b] rounded-xl p-5 hover:shadow-lg transition-all border-l-4 ${meeting.status === 'live' ? 'border-l-emerald-500' : meeting.status === 'ended' ? 'border-l-slate-600' : 'border-l-primary'}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className={`w-10 h-10 ${meeting.status === 'live' ? 'bg-emerald-500/10 text-emerald-500' : meeting.status === 'ended' ? 'bg-slate-500/10 text-slate-500' : 'bg-primary/10 text-primary'} rounded-lg flex items-center justify-center`}>
                                    <span className="material-icons">{meeting.status === 'live' ? 'videocam' : meeting.status === 'ended' ? 'history' : 'event_available'}</span>
                                  </div>
                                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${meeting.status === 'live' ? 'bg-emerald-900/30 text-emerald-400' : meeting.status === 'ended' ? 'bg-slate-800 text-slate-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                    {meeting.status === 'live' ? 'Live' : meeting.status === 'ended' ? 'Ended' : 'Scheduled'}
                                  </span>
                                </div>
                                <h4 className="font-bold text-base mb-1 text-start">{meeting.name}</h4>
                                <p className="text-xs text-slate-500 mb-3">ID: {meeting.meetingId}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-[#2d3a4b]">
                                  <span className="text-xs text-slate-500"><span className="material-icons text-sm mr-1 align-middle">group</span>{meeting.participants?.length || 0}</span>
                                  <button className="text-primary text-xs font-bold hover:underline" type="button" onClick={() => {
                                    if (meeting.status === 'ended') { navigate(`/meeting-notes/${meeting._id}`); }
                                    else { navigate(`/meeting/${meeting.meetingId}`, { state: { meetingDbId: meeting._id, meetingId: meeting.meetingId, role: meeting.isHost ? 'host' : 'participant', permission: meeting.isHost ? 'edit' : 'view', status: meeting.status } }); }
                                  }}>
                                    {meeting.status === 'ended' ? 'View Notes' : meeting.status === 'live' ? 'Join Now' : 'View Details'} <span className="material-icons text-sm ml-1 align-middle">arrow_forward</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                {!searchQuery.replace(/\s+/g, ' ').trim() && (
                <>
                {/* Active Meetings — categorized by backend */}
                {(() => {
                  const formatDate = (dt) => {
                    if (!dt) return 'TBD';
                    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  };
                  const formatTime = (dt) => {
                    if (!dt) return '';
                    return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  };
                  return (
                    <>
                    <section className="mb-10">
                      <div className="flex items-center mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3"></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Active ({activeMeetings.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {isLoadingMeetings ? (
                          <div className="text-center py-10">
                            <span className="material-icons animate-spin text-primary text-3xl">refresh</span>
                            <p className="text-slate-500 mt-2 text-sm">Loading meetings...</p>
                          </div>
                        ) : activeMeetings.length === 0 ? (
                          <div className="text-center py-10">
                            <span className="material-icons text-slate-600 text-4xl block mb-2">event_busy</span>
                            <p className="text-slate-400 font-medium">No active meetings right now</p>
                            <p className="text-slate-500 text-xs mt-1">Meetings starting within 5 minutes will appear here</p>
                          </div>
                        ) : (
                          activeMeetings.map((meeting) => {
                            const isMeetingStarted = meeting.status === 'live';
                            return (
                            <div key={meeting._id} className="py-5 px-4 bg-[#1a242f] border-l-4 border-emerald-500 rounded-xl border border-[#2d3a4b]">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold truncate">{meeting.name}</h4>
                                    <span className={`inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isMeetingStarted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                      <span className="relative flex h-1.5 w-1.5 mr-1">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMeetingStarted ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isMeetingStarted ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                      </span>
                                      {isMeetingStarted ? 'Meeting Started' : 'Starting Soon'}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-slate-500 text-[11px] gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                                      {formatDate(meeting.startTime)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[11px]">schedule</span>
                                      {formatTime(meeting.startTime) || 'In Progress'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {activeJoinMeetingId === meeting._id ? (
                                    <div className="flex items-center gap-3 bg-[#0d1526] border border-slate-600/40 rounded-xl px-4 py-2.5 shadow-lg shadow-black/20">
                                      <button
                                        onClick={() => setActiveJoinAudio((prev) => !prev)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${activeJoinAudio ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40' : 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-400/40'}`}
                                        type="button"
                                        title={activeJoinAudio ? 'Disable Audio' : 'Enable Audio'}
                                      >
                                        <span className="material-icons text-[15px]">{activeJoinAudio ? 'mic' : 'mic_off'}</span>
                                      </button>
                                      <button
                                        onClick={() => setActiveJoinVideo((prev) => !prev)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${activeJoinVideo ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40' : 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-400/40'}`}
                                        type="button"
                                        title={activeJoinVideo ? 'Disable Video' : 'Enable Video'}
                                      >
                                        <span className="material-icons text-[15px]">{activeJoinVideo ? 'videocam' : 'videocam_off'}</span>
                                      </button>
                                      <div className="w-px h-6 bg-slate-600/50"></div>
                                      <button
                                        className="h-8 px-4 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-500 transition-all inline-flex items-center justify-center gap-1.5"
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            if (meeting.isHost && meeting.status === 'pending') {
                                              await meetingAPI.start(meeting._id);
                                            }
                                            // Non-host: re-register via join API (handles rejoin after leave, resets leaveTime)
                                            let joinData = null;
                                            if (!meeting.isHost && meeting.shareLink) {
                                              const linkToken = meeting.shareLink.split('/join-link/')[1];
                                              if (linkToken) {
                                                joinData = await meetingAPI.joinByLink(linkToken);
                                              }
                                            }
                                            setActiveJoinMeetingId(null);
                                            const label = meeting.isHost ? 'Starting meeting...' : 'Joining meeting...';
                                            startMeetingTransition(label, () =>
                                              navigate(`/meeting/${meeting.meetingId}`, {
                                                state: {
                                                  meetingDbId: meeting._id,
                                                  meetingId: meeting.meetingId,
                                                  meetingPassword: meeting.password || '',
                                                  role: meeting.isHost ? 'host' : (joinData?.role || 'participant'),
                                                  permission: meeting.isHost ? 'edit' : (joinData?.permission || 'view'),
                                                  status: 'live',
                                                  audioEnabled: activeJoinAudio,
                                                  videoEnabled: activeJoinVideo,
                                                }
                                              })
                                            );
                                          } catch (err) {
                                            console.error('Failed to start/join meeting:', err);
                                            const msg = err?.response?.data?.message || 'Failed to join meeting';
                                            setActiveJoinMeetingId(null);
                                            showFlash('error', msg);
                                          }
                                        }}
                                      >
                                        <span className="material-icons text-sm">play_arrow</span>
                                        Start
                                      </button>
                                      <button
                                        className="h-8 px-3 bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg hover:bg-slate-600 transition-all inline-flex items-center justify-center gap-1"
                                        type="button"
                                        onClick={() => setActiveJoinMeetingId(null)}
                                      >
                                        <span className="material-icons text-sm">arrow_back</span>
                                        Back
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        className="h-8 px-3 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-500 transition-all inline-flex items-center justify-center gap-1"
                                        type="button"
                                        onClick={() => {
                                          setActiveJoinAudio(true);
                                          setActiveJoinVideo(true);
                                          setActiveJoinMeetingId(meeting._id);
                                        }}
                                      >
                                        <span className="material-icons text-xs">play_arrow</span>
                                        {meeting.isHost ? 'Start Meeting' : 'Join Meeting'}
                                      </button>
                                      <button
                                        className="h-8 px-2.5 bg-slate-700/80 text-slate-300 text-[11px] font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center justify-center gap-1"
                                        type="button"
                                        onClick={() => setInviteMeeting(meeting)}
                                      >
                                        <span className="material-icons text-xs">person_add</span>
                                        Invite
                                      </button>
                                      {meeting.isHost && (
                                        <button
                                          className="h-8 px-2.5 bg-slate-700/80 text-slate-300 text-[11px] font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-all inline-flex items-center justify-center gap-1"
                                          type="button"
                                          onClick={() => setCancelConfirmMeetingId(meeting._id)}
                                        >
                                          <span className="material-icons text-xs">close</span>
                                          Cancel
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            );
                          })
                        )}
                      </div>
                    </section>

                    {/* Upcoming Meetings — more than 5 minutes away */}
                    <section className="mb-10">
                      <div className="flex items-center mb-4">
                        <div className="w-2 h-2 rounded-full bg-primary mr-3"></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Upcoming ({upcomingMeetings.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {upcomingMeetings.length === 0 ? (
                          <div className="text-center py-10">
                            <span className="material-icons text-slate-600 text-4xl block mb-2">calendar_today</span>
                            <p className="text-slate-400 font-medium">No upcoming meetings</p>
                            <p className="text-slate-500 text-xs mt-1">Schedule a meeting to see it here</p>
                          </div>
                        ) : (
                          upcomingMeetings.map((meeting) => (
                            <div key={meeting._id} className="py-5 px-4 bg-[#1a242f] border-l-4 border-primary rounded-xl border border-[#2d3a4b] hover:border-slate-600 transition-all">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold truncate">{meeting.name}</h4>
                                    <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-primary uppercase tracking-wider bg-primary/10">Scheduled</span>
                                  </div>
                                  <div className="flex items-center text-slate-500 text-[11px] gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                                      {formatDate(meeting.startTime)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[11px]">schedule</span>
                                      {formatTime(meeting.startTime) || 'TBD'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    className="h-8 px-2.5 bg-slate-700/80 text-slate-300 text-[11px] font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center justify-center gap-1"
                                    type="button"
                                    onClick={() => setInviteMeeting(meeting)}
                                  >
                                    <span className="material-icons text-xs">person_add</span>
                                    Invite
                                  </button>
                                  {meeting.isHost && (
                                    <button
                                      className="h-8 px-2.5 bg-slate-700/80 text-slate-300 text-[11px] font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-all inline-flex items-center justify-center gap-1"
                                      type="button"
                                      onClick={() => setCancelConfirmMeetingId(meeting._id)}
                                    >
                                      <span className="material-icons text-xs">close</span>
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                    </>
                  );
                })()}

                {/* Completed Meetings */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-600 mr-3"></div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Completed ({endedMeetings.length})</h3>
                    </div>
                    <button
                      className="text-xs text-slate-400 hover:text-primary flex items-center gap-1 transition-colors"
                      type="button"
                      onClick={() => { setIsLoadingMeetings(true); doFetchMeetings().finally(() => setIsLoadingMeetings(false)); }}
                    >
                      <span className={`material-icons text-sm ${isLoadingMeetings ? 'animate-spin' : ''}`}>refresh</span>
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-3">
                    {endedMeetings.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-500 text-sm">No completed meetings yet.</p>
                      </div>
                    ) : (
                      endedMeetings.map((meeting) => (
                        <div key={meeting._id} className="py-5 px-4 bg-[#1a242f] border-l-4 border-slate-600 rounded-xl border border-[#2d3a4b] hover:border-slate-600 transition-all">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold truncate">{meeting.name}</h4>
                                <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-700/50">Ended</span>
                              </div>
                              <div className="flex items-center text-slate-500 text-[11px] gap-3">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                                  {meeting.endTime ? new Date(meeting.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Ended'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[11px]">schedule</span>
                                  {meeting.endTime ? new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[11px]">tag</span>
                                  {meeting.meetingId}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-icons text-[11px]">group</span>
                                  {meeting.participants?.length || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[11px]">timer</span>
                                  {meeting.startTime && meeting.endTime
                                    ? `${Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / 60000)}m`
                                    : 'N/A'}
                                </span>
                              </div>
                            </div>
                            <button
                              className="px-3 py-1.5 text-primary text-[11px] font-bold rounded-lg border border-primary/30 hover:bg-primary/10 transition-all flex items-center gap-1 shrink-0"
                              type="button"
                              onClick={() => navigate(`/meeting-notes/${meeting._id}`)}
                            >
                              <span className="material-symbols-outlined text-xs">description</span>
                              View Notes
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
                </>
                )}
              </>
            ) : activeView === 'notifications' ? (
              <>
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1 text-start">Notifications</h1>
                      <p className="text-slate-500 text-sm text-start">Meeting reminders</p>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        className="text-xs font-semibold text-primary hover:underline transition-all"
                        type="button"
                        onClick={markAllNotificationsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <div className="text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-slate-700 mb-4 block">notifications_off</span>
                        <p className="text-slate-400 text-lg font-medium">No notifications yet</p>
                        <p className="text-slate-600 text-sm mt-1">Meeting reminders will appear here when it's time</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`group flex items-center p-5 bg-[#1a242f] border rounded-xl transition-all relative overflow-hidden ${
                            n.read
                              ? 'border-[#2d3a4b] opacity-70 hover:opacity-100'
                              : 'border-primary/50 hover:border-primary'
                          }`}
                        >
                          {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                          <div className="flex-shrink-0 w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mr-4">
                            <span className="material-symbols-outlined text-amber-400">timer</span>
                          </div>
                          <div className="flex-1 min-w-0 text-start">
                            <p className="text-sm font-medium text-slate-200">
                              Reminder: <span className="font-bold text-white">{n.name}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(n.startTime).toLocaleString('en-US', {
                                month: 'short', day: 'numeric',
                                hour: 'numeric', minute: '2-digit', hour12: true
                              })}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                            {!n.read && (
                              <button
                                className="px-3 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-[#2d3a4b] hover:bg-slate-700 hover:text-white transition-all"
                                type="button"
                                onClick={() => markNotificationRead(n._id)}
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all flex items-center"
                              type="button"
                              onClick={() => {
                                setActiveView('meetings');
                              }}
                            >
                              <span className="material-icons text-sm mr-1">videocam</span>
                              Join Now
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : activeView === 'activity' ? (
              <>
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-start">Recent Actions</h3>
                      <p className="text-sm text-slate-500">Chronological track of your platform interactions</p>
                    </div>
                  </div>
                  {isLoadingActivity ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                          <div className="w-9 h-9 rounded-lg bg-slate-800" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-800 rounded w-1/3" />
                          </div>
                          <div className="h-3 bg-slate-800 rounded w-20" />
                        </div>
                      ))}
                    </div>
                  ) : activityLogs.length === 0 ? (
                    <div className="text-center py-16">
                      <span className="material-symbols-outlined text-5xl text-slate-700 mb-4 block">history</span>
                      <p className="text-slate-400 text-lg font-medium">No activity yet</p>
                      <p className="text-slate-600 text-sm mt-1">Your actions will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activityLogs.map((log, idx) => {
                        const config = ACTIVITY_ICON_MAP[log.action] || { icon: 'info', color: 'text-slate-400', border: 'border-slate-500/20', bg: 'bg-slate-500/10' };
                        const label = ACTIVITY_LABELS[log.action] || log.action;
                        const isLast = idx === activityLogs.length - 1;
                        return (
                            <div key={log._id || idx} className={`activity-item relative flex items-center py-4 ${isLast ? '' : 'activity-line'}`}>
                              <div className={`z-10 w-11 h-11 flex-shrink-0 ${config.bg} border ${config.border} rounded-xl flex items-center justify-center mr-4`}>
                                <span className={`material-symbols-outlined text-2xl ${config.color}`}>{config.icon}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-col items-start">
                                  <span className="text-[15px] font-semibold text-slate-100 truncate block">{label}</span>
                                  <span className="text-xs text-slate-500 mt-0.5">{timeAgo(log.timestamp)}</span>
                                </div>
                              </div>
                              <div className="ml-auto flex-shrink-0 pl-4">
                                <span className="text-sm text-slate-500">{formatTimestamp(log.timestamp)}</span>
                              </div>
                            </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : activeView === 'settings' ? (
              <>
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-start">Account Settings</h3>
                      <p className="text-sm text-slate-500">Manage your profile and security preferences</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-1 bg-[#1a242f] border border-[#2d3a4b] rounded-xl mb-8">
                    <button
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        settingsTab === 'profile'
                          ? 'bg-primary text-white'
                          : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                      }`}
                      onClick={() => setSettingsTab('profile')}
                      type="button"
                    >
                      Profile Details
                    </button>
                    <button
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        settingsTab === 'password'
                          ? 'bg-primary text-white'
                          : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                      }`}
                      onClick={() => setSettingsTab('password')}
                      type="button"
                    >
                      Password
                    </button>
                    <button
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        settingsTab === 'account'
                          ? 'bg-primary text-white'
                          : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                      }`}
                      onClick={() => setSettingsTab('account')}
                      type="button"
                    >
                      Account Details
                    </button>
                  </div>

                  {settingsTab === 'profile' && (
                    <form className="bg-[#1a242f] border border-[#2d3a4b] rounded-2xl p-6" onSubmit={handleProfileUpdate}>
                      <div className="mb-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Profile Details</h4>
                        <p className="text-xs text-slate-500 mt-1">Update your public profile information.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-semibold text-slate-400">Username</label>
                          <input
                            className="mt-2 w-full h-11 bg-[#101922]/40 border border-[#2d3a4b] rounded-xl px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            onChange={(event) => setProfileUsername(event.target.value)}
                            placeholder="Enter your username"
                            value={profileUsername}
                            type="text"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400">Email</label>
                          <input
                            className="mt-2 w-full h-11 bg-[#101922]/40 border border-[#2d3a4b] rounded-xl px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            onChange={(event) => setProfileEmail(event.target.value)}
                            placeholder="Enter your email"
                            value={profileEmail}
                            type="email"
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all"
                          disabled={isProfileSaving}
                          type="submit"
                        >
                          {isProfileSaving ? 'Updating...' : 'Update Profile'}
                        </button>
                      </div>
                    </form>
                  )}

                  {settingsTab === 'password' && (
                    <form className="bg-[#1a242f] border border-[#2d3a4b] rounded-2xl p-6" onSubmit={handlePasswordUpdate}>
                      <div className="mb-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Password</h4>
                        <p className="text-xs text-slate-500 mt-1">Set a strong password to keep your account secure.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-400">Old Password</label>
                          <input
                            className="mt-2 w-full h-11 bg-[#101922]/40 border border-[#2d3a4b] rounded-xl px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            onChange={(event) => setOldPassword(event.target.value)}
                            placeholder="Enter your old password"
                            type="password"
                            value={oldPassword}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400">New Password</label>
                          <input
                            className="mt-2 w-full h-11 bg-[#101922]/40 border border-[#2d3a4b] rounded-xl px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            onChange={(event) => setNewPassword(event.target.value)}
                            placeholder="Create a new password"
                            type="password"
                            value={newPassword}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
                          <input
                            className="mt-2 w-full h-11 bg-[#101922]/40 border border-[#2d3a4b] rounded-xl px-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Re-enter the new password"
                            type="password"
                            value={confirmPassword}
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all"
                          disabled={isPasswordSaving}
                          type="submit"
                        >
                          {isPasswordSaving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  )}

                  {settingsTab === 'account' && (
                    <div className="bg-[#1a242f] border border-[#2d3a4b] rounded-2xl p-6">
                      <div className="mb-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Account Details</h4>
                        <p className="text-xs text-slate-500 mt-1">Review account metadata and manage access.</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#101922]/40 border border-[#2d3a4b] rounded-xl">
                        <div>
                          <p className="text-xs text-slate-500 text-start">Account created</p>
                          <p className="text-sm font-semibold text-slate-200">{accountCreatedLabel}</p>
                        </div>
                        <span className="text-xs text-slate-500">{user?.email || 'No email available'}</span>
                      </div>
                      <div className="mt-6 flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold  text-rose-400 text-start mb-1">Delete account</p>
                          <p className="text-xs text-rose-300 ">This action is permanent and cannot be undone.</p>
                        </div>
                        <button 
                          className="px-5 py-2 bg-rose-500 text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all" 
                          type="button"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {(() => {
                  const q = searchQuery.replace(/\s+/g, ' ').trim().toLowerCase();
                  if (q && isSearching) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative w-12 h-12 mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-[#1f2a3b]"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-slate-400 text-sm">Searching...</p>
                      </div>
                    );
                  }
                  if (q && searchReady) {
                    const matchedCanvases = savedCanvases.filter(c => (c.title || '').toLowerCase().includes(q));
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-sm text-slate-400">Results for "<span className="text-white font-semibold">{searchQuery.trim()}</span>" <span className="ml-2 text-slate-500">({matchedCanvases.length} found)</span></p>
                          <button className="text-xs text-slate-400 hover:text-white transition-colors" onClick={() => setSearchQuery('')} type="button"><span className="material-icons text-sm align-middle mr-1">close</span>Clear search</button>
                        </div>
                        {matchedCanvases.length === 0 ? (
                          <div className="text-center py-20">
                            <span className="material-icons text-5xl text-slate-700 mb-3 block">search_off</span>
                            <p className="text-slate-400 text-lg font-medium">No canvases found</p>
                            <p className="text-slate-600 text-sm mt-1">Try a different search term</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {matchedCanvases.map((canvas) => (
                              <div key={canvas._id} className={`group bg-[#111827] border border-[#1f2a3b] rounded-xl overflow-hidden hover:shadow-lg transition-all border-b-4 ${canvas.isMeetingCanvas ? 'border-b-amber-400/60' : 'border-b-emerald-400/60'}`}>
                                <div className="h-40 bg-[#0b1220] relative overflow-hidden">
                                  <div className={`absolute inset-0 bg-gradient-to-br ${canvas.isMeetingCanvas ? 'from-amber-500/10' : 'from-emerald-500/10'} to-transparent`}></div>
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                    <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-lg" onClick={() => navigate(canvas.isMeetingCanvas ? `/meeting-canvas/${canvas._id}` : `/paint/${canvas._id}`)} type="button">Open Editor</button>
                                  </div>
                                  <img alt={`${canvas.title} Preview`} className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none" src={canvas.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23111827' width='400' height='200'/%3E%3C/svg%3E"} />
                                  {canvas.isMeetingCanvas && (
                                    <div className="absolute top-3 right-3 z-10"><span className="px-2 py-1 bg-[#101922]/80 text-[10px] font-bold rounded border uppercase text-amber-400 border-amber-400/30">Meeting</span></div>
                                  )}
                                </div>
                                <div className="p-4">
                                  <h4 className="font-bold text-sm truncate mb-1">{canvas.title || 'Untitled Canvas'}</h4>
                                  <div className="flex items-center text-xs text-slate-500 space-x-2">
                                    <span className="material-icons text-sm">schedule</span>
                                    <span>{new Date(canvas.updatedAt).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                {!searchQuery.replace(/\s+/g, ' ').trim() && (
                <>
                {activeFolder ? (
                  <>
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined">folder_open</span>
                          </div>
                          <h1 className="text-3xl font-extrabold tracking-tight text-white">{activeFolder.name}</h1>
                        </div>
                        <p className="text-slate-400 mt-1">{activeFolder.description}</p>
                      </div>
                      <div className="flex items-center space-x-2"></div>
                    </div>

                    <section className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-1 p-1 bg-[#1a242f] border border-[#2d3a4b] rounded-xl">
                        <button
                          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            canvasFilter === 'all'
                              ? 'bg-primary text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('all')}
                          type="button"
                        >
                          All
                        </button>
                        <button
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            canvasFilter === 'recent'
                              ? 'bg-primary text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('recent')}
                          type="button"
                        >
                          Recent
                        </button>
                        <button
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            canvasFilter === 'meeting'
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('meeting')}
                          type="button"
                        >
                          Meeting
                        </button>
                        <button
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            canvasFilter === 'private'
                              ? 'bg-primary text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('private')}
                          type="button"
                        >
                          Private
                        </button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <span>Sort by:</span>
                          <button className="flex items-center space-x-1 font-bold text-slate-200" type="button">
                            <span>Last edited</span>
                            <span className="material-icons text-sm">expand_more</span>
                          </button>
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                      <button
                        className="group bg-primary rounded-xl flex flex-col items-center justify-center text-white hover:brightness-110 transition-all p-10 h-64 shadow-lg shadow-primary/20"
                        onClick={handleNewCanvas}
                        type="button"
                      >
                        <span className="material-icons text-4xl mb-3">add_circle</span>
                        <span className="text-sm font-bold uppercase tracking-wider">New Canvas</span>
                        {createCanvasCardMessage && (
                          <span className="mt-3 text-xs font-semibold text-rose-100/90 bg-rose-500/30 inline-flex px-2 py-1 rounded">
                            {createCanvasCardMessage}
                          </span>
                        )}
                      </button>

                      {filteredFolderCanvases.map((canvas) => (
                        <div
                          key={canvas.id}
                          className={`group h-64 flex flex-col bg-[#1a242f] border border-[#2d3a4b] rounded-xl hover:shadow-2xl transition-all border-b-4 relative ${canvas.border}`}
                        >
                          <div className="flex-1 bg-[#101922] relative overflow-hidden rounded-t-xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#101922]/60 backdrop-blur-sm z-20">
                              <button
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-blue-600/30 transition-all"
                                type="button"
                                onClick={() => navigate(canvas.isMeetingCanvas ? `/meeting-canvas/${canvas.id}` : `/paint/${canvas.id}`)}
                              >
                                Open Editor
                              </button>
                            </div>
                            <img
                              alt={`${canvas.title} Preview`}
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                              src={canvas.preview}
                            />
                            <div className="absolute top-3 right-3 z-10">
                              <span
                                className={`px-2 py-1 bg-[#101922]/80 text-[10px] font-bold rounded border uppercase ${
                                  canvas.tagColor === 'amber'
                                    ? 'text-amber-400 border-amber-400/30'
                                    : canvas.tagColor === 'emerald'
                                    ? 'text-emerald-400 border-emerald-400/30'
                                    : 'text-primary border-primary/30'
                                }`}
                              >
                                {canvas.tag}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 bg-[#1a242f]">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-bold text-sm truncate text-white">{canvas.title}</h4>
                              {isRealCanvas(canvas) && (
                                <div className="relative">
                                  <button 
                                    className="text-slate-500 hover:text-primary transition-colors" 
                                    type="button"
                                    data-canvas-menu-button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentMenuCanvasId(currentMenuCanvasId === canvas.id ? null : canvas.id);
                                    }}
                                  >
                                    <span className="material-icons text-lg">more_vert</span>
                                  </button>
                                  {currentMenuCanvasId === canvas.id && (
                                    <div 
                                      className="absolute right-0 top-full mt-2 bg-[#101922] border border-[#2d3a4b] rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden"
                                      data-canvas-menu
                                    >
                                      <button
                                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-[#1a242f] hover:text-primary flex items-center space-x-3 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRenameCanvasId(canvas.id);
                                          setNewCanvasName(canvas.title);
                                          setShowRenameModal(true);
                                          setCurrentMenuCanvasId(null);
                                        }}
                                      >
                                        <span className="material-icons text-sm">edit</span>
                                        <span className="font-medium">Rename</span>
                                      </button>
                                      <button
                                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-[#1a242f] hover:text-primary flex items-center space-x-3 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDuplicateCanvas(canvas.id);
                                        }}
                                        disabled={isOperating}
                                      >
                                        <span className="material-icons text-sm">content_copy</span>
                                        <span className="font-medium">Duplicate</span>
                                      </button>
                                      <div className="border-t border-[#2d3a4b]"></div>
                                      <button
                                        className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-[#1a242f] hover:text-rose-300 flex items-center space-x-3 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCanvas(canvas.id);
                                        }}
                                        disabled={isOperating}
                                      >
                                        <span className="material-icons text-sm">delete</span>
                                        <span className="font-medium">Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center text-[11px] text-slate-500 space-x-2">
                              <span className="material-icons text-sm">schedule</span>
                              <span className="whitespace-nowrap">{canvas.edited}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white text-start">My Canvases</h1>
                        <p className="text-slate-400 mt-1">Manage and organize your collaborative workspaces.</p>
                      </div>
                    </div>

                    <section className="mb-12">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">My Folders</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {folders.map((folder, index) => {
                          const folderCanvasCount = savedCanvases.filter(c => c.folder === folder._id).length;
                          const colors = ['blue', 'amber', 'emerald', 'purple'];
                          const color = colors[index % colors.length];
                          
                          return (
                            <div
                              key={folder._id}
                              className="group relative flex items-center p-4 bg-[#1a242f] border border-[#2d3a4b] rounded-xl hover:border-primary cursor-pointer transition-all text-left"
                            >
                              <div
                                className="flex items-center flex-1"
                                onClick={() => setActiveFolderId(folder._id)}
                              >
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-colors ${
                                    color === 'blue'
                                      ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'
                                      : color === 'amber'
                                      ? 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
                                      : color === 'emerald'
                                      ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                                      : 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'
                                  }`}
                                >
                                  <span className="material-symbols-outlined">folder</span>
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-white">{folder.name}</p>
                                  <p className="text-[10px] text-slate-500">{folderCanvasCount} canvases</p>
                                </div>
                              </div>
                              <div className="relative">
                                <button
                                  className="text-slate-500 hover:text-primary transition-colors p-1"
                                  data-folder-menu-button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentMenuFolderId(currentMenuFolderId === folder._id ? null : folder._id);
                                  }}
                                  type="button"
                                >
                                  <span className="material-icons text-lg">more_vert</span>
                                </button>
                                {currentMenuFolderId === folder._id && (
                                  <div
                                    className="absolute right-0 top-full mt-2 bg-[#101922] border border-[#2d3a4b] rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden"
                                    data-folder-menu
                                  >
                                    <button
                                      className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-[#1a242f] hover:text-primary flex items-center space-x-3 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRenameFolderId(folder._id);
                                        setNewFolderName(folder.name);
                                        setShowRenameFolderModal(true);
                                        setCurrentMenuFolderId(null);
                                      }}
                                      type="button"
                                    >
                                      <span className="material-icons text-sm">edit</span>
                                      <span className="font-medium">Rename</span>
                                    </button>
                                    <div className="border-t border-[#2d3a4b]"></div>
                                    <button
                                      className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-[#1a242f] hover:text-rose-300 flex items-center space-x-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(folder._id);
                                      }}
                                      disabled={isOperatingFolder || folder._id === defaultFolderId}
                                      type="button"
                                    >
                                      <span className="material-icons text-sm">delete</span>
                                      <span className="font-medium">Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <button 
                          className="group flex items-center justify-center p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 cursor-pointer transition-all" 
                          onClick={() => setShowCreateFolderModal(true)}
                          type="button"
                        >
                          <span className="material-icons text-xl mr-2 text-white/90">create_new_folder</span>
                          <span className="text-xs font-bold uppercase">Add Folder</span>
                        </button>
                      </div>
                    </section>

                    <section className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-1 p-1 bg-[#1a242f] border border-[#2d3a4b] rounded-xl">
                        <button
                          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            canvasFilter === 'all'
                              ? 'bg-primary text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('all')}
                          type="button"
                        >
                          All
                        </button>
                        <button
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            canvasFilter === 'recent'
                              ? 'bg-primary text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('recent')}
                          type="button"
                        >
                          Recent
                        </button>
                        <button
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            canvasFilter === 'meeting'
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('meeting')}
                          type="button"
                        >
                          Meeting
                        </button>
                        <button
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            canvasFilter === 'private'
                              ? 'bg-primary text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('private')}
                          type="button"
                        >
                          Private
                        </button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <span>Sort by:</span>
                          <button className="flex items-center space-x-1 font-bold text-slate-200" type="button">
                            <span>Last edited</span>
                            <span className="material-icons text-sm">expand_more</span>
                          </button>
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <button
                        className="flex flex-col items-center justify-center bg-primary text-white rounded-xl hover:brightness-110 transition-all p-10 cursor-pointer h-[264px] shadow-lg shadow-primary/20"
                        onClick={handleNewCanvas}
                        type="button"
                      >
                        <span className="material-icons text-4xl mb-3">add_circle</span>
                        <span className="text-sm font-bold uppercase tracking-widest">New Canvas</span>
                        {createCanvasCardMessage && (
                          <span className="mt-3 text-xs font-semibold text-rose-100/90 bg-rose-500/30 inline-flex px-2 py-1 rounded">
                            {createCanvasCardMessage}
                          </span>
                        )}
                      </button>

                      {(() => {
                        const q = searchQuery.replace(/\s+/g, ' ').trim().toLowerCase();
                        const searchedCanvases = filteredAllCanvases.filter(c => !q || c.title.toLowerCase().includes(q));
                        return searchedCanvases.length === 0 ? (
                          <div className="col-span-3 text-center py-12">
                            <span className="material-icons text-slate-600 text-4xl block mb-2">search_off</span>
                            <p className="text-slate-500">{q ? 'No canvases match your search.' : 'No canvases yet.'}</p>
                          </div>
                        ) : searchedCanvases.map((canvas) => (
                        <div
                          key={canvas.id}
                          className={`group bg-[#1a242f] border border-[#2d3a4b] rounded-xl hover:shadow-2xl transition-all border-b-4 relative ${canvas.border}`}
                        >
                          <div className="h-40 bg-[#101922] relative overflow-hidden rounded-t-xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#101922]/60 backdrop-blur-sm z-20">
                              <button
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-blue-600/30 transition-all"
                                onClick={() => navigate(canvas.isMeetingCanvas ? `/meeting-canvas/${canvas.id}` : `/paint/${canvas.id}`)}
                                type="button"
                              >
                                Open Editor
                              </button>
                            </div>
                            <img
                              alt={`${canvas.title} Preview`}
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                              src={canvas.preview}
                            />
                            <div className="absolute top-3 right-3 z-10">
                              <span
                                className={`px-2 py-1 bg-[#101922]/80 text-[10px] font-bold rounded border uppercase ${
                                  canvas.tagColor === 'amber'
                                    ? 'text-amber-400 border-amber-400/30'
                                    : canvas.tagColor === 'emerald'
                                    ? 'text-emerald-400 border-emerald-400/30'
                                    : 'text-primary border-primary/30'
                                }`}
                              >
                                {canvas.tag}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-sm truncate text-white">{canvas.title}</h4>
                              {isRealCanvas(canvas) && (
                                <div className="relative">
                                  <button 
                                    className="text-slate-500 hover:text-primary transition-colors" 
                                    type="button"
                                    data-canvas-menu-button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentMenuCanvasId(currentMenuCanvasId === canvas.id ? null : canvas.id);
                                    }}
                                  >
                                    <span className="material-icons text-lg">more_vert</span>
                                  </button>
                                  {currentMenuCanvasId === canvas.id && (
                                    <div 
                                      className="absolute right-0 top-full mt-2 bg-[#101922] border border-[#2d3a4b] rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden"
                                      data-canvas-menu
                                    >
                                      <button
                                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-[#1a242f] hover:text-primary flex items-center space-x-3 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRenameCanvasId(canvas.id);
                                          setNewCanvasName(canvas.title);
                                          setShowRenameModal(true);
                                          setCurrentMenuCanvasId(null);
                                        }}
                                      >
                                        <span className="material-icons text-sm">edit</span>
                                        <span className="font-medium">Rename</span>
                                      </button>
                                      <button
                                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-[#1a242f] hover:text-primary flex items-center space-x-3 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDuplicateCanvas(canvas.id);
                                        }}
                                        disabled={isOperating}
                                      >
                                        <span className="material-icons text-sm">content_copy</span>
                                        <span className="font-medium">Duplicate</span>
                                      </button>
                                      <div className="border-t border-[#2d3a4b]"></div>
                                      <button
                                        className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-[#1a242f] hover:text-rose-300 flex items-center space-x-3 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCanvas(canvas.id);
                                        }}
                                        disabled={isOperating}
                                      >
                                        <span className="material-icons text-sm">delete</span>
                                        <span className="font-medium">Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center text-[11px] text-slate-500 space-x-2">
                              <span className="material-icons text-sm">schedule</span>
                              <span>{canvas.edited}</span>
                              <span>•</span>
                              <span className="flex items-center">
                                <span className="material-icons text-[10px] mr-1">folder</span>
                                {canvas.folder}
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                      })()}
                    </div>
                  </>
                )}
                </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Cancel Meeting Confirmation Modal */}
      {cancelConfirmMeetingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
            <div className="text-center mb-5">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15">
                <span className="material-icons text-rose-400 text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-white">Cancel Meeting?</h3>
              <p className="text-slate-400 text-sm mt-1">This will permanently delete this meeting. This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex-1 py-2.5 rounded-lg bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-all"
                type="button"
                onClick={() => setCancelConfirmMeetingId(null)}
              >
                Keep Meeting
              </button>
              <button
                className="flex-1 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 transition-all"
                type="button"
                onClick={() => handleCancelMeeting(cancelConfirmMeetingId)}
              >
                Cancel Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Meeting Modal */}
      {inviteMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
            <button
              onClick={() => setInviteMeeting(null)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              type="button"
            >
              <span className="material-icons">close</span>
            </button>
            <div className="text-center mb-5">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15">
                <span className="material-icons text-indigo-400 text-2xl">person_add</span>
              </div>
              <h3 className="text-lg font-bold text-white">Invite to Meeting</h3>
              <p className="text-slate-400 text-sm mt-1">Share these details with participants</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Meeting ID</p>
                  <p className="text-sm font-mono text-white">{inviteMeeting.meetingId}</p>
                </div>
                <button
                  className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(inviteMeeting.meetingId); }}
                  title="Copy Meeting ID"
                >
                  <span className="material-icons text-sm">content_copy</span>
                </button>
              </div>
              {inviteMeeting.password && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Password</p>
                    <p className="text-sm font-mono text-white">{inviteMeeting.password}</p>
                  </div>
                  <button
                    className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(inviteMeeting.password); }}
                    title="Copy Password"
                  >
                    <span className="material-icons text-sm">content_copy</span>
                  </button>
                </div>
              )}
              {inviteMeeting.shareLink && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Shareable Link</p>
                    <p className="text-xs font-mono text-white truncate">{inviteMeeting.shareLink}</p>
                  </div>
                  <button
                    className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 shrink-0"
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(inviteMeeting.shareLink); }}
                    title="Copy Link"
                  >
                    <span className="material-icons text-sm">content_copy</span>
                  </button>
                </div>
              )}
            </div>
            <button
              className="w-full mt-5 py-2.5 rounded-lg bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-all"
              type="button"
              onClick={() => setInviteMeeting(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showJoinMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
            <button
              onClick={() => setShowJoinMeeting(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              type="button"
            >
              <span className="material-icons">close</span>
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <span className="material-icons">login</span>
              </div>
              <h3 className="text-2xl font-bold">Join a Meeting</h3>
              <p className="text-slate-400 text-sm">Enter your meeting credentials to continue.</p>
            </div>

            {joinMeetingFlash && (
              <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {joinMeetingFlash}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Meeting ID</label>
                <input
                  type="text"
                  value={joinMeetingId}
                  onChange={(event) => setJoinMeetingId(event.target.value)}
                  placeholder="MEET-XXXXXX"
                  className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Meeting Password</label>
                <input
                  type="password"
                  value={joinMeetingPassword}
                  onChange={(event) => setJoinMeetingPassword(event.target.value)}
                  placeholder="Enter meeting password"
                  className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                />
              </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-sm text-slate-200">Device Settings</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setJoinAudioEnabled((prev) => !prev)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                        joinAudioEnabled
                          ? 'border-emerald-400/60 bg-emerald-800 text-white'
                          : 'border-rose-400/60 bg-rose-500 text-white'
                      }`}
                      type="button"
                      title={joinAudioEnabled ? 'Disable Audio' : 'Enable Audio'}
                    >
                      <span className="material-icons">{joinAudioEnabled ? 'mic' : 'mic_off'}</span>
                    </button>
                    <button
                      onClick={() => setJoinVideoEnabled((prev) => !prev)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                        joinVideoEnabled
                          ? 'border-emerald-400/60 bg-emerald-800 text-white'
                          : 'border-rose-400/60 bg-rose-500 text-white'
                      }`}
                      type="button"
                      title={joinVideoEnabled ? 'Disable Video' : 'Enable Video'}
                    >
                      <span className="material-icons">{joinVideoEnabled ? 'videocam' : 'videocam_off'}</span>
                    </button>
                  </div>
                </div>

              <button
                onClick={handleJoinMeetingSubmit}
                className="w-full rounded-lg bg-emerald-600 py-3 font-bold text-white transition-all hover:bg-emerald-500"
                type="button"
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
            <button
              onClick={() => setShowCreateMeeting(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              type="button"
            >
              <span className="material-icons">close</span>
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                <span className="material-icons">video_call</span>
              </div>
              <h3 className="text-2xl font-bold">Create a Meeting</h3>
              <p className="text-slate-400 text-sm">Choose instant or schedule a meeting.</p>
            </div>

            {createMeetingFlash && (
              <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {createMeetingFlash}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Meeting Name</label>
              <input
                type="text"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Enter meeting name..."
                className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                maxLength={100}
              />
            </div>

            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setCreateMeetingMode('instant')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                  createMeetingMode === 'instant'
                    ? 'border-indigo-400 bg-indigo-500/20 text-white'
                    : 'border-white/10 text-slate-300 hover:border-white/30'
                }`}
                type="button"
              >
                Instant Meeting
              </button>
              <button
                onClick={() => setCreateMeetingMode('scheduled')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                  createMeetingMode === 'scheduled'
                    ? 'border-indigo-400 bg-indigo-500/20 text-white'
                    : 'border-white/10 text-slate-300 hover:border-white/30'
                }`}
                type="button"
              >
                Schedule Meeting
              </button>
            </div>

            {createMeetingMode === 'instant' && (
              <div className="space-y-4">
                {isInstantGenerating && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-indigo-500"></div>
                    Generating meeting details...
                  </div>
                )}

                {instantMeetingDetails && (
                  <div className={`rounded-xl border p-4 text-sm space-y-2 ${
                    instantMeetingDetails?.meetingDbId
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-slate-200'
                      : 'border-blue-500/40 bg-blue-500/10 text-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`material-icons text-sm ${instantMeetingDetails?.meetingDbId ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {instantMeetingDetails?.meetingDbId ? 'check_circle' : 'info'}
                      </span>
                      <span className="font-semibold">
                        {instantMeetingDetails?.meetingDbId ? 'Meeting Created Successfully' : 'Meeting Details Generated'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Meeting ID</span>
                      <span className="font-semibold">{instantMeetingDetails.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Meeting Password</span>
                      <span className="font-semibold">{instantMeetingDetails.password}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Shareable Link</span>
                      <span className="font-semibold text-xs break-all">
                        {instantMeetingDetails.shareLink || (isInstantGenerating ? 'Generating...' : 'Not yet generated')}
                      </span>
                    </div>
                    <p className={`text-xs mt-2 ${
                      instantMeetingDetails?.meetingDbId 
                        ? 'text-emerald-300' 
                        : 'text-blue-300'
                    }`}>
                      {instantMeetingDetails?.meetingDbId 
                        ? 'Other members can now join this meeting' 
                        : 'Click "Host Meeting" below to create and enter the meeting'}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-sm text-slate-200">Device Settings</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCreateAudioEnabled((prev) => !prev)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                        createAudioEnabled
                          ? 'border-emerald-400/60 bg-emerald-800 text-white'
                          : 'border-rose-400/60 bg-rose-500 text-white'
                      }`}
                      type="button"
                      title={createAudioEnabled ? 'Disable Audio' : 'Enable Audio'}
                    >
                      <span className="material-icons">{createAudioEnabled ? 'mic' : 'mic_off'}</span>
                    </button>
                    <button
                      onClick={() => setCreateVideoEnabled((prev) => !prev)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                        createVideoEnabled
                          ? 'border-emerald-400/60 bg-emerald-800 text-white'
                          : 'border-rose-400/60 bg-rose-500 text-white'
                      }`}
                      type="button"
                      title={createVideoEnabled ? 'Disable Video' : 'Enable Video'}
                    >
                      <span className="material-icons">{createVideoEnabled ? 'videocam' : 'videocam_off'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleInstantJoin}
                  className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={isInstantGenerating || !instantMeetingDetails}
                >
                  {isInstantGenerating ? 'Creating Meeting...' : instantMeetingDetails && !instantMeetingDetails.meetingDbId ? 'Host Meeting' : 'Host Meeting'}
                </button>
              </div>
            )}

            {createMeetingMode === 'scheduled' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(event) => setScheduleDate(event.target.value)}
                      className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(event) => setScheduleTime(event.target.value)}
                      className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {scheduleError && (
                  <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {scheduleError}
                  </div>
                )}

                {isScheduledGenerating && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-indigo-500"></div>
                    Generating meeting details...
                  </div>
                )}

                <button
                  onClick={handleGenerateScheduledMeeting}
                  className="w-full rounded-lg border border-indigo-400/40 bg-indigo-500/10 py-3 text-sm font-semibold text-indigo-200 transition-all hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={isScheduledGenerating}
                >
                  {isScheduledGenerating ? 'Generating...' : 'Generate Meeting Details'}
                </button>

                {scheduledMeetingDetails && (
                  <div className={`rounded-xl border p-4 text-sm space-y-2 ${
                    scheduledMeetingDetails?.meetingDbId
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-slate-200'
                      : 'border-blue-500/40 bg-blue-500/10 text-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Meeting ID</span>
                      <span className="font-semibold">{scheduledMeetingDetails.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Meeting Password</span>
                      <span className="font-semibold">{scheduledMeetingDetails.password}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Shareable Link</span>
                      <span className="font-semibold text-xs break-all">{scheduledMeetingDetails.shareLink}</span>
                    </div>
                    {scheduledMeetingDetails.scheduledDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Scheduled Date & Time</span>
                        <span className="font-semibold">{scheduledMeetingDetails.scheduledDate} {scheduledMeetingDetails.scheduledTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {scheduledMeetingDetails && (
                  <button
                    onClick={() => setShowCreateMeeting(false)}
                    className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-500"
                    type="button"
                  >
                    Done
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {meetingTransition.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#0f172a] px-6 py-5 shadow-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-primary"></div>
            <p className="text-sm font-semibold text-slate-100">{meetingTransition.label}</p>
          </div>
        </div>
      )}

      {showCreateCanvasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
            <button
              onClick={() => {
                setShowCreateCanvasModal(false);
                setCreateCanvasName('');
                setCreateCanvasError('');
              }}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              type="button"
            >
              <span className="material-icons">close</span>
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <span className="material-icons">add_circle</span>
              </div>
              <h3 className="text-2xl font-bold">Create Canvas</h3>
              <p className="text-slate-400 text-sm mt-1">Give your canvas a name to get started</p>
            </div>

            {createCanvasError && (
              <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {createCanvasError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Canvas Name</label>
                <input
                  type="text"
                  value={createCanvasName}
                  onChange={(e) => {
                    setCreateCanvasName(e.target.value);
                    if (createCanvasError) {
                      setCreateCanvasError('');
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCanvas();
                    }
                  }}
                  placeholder="Enter canvas name"
                  className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateCanvasModal(false);
                    setCreateCanvasName('');
                    setCreateCanvasError('');
                  }}
                  className="flex-1 rounded-lg border border-white/10 py-3 font-bold text-white transition-all hover:bg-white/5"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCanvas}
                  className="flex-1 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  disabled={!createCanvasName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
            <button
              onClick={() => {
                setShowRenameModal(false);
                setRenameCanvasId(null);
                setNewCanvasName('');
              }}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              type="button"
            >
              <span className="material-icons">close</span>
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <span className="material-icons">edit</span>
              </div>
              <h3 className="text-2xl font-bold">Rename Canvas</h3>
              <p className="text-slate-400 text-sm mt-1">Enter a new name for your canvas</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Canvas Name</label>
                <input
                  type="text"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="Enter canvas name"
                  className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRenameModal(false);
                    setRenameCanvasId(null);
                    setNewCanvasName('');
                  }}
                  className="flex-1 rounded-lg border border-white/10 py-3 font-bold text-white transition-all hover:bg-white/5"
                  type="button"
                  disabled={isOperating}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRenameCanvas(renameCanvasId, newCanvasName)}
                  className="flex-1 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  disabled={isOperating}
                >
                  {isOperating ? 'Renaming...' : 'Rename'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
            <button
              onClick={() => {
                setShowCreateFolderModal(false);
                setNewFolderName('');
              }}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              type="button"
            >
              <span className="material-icons">close</span>
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                <span className="material-icons">create_new_folder</span>
              </div>
              <h3 className="text-2xl font-bold">Create New Folder</h3>
              <p className="text-slate-400 text-sm mt-1">Enter a name for your new folder</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder();
                    }
                  }}
                  placeholder="Enter folder name"
                  className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 rounded-lg border border-white/10 py-3 font-bold text-white transition-all hover:bg-white/5"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 rounded-lg bg-indigo-600 py-3 font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  disabled={!newFolderName.trim()}
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRenameFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
            <button
              onClick={() => {
                setShowRenameFolderModal(false);
                setRenameFolderId(null);
                setNewFolderName('');
              }}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              type="button"
            >
              <span className="material-icons">close</span>
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <span className="material-icons">edit</span>
              </div>
              <h3 className="text-2xl font-bold">Rename Folder</h3>
              <p className="text-slate-400 text-sm mt-1">Enter a new name for your folder</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameFolder(renameFolderId, newFolderName);
                    }
                  }}
                  placeholder="Enter folder name"
                  className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRenameFolderModal(false);
                    setRenameFolderId(null);
                    setNewFolderName('');
                  }}
                  className="flex-1 rounded-lg border border-white/10 py-3 font-bold text-white transition-all hover:bg-white/5"
                  type="button"
                  disabled={isOperatingFolder}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRenameFolder(renameFolderId, newFolderName)}
                  className="flex-1 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  disabled={isOperatingFolder || !newFolderName.trim()}
                >
                  {isOperatingFolder ? 'Renaming...' : 'Rename'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && !isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-rose-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-500">
                <span className="material-icons">warning</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Account</h3>
                <p className="text-sm text-rose-400">This action is permanent.</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              You are about to permanently delete your account, all your canvases, folders, and meetings. 
              <strong> You cannot undo this action.</strong>
            </p>

            <form onSubmit={handleDeleteAccount}>
              <div className="space-y-2 mb-6">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Confirm Password</label>
                <input 
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#101922]/40 border border-[#2d3a4b] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-all placeholder:text-slate-600"
                  required
                  disabled={isDeleting}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isDeleting || !deletePassword}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Deleting...
                    </>
                  ) : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT DELETION LOADING OVERLAY */}
      {isDeleting && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-[#0f172a] px-12 py-12 shadow-2xl">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-rose-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-rose-500 animate-spin"></div>
            </div>
            <p className="text-sm font-semibold text-slate-100">Deleting your account...</p>
          </div>
        </div>
      )}
    </div>
  );
}