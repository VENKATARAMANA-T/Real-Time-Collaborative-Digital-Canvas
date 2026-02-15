import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Teams-like Audio System:
 * - Mic ON: Request microphone, add tracks to peers, speak + receive
 * - Mic OFF: No microphone request, listen-only mode
 * - Refresh: Restore exact state without permission dialogs
 */
export const useAudioStream = ({ micEnabled = true, meetingId, userId, socket, participants }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [audioError, setAudioError] = useState(null);

  const peerConnectionsRef = useRef({});
  const remoteAudioElementsRef = useRef({});
  const localStreamRef = useRef(null);
  const handlerRefs = useRef({});
  const iceServersRef = useRef([
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ]);
  const participantMapRef = useRef({});

  // Track participant names
  useEffect(() => {
    participants.forEach(p => {
      participantMapRef.current[p._id || p.id] = p.username;
    });
  }, [participants]);

  // Get microphone audio stream from browser
  const requestMicrophone = useCallback(async () => {
    if (localStreamRef.current) {
      console.log('✅ Microphone already initialized');
      return localStreamRef.current;
    }

    try {
      console.log('🎤 Requesting microphone from browser...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioError(null);
      console.log('✅ Microphone granted - ready to speak\n');
      return stream;
    } catch (error) {
      console.error('❌ Microphone denied:', error.message);
      setAudioError('Microphone access denied');
      return null;
    }
  }, []);

  // Release microphone back to OS
  const releaseMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      console.log('🛑 Releasing microphone - stopping all tracks');
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`   Stopped: ${track.label}`);
      });
      localStreamRef.current = null;
      setLocalStream(null);
      console.log('✅ Microphone released\n');
    }
  }, []);
// Optimized Add Track
const addAudioTracksToPeer = useCallback(async (peerConnection) => {
  if (!localStreamRef.current) return;

  const tracks = localStreamRef.current.getAudioTracks();
  const senders = peerConnection.getSenders();

  tracks.forEach(track => {
    // Only add if not already being sent
    const alreadyExists = senders.some(s => s.track === track);
    if (!alreadyExists) {
      peerConnection.addTrack(track, localStreamRef.current);
    }
  });
}, []);

// Optimized Remove Track
const removeAudioTracksFromPeer = useCallback(async (peerConnection) => {
  const senders = peerConnection.getSenders();
  for (const sender of senders) {
    if (sender.track?.kind === 'audio') {
      // removeTrack is the correct way to stop sending without closing PC
      peerConnection.removeTrack(sender);
    }
  }
}, []);
  // Renegotiate with specific peer
 const renegotiateWithPeer = useCallback(async (peerConnection, participantId) => {
  // If the connection is busy, wait 500ms and try ONE more time instead of just skipping
  if (peerConnection.signalingState !== 'stable') {
    console.log(`⏳ ${participantMapRef.current[participantId]} busy, retrying in 500ms...`);
    setTimeout(() => renegotiateWithPeer(peerConnection, participantId), 500);
    return;
  }

  try {
    const offer = await peerConnection.createOffer();
    // Only set local description if state is still stable
    if (peerConnection.signalingState === 'stable') {
      await peerConnection.setLocalDescription(offer);
      socket.emit('webrtc_offer', {
        meetingId,
        from: userId,
        to: participantId,
        offer
      });
      console.log(`📤 Sent offer to ${participantMapRef.current[participantId]}`);
    }
  } catch (error) {
    console.error(`❌ Renegotiation Error:`, error.message);
  }
}, [socket, meetingId, userId]);
  // **MAIN: Handle mic enable/disable**
  useEffect(() => {
    (async () => {
      if (micEnabled) {
        console.log('\n🎤 MICROPHONE: ENABLING');
        
        // Step 1: Get microphone from browser
        const stream = await requestMicrophone();
        if (!stream) return;

        // Step 2: Add audio to all existing peer connections
        console.log('   Adding audio to peer connections...');
        for (const participantId in peerConnectionsRef.current) {
          await addAudioTracksToPeer(peerConnectionsRef.current[participantId], participantId);
        }

        // Step 3: Renegotiate with all peers
        console.log('   Renegotiating...');
        await renegotiateWithAllPeers();

        console.log('✅ Ready to speak and receive audio\n');
      } else {
        console.log('\n🔇 MICROPHONE: DISABLING');
        
        // Step 1: Remove audio from all peer connections
        console.log('   Removing audio from peer connections...');
        for (const participantId in peerConnectionsRef.current) {
          await removeAudioTracksFromPeer(peerConnectionsRef.current[participantId], participantId);
        }

        // Step 2: Renegotiate with all peers
        console.log('   Renegotiating...');
        await renegotiateWithAllPeers();

        // Step 3: Release microphone from OS (THIS RELEASES THE MIC INDICATOR)
        releaseMicrophone();

        console.log('✅ Listen-only mode (no microphone in use)\n');
      }
    })();
  }, [micEnabled, requestMicrophone, releaseMicrophone, addAudioTracksToPeer, removeAudioTracksFromPeer, renegotiateWithAllPeers]);

  // Create peer connection
  const createPeerConnection = useCallback(async (participantId, isInitiator) => {
    if (peerConnectionsRef.current[participantId]) {
      return peerConnectionsRef.current[participantId];
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    // ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
          meetingId,
          from: userId,
          to: participantId,
          candidate: event.candidate
        });
      }
    };

    // Remote audio track
   peerConnection.ontrack = (event) => {
  const [remoteStream] = event.streams;
  const name = participantMapRef.current[participantId] || 'User';
  
  setRemoteStreams(prev => ({ ...prev, [participantId]: remoteStream }));

  // Use a unique ID to find the element
  const audioId = `remote-audio-${participantId}`;
  let audio = document.getElementById(audioId);

  if (!audio) {
    audio = new Audio();
    audio.id = audioId;
    audio.autoplay = true;
    audio.playsInline = true; // Required for iOS/Safari
    document.body.appendChild(audio);
    remoteAudioElementsRef.current[participantId] = audio;
  }

  // Only update srcObject if it's new/different
  if (audio.srcObject !== remoteStream) {
    audio.srcObject = remoteStream;
    console.log(`📥 Playing live audio from ${name}`);
    audio.play().catch(e => {
       console.warn("Autoplay blocked. User needs to click the page first.", e);
    });
  }
};
    // Connection state
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        cleanupPeerConnection(participantId);
      }
    };

    peerConnectionsRef.current[participantId] = peerConnection;

    // Add local audio ONLY if mic is currently enabled
    if (micEnabled && localStreamRef.current) {
      await addAudioTracksToPeer(peerConnection, participantId);
    }

    // Send offer if initiator
    if (isInitiator) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('webrtc_offer', {
          meetingId,
          from: userId,
          to: participantId,
          offer
        });
      } catch (error) {
        console.error('Error creating offer:', error.message);
      }
    }

    return peerConnection;
  }, [micEnabled, addAudioTracksToPeer, socket, meetingId, userId]);

  // Setup WebRTC signaling handlers
  const setupSignalingHandlers = useCallback(() => {
    handlerRefs.current.handleIncomingOffer = async (data) => {
  try {
    const { from, to, offer } = data;
    if (to && to !== userId) return;
    if (from === userId) return;

    let pc = peerConnectionsRef.current[from];
    if (!pc) {
      pc = await createPeerConnection(from, false);
    }

    // BETTER POLITE PEER LOGIC
    // If we have a collision (we sent an offer and just received one)
    const isOfferCollision = 
      offer.type === "offer" && 
      (pc.signalingState !== "stable" || pc.makingOffer);

    if (isOfferCollision) {
      // If we are the 'polite' one (lower ID), we roll back our offer
      if (userId < from) { 
        console.log("🤝 Collision: I am polite, rolling back to accept remote offer");
        await Promise.all([
          pc.setLocalDescription({ type: "rollback" }),
          pc.setRemoteDescription(offer)
        ]);
      } else {
        console.log("✋ Collision: I am impolite, ignoring remote offer");
        return; // Impolite peer ignores the incoming offer
      }
    } else {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('webrtc_answer', { meetingId, from: userId, to: from, answer });
  } catch (error) {
    console.error('❌ Offer error:', error);
  }
};

    handlerRefs.current.handleIncomingAnswer = async (data) => {
      try {
        const { from, to, answer } = data;
        if (to && to !== userId) return;
        if (from === userId) return;

        const pc = peerConnectionsRef.current[from];
        if (pc?.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (error) {
        console.error('Answer error:', error.message);
      }
    };

  //   handlerRefs.current.handleIncomingICECandidate = async (data) => {
  //     try {
  //       const { from, to, candidate } = data;
  //       if (to && to !== userId) return;
  //       if (from === userId) return;

  //       const pc = peerConnectionsRef.current[from];
  //       if (pc) {
  //         await pc.addIceCandidate(new RTCIceCandidate(candidate));
  //       }
  //     } catch (error) {
  //       console.error('ICE error:', error.message);
  //     }
  //   };

  handlerRefs.current.handleIncomingICECandidate = async (data) => {
  const { from, to, candidate } = data;
  if (to && to !== userId) return;
  if (from === userId) return;

  const pc = peerConnectionsRef.current[from];
  if (!pc) return;

  try {
    // If the remote description isn't set yet, wait 250ms and try again
    if (!pc.remoteDescription || !pc.remoteDescription.type) {
      setTimeout(() => handlerRefs.current.handleIncomingICECandidate(data), 250);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    // Connection might have closed during the timeout, ignore errors
  }
};
  }, [createPeerConnection, socket, meetingId, userId]);


  // Cleanup peer connection
  const cleanupPeerConnection = useCallback((participantId) => {
    const pc = peerConnectionsRef.current[participantId];
    if (pc) {
      pc.close();
      delete peerConnectionsRef.current[participantId];
    }

    const audio = remoteAudioElementsRef.current[participantId];
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audio.parentNode?.removeChild(audio);
      delete remoteAudioElementsRef.current[participantId];
    }

    setRemoteStreams(prev => {
      const next = { ...prev };
      delete next[participantId];
      return next;
    });
  }, []);

  const cleanupAllPeerConnections = useCallback(() => {
    Object.keys(peerConnectionsRef.current).forEach(cleanupPeerConnection);
  }, [cleanupPeerConnection]);

  const handleParticipantLeft = useCallback((participantId) => {
    cleanupPeerConnection(participantId);
  }, [cleanupPeerConnection]);

  // Initialize audio connections with all participants
  const initializeAudioConnections = useCallback(async () => {
    if (!socket || !participants.length) return;

    const others = participants.filter(p => (p._id || p.id) !== userId);
    for (const participant of others) {
      if (!peerConnectionsRef.current[participant._id]) {
        await createPeerConnection(participant._id, true);
      }
    }
  }, [socket, participants, userId, createPeerConnection]);

  // Setup handlers once
  useEffect(() => {
    setupSignalingHandlers();
  }, [setupSignalingHandlers]);

  // Setup socket listeners (persistent)
  useEffect(() => {
    if (!socket || !meetingId) return;

    socket.on('webrtc_offer', handlerRefs.current.handleIncomingOffer);
    socket.on('webrtc_answer', handlerRefs.current.handleIncomingAnswer);
    socket.on('webrtc_ice_candidate', handlerRefs.current.handleIncomingICECandidate);

    return () => {
      socket.off('webrtc_offer', handlerRefs.current.handleIncomingOffer);
      socket.off('webrtc_answer', handlerRefs.current.handleIncomingAnswer);
      socket.off('webrtc_ice_candidate', handlerRefs.current.handleIncomingICECandidate);
    };
  }, [socket, meetingId]);

  return {
    localStream,
    remoteStreams,
    audioError,
    initializeLocalStream: requestMicrophone,
    stopLocalStream: releaseMicrophone,
    setMicStatus: () => {}, // Mic controlled via micEnabled prop only
    cleanupAllPeerConnections,
    handleParticipantLeft,
    initializeAudioConnections
  };
};
