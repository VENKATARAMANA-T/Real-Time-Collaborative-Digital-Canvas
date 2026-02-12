import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { userAPI, canvasAPI, meetingAPI } from '../services/api';

export default function Dashboard() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recent');
  const [activeView, setActiveView] = useState('home');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [canvasFilter, setCanvasFilter] = useState('all');
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
  const [joinMeetingFlash, setJoinMeetingFlash] = useState(null);
  const [createMeetingFlash, setCreateMeetingFlash] = useState(null);
  const [instantMeetingDetails, setInstantMeetingDetails] = useState(null);
  const [scheduledMeetingDetails, setScheduledMeetingDetails] = useState(null);
  const [isInstantGenerating, setIsInstantGenerating] = useState(false);
  const [isScheduledGenerating, setIsScheduledGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileUsername(user.username || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

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

  const folders = [
    {
      id: 'q4-projects',
      name: 'Q4 Projects',
      count: 12,
      accent: 'blue',
      description: 'Strategic planning and roadmaps for the final quarter.',
    },
    {
      id: 'client-work',
      name: 'Client Work',
      count: 8,
      accent: 'amber',
      description: 'Partner deliverables, timelines, and approvals.',
    },
    {
      id: 'personal-sketches',
      name: 'Personal Sketches',
      count: 24,
      accent: 'emerald',
      description: 'Early ideas, rough drafts, and experiments.',
    },
    {
      id: 'research-lab',
      name: 'Research Lab',
      count: 6,
      accent: 'purple',
      description: 'Discovery notes, user tests, and insights.',
    },
  ];

  const folderCanvases = {
    'q4-projects': [
      {
        id: 'q4-roadmap',
        title: 'Q4 Product Roadmap',
        edited: 'Edited 2h ago',
        folder: 'Q4 Projects',
        tag: 'Shared',
        tagColor: 'primary',
        border: 'border-b-primary/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuADVMWa09Lb-wiD6O-WhFcjqyxpwzLsJtyC4cq3pvE6RVuLuH9zyJmYK9xsMhKKxbkiFGTDf8Row0IANr79WGr8477MqYXGRBS33oG6jSOawBMTpYb8Lwy6xjXfcvMuwHOY5cIyL9_FnJNbwbkKWFtQKfwiu4yBDMSEHgWLEkS7qYdd5yGwLhZ327-ZT1abBwbBlQmRRqizocYXwUIjsdeF2ebjtRieM_r9tG2llspyOoMI0K3At-jUNwNAvbAEdtei7i0lnvtq7_U',
      },
      {
        id: 'q4-marketing',
        title: 'Q4 Marketing Strategy',
        edited: 'Edited Yesterday',
        folder: 'Q4 Projects',
        tag: 'Private',
        tagColor: 'emerald',
        border: 'border-b-emerald-400/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBsOnjC1yeDr3SF1UT2ZbVJILQ6AUyMRO7zO6McDldnd-dE8oUsIx78urvYg-M-LAcYs-cwS0xU8iR06nU7A93a255olYfX82pEDmHo5kAJiH5VZak5M_pdHUYclVFzcIp7hOc50FPIJ2oDPUIkey5WjjICizoLiHu2VXdJYCzGfIHABu7S3C3asfjQJjB0imGzdg14T9S63Qw01FUjKa9IvhWzmnH9oeO2X-0Yjiq8YYJW9RjIeyG7jRz3_7qDCIjxtNfp6nY6GvM',
      },
      {
        id: 'q4-budget',
        title: 'Q4 Budget Plan',
        edited: 'Edited 3 days ago',
        folder: 'Q4 Projects',
        tag: 'Shared',
        tagColor: 'primary',
        border: 'border-b-purple-400/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAb-Z5EqbE6ee1mjMe_0sjEZHvyb241L5-EljC6P3CgMi585PBJSath_lV4l64hjKhqIBw30hrBN-g5DOT7X2GFwSbK5ZKCLXvybMRvkbubO8ULQZtin0eqf-OSjil46taqlO3WKkbJupniIAhquZxhZSYTYv0GxtAQJkooc9dZd_b5BU1IrTwf31u0mecCnISdJBQK00jAY3rysVP0qUvT5P6-g3beIMi0IGVGrGt88XqJTCcX3JlYi-8IPbbsW2LUUx07cc0ZhTk',
      },
    ],
    'client-work': [
      {
        id: 'client-brief',
        title: 'Client Briefing Notes',
        edited: 'Edited 4h ago',
        folder: 'Client Work',
        tag: 'Shared',
        tagColor: 'primary',
        border: 'border-b-primary/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU',
      },
      {
        id: 'client-journey',
        title: 'User Journey Mapping',
        edited: 'Edited Yesterday',
        folder: 'Client Work',
        tag: 'Private',
        tagColor: 'emerald',
        border: 'border-b-emerald-400/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBsOnjC1yeDr3SF1UT2ZbVJILQ6AUyMRO7zO6McDldnd-dE8oUsIx78urvYg-M-LAcYs-cwS0xU8iR06nU7A93a255olYfX82pEDmHo5kAJiH5VZak5M_pdHUYclVFzcIp7hOc50FPIJ2oDPUIkey5WjjICizoLiHu2VXdJYCzGfIHABu7S3C3asfjQJjB0imGzdg14T9S63Qw01FUjKa9IvhWzmnH9oeO2X-0Yjiq8YYJW9RjIeyG7jRz3_7qDCIjxtNfp6nY6GvM',
      },
      {
        id: 'client-creative',
        title: 'Campaign Creative',
        edited: 'Edited 2 days ago',
        folder: 'Client Work',
        tag: 'Shared',
        tagColor: 'primary',
        border: 'border-b-purple-400/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAb-Z5EqbE6ee1mjMe_0sjEZHvyb241L5-EljC6P3CgMi585PBJSath_lV4l64hjKhqIBw30hrBN-g5DOT7X2GFwSbK5ZKCLXvybMRvkbubO8ULQZtin0eqf-OSjil46taqlO3WKkbJupniIAhquZxhZSYTYv0GxtAQJkooc9dZd_b5BU1IrTwf31u0mecCnISdJBQK00jAY3rysVP0qUvT5P6-g3beIMi0IGVGrGt88XqJTCcX3JlYi-8IPbbsW2LUUx07cc0ZhTk',
      },
    ],
    'personal-sketches': [
      {
        id: 'personal-ideas',
        title: 'Website Redesign Ideas',
        edited: 'Edited 3 days ago',
        folder: 'Personal Sketches',
        tag: 'Private',
        tagColor: 'emerald',
        border: 'border-b-emerald-400/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAb-Z5EqbE6ee1mjMe_0sjEZHvyb241L5-EljC6P3CgMi585PBJSath_lV4l64hjKhqIBw30hrBN-g5DOT7X2GFwSbK5ZKCLXvybMRvkbubO8ULQZtin0eqf-OSjil46taqlO3WKkbJupniIAhquZxhZSYTYv0GxtAQJkooc9dZd_b5BU1IrTwf31u0mecCnISdJBQK00jAY3rysVP0qUvT5P6-g3beIMi0IGVGrGt88XqJTCcX3JlYi-8IPbbsW2LUUx07cc0ZhTk',
      },
      {
        id: 'personal-mood',
        title: 'Moodboard Experiments',
        edited: 'Edited 5 days ago',
        folder: 'Personal Sketches',
        tag: 'Shared',
        tagColor: 'primary',
        border: 'border-b-primary/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU',
      },
      {
        id: 'personal-notes',
        title: 'Sketchbook Notes',
        edited: 'Edited 1 week ago',
        folder: 'Personal Sketches',
        tag: 'Private',
        tagColor: 'emerald',
        border: 'border-b-purple-400/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBsOnjC1yeDr3SF1UT2ZbVJILQ6AUyMRO7zO6McDldnd-dE8oUsIx78urvYg-M-LAcYs-cwS0xU8iR06nU7A93a255olYfX82pEDmHo5kAJiH5VZak5M_pdHUYclVFzcIp7hOc50FPIJ2oDPUIkey5WjjICizoLiHu2VXdJYCzGfIHABu7S3C3asfjQJjB0imGzdg14T9S63Qw01FUjKa9IvhWzmnH9oeO2X-0Yjiq8YYJW9RjIeyG7jRz3_7qDCIjxtNfp6nY6GvM',
      },
    ],
    'research-lab': [
      {
        id: 'research-synthesis',
        title: 'Research Synthesis',
        edited: 'Edited 6h ago',
        folder: 'Research Lab',
        tag: 'Shared',
        tagColor: 'primary',
        border: 'border-b-primary/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU',
      },
      {
        id: 'research-flows',
        title: 'Interview Flows',
        edited: 'Edited 2 days ago',
        folder: 'Research Lab',
        tag: 'Private',
        tagColor: 'emerald',
        border: 'border-b-emerald-400/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuADVMWa09Lb-wiD6O-WhFcjqyxpwzLsJtyC4cq3pvE6RVuLuH9zyJmYK9xsMhKKxbkiFGTDf8Row0IANr79WGr8477MqYXGRBS33oG6jSOawBMTpYb8Lwy6xjXfcvMuwHOY5cIyL9_FnJNbwbkKWFtQKfwiu4yBDMSEHgWLEkS7qYdd5yGwLhZ327-ZT1abBwbBlQmRRqizocYXwUIjsdeF2ebjtRieM_r9tG2llspyOoMI0K3At-jUNwNAvbAEdtei7i0lnvtq7_U',
      },
      {
        id: 'research-metrics',
        title: 'Insight Metrics',
        edited: 'Edited 1 week ago',
        folder: 'Research Lab',
        tag: 'Shared',
        tagColor: 'primary',
        border: 'border-b-purple-400/60',
        preview:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAb-Z5EqbE6ee1mjMe_0sjEZHvyb241L5-EljC6P3CgMi585PBJSath_lV4l64hjKhqIBw30hrBN-g5DOT7X2GFwSbK5ZKCLXvybMRvkbubO8ULQZtin0eqf-OSjil46taqlO3WKkbJupniIAhquZxhZSYTYv0GxtAQJkooc9dZd_b5BU1IrTwf31u0mecCnISdJBQK00jAY3rysVP0qUvT5P6-g3beIMi0IGVGrGt88XqJTCcX3JlYi-8IPbbsW2LUUx07cc0ZhTk',
      },
    ],
  };

  const allCanvases = [...savedCanvases.map(cv => ({
    id: cv._id,
    title: cv.title || 'Untitled Canvas',
    edited: new Date(cv.updatedAt).toLocaleString(),
    folder: 'Personal Sketches',
    tag: 'Private',
    tagColor: 'emerald',
    border: 'border-b-emerald-400/60',
    preview: cv.thumbnail || 'https://via.placeholder.com/400x200?text=No+Preview'
  })), ...Object.values(folderCanvases).flat()];
  const activeFolder = folders.find((folder) => folder.id === activeFolderId) || null;
  const activeFolderCanvases = activeFolderId ? folderCanvases[activeFolderId] : [];

  const filterCanvases = (canvases) => {
    if (canvasFilter === 'shared') {
      return canvases.filter((canvas) => canvas.tag === 'Shared');
    }
    if (canvasFilter === 'private') {
      return canvases.filter((canvas) => canvas.tag === 'Private');
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
    setShowCreateMeeting(true);

    setIsInstantGenerating(true);
    try {
      // Generate credentials for instant meeting (no DB creation)
      const data = await meetingAPI.generateCredentials();
      setInstantMeetingDetails({
        id: data.meetingId,
        password: data.password,
        shareLink: data.shareLink,
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
      showMeetingFlash(setJoinMeetingFlash, 'Invalid meeting details');
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
    const validationError = validateSchedule();
    if (validationError) {
      setScheduleError(validationError);
      setScheduledMeetingDetails(null);
      return;
    }
    setScheduleError('');
    setIsScheduledGenerating(true);
    try {
      // Generate credentials for scheduled meeting (no DB creation yet)
      const data = await meetingAPI.generateCredentials();
      setScheduledMeetingDetails({
        id: data.meetingId,
        password: data.password,
        shareLink: data.shareLink,
        meetingDbId: null,
        role: 'host',
        permission: 'edit',
        status: 'pending',
        scheduledDate: scheduleDate,
        scheduledTime: scheduleTime
      });
    } catch (error) {
      showMeetingFlash(setCreateMeetingFlash, 'Failed to generate meeting details');
    } finally {
      setIsScheduledGenerating(false);
    }
  };

  const handleInstantJoin = async () => {
    setIsInstantGenerating(true);
    
    try {
      // If credentials exist but not in DB, create the meeting
      if (instantMeetingDetails && !instantMeetingDetails?.meetingDbId) {
        const data = await meetingAPI.createInstant({
          meetingId: instantMeetingDetails.id,
          password: instantMeetingDetails.password
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
      showMeetingFlash(setCreateMeetingFlash, 'Failed to create meeting');
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

  const handleLogout = async () => {
    await logout();
    setIsLoggingOut(true);
    setTimeout(() => {
      navigate('/', { state: { flash: { type: 'success', message: 'Logged out successfully.' } } });
    }, 2000);
  };

  const handleNewCanvas = async () => {
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

      const newCanvas = await canvasAPI.create({
        title: `Untitled Canvas ${Date.now()}`,
        folderId: null,
        data: {
          elements: [],
          canvasSize: { width: 1920, height: 1080 },
          pixelData: null
        },
        thumbnail
      });

      if (newCanvas?._id) {
        navigate(`/paint/${newCanvas._id}`);
      }
    } catch (error) {
      console.error('Failed to create canvas:', error);
      showFlash('error', 'Failed to create canvas');
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
                    placeholder="Search canvases, meetings or templates..."
                    type="text"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-slate-400 hover:bg-[#111827] rounded-full transition-all relative">
                  <span className="material-icons">notifications</span>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
                </button>
                <button className="p-2 text-slate-400 hover:bg-[#111827] rounded-full transition-all">
                  <span className="material-icons">help_outline</span>
                </button>
              </div>
            </header>
          ) : activeView === 'meetings' ? (
            <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 bg-[#1a242f] border-b border-[#2d3a4b]">
              <div className="flex items-center space-x-6">
                <h2 className="text-xl font-bold">Meetings</h2>
              </div>
              <div className="flex items-center space-x-4"></div>
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
            <header className="h-16 flex-shrink-0 flex items-center justify-start px-8 bg-[#1a242f] border-b border-[#2d3a4b]">
              <div className="w-full max-w-md relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-primary transition-colors">
                  search
                </span>
                <input
                  className="w-full h-10 bg-[#101922]/40 border border-[#2d3a4b] rounded-xl pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Search canvases..."
                  type="text"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-[#2d3a4b]/50 rounded border border-[#2d3a4b]">Ctrl</kbd>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-[#2d3a4b]/50 rounded border border-[#2d3a4b]">K</kbd>
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

              {activeTab === 'recent' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {savedCanvases.slice(0, 4).map((canvas) => (
                    <div key={canvas._id} className="group bg-[#111827] border border-[#1f2a3b] rounded-xl overflow-hidden hover:shadow-lg transition-all border-b-4 border-b-emerald-400/60">
                      <div className="h-40 bg-[#0b1220] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                          <button
                            className="px-4 py-2 bg-primary  text-white text-xs font-bold rounded-lg shadow-lg"
                            onClick={() => navigate(`/paint/${canvas._id}`)}
                            type="button"
                          >
                            Open Editor
                          </button>
                        </div>
                        <img
                          alt={`${canvas.title} Preview`}
                          className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500"
                          src={canvas.thumbnail || 'https://via.placeholder.com/400x200?text=No+Preview'}
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm truncate">{canvas.title || 'Untitled Canvas'}</h4>
                          <button className="text-slate-500 hover:text-primary">
                            <span className="material-icons text-lg">more_vert</span>
                          </button>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 space-x-2">
                          <span className="material-icons text-sm">schedule</span>
                          <span>{new Date(canvas.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {savedCanvases.length === 0 && (
                    <div className="col-span-4 text-center py-12">
                      <p className="text-slate-500">No canvases yet. Create your first canvas!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'upcoming' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-lg transition-all border-l-4 border-l-primary">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <span className="material-icons">event_available</span>
                      </div>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded uppercase">In 15 Mins</span>
                    </div>
                    <h4 className="font-bold text-base mb-1">Weekly Design Alignment</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Reviewing final prototypes for the mobile app navigation overhaul.
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                      <div className="flex -space-x-2">
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                        />
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3Jffw2Ed86qLcQBO1a05mSUUVVKiWWIFMs5eaQUtbgZZ4WJ_YsRgPDXetsYBMgE5cwexXnXHnLy5tzdCTEB8Lm88P7PDk6cb1yiWobJMGU54wKA656FbzmD0HUDm-twu2t2QlQzMcGo83A8g14CN7wfS42kaCoMq3HghIJpfzsIxlw9F0-qfuyjFhl4rn7v7NuVj2swvt3ceKSi_dsi9dsHo3-V702VS9fDUJNATljFvadY7ZQRFxGEH2hKU4YrnGYmKET_jfD0"
                        />
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-surface-dark flex items-center justify-center text-[10px] font-bold">
                          +3
                        </div>
                      </div>
                      <button className="text-primary text-xs font-bold hover:underline flex items-center" type="button">
                        Join Meeting <span className="material-icons text-sm ml-1">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  <div className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-lg transition-all border-l-4 border-l-deep-purple">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-deep-purple/10 rounded-lg flex items-center justify-center text-deep-purple">
                        <span className="material-icons">groups</span>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase">Today, 2:00 PM</span>
                    </div>
                    <h4 className="font-bold text-base mb-1">Product Roadmap Q1</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Stakeholder sync to finalize the feature priority list for early 2024.
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                      <div className="flex -space-x-2">
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkXpCRHQ-UPXaJsLlUZdtA6naCVhm0E8mn-XUR7zD0CADV8MeTxlg3Sql9v9OO0nscMWorf4ji5EI3pTGy1cVGzp_Wgsiry-KXMPTfgYObiKvsGsQT-RCjJkMFW1uBj-Nuh18F_QMrwQdzlR1Bl7tHY75q8SFQqD0SQ51kQ1UqTmvj_Dh8MS9rcL_eVXqf71_OGa0SgNL4FInMVAT5e5O6xC_4aAVzE0p7A6fiU9GmIy3kJuv0EZ_e3seFc1wufAg-HHOwdxWs9e8"
                        />
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1G-Hn3vTP4BF8Tw65GNWLXCvphxit-gjaQaTS4e4417fPSGMKmx5zWr3w71xhaFli15vvoNhXAQzFsZhbXrYJnyiMAASvjonWiMDpUrf74kM00j8LO0v8ZIeWjxaTbQuwyPqYZPfUeaOJ0wxlWWLxz3b8aKfJIiOrN14CKccdESbzqpgCNmOz0yLKqEPnT9TLpYA75qsT7GKR2uA3ES71XLf46HSiL3x1oGxqtIPUL_bm67_UVcIPd6dxq-bs8_hsxaiualJBX4s"
                        />
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-surface-dark flex items-center justify-center text-[10px] font-bold">
                          +12
                        </div>
                      </div>
                      <button className="text-slate-400 text-xs font-bold flex items-center cursor-not-allowed" type="button">
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-lg transition-all border-l-4 border-l-teal-accent">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-teal-accent/10 rounded-lg flex items-center justify-center text-teal-accent">
                        <span className="material-icons">psychology</span>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase">Tomorrow, 10:00 AM</span>
                    </div>
                    <h4 className="font-bold text-base mb-1">Brainstorming: Marketing Site</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Creative session for the new landing page concept and messaging.
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                      <div className="flex -space-x-2">
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                        />
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-surface-dark flex items-center justify-center text-[10px] font-bold">
                          +2
                        </div>
                      </div>
                      <button className="text-slate-400 text-xs font-bold flex items-center cursor-not-allowed" type="button">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'completed' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                        <span className="material-icons">history</span>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase">
                        Oct 22 · 45m
                      </span>
                    </div>
                    <h4 className="font-bold text-base mb-1">Backend Architecture Review</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Detailed walkthrough of the microservices transition plan and database schema.
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                      <div className="flex -space-x-2">
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                        />
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3Jffw2Ed86qLcQBO1a05mSUUVVKiWWIFMs5eaQUtbgZZ4WJ_YsRgPDXetsYBMgE5cwexXnXHnLy5tzdCTEB8Lm88P7PDk6cb1yiWobJMGU54wKA656FbzmD0HUDm-twu2t2QlQzMcGo83A8g14CN7wfS42kaCoMq3HghIJpfzsIxlw9F0-qfuyjFhl4rn7v7NuVj2swvt3ceKSi_dsi9dsHo3-V702VS9fDUJNATljFvadY7ZQRFxGEH2hKU4YrnGYmKET_jfD0"
                        />
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-surface-dark flex items-center justify-center text-[10px] font-bold">
                          +2
                        </div>
                      </div>
                      <button className="text-primary text-xs font-bold hover:underline flex items-center" type="button">
                        View Recap <span className="material-icons text-sm ml-1">description</span>
                      </button>
                    </div>
                  </div>

                  <div className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                        <span className="material-icons">campaign</span>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase">
                        Oct 21 · 60m
                      </span>
                    </div>
                    <h4 className="font-bold text-base mb-1">Marketing Strategy Session</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Aligning on the holiday campaign assets and cross-channel promotion timelines.
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                      <div className="flex -space-x-2">
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkXpCRHQ-UPXaJsLlUZdtA6naCVhm0E8mn-XUR7zD0CADV8MeTxlg3Sql9v9OO0nscMWorf4ji5EI3pTGy1cVGzp_Wgsiry-KXMPTfgYObiKvsGsQT-RCjJkMFW1uBj-Nuh18F_QMrwQdzlR1Bl7tHY75q8SFQqD0SQ51kQ1UqTmvj_Dh8MS9rcL_eVXqf71_OGa0SgNL4FInMVAT5e5O6xC_4aAVzE0p7A6fiU9GmIy3kJuv0EZ_e3seFc1wufAg-HHOwdxWs9e8"
                        />
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1G-Hn3vTP4BF8Tw65GNWLXCvphxit-gjaQaTS4e4417fPSGMKmx5zWr3w71xhaFli15vvoNhXAQzFsZhbXrYJnyiMAASvjonWiMDpUrf74kM00j8LO0v8ZIeWjxaTbQuwyPqYZPfUeaOJ0wxlWWLxz3b8aKfJIiOrN14CKccdESbzqpgCNmOz0yLKqEPnT9TLpYA75qsT7GKR2uA3ES71XLf46HSiL3x1oGxqtIPUL_bm67_UVcIPd6dxq-bs8_hsxaiualJBX4s"
                        />
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-surface-dark flex items-center justify-center text-[10px] font-bold">
                          +5
                        </div>
                      </div>
                      <button className="text-primary text-xs font-bold hover:underline flex items-center" type="button">
                        View Summary <span className="material-icons text-sm ml-1">article</span>
                      </button>
                    </div>
                  </div>

                  <div className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                        <span className="material-icons">event_note</span>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase">
                        Oct 20 · 90m
                      </span>
                    </div>
                    <h4 className="font-bold text-base mb-1">Q3 Retrospective</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Analyzing performance metrics, team feedback, and setting goals for the next quarter.
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                      <div className="flex -space-x-2">
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                        />
                        <img
                          alt="Team member"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-surface-dark"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                        />
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-surface-dark flex items-center justify-center text-[10px] font-bold">
                          +8
                        </div>
                      </div>
                      <button className="text-primary text-xs font-bold hover:underline flex items-center" type="button">
                        View Recap <span className="material-icons text-sm ml-1">description</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Today's Schedule</h3>
                  <button className="text-primary text-sm font-bold hover:underline">View Calendar</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#111827] border border-[#1f2a3b] rounded-xl group hover:border-primary transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center text-primary">
                        <span className="text-[10px] font-bold leading-none uppercase">Oct</span>
                        <span className="text-xl font-extrabold leading-none">24</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-start">Frontend Sync-up</h4>
                        <p className="text-xs text-slate-500 text-start">10:00 AM — 11:00 AM • 4 participants</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-2 mr-4">
                        <img
                          alt="Team member profile picture small"
                          className="w-7 h-7 rounded-full border-2 border-[#0f172a]"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                        />
                        <img
                          alt="Team member profile picture small"
                          className="w-7 h-7 rounded-full border-2 border-[#0f172a]"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3Jffw2Ed86qLcQBO1a05mSUUVVKiWWIFMs5eaQUtbgZZ4WJ_YsRgPDXetsYBMgE5cwexXnXHnLy5tzdCTEB8Lm88P7PDk6cb1yiWobJMGU54wKA656FbzmD0HUDm-twu2t2QlQzMcGo83A8g14CN7wfS42kaCoMq3HghIJpfzsIxlw9F0-qfuyjFhl4rn7v7NuVj2swvt3ceKSi_dsi9dsHo3-V702VS9fDUJNATljFvadY7ZQRFxGEH2hKU4YrnGYmKET_jfD0"
                        />
                        <div className="w-7 h-7 rounded-full bg-[#1f2a3b] border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-bold">+2</div>
                      </div>
                      <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Join Now
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#111827] border border-[#1f2a3b] rounded-xl group hover:border-primary transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#0b1220] rounded-lg flex flex-col items-center justify-center text-slate-400">
                        <span className="text-[10px] font-bold leading-none uppercase">Oct</span>
                        <span className="text-xl font-extrabold leading-none">24</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-start">Sprint Retrospective</h4>
                        <p className="text-xs text-slate-500 text-start">03:30 PM — 04:30 PM • 8 participants</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-2 mr-4">
                        <img
                          alt="Team member profile picture small"
                          className="w-7 h-7 rounded-full border-2 border-[#0f172a]"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkXpCRHQ-UPXaJsLlUZdtA6naCVhm0E8mn-XUR7zD0CADV8MeTxlg3Sql9v9OO0nscMWorf4ji5EI3pTGy1cVGzp_Wgsiry-KXMPTfgYObiKvsGsQT-RCjJkMFW1uBj-Nuh18F_QMrwQdzlR1Bl7tHY75q8SFQqD0SQ51kQ1UqTmvj_Dh8MS9rcL_eVXqf71_OGa0SgNL4FInMVAT5e5O6xC_4aAVzE0p7A6fiU9GmIy3kJuv0EZ_e3seFc1wufAg-HHOwdxWs9e8"
                        />
                        <div className="w-7 h-7 rounded-full bg-[#1f2a3b] border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-bold">+7</div>
                      </div>
                      <button className="px-4 py-2 border border-[#1f2a3b] text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed">
                        Later Today
                      </button>
                    </div>
                  </div>
                </div>
              </div>
                </section>
              </>
            ) : activeView === 'meetings' ? (
              <>
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-2 h-2 rounded-full bg-primary mr-3"></div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Today — October 24</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="relative group p-6 bg-[#1a242f] border-l-4 border-primary rounded-xl border border-[#2d3a4b] ">
                      <div className="absolute top-6 right-6 flex items-center bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="relative flex h-2 w-2 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live Now
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold mb-2 text-start">Q4 Strategic Product Roadmap</h4>
                          <div className="flex items-center text-slate-400 text-sm space-x-4">
                            <span className="flex items-center">
                              <span className="material-symbols-outlined text-sm mr-1">schedule</span> 10:00 AM - 11:30 AM
                            </span>
                            <span className="flex items-center">
                              <span className="material-symbols-outlined text-sm mr-1">location_on</span> Main Canvas Board
                            </span>
                          </div>
                          <div className="mt-4 flex items-center">
                            <div className="flex -space-x-2 mr-4">
                              <img
                                alt="Participant"
                                className="w-8 h-8 rounded-full border-2 border-[#1a242f]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                              />
                              <img
                                alt="Participant"
                                className="w-8 h-8 rounded-full border-2 border-[#1a242f]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3Jffw2Ed86qLcQBO1a05mSUUVVKiWWIFMs5eaQUtbgZZ4WJ_YsRgPDXetsYBMgE5cwexXnXHnLy5tzdCTEB8Lm88P7PDk6cb1yiWobJMGU54wKA656FbzmD0HUDm-twu2t2QlQzMcGo83A8g14CN7wfS42kaCoMq3HghIJpfzsIxlw9F0-qfuyjFhl4rn7v7NuVj2swvt3ceKSi_dsi9dsHo3-V702VS9fDUJNATljFvadY7ZQRFxGEH2hKU4YrnGYmKET_jfD0"
                              />
                              <img
                                alt="Participant"
                                className="w-8 h-8 rounded-full border-2 border-[#1a242f]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkXpCRHQ-UPXaJsLlUZdtA6naCVhm0E8mn-XUR7zD0CADV8MeTxlg3Sql9v9OO0nscMWorf4ji5EI3pTGy1cVGzp_Wgsiry-KXMPTfgYObiKvsGsQT-RCjJkMFW1uBj-Nuh18F_QMrwQdzlR1Bl7tHY75q8SFQqD0SQ51kQ1UqTmvj_Dh8MS9rcL_eVXqf71_OGa0SgNL4FInMVAT5e5O6xC_4aAVzE0p7A6fiU9GmIy3kJuv0EZ_e3seFc1wufAg-HHOwdxWs9e8"
                              />
                              <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#1a242f] flex items-center justify-center text-[10px] font-bold text-white">
                                +5
                              </div>
                            </div>
                            <span className="text-xs text-slate-500">8 Participants joined</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button className="w-full md:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl hover:scale-105 transition-all shadow-xl shadow-primary/30 flex items-center justify-center" type="button">
                            <span className="material-icons mr-2">videocam</span>
                            Join Now
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-[#1a242f] rounded-xl border border-[#2d3a4b] hover:border-slate-600 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mr-3">Coming Up Next</span>
                            <div className="h-px flex-1 bg-[#2d3a4b]"></div>
                          </div>
                          <h4 className="text-xl font-bold mb-2 text-start">Frontend Engineering Sync</h4>
                          <div className="flex items-center text-slate-400 text-sm space-x-4">
                            <span className="flex items-center">
                              <span className="material-symbols-outlined text-sm mr-1">schedule</span> 02:00 PM - 03:00 PM
                            </span>
                            <span className="flex items-center">
                              <span className="material-symbols-outlined text-sm mr-1">groups</span> Engineering Team
                            </span>
                          </div>
                          <div className="mt-4 flex -space-x-2">
                            <img
                              alt="Participant"
                              className="w-7 h-7 rounded-full border-2 border-[#1a242f]"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                            />
                            <img
                              alt="Participant"
                              className="w-7 h-7 rounded-full border-2 border-[#1a242f]"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3Jffw2Ed86qLcQBO1a05mSUUVVKiWWIFMs5eaQUtbgZZ4WJ_YsRgPDXetsYBMgE5cwexXnXHnLy5tzdCTEB8Lm88P7PDk6cb1yiWobJMGU54wKA656FbzmD0HUDm-twu2t2QlQzMcGo83A8g14CN7wfS42kaCoMq3HghIJpfzsIxlw9F0-qfuyjFhl4rn7v7NuVj2swvt3ceKSi_dsi9dsHo3-V702VS9fDUJNATljFvadY7ZQRFxGEH2hKU4YrnGYmKET_jfD0"
                            />
                            <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-[#1a242f] flex items-center justify-center text-[10px] font-bold text-white">
                              +2
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button className="px-6 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg border border-[#2d3a4b] hover:bg-slate-700 transition-all" type="button">
                            Prepare Canvas
                          </button>
                          <button className="px-6 py-2 bg-transparent text-slate-400 text-xs font-bold hover:text-white transition-all" type="button">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-2 h-2 rounded-full bg-slate-600 mr-3"></div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Tomorrow — October 25</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 bg-[#1a242f] rounded-xl border border-[#2d3a4b] hover:border-slate-600 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                          <span className="material-symbols-outlined text-purple-400">psychology</span>
                        </div>
                        <button className="text-slate-500 hover:text-white" type="button">
                          <span className="material-icons">more_horiz</span>
                        </button>
                      </div>
                      <h4 className="text-lg font-bold mb-1">User Experience Brainstorming</h4>
                      <p className="text-xs text-slate-500 mb-4">Focus on checkout flow improvements</p>
                      <div className="flex items-center justify-between pt-4 border-t border-[#2d3a4b]">
                        <div className="flex items-center text-xs text-slate-400">
                          <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                          09:30 AM
                        </div>
                        <div className="flex -space-x-1">
                          <img
                            alt="Participant"
                            className="w-6 h-6 rounded-full border-2 border-[#1a242f]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkXpCRHQ-UPXaJsLlUZdtA6naCVhm0E8mn-XUR7zD0CADV8MeTxlg3Sql9v9OO0nscMWorf4ji5EI3pTGy1cVGzp_Wgsiry-KXMPTfgYObiKvsGsQT-RCjJkMFW1uBj-Nuh18F_QMrwQdzlR1Bl7tHY75q8SFQqD0SQ51kQ1UqTmvj_Dh8MS9rcL_eVXqf71_OGa0SgNL4FInMVAT5e5O6xC_4aAVzE0p7A6fiU9GmIy3kJuv0EZ_e3seFc1wufAg-HHOwdxWs9e8"
                          />
                          <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-[#1a242f] flex items-center justify-center text-[8px] font-bold">
                            +4
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-[#1a242f] rounded-xl border border-[#2d3a4b] hover:border-slate-600 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg">
                          <span className="material-symbols-outlined text-emerald-400">rocket_launch</span>
                        </div>
                        <button className="text-slate-500 hover:text-white" type="button">
                          <span className="material-icons">more_horiz</span>
                        </button>
                      </div>
                      <h4 className="text-lg font-bold mb-1">Project Launch Retrospective</h4>
                      <p className="text-xs text-slate-500 mb-4">Internal team debriefing session</p>
                      <div className="flex items-center justify-between pt-4 border-t border-[#2d3a4b]">
                        <div className="flex items-center text-xs text-slate-400">
                          <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                          04:00 PM
                        </div>
                        <div className="flex -space-x-1">
                          <img
                            alt="Participant"
                            className="w-6 h-6 rounded-full border-2 border-[#1a242f]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3Jffw2Ed86qLcQBO1a05mSUUVVKiWWIFMs5eaQUtbgZZ4WJ_YsRgPDXetsYBMgE5cwexXnXHnLy5tzdCTEB8Lm88P7PDk6cb1yiWobJMGU54wKA656FbzmD0HUDm-twu2t2QlQzMcGo83A8g14CN7wfS42kaCoMq3HghIJpfzsIxlw9F0-qfuyjFhl4rn7v7NuVj2swvt3ceKSi_dsi9dsHo3-V702VS9fDUJNATljFvadY7ZQRFxGEH2hKU4YrnGYmKET_jfD0"
                          />
                          <img
                            alt="Participant"
                            className="w-6 h-6 rounded-full border-2 border-[#1a242f]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                          />
                          <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-[#1a242f] flex items-center justify-center text-[8px] font-bold">
                            +12
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : activeView === 'notifications' ? (
              <>
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1 text-start">Recent Activity</h1>
                      <p className="text-slate-500 text-sm">Stay updated with your team's collaboration</p>
                    </div>
                    <button className="text-xs font-semibold text-primary hover:underline transition-all" type="button">
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="group flex items-center p-5 bg-[#1a242f] border border-[#2d3a4b] rounded-xl hover:border-primary/50 transition-all relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                        <img
                          alt="Sarah"
                          className="w-full h-full rounded-full"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTfywyR1V-K_AIjWqiOpMkL5HqSbth_mGsQcF68NS0z93K1S6BUVP0lqSnWROCkio9XUfSI18giEkbkPLo_W23mJ-k0X_w7EkGW1Dew_eQHHSfMx0u2oiT5gHyh97czYjZXFtmWtQT6X_d6vDduce1MqiC3odtK22ShLDLaA6q4FsSZERi21w-kCoM-xTt9Q99dhAqT4ybTq_zUr_E4KiMaI5GvwJSfk2i0xNPBWytcC0AuTgUvcRChDtHaKevbzhcFlp0dPNyiU"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <p className="text-sm font-medium text-slate-200">
                          <span className="font-bold text-white">Sarah</span> joined the{' '}
                          <span className="text-primary font-semibold">Q4 Roadmap</span> canvas
                        </p>
                        <p className="text-xs text-slate-500 mt-1">2m ago</p>
                      </div>
                      <div className="ml-4 flex-shrink-0 ">
                        <button className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all" type="button">
                          View
                        </button>
                      </div>
                    </div>

                    <div className="group flex items-center p-5 bg-[#1a242f] border border-[#2d3a4b] rounded-xl hover:border-primary/50 transition-all relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                      <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mr-4">
                        <span className="material-symbols-outlined text-emerald-400">calendar_today</span>
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <p className="text-sm font-medium text-slate-200">
                          New meeting invite: <span className="font-bold text-white">Frontend Sync</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">15m ago</p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg border border-[#2d3a4b] hover:bg-slate-700 transition-all"
                          type="button"
                        >
                          Decline
                        </button>
                        <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all" type="button">
                          Accept
                        </button>
                      </div>
                    </div>

                    <div className="group flex items-center p-5 bg-[#1a242f] border border-[#2d3a4b] rounded-xl hover:border-slate-600 transition-all">
                      <div className="flex-shrink-0 w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mr-4">
                        <span className="material-symbols-outlined text-amber-400">timer</span>
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <p className="text-sm font-medium text-slate-200">
                          Reminder: <span className="font-bold text-white">Project Retrospective</span> starts in 10 mins
                        </p>
                        <p className="text-xs text-slate-500 mt-1">1h ago</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all flex items-center"
                          type="button"
                        >
                          <span className="material-icons text-sm mr-1">videocam</span>
                          Join
                        </button>
                      </div>
                    </div>

                    <div className="group flex items-center p-5 bg-[#1a242f] border border-[#2d3a4b] rounded-xl hover:border-slate-600 transition-all">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mr-4">
                        <span className="material-symbols-outlined text-purple-400">share</span>
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <p className="text-sm font-medium text-slate-200">
                          Canvas <span className="font-bold text-white">"Brand Identity"</span> was shared with you
                        </p>
                        <p className="text-xs text-slate-500 mt-1">3h ago</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg border border-[#2d3a4b] hover:bg-slate-700 transition-all"
                          type="button"
                        >
                          Open Canvas
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">Yesterday</h3>
                    </div>

                    <div className="group flex items-center p-5 bg-[#1a242f]/40 border border-[#2d3a4b]/50 rounded-xl grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                      <div className="flex-shrink-0 w-12 h-12 bg-slate-500/10 rounded-full flex items-center justify-center mr-4">
                        <img
                          alt="User"
                          className="w-full h-full rounded-full"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3Jffw2Ed86qLcQBO1a05mSUUVVKiWWIFMs5eaQUtbgZZ4WJ_YsRgPDXetsYBMgE5cwexXnXHnLy5tzdCTEB8Lm88P7PDk6cb1yiWobJMGU54wKA656FbzmD0HUDm-twu2t2QlQzMcGo83A8g14CN7wfS42kaCoMq3HghIJpfzsIxlw9F0-qfuyjFhl4rn7v7NuVj2swvt3ceKSi_dsi9dsHo3-V702VS9fDUJNATljFvadY7ZQRFxGEH2hKU4YrnGYmKET_jfD0"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <p className="text-sm font-medium text-slate-400">
                          <span className="font-bold text-slate-300">Marcus</span> left a comment on your canvas
                        </p>
                        <p className="text-xs text-slate-600 mt-1">24h ago</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button className="px-4 py-2 text-slate-500 text-xs font-bold hover:text-white transition-all" type="button">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : activeView === 'activity' ? (
              <>
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-start">Recent Actions</h3>
                      <p className="text-sm text-slate-500">Chronological track of your platform interactions</p>
                    </div>
                    <button className="text-xs text-primary font-bold hover:underline" type="button">
                      Mark all as seen
                    </button>
                  </div>
                  <div className="space-y-0">
                    <div className="activity-item relative flex items-start pb-12 activity-line">
                      <div className="z-10 w-12 h-12 flex-shrink-0 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mr-6">
                        <span className="material-symbols-outlined text-blue-400">login</span>
                      </div>
                      <div className="flex-1 pt-1 text-start">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-100 ">Login</h4>
                          <span className="text-xs text-slate-500">Today, 10:42 AM</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">Session started from Chrome on macOS (IP: 192.168.1.45)</p>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                          1 hour ago
                        </span>
                      </div>
                    </div>

                    <div className="activity-item relative flex items-start pb-12 activity-line">
                      <div className="z-10 w-12 h-12 flex-shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mr-6">
                        <span className="material-symbols-outlined text-emerald-400">add_to_photos</span>
                      </div>
                      <div className="flex-1 pt-1 text-start">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-100">Created "Website Redesign" Canvas</h4>
                          <span className="text-xs text-slate-500">Today, 08:15 AM</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">A new collaborative workspace was initialized in the "Marketing" folder.</p>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                          3 hours ago
                        </span>
                      </div>
                    </div>

                    <div className="activity-item relative flex items-start pb-12 activity-line">
                      <div className="z-10 w-12 h-12 flex-shrink-0 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mr-6">
                        <span className="material-symbols-outlined text-purple-400">video_chat</span>
                      </div>
                      <div className="flex-1 pt-1 text-start">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-100">Joined "Weekly Sync" Meeting</h4>
                          <span className="text-xs text-slate-500">Yesterday, 02:00 PM</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">Attended session with 12 other participants. Duration: 45 minutes.</p>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                          Yesterday
                        </span>
                      </div>
                    </div>

                    <div className="activity-item relative flex items-start pb-12 activity-line">
                      <div className="z-10 w-12 h-12 flex-shrink-0 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center mr-6">
                        <span className="material-symbols-outlined text-rose-400">delete_forever</span>
                      </div>
                      <div className="flex-1 pt-1 text-start">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-100">Deleted "Old Draft" Canvas</h4>
                          <span className="text-xs text-slate-500">Yesterday, 11:30 AM</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">Workspace removed from "Personal" collection. Available in trash for 30 days.</p>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                          Yesterday
                        </span>
                      </div>
                    </div>

                    <div className="activity-item relative flex items-start pb-12 activity-line">
                      <div className="z-10 w-12 h-12 flex-shrink-0 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mr-6">
                        <span className="material-symbols-outlined text-amber-400">account_circle</span>
                      </div>
                      <div className="flex-1 pt-1 text-start">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-100">Updated Profile Picture</h4>
                          <span className="text-xs text-slate-500">Oct 22, 2023, 04:12 PM</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">Changed user avatar in Account Settings.</p>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                          2 days ago
                        </span>
                      </div>
                    </div>

                    <div className="activity-item relative flex items-start">
                      <div className="z-10 w-12 h-12 flex-shrink-0 bg-slate-500/10 border border-slate-500/20 rounded-xl flex items-center justify-center mr-6">
                        <span className="material-symbols-outlined text-slate-400">logout</span>
                      </div>
                      <div className="flex-1 pt-1 text-start">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-100">Log out</h4>
                          <span className="text-xs text-slate-500">Oct 21, 2023, 09:05 PM</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">Manual session termination from desktop client.</p>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">
                          3 days ago
                        </span>
                      </div>
                    </div>
                  </div>
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
                        <button className="px-5 py-2 bg-rose-500 text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all" type="button">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
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
                            canvasFilter === 'shared'
                              ? 'bg-primary text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('shared')}
                          type="button"
                        >
                          Shared
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
                      </button>

                      {filteredFolderCanvases.map((canvas) => (
                        <div
                          key={canvas.id}
                          className={`group h-64 flex flex-col bg-[#1a242f] border border-[#2d3a4b] rounded-xl overflow-hidden hover:shadow-2xl transition-all border-b-4 ${canvas.border}`}
                        >
                          <div className="flex-1 bg-[#101922] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#101922]/60 backdrop-blur-sm z-20">
                              <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-lg" type="button">
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
                                  canvas.tagColor === 'emerald'
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
                              <button className="text-slate-500 hover:text-primary" type="button">
                                <span className="material-icons text-lg">more_vert</span>
                              </button>
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
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            className="group flex items-center p-4 bg-[#1a242f] border border-[#2d3a4b] rounded-xl hover:border-primary cursor-pointer transition-all text-left"
                            onClick={() => setActiveFolderId(folder.id)}
                            type="button"
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-colors ${
                                folder.accent === 'blue'
                                  ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'
                                  : folder.accent === 'amber'
                                  ? 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
                                  : folder.accent === 'emerald'
                                  ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                                  : 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'
                              }`}
                            >
                              <span className="material-symbols-outlined">folder</span>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">{folder.name}</p>
                              <p className="text-[10px] text-slate-500">{folder.count} canvases</p>
                            </div>
                          </button>
                        ))}
                        <button className="group flex items-center justify-center p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 cursor-pointer transition-all" type="button">
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
                            canvasFilter === 'shared'
                              ? 'bg-primary text-white'
                              : 'text-slate-400 hover:text-white hover:bg-[#101922]'
                          }`}
                          onClick={() => setCanvasFilter('shared')}
                          type="button"
                        >
                          Shared
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
                      </button>

                      {filteredAllCanvases.map((canvas) => (
                        <div
                          key={canvas.id}
                          className={`group bg-[#1a242f] border border-[#2d3a4b] rounded-xl overflow-hidden hover:shadow-2xl transition-all border-b-4 ${canvas.border}`}
                        >
                          <div className="h-40 bg-[#101922] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#101922]/60 backdrop-blur-sm z-20">
                              <button
                                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-lg"
                                onClick={() => navigate(`/paint/${canvas.id}`)}
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
                                  canvas.tagColor === 'emerald'
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
                              <button className="text-slate-500 hover:text-primary" type="button">
                                <span className="material-icons text-lg">more_vert</span>
                              </button>
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
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

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
                Host Meeting
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
    </div>
  );
}