import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './meeting.css';
import Header from '../components/Meeting/Header';
import Footer from '../components/Meeting/Footer';
import Toolbar from '../components/Meeting/Toolbar';
import Canvas from '../components/Meeting/Canvas';
import Sidebar from '../components/Meeting/Sidebar';
import ToolSettings from '../components/Meeting/ToolSettings';
import UserNotification from '../components/Meeting/UserNotification';
import ScreenShareRequests from '../components/Meeting/ScreenShareRequests';
import Cursors from '../components/Collaboration/Cursors.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { useAudioStream } from '../hooks/useAudioStream.js';
import { meetingAPI } from '../services/api.js';

const getMediaStateFromStorage = (meetingDbId, userId, key, defaultValue) => {
  if (!meetingDbId || !userId) return defaultValue;
  const saved = sessionStorage.getItem(`meeting:${meetingDbId}:${userId}:${key}`);
  return saved !== null ? JSON.parse(saved) : defaultValue;
};

function Meeting() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState('selector');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarView, setSidebarView] = useState('members');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState(location.state?.status || 'pending');
  const [participants, setParticipants] = useState([]);
  const [meetingDbId, setMeetingDbId] = useState(location.state?.meetingDbId || sessionStorage.getItem('meetingDbId'));
  const userId = user?._id || user?.id;
  const [meetingId, setMeetingId] = useState(location.state?.meetingId || sessionStorage.getItem('meetingId') || '');
  const [meetingPassword, setMeetingPassword] = useState(
    location.state?.meetingPassword ? location.state.meetingPassword : (sessionStorage.getItem('meetingPassword') || '')
  );
  const [shareLink, setShareLink] = useState('');
  const _initialRole = location.state?.role || sessionStorage.getItem('meetingRole') || 'participant';
  const [effectiveRole, setEffectiveRole] = useState(_initialRole);
  const meetingRole = effectiveRole;
  const [meetingPermission, setMeetingPermission] = useState(
    location.state?.permission || sessionStorage.getItem('meetingPermission') || 'view'
  );
  
  
  const [localMedia, setLocalMedia] = useState(() => {
    const dbId = location.state?.meetingDbId || sessionStorage.getItem('meetingDbId');
    const uId = user?._id || user?.id;
    return {
      mic: getMediaStateFromStorage(dbId, uId, 'mic', location.state?.audioEnabled ?? true),
      video: getMediaStateFromStorage(dbId, uId, 'video', location.state?.videoEnabled ?? true)
    };
  });
  
  const [micPrompted, setMicPrompted] = useState(false);
  const [mediaStatusMap, setMediaStatusMap] = useState({});
  const refreshStorageKey = meetingDbId && userId ? `meetingRefresh:${meetingDbId}:${userId}` : null;
  const silentJoin = Boolean(refreshStorageKey && sessionStorage.getItem(refreshStorageKey) === '1');
  const meetingStartRef = useRef(Date.now());
  const [durationLabel, setDurationLabel] = useState('00:00:00');

  // Host settings state (persisted from DB, synced via socket)
  const [hostSettings, setHostSettings] = useState({
    isAllMuted: false,
    isAllVideoOff: false,
    isChatEnabled: true,
    isScreenRecordingAllowed: false
  });

useEffect(() => {
  if (!userId || !meetingDbId) return;
  
  const currentMic = JSON.stringify(localMedia.mic);
  const savedMic = sessionStorage.getItem(`meeting:${meetingDbId}:${userId}:mic`);
  
  // Only update if value changed to prevent render storms
  if (currentMic !== savedMic) {
    sessionStorage.setItem(`meeting:${meetingDbId}:${userId}:mic`, currentMic);
    sessionStorage.setItem(`meeting:${meetingDbId}:${userId}:video`, JSON.stringify(localMedia.video));
  }
}, [userId, meetingDbId, localMedia.mic, localMedia.video]);

  useEffect(() => {
    if (location.state?.meetingDbId) {
      // Store everything from location state
      sessionStorage.setItem('meetingDbId', location.state.meetingDbId);
      sessionStorage.setItem('meetingRole', location.state.role || 'participant');
      sessionStorage.setItem('meetingPermission', location.state.permission || 'view');
      setMeetingPermission(location.state.permission || 'view');
      
      if (location.state.meetingId) {
        sessionStorage.setItem('meetingId', location.state.meetingId);
        setMeetingId(location.state.meetingId);
      }
      
      if (location.state.meetingPassword) {
        sessionStorage.setItem('meetingPassword', location.state.meetingPassword);
        setMeetingPassword(location.state.meetingPassword);
      }
      
      setMeetingDbId(location.state.meetingDbId);
    }
  }, [location.state?.meetingDbId, location.state?.meetingId, location.state?.meetingPassword, location.state?.role, location.state?.permission]);

  useEffect(() => {
    if (!refreshStorageKey) return;
    const handleBeforeUnload = () => {
      sessionStorage.setItem(refreshStorageKey, '1');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [refreshStorageKey]);

  useEffect(() => {
    if (!refreshStorageKey) return;
    if (sessionStorage.getItem(refreshStorageKey)) {
      sessionStorage.removeItem(refreshStorageKey);
    }
  }, [refreshStorageKey]);

 useEffect(() => {
    if (!userId || !meetingDbId) return;
    
    const savedMic = sessionStorage.getItem(`meeting:${meetingDbId}:${userId}:mic`);
    const currentMicStr = JSON.stringify(localMedia.mic);
    
    // Only update if it actually changed to stop the render loop
    if (savedMic !== currentMicStr) {
      sessionStorage.setItem(`meeting:${meetingDbId}:${userId}:mic`, currentMicStr);
      sessionStorage.setItem(`meeting:${meetingDbId}:${userId}:video`, JSON.stringify(localMedia.video));
    }
  }, [userId, meetingDbId, localMedia.mic, localMedia.video]);

  // Update media status map
  // useEffect(() => {
  //   if (!userId) return;
  //   setMediaStatusMap((prev) => ({
  //     ...prev,
  //     [userId]: { mic: localMedia.mic, video: localMedia.video }
  //   }));
  // }, [userId, localMedia.mic, localMedia.video]);
  // Sync mediaStatusMap with both Local state and Remote participants
  useEffect(() => {
    setMediaStatusMap((prev) => {
      const newMap = { ...prev };
      
      // 1. Sync local user status
      if (userId) {
        newMap[userId] = { mic: localMedia.mic, video: localMedia.video };
      }

      // 2. Sync remote participants (prevent UI flickering for new joins)
      participants.forEach(p => {
        const id = p._id || p.id;
        if (!newMap[id]) {
          newMap[id] = { mic: true, video: true }; // Assume enabled until updated via socket
        }
      });

      return newMap;
    });
  }, [userId, localMedia.mic, localMedia.video, participants]);

  // Fetch meeting details to ensure we have meetingId
  useEffect(() => {
    const fetchMeetingInfo = async () => {
      try {
        if (!meetingDbId) return;
        
        const response = await meetingAPI.getDetails(meetingDbId);
        if (response.success && response.meeting?.meetingId && !meetingId) {
          setMeetingId(response.meeting.meetingId);
          sessionStorage.setItem('meetingId', response.meeting.meetingId);
        }
        if (response.success && response.meeting?.password && !meetingPassword) {
          setMeetingPassword(response.meeting.password);
          sessionStorage.setItem('meetingPassword', response.meeting.password);
        }
        if (response.success && response.meeting?.shareLink) {
          setShareLink(response.meeting.shareLink);
        }
        if (response.success && response.meeting?.host) {
          const hostId = response.meeting.host._id || response.meeting.host;
          const isHost = hostId.toString() === userId?.toString();
          if (isHost && effectiveRole !== 'host') {
            setEffectiveRole('host');
            sessionStorage.setItem('meetingRole', 'host');
            setMeetingPermission('edit');
            sessionStorage.setItem('meetingPermission', 'edit');
          }
        }
        if (response.success && response.meeting?.status) {
          setMeetingStatus(response.meeting.status);
          sessionStorage.setItem('meetingStatus', response.meeting.status);
        }
        // Load host settings from DB (persisted state for late joiners)
        if (response.success && response.meeting?.hostSettings) {
          setHostSettings(prev => ({
            ...prev,
            ...response.meeting.hostSettings
          }));
        }
      } catch (error) {
        console.error('Error fetching meeting details:', error);
      }
    };

    fetchMeetingInfo();
  }, [meetingDbId, meetingId]);

  useEffect(() => {
    if (!meetingDbId) return;
    const storageKey = `meetingStart:${meetingDbId}`;
    const storedStart = sessionStorage.getItem(storageKey);
    if (storedStart) {
      meetingStartRef.current = Number(storedStart);
    } else {
      const now = Date.now();
      meetingStartRef.current = now;
      sessionStorage.setItem(storageKey, String(now));
    }
  }, [meetingDbId]);

  const fetchParticipants = useCallback(async () => {
    try {
      if (!meetingDbId) return;
      const response = await meetingAPI.getDetails(meetingDbId);
      if (response.success && response.meeting?.participants) {
        const activeParticipants = response.meeting.participants.filter(
          (participant) => participant.isActive !== false
        );
        console.log(`📊 Fetched ${activeParticipants.length} participants from API, current userId=${userId}:`, 
          activeParticipants.map(p => ({ id: p._id || p.id, name: p.username })));
        setParticipants(activeParticipants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, [meetingDbId, userId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);


  useEffect(() => {
    const previousBackground = document.body.style.backgroundColor;
    const previousColor = document.body.style.color;
    document.body.style.backgroundColor = '#0a0a0c';
    document.body.style.color = '#cbd5e1';

    return () => {
      document.body.style.backgroundColor = previousBackground;
      document.body.style.color = previousColor;
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      const elapsedMs = Date.now() - meetingStartRef.current;
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const padded = (value) => String(value).padStart(2, '0');
      setDurationLabel(`${padded(hours)}:${padded(minutes)}:${padded(seconds)}`);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // --- State for Notifications ---
  const [notification, setNotification] = useState(null);
  const [notificationKey, setNotificationKey] = useState(0);

  // --- State for Canvas Elements & History (Undo/Redo) ---
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Lifted selection state
  const [selectedElementId, setSelectedElementId] = useState(null);

  // --- State for Persistent Color Palettes ---
  const [customBrushColors, setCustomBrushColors] = useState([
    '#3b82f6',
    '#10b981',
    '#ef4444',
    '#f59e0b',
    '#a855f7',
    '#ffffff'
  ]);
  const [customFillColors, setCustomFillColors] = useState([
    '#ffffff',
    '#94a3b8',
    '#0f172a',
    '#ef4444',
    '#f97316',
    '#fbbf24',
    '#10b981',
    '#14b8a6',
    '#3b82f6',
    '#6366f1',
    '#a855f7'
  ]);
  const [customNoteColors, setCustomNoteColors] = useState([
    '#fef08a',
    '#fbcfe8',
    '#bae6fd',
    '#bbf7d0',
    '#fed7aa'
  ]);

  // Shared state for drawing tools
  const [settings, setSettings] = useState({
    brushSize: 5,
    brushOpacity: 100,
    brushColor: '#3b82f6',
    brushStyle: 'edit',
    brushType: 'solid',
    eraserSize: 20,
    fillColor: 'transparent',
    fillOpacity: 100,
    strokeWidth: 4,
    strokeOpacity: 100,
    strokeStyle: 'solid',
    activeShape: 'rectangle',
    noteFillColor: '#fef08a',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center'
  });

  // --- Undo/Redo Logic ---

  const saveToHistory = useCallback(() => {
    setHistory((prev) => [...prev, elements]);
    setRedoStack([]); // Clear redo stack on new action
  }, [elements]);

  

  // --- Tool Logic ---

  const handleToolChange = (tool) => {
    if (activeTool === tool) {
      // Toggle settings visibility if clicking the currently active tool
      setIsSettingsVisible(!isSettingsVisible);
    } else {
      setActiveTool(tool);
      // Logic: Open settings for any new tool except Selector.
      // Selector should start closed to keep UI clean, unless user clicks canvas.
      if (tool !== 'selector') {
        setIsSettingsVisible(true);
      } else {
        setIsSettingsVisible(false);
      }
    }
  };

  const handleCanvasClick = () => {
    // Close settings immediately when clicking on the canvas
    setIsSettingsVisible(false);
  };

  // When selection changes, update the settings panel to reflect the selected object
  const handleSelectionChange = (id) => {
    setSelectedElementId(id);
    if (id) {
      const el = elements.find((e) => e.id === id);
      if (el) {
        // Update local settings to match selected element so the UI is in sync
        setSettings((prev) => ({
          ...prev,
          ...el.style
        }));
        // Note: We do NOT automatically open settings here anymore.
        // This prevents cards from popping up while moving elements.
        // The user must click the active tool icon to toggle settings.
      }
    } else {
      // Deselecting hides the settings
      setIsSettingsVisible(false);
    }
  };

  const updateSettings = (newSettings) => {
    // 1. Update global settings state
    setSettings((prev) => ({ ...prev, ...newSettings }));

    // 2. If an element is selected, update that element's style
    if (selectedElementId) {
      setElements((prevElements) =>
        prevElements.map((el) => {
          if (el.id === selectedElementId) {
            return {
              ...el,
              style: {
                ...el.style,
                ...newSettings
              }
            };
          }
          return el;
        })
      );
    }
  };

  // Calculate the effective tool to display in settings
  // If we are in selector mode and have an object selected, show that object's specific settings
  const getEffectiveSettingsTool = () => {
    if (activeTool !== 'selector') return activeTool;

    if (selectedElementId) {
      const el = elements.find((e) => e.id === selectedElementId);
      if (el) {
        if (el.type === 'sticky-note') return 'sticky-note';
        if (el.type === 'shape') return 'shapes';
        if (el.type === 'freehand') return 'brush';
      }
    }
    return activeTool;
  };

  const settingsTool = getEffectiveSettingsTool();

  const [cursorMap, setCursorMap] = useState({});
  const cursorThrottleRef = useRef(0);
  const canvasSyncTimerRef = useRef(null);
  const lastCanvasSyncRef = useRef(0);
  const pendingCanvasSyncRef = useRef(null);

  // Emoji reactions floating animation state
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  // Raise hand state
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  // Canvas lock / collaborative mode toggle
  const [isCollaborativeMode, setIsCollaborativeMode] = useState(false);

  // Screen sharing state
  const [screenSharer, setScreenSharer] = useState(null); // { userId, username } of current sharer
  const [isLocalScreenSharing, setIsLocalScreenSharing] = useState(false);
  const localScreenStreamRef = useRef(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);
  const screenSharePCsRef = useRef({}); // Dedicated peer connections for screen share
  const screenShareVideoRef = useRef(null);
  // Screen share permission request state
  const [screenShareRequests, setScreenShareRequests] = useState([]); // Host sees these: [{ userId, username }]
  const [isScreenSharePending, setIsScreenSharePending] = useState(false); // Requester waiting for approval
  const startScreenShareRef = useRef(null);

  // Screen recording state
  const [meetingRecorder, setMeetingRecorder] = useState(null); // { userId, username } of current recorder
  const [isLocalRecording, setIsLocalRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const recordingAudioCtxRef = useRef(null);
  const recordingMicStreamRef = useRef(null);

  const getCursorColor = useCallback((id) => {
    if (!id) return '#38bdf8';
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 75%, 60%)`;
  }, []);

  const handleLeaveMeeting = async () => {
    if (isLeaving || isEnding) return;
    setIsLeaving(true);
    try {
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop());
        recordingStreamRef.current = null;
      }
      // Cleanup screen share
      cleanupScreenSharePCs();
      stopScreenShareStream();
      // Cleanup audio streams
      cleanupAllPeerConnections();
      stopLocalStream();
      
      // Emit leave_meeting socket event first
      if (socket && meetingDbId) {
        socket.emit('leave_meeting', { meetingId: meetingDbId, silent: false });
      }
      
      // Call the backend to mark the participant as left
      if (meetingDbId) {
        await meetingAPI.leave(meetingDbId);
      }
    } catch (error) {
      console.error('Error leaving meeting:', error);
    } finally {
      window.setTimeout(() => {
        navigate('/dashboard');
      }, 1100);
    }
  };

  const handleEndMeeting = async () => {
    if (isEnding || isLeaving) return;
    if (meetingRole !== 'host') {
      alert('Only host can end the meeting');
      return;
    }

    setIsEnding(true);

    // ── STEP 1: Update the DB via API (MOST CRITICAL — must run first) ──
    // This MUST happen before any media cleanup because cleanup functions
    // can throw errors and would prevent the API call from ever executing.
    if (meetingDbId) {
      console.log('[Meeting] handleEndMeeting: calling API with meetingDbId:', meetingDbId);
      try {
        const endResponse = await meetingAPI.end(meetingDbId, { elements });
        console.log('[Meeting] handleEndMeeting: API response:', endResponse);
      } catch (apiErr) {
        console.error('[Meeting] handleEndMeeting: API call failed:', apiErr?.response?.data || apiErr.message);
      }
    } else {
      console.error('[Meeting] handleEndMeeting: meetingDbId is null/undefined!');
    }

    // ── STEP 2: Notify all participants via socket ──
    // The DB is already updated, so when participants land on Dashboard
    // and fetch meetings, they will see the ended meeting.
    try {
      if (socket && meetingDbId) {
        socket.emit('end_meeting', { meetingId: meetingDbId, meetingDbId });
      }
    } catch (socketErr) {
      console.error('[Meeting] handleEndMeeting: socket emit failed:', socketErr);
    }

    // ── STEP 3: Cleanup local media resources (safe to fail) ──
    // These only affect the local browser — they cannot impact the DB.
    // Each is wrapped individually so one failure doesn't block others.
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) { console.warn('[Meeting] cleanup: mediaRecorder stop failed:', e.message); }

    try {
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop());
        recordingStreamRef.current = null;
      }
    } catch (e) { console.warn('[Meeting] cleanup: recording stream failed:', e.message); }

    try { cleanupScreenSharePCs(); } catch (e) { console.warn('[Meeting] cleanup: screen share PCs failed:', e.message); }
    try { stopScreenShareStream(); } catch (e) { console.warn('[Meeting] cleanup: screen share stream failed:', e.message); }
    try { cleanupAllPeerConnections(); } catch (e) { console.warn('[Meeting] cleanup: peer connections failed:', e.message); }
    try { stopLocalStream(); } catch (e) { console.warn('[Meeting] cleanup: local stream failed:', e.message); }

    // ── STEP 4: Navigate to Dashboard ──
    window.setTimeout(() => {
      sessionStorage.setItem('meetingJustEnded', 'true');
      navigate('/dashboard', { state: { meetingJustEnded: true } });
    }, 1100);
  };

  const handleStartMeeting = async () => {
    if (meetingRole !== 'host') return;
    try {
      const response = await meetingAPI.start(meetingDbId);
      if (response.success) {
        setMeetingStatus('live');
        sessionStorage.setItem('meetingStatus', 'live');
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
      alert('Failed to start meeting');
    }
  };

  const socket = useSocket({
    meetingId: meetingDbId,
    userId: userId,
    username: user?.username || user?.name,
    silentJoin,
    refreshKey: refreshStorageKey
  });

  const {
    localVideoStream,
    remoteStreams,
    audioError,
    videoError,
    stopLocalStream,
    initializeVideoStream,
    stopVideoStream,
    setMicStatus,
    cleanupAllPeerConnections,
    handleParticipantLeft,
    initializeAudioConnections,
    remoteVideoStreams
  } = useAudioStream({
    micEnabled: localMedia.mic,
    videoEnabled: localMedia.video,
    meetingId: meetingDbId,
    userId,
    socket,
    participants
  });

  const emitLocalMediaStatus = useCallback(() => {
    if (!socket || !meetingDbId || !userId) return;
    socket.emit('media_status_updated', {
      meetingId: meetingDbId,
      userId,
      mic: localMedia.mic,
      video: localMedia.video,
      username: user?.username || user?.name || 'User'
    });
  }, [socket, meetingDbId, userId, localMedia.mic, localMedia.video, user]);

  const handleToggleMic = useCallback(async () => {
    // Block non-host from enabling mic when host has muted all
    if (!localMedia.mic && hostSettings.isAllMuted && meetingRole !== 'host') {
      setNotification({ message: 'Host has muted all participants', type: 'info' });
      setNotificationKey(prev => prev + 1);
      return;
    }
    // Simply toggle the mic state - useAudioStream will handle mic initialization/stopping
    setLocalMedia((prev) => {
      const next = { ...prev, mic: !prev.mic };
      if (userId) {
        setMediaStatusMap((map) => ({ ...map, [userId]: next }));
      }
      if (socket && meetingDbId && userId) {
        socket.emit('media_status_updated', {
          meetingId: meetingDbId,
          userId,
          mic: next.mic,
          video: next.video,
          username: user?.username || user?.name || 'User'
        });
      }
      // Notify audio hook of the change
      setMicStatus(next.mic);
      return next;
    });
  }, [socket, meetingDbId, userId, user, setMicStatus, localMedia.mic, hostSettings.isAllMuted, meetingRole]);

  const handleToggleVideo = useCallback(async () => {
    if (!userId) return;

    // Block non-host from enabling video when host has turned off all video
    if (!localMedia.video && hostSettings.isAllVideoOff && meetingRole !== 'host') {
      setNotification({ message: 'Host has turned off video for all participants', type: 'info' });
      setNotificationKey(prev => prev + 1);
      return;
    }

    if (!localMedia.video) {
      const stream = await initializeVideoStream();
      if (!stream) {
        const next = { ...localMedia, video: false };
        setLocalMedia(next);
        setMediaStatusMap((map) => ({ ...map, [userId]: next }));
        if (socket && meetingDbId) {
          socket.emit('media_status_updated', {
            meetingId: meetingDbId,
            userId,
            mic: next.mic,
            video: next.video,
            username: user?.username || user?.name || 'User'
          });
        }
        return;
      }

      const next = { ...localMedia, video: true };
      setLocalMedia(next);
      setMediaStatusMap((map) => ({ ...map, [userId]: next }));
      if (socket && meetingDbId) {
        socket.emit('media_status_updated', {
          meetingId: meetingDbId,
          userId,
          mic: next.mic,
          video: next.video,
          username: user?.username || user?.name || 'User'
        });
      }
      return;
    }

    const next = { ...localMedia, video: false };
    setLocalMedia(next);
    setMediaStatusMap((map) => ({ ...map, [userId]: next }));
    if (socket && meetingDbId) {
      socket.emit('media_status_updated', {
        meetingId: meetingDbId,
        userId,
        mic: next.mic,
        video: next.video,
        username: user?.username || user?.name || 'User'
      });
    }
    stopVideoStream();
  }, [initializeVideoStream, localMedia, meetingDbId, socket, stopVideoStream, user, userId, hostSettings.isAllVideoOff, meetingRole]);

  // Listen for real-time user join/leave notifications
  useEffect(() => {
    if (!socket) {
      console.log('❌ Socket not available yet');
      return;
    }

    console.log('✅ Socket connected, setting up listeners');

    // const handleUserJoined = (data) => {
    //   const username = data?.username || 'User';
    //   console.log(`🟢 User joined event received: ${username}`);
    //   setNotification({
    //     message: `${username} has joined meeting`,
    //     type: 'join'
    //   });
    //   setNotificationKey(prev => prev + 1); // Force re-render with new key
    //   fetchParticipants();
    //   emitLocalMediaStatus();
    // };
// Inside the socket useEffect, update the handleUserJoined function:
const handleUserJoined = (data) => {
  const username = data?.username || 'User';
  console.log(`🟢 User joined: ${username}`);
  
  // Existing logic
  setNotification({ message: `${username} has joined meeting`, type: 'join' });
  setNotificationKey(prev => prev + 1);
  fetchParticipants();

  // ADD THIS: Specifically tell the NEW user your current media status
  if (socket && data.userId) {
    socket.emit('media_status_updated', {
      meetingId: meetingDbId,
      to: data.userId, // Targeted to the joiner
      userId,
      mic: localMedia.mic,
      video: localMedia.video,
      username: user?.username || user?.name || 'User'
    });
  }
};
    const handleUserLeft = (data) => {
      const username = data?.username || 'User';
      console.log(`🔴 User left event received: ${username}`);
      setNotification({
        message: `${username} left the meeting`,
        type: 'leave'
      });
      setNotificationKey(prev => prev + 1); // Force re-render with new key
      fetchParticipants();
      if (data?.userId) {
        setCursorMap((prev) => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
        setMediaStatusMap((prev) => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
        // Clean up raised hand for departed user
        setRaisedHands((prev) => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
        // Clean up audio connection with departed user
        handleParticipantLeft(data.userId);
      }
    };

    const handleMeetingEnded = () => {
      console.log(`🔴 Meeting ended event received`);
      if (!isEnding) {
        setIsEnding(true);
      }

      // Cleanup media streams and peer connections for all participants
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(t => t.stop());
          recordingStreamRef.current = null;
        }
        cleanupAllPeerConnections();
        stopLocalStream();
      } catch (err) {
        console.error('Cleanup error on meeting ended:', err);
      }

      setNotification({
        message: 'Host has ended the meeting',
        type: 'end'
      });
      setNotificationKey((prev) => prev + 1);
      setTimeout(() => {
        sessionStorage.setItem('meetingJustEnded', 'true');
        navigate('/dashboard', { state: { meetingJustEnded: true } });
      }, 1100);
    };

    const handleEditPermissionUpdated = (data) => {
      if (!data) return;
      const currentUserId = user?._id || user?.id;

      setParticipants((prev) =>
        prev.map((participant) =>
          participant._id === data.userId
            ? { ...participant, permission: data.permission }
            : participant
        )
      );

      if (data.permission !== 'edit') {
        setCursorMap((prev) => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
      }

      if (data.userId === currentUserId) {
        setMeetingPermission(data.permission || 'view');
        sessionStorage.setItem('meetingPermission', data.permission || 'view');
        setNotification({
          message: data.permission === 'edit' ? 'Editing enabled by host' : 'Editing disabled by host',
          type: 'info'
        });
        setNotificationKey((prev) => prev + 1);
      }
    };

    const handleCanvasLocked = (data) => {
      const hostName = data?.username || 'Host';
      setNotification({
        message: `${hostName} locked the canvas`,
        type: 'info'
      });
      setNotificationKey((prev) => prev + 1);
    };

    const handleCanvasStateUpdated = (data) => {
      if (!data?.elements) return;
      setElements(data.elements);
    };

    const handleCanvasStateSnapshot = (data) => {
      if (!data?.elements) return;
      setElements(data.elements);
    };

    const handleMediaStatusUpdated = (data) => {
      if (!data?.userId) return;
      setMediaStatusMap((prev) => ({
        ...prev,
        [data.userId]: {
          mic: data.mic ?? true,
          video: data.video ?? true
        }
      }));
    };

    const handleCursorMove = (data) => {
      if (!data?.userId || !data?.username) return;
      if (data.userId === userId) return;
      setCursorMap((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          username: data.username,
          x: data.x,
          y: data.y,
          color: getCursorColor(data.userId),
          updatedAt: Date.now()
        }
      }));
    };

    const handleCursorLeave = (data) => {
      if (!data?.userId) return;
      setCursorMap((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };

    const handleEmojiReaction = (data) => {
      if (!data?.emoji) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const left = 10 + Math.random() * 80; // random horizontal position 10%-90%
      setFloatingEmojis(prev => [...prev, { id, emoji: data.emoji, left, username: data.username }]);
      // Auto-remove after animation completes
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== id));
      }, 3000);
    };

    const handleRaiseHand = (data) => {
      if (!data?.userId) return;
      setRaisedHands(prev => {
        if (data.raised) {
          return { ...prev, [data.userId]: data.username || 'User' };
        } else {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        }
      });
    };

    const handleHostSettingsUpdated = (data) => {
      if (!data) return;
      setHostSettings(prev => ({
        ...prev,
        ...data
      }));

      // Enforce mute-all on non-host participants
      if (data.isAllMuted === true && meetingRole !== 'host') {
        setLocalMedia(prev => {
          if (prev.mic) {
            // Force mic off
            const next = { ...prev, mic: false };
            if (userId) {
              setMediaStatusMap(map => ({ ...map, [userId]: next }));
            }
            if (socket && meetingDbId && userId) {
              socket.emit('media_status_updated', {
                meetingId: meetingDbId,
                userId,
                mic: false,
                video: next.video,
                username: user?.username || user?.name || 'User'
              });
            }
            setMicStatus(false);
            return next;
          }
          return prev;
        });
      }

      // Enforce video-off on non-host participants
      if (data.isAllVideoOff === true && meetingRole !== 'host') {
        setLocalMedia(prev => {
          if (prev.video) {
            const next = { ...prev, video: false };
            if (userId) {
              setMediaStatusMap(map => ({ ...map, [userId]: next }));
            }
            if (socket && meetingDbId && userId) {
              socket.emit('media_status_updated', {
                meetingId: meetingDbId,
                userId,
                mic: next.mic,
                video: false,
                username: user?.username || user?.name || 'User'
              });
            }
            stopVideoStream();
            return next;
          }
          return prev;
        });
      }

      // Show specific flash messages per action for NON-HOST members
      if (meetingRole !== 'host') {
        if (typeof data.isAllMuted === 'boolean') {
          setNotification({
            message: data.isAllMuted ? 'Host has muted all participants' : 'Host has unmuted all participants',
            type: 'info'
          });
          setNotificationKey(prev => prev + 1);
        }
        if (typeof data.isAllVideoOff === 'boolean') {
          setNotification({
            message: data.isAllVideoOff ? 'Host has turned off all video' : 'Host has enabled video for all',
            type: 'info'
          });
          setNotificationKey(prev => prev + 1);
        }
        if (typeof data.isChatEnabled === 'boolean') {
          setNotification({
            message: data.isChatEnabled ? 'Host has enabled chat' : 'Host has disabled chat',
            type: 'info'
          });
          setNotificationKey(prev => prev + 1);
        }
        if (typeof data.isScreenRecordingAllowed === 'boolean') {
          setNotification({
            message: data.isScreenRecordingAllowed ? 'Host has enabled screen recording' : 'Host has disabled screen recording',
            type: 'info'
          });
          setNotificationKey(prev => prev + 1);
        }
      }
    };

    // --- Recording socket event handlers ---
    const handleRecordingStarted = (data) => {
      // data: { userId, username }
      setMeetingRecorder({ userId: data.userId, username: data.username });
      if (data.userId !== userId) {
        setNotification({ message: `${data.username} started recording`, type: 'info' });
        setNotificationKey(prev => prev + 1);
      }
    };

    const handleRecordingStopped = (data) => {
      setMeetingRecorder(null);
      if (data.userId !== userId) {
        setNotification({ message: 'Recording has stopped', type: 'info' });
        setNotificationKey(prev => prev + 1);
      }
    };

    const handleRecordingDenied = (data) => {
      setNotification({ message: data.reason || 'Cannot start recording', type: 'leave' });
      setNotificationKey(prev => prev + 1);
    };

    const handleRecordingForceStopped = () => {
      // Host disabled recording — force stop our local recorder if we are recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop());
        recordingStreamRef.current = null;
      }
      setIsLocalRecording(false);
      setMeetingRecorder(null);
      recordedChunksRef.current = [];
      setNotification({ message: 'Host has disabled screen recording. Your recording was stopped.', type: 'leave' });
      setNotificationKey(prev => prev + 1);
    };

    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('meeting_ended', handleMeetingEnded);
    socket.on('edit_permission_updated', handleEditPermissionUpdated);
    socket.on('canvas_locked', handleCanvasLocked);
    socket.on('canvas_state_updated', handleCanvasStateUpdated);
    socket.on('canvas_state_snapshot', handleCanvasStateSnapshot);
    socket.on('media_status_updated', handleMediaStatusUpdated);
    socket.on('cursor_move', handleCursorMove);
    socket.on('cursor_leave', handleCursorLeave);
    socket.on('host_settings_updated', handleHostSettingsUpdated);
    socket.on('emoji_reaction', handleEmojiReaction);
    socket.on('raise_hand', handleRaiseHand);
    socket.on('recording_started', handleRecordingStarted);
    socket.on('recording_stopped', handleRecordingStopped);
    socket.on('recording_denied', handleRecordingDenied);
    socket.on('recording_force_stopped', handleRecordingForceStopped);

    console.log('✅ Event listeners attached');

    return () => {
      console.log('🧹 Cleaning up listeners');
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('meeting_ended', handleMeetingEnded);
      socket.off('edit_permission_updated', handleEditPermissionUpdated);
      socket.off('canvas_locked', handleCanvasLocked);
      socket.off('canvas_state_updated', handleCanvasStateUpdated);
      socket.off('canvas_state_snapshot', handleCanvasStateSnapshot);
      socket.off('media_status_updated', handleMediaStatusUpdated);
      socket.off('cursor_move', handleCursorMove);
      socket.off('cursor_leave', handleCursorLeave);
      socket.off('host_settings_updated', handleHostSettingsUpdated);
      socket.off('emoji_reaction', handleEmojiReaction);
      socket.off('raise_hand', handleRaiseHand);
      socket.off('recording_started', handleRecordingStarted);
      socket.off('recording_stopped', handleRecordingStopped);
      socket.off('recording_denied', handleRecordingDenied);
      socket.off('recording_force_stopped', handleRecordingForceStopped);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    emitLocalMediaStatus();
  }, [socket, emitLocalMediaStatus]);

  useEffect(() => {
    if (!socket || !meetingDbId) return;
    socket.emit('request_canvas_state', { meetingId: meetingDbId });
    return () => {
      if (canvasSyncTimerRef.current) {
        window.clearTimeout(canvasSyncTimerRef.current);
      }
    };
  }, [socket, meetingDbId]);

  // Initialize audio stream on socket connection and create peer connections
  useEffect(() => {
    if (!socket || !meetingDbId) return;

    return () => {
      cleanupAllPeerConnections();
      stopLocalStream();
    };
  }, [socket, meetingDbId, stopLocalStream, cleanupAllPeerConnections]);

  // Auto-initialize audio connections when participants update
  // useEffect(() => {
  //   if (!socket || !meetingDbId) {
  //     console.log(`⏭️ Skipping peer init: socket=${!!socket}, meetingDbId=${!!meetingDbId}`);
  //     return;
  //   }

  //   console.log(`🔍 Current userId: ${userId}, Participants:`, participants.map(p => ({_id: p._id, username: p.username})));
    
  //   const otherParticipants = participants.filter(p => {
  //     const participantId = p._id || p.id;
  //     const isOthers = participantId !== userId;
  //     const isActive = p.isActive !== false;
  //     console.log(`  - Checking ${p.username} (id=${participantId}): isOthers=${isOthers}, isActive=${isActive}`);
  //     return isOthers && isActive;
  //   });
    
  //   if (otherParticipants.length === 0) {
  //     console.log(`⏭️ No other participants in meeting (total=${participants.length}, userId=${userId})`);
  //     return;
  //   }

  //   console.log(`🔄 Participants updated (${otherParticipants.length} others), initializing peer connections`);
  //   initializeAudioConnections();
  // }, [participants, socket, meetingDbId, userId, initializeAudioConnections]);

  // Optimized peer initialization with a settling delay
  useEffect(() => {
    if (!socket || !meetingDbId || participants.length === 0) return;

    const others = participants.filter(p => {
      const pId = p._id || p.id;
      return pId !== userId && p.isActive !== false;
    });
    
    if (others.length > 0) {
      // Delay allows signaling handlers to stabilize after a user joins/refreshes
      const timer = setTimeout(() => {
        console.log(`🚀 Initializing audio connections for ${others.length} peers`);
        initializeAudioConnections();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [participants, socket, meetingDbId, userId, initializeAudioConnections]);

  const canEdit = meetingPermission === 'edit' || meetingRole === 'host';

  const emitCanvasState = useCallback((nextElements) => {
    if (!socket || !meetingDbId || !canEdit) return;
    pendingCanvasSyncRef.current = nextElements;

    if (canvasSyncTimerRef.current) return;

    const now = Date.now();
    const elapsed = now - lastCanvasSyncRef.current;
    const delay = elapsed >= 60 ? 0 : 60 - elapsed;

    canvasSyncTimerRef.current = window.setTimeout(() => {
      const payload = pendingCanvasSyncRef.current;
      pendingCanvasSyncRef.current = null;
      canvasSyncTimerRef.current = null;
      lastCanvasSyncRef.current = Date.now();
      if (payload) {
        socket.emit('canvas_state_updated', {
          meetingId: meetingDbId,
          elements: payload
        });
      }
    }, delay);
  }, [socket, meetingDbId, canEdit]);

  const handleElementsChange = useCallback((newElements) => {
    setElements(newElements);
    emitCanvasState(newElements);
  }, [emitCanvasState]);

  const applyElementsState = useCallback((nextElements) => {
    setElements(nextElements);
    emitCanvasState(nextElements);
  }, [emitCanvasState]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setRedoStack((prev) => [elements, ...prev]);
    applyElementsState(previousState);
    setHistory((prev) => prev.slice(0, -1));
  }, [elements, history, applyElementsState]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setHistory((prev) => [...prev, elements]);
    applyElementsState(nextState);
    setRedoStack((prev) => prev.slice(1));
  }, [elements, redoStack, applyElementsState]);

  const handleCursorMove = useCallback((coords) => {
    if (!socket || !meetingDbId || !canEdit) return;
    const now = Date.now();
    if (now - cursorThrottleRef.current < 50) return;
    cursorThrottleRef.current = now;
    socket.emit('cursor_move', {
      meetingId: meetingDbId,
      userId: userId,
      username: user?.username || user?.name || 'User',
      x: coords.x,
      y: coords.y
    });
  }, [socket, meetingDbId, canEdit, userId, user]);

  const handleCursorLeave = useCallback(() => {
    if (!socket || !meetingDbId || !userId || !canEdit) return;
    socket.emit('cursor_leave', {
      meetingId: meetingDbId,
      userId: userId
    });
  }, [socket, meetingDbId, userId, canEdit]);

  const editableIds = new Set(
    participants
      .filter((participant) => participant.role === 'host' || participant.permission === 'edit')
      .map((participant) => participant._id)
  );
  const cursorList = Object.values(cursorMap).filter((cursor) => editableIds.has(cursor.userId));

  const handleToggleEditPermission = async (targetUserId, nextPermission) => {
    if (meetingRole !== 'host' || !meetingDbId) return;
    try {
      await meetingAPI.updatePermission(meetingDbId, targetUserId, nextPermission);
      if (socket) {
        socket.emit('edit_permission_updated', {
          meetingId: meetingDbId,
          userId: targetUserId,
          permission: nextPermission
        });
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      setNotification({
        message: 'Failed to update permission',
        type: 'leave'
      });
      setNotificationKey((prev) => prev + 1);
    }
  };

  const handleLockCanvas = async () => {
    if (meetingRole !== 'host' || !meetingDbId) return;
    const targets = participants.filter((participant) => participant.role !== 'host');

    try {
      await Promise.all(
        targets.map((participant) =>
          meetingAPI.updatePermission(meetingDbId, participant._id, 'view')
        )
      );

      setParticipants((prev) =>
        prev.map((participant) =>
          participant.role === 'host'
            ? participant
            : { ...participant, permission: 'view' }
        )
      );

      if (socket) {
        targets.forEach((participant) => {
          socket.emit('edit_permission_updated', {
            meetingId: meetingDbId,
            userId: participant._id,
            permission: 'view'
          });
        });
        socket.emit('canvas_locked', {
          meetingId: meetingDbId,
          username: user?.username || user?.name || 'Host'
        });
      }

      setNotification({
        message: 'You locked the canvas for everyone',
        type: 'info'
      });
      setNotificationKey((prev) => prev + 1);
      setIsCollaborativeMode(false);
    } catch (error) {
      console.error('Error locking canvas:', error);
      setNotification({
        message: 'Failed to lock canvas',
        type: 'leave'
      });
      setNotificationKey((prev) => prev + 1);
    }
  };

  const handleEnableCollaboration = async () => {
    if (meetingRole !== 'host' || !meetingDbId) return;
    const targets = participants.filter((participant) => participant.role !== 'host');

    try {
      await Promise.all(
        targets.map((participant) =>
          meetingAPI.updatePermission(meetingDbId, participant._id, 'edit')
        )
      );

      setParticipants((prev) =>
        prev.map((participant) =>
          participant.role === 'host'
            ? participant
            : { ...participant, permission: 'edit' }
        )
      );

      if (socket) {
        targets.forEach((participant) => {
          socket.emit('edit_permission_updated', {
            meetingId: meetingDbId,
            userId: participant._id,
            permission: 'edit'
          });
        });
      }

      setNotification({
        message: 'Collaborative mode enabled for everyone',
        type: 'info'
      });
      setNotificationKey((prev) => prev + 1);
      setIsCollaborativeMode(true);
    } catch (error) {
      console.error('Error enabling collaboration:', error);
      setNotification({
        message: 'Failed to enable collaborative mode',
        type: 'leave'
      });
      setNotificationKey((prev) => prev + 1);
    }
  };

  const headerParticipants = participants.length > 0
    ? participants.filter(p => p.isActive !== false)
    : [];

  // --- Import Image ---
  const importFileRef = useRef(null);
  const canvasRef = useRef(null);

  const handleImportImage = useCallback(() => {
    if (importFileRef.current) importFileRef.current.click();
  }, []);

  const handleImageFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so same file can be re-imported
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new window.Image();
      img.onload = () => {
        // Scale image so the longest side is max 400px
        const maxSize = 400;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const newElement = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          src: dataUrl,
          x: 100,
          y: 100,
          width: w,
          height: h,
          style: {}
        };
        setElements(prev => {
          const next = [...prev, newElement];
          emitCanvasState(next);
          return next;
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [emitCanvasState]);

  const handleExportCanvas = useCallback(() => {
    if (canvasRef.current?.exportCanvas) {
      canvasRef.current.exportCanvas();
    }
  }, []);

  const handleEmojiReactionEmit = useCallback((emoji) => {
    if (!socket || !meetingDbId) return;
    socket.emit('emoji_reaction', {
      meetingId: meetingDbId,
      userId,
      username: user?.username || user?.name || 'User',
      emoji
    });
  }, [socket, meetingDbId, userId, user]);

  const handleRaiseHandToggle = useCallback(() => {
    if (!socket || !meetingDbId) return;
    const nextRaised = !isHandRaised;
    setIsHandRaised(nextRaised);
    socket.emit('raise_hand', {
      meetingId: meetingDbId,
      userId,
      username: user?.username || user?.name || 'User',
      raised: nextRaised
    });
  }, [socket, meetingDbId, userId, user, isHandRaised]);

  // ===================================================================
  // SCREEN SHARING LOGIC
  // ===================================================================

  const ICE_SERVERS = [
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  // Cleanup all screen share peer connections
  const cleanupScreenSharePCs = useCallback(() => {
    Object.keys(screenSharePCsRef.current).forEach((id) => {
      const pc = screenSharePCsRef.current[id];
      if (pc) pc.close();
    });
    screenSharePCsRef.current = {};
  }, []);

  // Stop local screen share stream
  const stopScreenShareStream = useCallback(() => {
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((t) => t.stop());
      localScreenStreamRef.current = null;
    }
  }, []);

  // Create a screen share peer connection (sharer → viewer)
  const createScreenSharePC = useCallback(
    (targetId, stream) => {
      if (screenSharePCsRef.current[targetId]) return screenSharePCsRef.current[targetId];

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      screenSharePCsRef.current[targetId] = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate && socket) {
          socket.emit('screen_share_ice_candidate', {
            meetingId: meetingDbId,
            from: userId,
            to: targetId,
            candidate: e.candidate
          });
        }
      };

      // Add screen share tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Create and send offer
      (async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('screen_share_offer', {
            meetingId: meetingDbId,
            from: userId,
            to: targetId,
            offer
          });
        } catch (err) {
          console.error('Screen share offer error:', err);
        }
      })();

      return pc;
    },
    [socket, meetingDbId, userId]
  );

  // Actually start sharing screen (called directly by host, or after approval for non-host)
  const startScreenShare = useCallback(async () => {
    if (!socket || !meetingDbId) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080, frameRate: 30 },
        audio: false
      });

      localScreenStreamRef.current = stream;
      setIsLocalScreenSharing(true);
      setIsScreenSharePending(false);

      // Notify server
      socket.emit('screen_share_start', {
        meetingId: meetingDbId,
        userId,
        username: user?.username || user?.name || 'User'
      });

      // When browser's native "Stop sharing" button is clicked
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        cleanupScreenSharePCs();
        stopScreenShareStream();
        setIsLocalScreenSharing(false);
        setScreenSharer(null);
        setRemoteScreenStream(null);
        if (socket && meetingDbId) {
          socket.emit('screen_share_stop', { meetingId: meetingDbId, userId });
        }
      });

      // Create peer connections to all other participants
      const others = participants.filter((p) => (p._id || p.id) !== userId);
      for (const p of others) {
        createScreenSharePC(p._id || p.id, stream);
      }
    } catch (err) {
      // User cancelled the screen picker — reset pending state
      setIsScreenSharePending(false);
      console.log('Screen share cancelled or failed:', err.message);
    }
  }, [
    socket,
    meetingDbId,
    userId,
    user,
    participants,
    createScreenSharePC,
    cleanupScreenSharePCs,
    stopScreenShareStream
  ]);

  // Keep ref in sync so socket handlers avoid stale closures
  useEffect(() => {
    startScreenShareRef.current = startScreenShare;
  }, [startScreenShare]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!socket || !meetingDbId) return;

    if (isLocalScreenSharing) {
      // STOP sharing
      cleanupScreenSharePCs();
      stopScreenShareStream();
      setIsLocalScreenSharing(false);
      setScreenSharer(null);
      setRemoteScreenStream(null);
      socket.emit('screen_share_stop', { meetingId: meetingDbId, userId });
      return;
    }

    // If already waiting for approval, cancel the request
    if (isScreenSharePending) {
      setIsScreenSharePending(false);
      return;
    }

    // Someone else is sharing — block
    if (screenSharer && screenSharer.userId !== userId) return;

    // HOST: share directly
    if (meetingRole === 'host') {
      await startScreenShare();
      return;
    }

    // NON-HOST: send permission request to host
    const host = participants.find((p) => p.role === 'host');
    if (!host) {
      setNotification({ message: 'Host not found', type: 'leave' });
      setNotificationKey((prev) => prev + 1);
      return;
    }

    setIsScreenSharePending(true);
    socket.emit('screen_share_request', {
      meetingId: meetingDbId,
      userId,
      username: user?.username || user?.name || 'User',
      hostUserId: host._id || host.id
    });
  }, [
    socket,
    meetingDbId,
    userId,
    user,
    meetingRole,
    isLocalScreenSharing,
    isScreenSharePending,
    screenSharer,
    participants,
    startScreenShare,
    cleanupScreenSharePCs,
    stopScreenShareStream
  ]);

  // Host actions: approve/decline screen share request
  const handleApproveScreenShare = useCallback((requestUserId) => {
    if (!socket || !meetingDbId) return;
    socket.emit('screen_share_approve', {
      meetingId: meetingDbId,
      userId: requestUserId
    });
    // Clear all requests from local state (server auto-declines others)
    setScreenShareRequests([]);
  }, [socket, meetingDbId]);

  const handleDeclineScreenShare = useCallback((requestUserId) => {
    if (!socket || !meetingDbId) return;
    socket.emit('screen_share_decline', {
      meetingId: meetingDbId,
      userId: requestUserId
    });
    // Remove this request from local state
    setScreenShareRequests((prev) => prev.filter((r) => r.userId !== requestUserId));
  }, [socket, meetingDbId]);

  // Handle incoming screen share WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    const handleScreenShareOffer = async (data) => {
      const { from, offer } = data;
      if (from === userId) return;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      screenSharePCsRef.current[from] = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('screen_share_ice_candidate', {
            meetingId: meetingDbId,
            from: userId,
            to: from,
            candidate: e.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteScreenStream(remoteStream);
        // If track ends, clear remote stream
        remoteStream.getVideoTracks().forEach((track) => {
          track.onended = () => setRemoteScreenStream(null);
        });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('screen_share_answer', {
        meetingId: meetingDbId,
        from: userId,
        to: from,
        answer
      });
    };

    const handleScreenShareAnswer = async (data) => {
      const { from, answer } = data;
      const pc = screenSharePCsRef.current[from];
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleScreenShareICE = async (data) => {
      const { from, candidate } = data;
      const pc = screenSharePCsRef.current[from];
      if (!pc) return;
      if (!pc.remoteDescription?.type) {
        setTimeout(() => handleScreenShareICE(data), 250);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        // Ignore — connection may have closed
      }
    };

    const handleScreenShareStarted = (data) => {
      setScreenSharer({ userId: data.userId, username: data.username });
      // Clear any pending requests (host side) since someone is now sharing
      setScreenShareRequests([]);
      // Clear pending state (requester side) — sharing has started
      setIsScreenSharePending(false);
    };

    const handleScreenShareStopped = (data) => {
      setScreenSharer(null);
      setRemoteScreenStream(null);
      // Clean up screen share peer connections
      if (data?.userId) {
        const pc = screenSharePCsRef.current[data.userId];
        if (pc) {
          pc.close();
          delete screenSharePCsRef.current[data.userId];
        }
      }
      // If we were the sharer and got stopped externally
      if (data?.userId === userId) {
        stopScreenShareStream();
        setIsLocalScreenSharing(false);
        cleanupScreenSharePCs();
      }
    };

    const handleScreenShareDenied = (data) => {
      setNotification({
        message: data?.reason || 'Screen share denied',
        type: 'leave'
      });
      setNotificationKey((prev) => prev + 1);
    };

    // Permission request flow handlers
    const handleScreenShareRequest = (data) => {
      // Host receives this: show the request UI
      setScreenShareRequests((prev) => {
        // Prevent duplicates
        if (prev.some((r) => r.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, username: data.username }];
      });
    };

    const handleScreenShareApproved = async () => {
      // Requester receives this: start sharing
      setNotification({ message: 'Host allowed you to share your screen', type: 'join' });
      setNotificationKey((prev) => prev + 1);
      // Trigger screen share
      startScreenShareRef.current();
    };

    const handleScreenShareRequestDeclined = (data) => {
      // Requester receives this: show declined message
      setIsScreenSharePending(false);
      setNotification({
        message: data?.reason || 'Host declined your request',
        type: 'leave'
      });
      setNotificationKey((prev) => prev + 1);
    };

    const handleScreenShareRequestWithdrawn = (data) => {
      // Host receives this: remove the request from the list (user left/disconnected)
      if (data?.userId) {
        setScreenShareRequests((prev) => prev.filter((r) => r.userId !== data.userId));
      }
    };

    socket.on('screen_share_offer', handleScreenShareOffer);
    socket.on('screen_share_answer', handleScreenShareAnswer);
    socket.on('screen_share_ice_candidate', handleScreenShareICE);
    socket.on('screen_share_started', handleScreenShareStarted);
    socket.on('screen_share_stopped', handleScreenShareStopped);
    socket.on('screen_share_denied', handleScreenShareDenied);
    socket.on('screen_share_request', handleScreenShareRequest);
    socket.on('screen_share_approved', handleScreenShareApproved);
    socket.on('screen_share_request_declined', handleScreenShareRequestDeclined);
    socket.on('screen_share_request_withdrawn', handleScreenShareRequestWithdrawn);

    return () => {
      socket.off('screen_share_offer', handleScreenShareOffer);
      socket.off('screen_share_answer', handleScreenShareAnswer);
      socket.off('screen_share_ice_candidate', handleScreenShareICE);
      socket.off('screen_share_started', handleScreenShareStarted);
      socket.off('screen_share_stopped', handleScreenShareStopped);
      socket.off('screen_share_denied', handleScreenShareDenied);
      socket.off('screen_share_request', handleScreenShareRequest);
      socket.off('screen_share_approved', handleScreenShareApproved);
      socket.off('screen_share_request_declined', handleScreenShareRequestDeclined);
      socket.off('screen_share_request_withdrawn', handleScreenShareRequestWithdrawn);
    };
  }, [socket, meetingDbId, userId, cleanupScreenSharePCs, stopScreenShareStream]);

  // When a new user joins while someone is screen-sharing, send them the stream
  useEffect(() => {
    if (!isLocalScreenSharing || !localScreenStreamRef.current) return;
    const stream = localScreenStreamRef.current;
    const others = participants.filter((p) => (p._id || p.id) !== userId);
    for (const p of others) {
      const pid = p._id || p.id;
      if (!screenSharePCsRef.current[pid]) {
        createScreenSharePC(pid, stream);
      }
    }
  }, [participants, isLocalScreenSharing, userId, createScreenSharePC]);

  const handleUpdateHostSettings = useCallback(async (settingsUpdate) => {
    if (meetingRole !== 'host' || !meetingDbId) return;
    try {
      const newSettings = { ...hostSettings, ...settingsUpdate };
      
      // Optimistic UI update
      setHostSettings(newSettings);

      // Persist to DB
      await meetingAPI.updateHostSettings(meetingDbId, settingsUpdate);

      // Emit only the changed fields via socket for real-time broadcast
      if (socket) {
        socket.emit('host_settings_updated', {
          meetingId: meetingDbId,
          ...settingsUpdate
        });

        // If host is disabling screen recording, force-stop any active recorder
        if (settingsUpdate.isScreenRecordingAllowed === false) {
          socket.emit('recording_force_stop', { meetingId: meetingDbId });
        }
      }

      // Show notification to host
      const messages = [];
      if (typeof settingsUpdate.isAllMuted === 'boolean') {
        messages.push(settingsUpdate.isAllMuted ? 'All participants muted' : 'All participants unmuted');
      }
      if (typeof settingsUpdate.isAllVideoOff === 'boolean') {
        messages.push(settingsUpdate.isAllVideoOff ? 'All video turned off' : 'Video enabled for all');
      }
      if (typeof settingsUpdate.isChatEnabled === 'boolean') {
        messages.push(settingsUpdate.isChatEnabled ? 'Chat enabled' : 'Chat disabled');
      }
      if (typeof settingsUpdate.isScreenRecordingAllowed === 'boolean') {
        messages.push(settingsUpdate.isScreenRecordingAllowed ? 'Screen recording enabled' : 'Screen recording disabled');
      }
      if (messages.length > 0) {
        setNotification({ message: messages.join('. '), type: 'info' });
        setNotificationKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating host settings:', error);
      setNotification({ message: 'Failed to update settings', type: 'leave' });
      setNotificationKey(prev => prev + 1);
    }
  }, [meetingRole, meetingDbId, hostSettings, socket]);

  // Show audio error if microphone access fails
  useEffect(() => {
    if (audioError) {
      setNotification({
        message: audioError,
        type: 'leave'
      });
      setNotificationKey((prev) => prev + 1);
    }
  }, [audioError]);

  useEffect(() => {
    if (videoError) {
      setNotification({
        message: videoError,
        type: 'leave'
      });
      setNotificationKey((prev) => prev + 1);
    }
  }, [videoError]);

  // --- Screen Recording Logic ---
  const handleToggleRecording = useCallback(async () => {
    // If currently recording, stop
    if (isLocalRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    // Check if recording is allowed
    if (!hostSettings.isScreenRecordingAllowed) {
      setNotification({ message: 'Screen recording is not enabled by the host', type: 'leave' });
      setNotificationKey(prev => prev + 1);
      return;
    }

    // Check if someone else is already recording
    if (meetingRecorder && meetingRecorder.userId !== userId) {
      setNotification({ message: `${meetingRecorder.username} is already recording`, type: 'leave' });
      setNotificationKey(prev => prev + 1);
      return;
    }

    try {
      // Capture the current browser tab (auto-select, no picker dialog)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser', frameRate: { ideal: 30 } },
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
        monitorTypeSurfaces: 'exclude'
      });

      // Request a dedicated microphone stream for recording (independent of meeting mic toggle)
      let recordingMicStream = null;
      try {
        recordingMicStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (micErr) {
        console.warn('Could not get mic for recording, continuing without local mic:', micErr);
      }

      // Mix all audio sources (display audio + dedicated mic + remote participants)
      const audioCtx = new AudioContext();
      // Resume AudioContext — browsers suspend it by default
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      recordingAudioCtxRef.current = audioCtx;
      const destination = audioCtx.createMediaStreamDestination();
      let hasAnyAudioSource = false;

      // Add display/tab audio if present
      const displayAudioTracks = displayStream.getAudioTracks();
      if (displayAudioTracks.length > 0) {
        const displayAudioSource = audioCtx.createMediaStreamSource(
          new MediaStream(displayAudioTracks)
        );
        displayAudioSource.connect(destination);
        hasAnyAudioSource = true;
      }

      // Add dedicated recording microphone
      if (recordingMicStream) {
        const micTracks = recordingMicStream.getAudioTracks();
        if (micTracks.length > 0) {
          const micSource = audioCtx.createMediaStreamSource(recordingMicStream);
          micSource.connect(destination);
          hasAnyAudioSource = true;
        }
      }

      // Add remote participant audio streams (other users' voices via WebRTC)
      if (remoteStreams && Object.keys(remoteStreams).length > 0) {
        Object.entries(remoteStreams).forEach(([pid, remoteStream]) => {
          try {
            const remoteTracks = remoteStream.getAudioTracks().filter(t => t.readyState === 'live');
            if (remoteTracks.length > 0) {
              const remoteSource = audioCtx.createMediaStreamSource(
                new MediaStream(remoteTracks)
              );
              remoteSource.connect(destination);
              hasAnyAudioSource = true;
            }
          } catch (e) {
            console.warn(`Could not add remote audio for participant ${pid}:`, e);
          }
        });
      }

      // Build the recording stream: display video + mixed audio (if any)
      const combinedTracks = [...displayStream.getVideoTracks()];
      if (hasAnyAudioSource) {
        combinedTracks.push(...destination.stream.getAudioTracks());
      }
      const combinedStream = new MediaStream(combinedTracks);

      recordingStreamRef.current = displayStream;
      // Store the dedicated mic stream for cleanup
      recordingMicStreamRef.current = recordingMicStream;
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm'
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Cleanup stream and audio context
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(t => t.stop());
          recordingStreamRef.current = null;
        }
        if (recordingMicStreamRef.current) {
          recordingMicStreamRef.current.getTracks().forEach(t => t.stop());
          recordingMicStreamRef.current = null;
        }
        if (recordingAudioCtxRef.current) {
          recordingAudioCtxRef.current.close().catch(() => {});
          recordingAudioCtxRef.current = null;
        }

        setIsLocalRecording(false);

        // Notify others that recording stopped
        if (socket && meetingDbId) {
          socket.emit('recording_stop', { meetingId: meetingDbId, userId });
        }

        // Upload the recording
        if (recordedChunksRef.current.length > 0 && meetingDbId) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          recordedChunksRef.current = [];

          setNotification({ message: 'Uploading recording...', type: 'info' });
          setNotificationKey(prev => prev + 1);

          try {
            await meetingAPI.uploadRecording(meetingDbId, blob);
            setNotification({ message: 'Recording saved successfully!', type: 'info' });
            setNotificationKey(prev => prev + 1);
          } catch (err) {
            console.error('Failed to upload recording:', err);
            setNotification({ message: 'Failed to upload recording', type: 'leave' });
            setNotificationKey(prev => prev + 1);
          }
        }
      };

      // Handle user clicking "Stop sharing" in the browser prompt
      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      setIsLocalRecording(true);

      // Notify server/others
      if (socket && meetingDbId) {
        socket.emit('recording_start', {
          meetingId: meetingDbId,
          userId,
          username: user?.username || user?.name
        });
      }

      setNotification({ message: 'Recording started', type: 'info' });
      setNotificationKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to start recording:', err);
      if (err.name !== 'NotAllowedError') {
        setNotification({ message: 'Failed to start recording', type: 'leave' });
        setNotificationKey(prev => prev + 1);
      }
    }
  }, [isLocalRecording, hostSettings.isScreenRecordingAllowed, meetingRecorder, userId, socket, meetingDbId, user, remoteStreams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop());
        recordingStreamRef.current = null;
      }
      if (recordingMicStreamRef.current) {
        recordingMicStreamRef.current.getTracks().forEach(t => t.stop());
        recordingMicStreamRef.current = null;
      }
      if (recordingAudioCtxRef.current) {
        recordingAudioCtxRef.current.close().catch(() => {});
        recordingAudioCtxRef.current = null;
      }
      cleanupScreenSharePCs();
      stopScreenShareStream();
      cleanupAllPeerConnections();
      stopLocalStream();
    };
  }, [cleanupAllPeerConnections, stopLocalStream, cleanupScreenSharePCs, stopScreenShareStream]);

  // Guard: Don't render if user is not available
  if (!user || !userId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0c] text-slate-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0c] text-slate-300 font-sans selection:bg-primary/30 selection:text-white">
      {notification && (
        <UserNotification
          key={notificationKey}
          message={notification.message}
          type={notification.type}
          duration={3000}
        />
      )}

      {/* Screen Share Permission Requests (host sees these) */}
      {meetingRole === 'host' && screenShareRequests.length > 0 && (
        <ScreenShareRequests
          requests={screenShareRequests}
          onApprove={handleApproveScreenShare}
          onDecline={handleDeclineScreenShare}
        />
      )}

      {/* Floating Emoji Reactions (rise from bottom to top) */}
      {floatingEmojis.map((item) => (
        <div
          key={item.id}
          className="fixed z-[100] pointer-events-none animate-emoji-float"
          style={{ left: `${item.left}%`, bottom: '20px' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-4xl">{item.emoji}</span>
            <span className="text-[10px] font-bold text-white/70 bg-black/40 px-2 py-0.5 rounded-full mt-1 backdrop-blur-sm">
              {item.username}
            </span>
          </div>
        </div>
      ))}


      <Header
        meetingId={meetingId}
        meetingPassword={meetingPassword}
        shareLink={shareLink}
        participants={headerParticipants}
        meetingRecorder={meetingRecorder}
      />
      <main className="flex-1 flex overflow-hidden relative">
        {/* Hidden file input for image import */}
        <input
          ref={importFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* When screen is being shared, hide toolbar + canvas and show shared screen */}
        {screenSharer ? (
          <div className="flex-1 flex items-center justify-center bg-[#0a0a0c] relative">
            {/* Screen share view */}
            {isLocalScreenSharing && localScreenStreamRef.current ? (
              <video
                ref={(el) => {
                  if (el && localScreenStreamRef.current) {
                    el.srcObject = localScreenStreamRef.current;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : remoteScreenStream ? (
              <video
                ref={(el) => {
                  if (el && remoteScreenStream) {
                    el.srcObject = remoteScreenStream;
                  }
                }}
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <span className="material-symbols-outlined text-5xl">cast</span>
                <p className="text-sm font-medium">Connecting to {screenSharer.username}'s screen...</p>
              </div>
            )}

            {/* Sharer badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f172a]/90 border border-white/10 backdrop-blur-sm z-10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-200">
                {screenSharer.userId === userId ? 'You are' : `${screenSharer.username} is`} sharing screen
              </span>
              {isLocalScreenSharing && (
                <button
                  onClick={handleToggleScreenShare}
                  className="ml-2 px-3 py-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 transition-all"
                >
                  Stop Sharing
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <Toolbar
              activeTool={activeTool}
              setActiveTool={handleToolChange}
              onImportImage={handleImportImage}
              onExportCanvas={handleExportCanvas}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={history.length > 0}
              canRedo={redoStack.length > 0}
              canEdit={canEdit}
            />

            <ToolSettings
              tool={settingsTool}
              key={settingsTool}
              visible={isSettingsVisible}
              settings={settings}
              updateSettings={updateSettings}
              customColors={customBrushColors}
              setCustomColors={setCustomBrushColors}
              customFillColors={customFillColors}
              setCustomFillColors={setCustomFillColors}
              customNoteColors={customNoteColors}
              setCustomNoteColors={setCustomNoteColors}
            />

            <Canvas
              ref={canvasRef}
              activeTool={activeTool}
              canEdit={canEdit}
              onCursorMove={handleCursorMove}
              onCursorLeave={handleCursorLeave}
              cursors={<Cursors cursors={cursorList} />}
              settings={settings}
              elements={elements}
              onElementsChange={handleElementsChange}
              onActionStart={saveToHistory}
              onCanvasClick={handleCanvasClick}
              selectedElementId={selectedElementId}
              onSelectElement={handleSelectionChange}
              socket={socket}
              meetingDbId={meetingDbId}
              isHost={meetingRole === 'host'}
              isCanvasLocked={!isCollaborativeMode}
            />
          </>
        )}

        <Sidebar
          isOpen={sidebarOpen}
          toggle={() => setSidebarOpen(!sidebarOpen)}
          view={sidebarView}
          setView={setSidebarView}
          socket={socket}
          meetingDbId={meetingDbId}
          currentUser={user}
          currentRole={meetingRole}
          canEdit={canEdit}
          localMedia={localMedia}
          mediaStatusMap={mediaStatusMap}
          localVideoStream={localVideoStream}
          remoteVideoStreams={remoteVideoStreams}
          onToggleEditPermission={handleToggleEditPermission}
          isChatEnabled={hostSettings.isChatEnabled}
          raisedHands={raisedHands}
        />
      </main>
      <Footer
        onLeave={handleLeaveMeeting}
        onEnd={handleEndMeeting}
        isLeaving={isLeaving}
        isEnding={isEnding}
        meetingRole={meetingRole}
        durationLabel={durationLabel}
        onToggleCanvasMode={isCollaborativeMode ? handleLockCanvas : handleEnableCollaboration}
        isCollaborativeMode={isCollaborativeMode}
        micOn={localMedia.mic}
        videoOn={localMedia.video}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        hostSettings={hostSettings}
        onUpdateHostSettings={handleUpdateHostSettings}
        onEmojiReaction={handleEmojiReactionEmit}
        onRaiseHand={handleRaiseHandToggle}
        isHandRaised={isHandRaised}
        onToggleScreenShare={handleToggleScreenShare}
        isScreenSharing={isLocalScreenSharing}
        isScreenSharePending={isScreenSharePending}
        screenSharerName={screenSharer && screenSharer.userId !== userId ? screenSharer.username : null}
        onToggleRecording={handleToggleRecording}
        isRecording={isLocalRecording}
        recorderName={meetingRecorder && meetingRecorder.userId !== userId ? meetingRecorder.username : null}
      />
      {isLeaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#0f172a] px-6 py-5 shadow-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-red-500"></div>
            <p className="text-sm font-semibold text-slate-100">Leaving meeting...</p>
          </div>
        </div>
      )}
      {isEnding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#0f172a] px-6 py-5 shadow-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-orange-500"></div>
            <p className="text-sm font-semibold text-slate-100">Ending meeting for all participants...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Meeting;
