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
  const meetingRole = location.state?.role || sessionStorage.getItem('meetingRole') || 'participant';
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
    try {
      // Cleanup audio streams
      cleanupAllPeerConnections();
      stopLocalStream();
      
      // Emit end_meeting socket event to all members
      if (socket && meetingDbId) {
        socket.emit('end_meeting', { meetingId: meetingDbId, meetingDbId });
      }
      
      // Call the backend to end the meeting
      if (meetingDbId) {
        await meetingAPI.end(meetingDbId);
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
    } finally {
      window.setTimeout(() => {
        navigate('/dashboard');
      }, 1100);
    }
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
  }, [socket, meetingDbId, userId, user, setMicStatus]);

  const handleToggleVideo = useCallback(async () => {
    if (!userId) return;

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
  }, [initializeVideoStream, localMedia, meetingDbId, socket, stopVideoStream, user, userId]);

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
        // Clean up audio connection with departed user
        handleParticipantLeft(data.userId);
      }
    };

    const handleMeetingEnded = () => {
      console.log(`🔴 Meeting ended event received`);
      if (!isEnding) {
        setIsEnding(true);
      }
      setNotification({
        message: 'Host has ended the meeting',
        type: 'end'
      });
      setNotificationKey((prev) => prev + 1);
      setTimeout(() => {
        navigate('/dashboard');
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllPeerConnections();
      stopLocalStream();
    };
  }, [cleanupAllPeerConnections, stopLocalStream]);

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
      <Header
        meetingId={meetingId}
        meetingPassword={meetingPassword}
        participants={headerParticipants}
      />
      <main className="flex-1 flex overflow-hidden relative">
        <Toolbar
          activeTool={activeTool}
          setActiveTool={handleToolChange}
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
        />

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
        />
      </main>
      <Footer
        onLeave={handleLeaveMeeting}
        onEnd={handleEndMeeting}
        isLeaving={isLeaving}
        isEnding={isEnding}
        meetingRole={meetingRole}
        durationLabel={durationLabel}
        onLockCanvas={handleLockCanvas}
        onEnableCollaboration={handleEnableCollaboration}
        micOn={localMedia.mic}
        videoOn={localMedia.video}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
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
