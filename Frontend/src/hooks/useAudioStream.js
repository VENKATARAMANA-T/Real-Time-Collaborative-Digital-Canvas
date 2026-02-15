import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Teams-like Audio System:
 * - Mic ON: Request microphone, add tracks to peers, speak + receive
 * - Mic OFF: No microphone request, listen-only mode
 * - Refresh: Restore exact state without permission dialogs
 */
export const useAudioStream = ({ micEnabled = true, videoEnabled = true, meetingId, userId, socket, participants }) => {
  const [localStream, setLocalStream] = useState(null);
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteVideoStreams, setRemoteVideoStreams] = useState({});
  const [audioError, setAudioError] = useState(null);
  const [videoError, setVideoError] = useState(null);

  const peerConnectionsRef = useRef({});
  const remoteAudioElementsRef = useRef({});
  const localStreamRef = useRef(null);
  const handlerRefs = useRef({});
  const micEnabledRef = useRef(micEnabled); // Keep latest mic state for track handlers
  const videoEnabledRef = useRef(videoEnabled);
  const iceServersRef = useRef([
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ]);
  const participantMapRef = useRef({});
  const localVideoStreamRef = useRef(null);

  // Update mic state ref whenever it changes
  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);

  useEffect(() => {
    videoEnabledRef.current = videoEnabled;
  }, [videoEnabled]);

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

  // Get camera video stream from browser
  const requestCamera = useCallback(async () => {
    if (localVideoStreamRef.current) {
      console.log('✅ Camera already initialized');
      return localVideoStreamRef.current;
    }

    try {
      console.log('📷 Requesting camera from browser...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      });

      localVideoStreamRef.current = stream;
      setLocalVideoStream(stream);
      setVideoError(null);
      console.log('✅ Camera granted - ready to share video\n');
      return stream;
    } catch (error) {
      console.error('❌ Camera denied:', error.message);
      setVideoError('Camera access denied');
      return null;
    }
  }, []);

  // Release camera back to OS
  const releaseCamera = useCallback(() => {
    if (localVideoStreamRef.current) {
      console.log('🛑 Releasing camera - stopping all video tracks');
      localVideoStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`   Stopped: ${track.label}`);
      });
      localVideoStreamRef.current = null;
      setLocalVideoStream(null);
      console.log('✅ Camera released\n');
    }
  }, []);

  // Add audio tracks to peer connection
  const addAudioTracksToPeer = useCallback(async (peerConnection, participantId) => {
    if (!localStreamRef.current) return false;

    const senders = peerConnection.getSenders();
    const hasAudio = senders.some(s => s.track?.kind === 'audio');

    if (!hasAudio) {
      console.log(`   ➕ Adding audio to ${participantMapRef.current[participantId]}`);
      localStreamRef.current.getAudioTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
      return true;
    }
    return false;
  }, []);

  // Remove audio tracks from peer connection
  const removeAudioTracksFromPeer = useCallback(async (peerConnection, participantId) => {
    const senders = peerConnection.getSenders();
    const audioSenders = senders.filter(s => s.track?.kind === 'audio');

    if (audioSenders.length > 0) {
      console.log(`   ➖ Removing audio from ${participantMapRef.current[participantId]}`);
      for (const sender of audioSenders) {
        await peerConnection.removeTrack(sender);
      }
      return true;
    }
    return false;
  }, []);

  // Add video tracks to peer connection
  const addVideoTracksToPeer = useCallback(async (peerConnection, participantId) => {
    if (!localVideoStreamRef.current) return false;

    const senders = peerConnection.getSenders();
    const hasVideo = senders.some(s => s.track?.kind === 'video');

    if (!hasVideo) {
      console.log(`   ➕ Adding video to ${participantMapRef.current[participantId]}`);
      localVideoStreamRef.current.getVideoTracks().forEach(track => {
        peerConnection.addTrack(track, localVideoStreamRef.current);
      });
      return true;
    }
    return false;
  }, []);

  // Renegotiate with specific peer
  const renegotiateWithPeer = useCallback(async (peerConnection, participantId) => {
    if (peerConnection.signalingState !== 'stable') {
      console.log(`   ⏳ ${participantMapRef.current[participantId]} busy, skipping`);
      return;
    }

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('webrtc_offer', {
        meetingId,
        from: userId,
        to: participantId,
        offer
      });
      console.log(`   📤 Sent offer`);
    } catch (error) {
      console.error(`   Error:`, error.message);
    }
  }, [socket, meetingId, userId]);

  // Renegotiate with all peers
  const renegotiateWithAllPeers = useCallback(async () => {
    for (const participantId in peerConnectionsRef.current) {
      await renegotiateWithPeer(peerConnectionsRef.current[participantId], participantId);
    }
  }, [renegotiateWithPeer]);

  // **MAIN: Handle mic enable/disable**
  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (micEnabled) {
        console.log('\n🎤 MICROPHONE: ENABLING');
        
        // Step 1: Get microphone from browser
        if (!localStreamRef.current) {
          console.log('   Step 1/3: Requesting microphone...');
          const stream = await requestMicrophone();
          if (!stream || !isMounted) {
            console.log('   ❌ Failed to get microphone or component unmounted');
            return;
          }
          localStreamRef.current = stream;
        }

        // Wait a tick for refs to update
        await new Promise(r => setTimeout(r, 10));

        // Step 2: Add audio to all existing peer connections
        const peerIds = Object.keys(peerConnectionsRef.current);
        if (peerIds.length > 0 && isMounted) {
          console.log(`   Step 2/3: Adding audio to ${peerIds.length} peer connections...`);
          for (const participantId of peerIds) {
            const pc = peerConnectionsRef.current[participantId];
            if (pc && isMounted) {
              await addAudioTracksToPeer(pc, participantId);
            }
          }
        }

        // Step 3: Renegotiate with all peers
        const peerIds2 = Object.keys(peerConnectionsRef.current);
        if (peerIds2.length > 0 && isMounted) {
          console.log('   Step 3/3: Renegotiating...');
          for (const participantId of peerIds2) {
            const pc = peerConnectionsRef.current[participantId];
            if (pc && isMounted) {
              await renegotiateWithPeer(pc, participantId);
            }
          }
        }

        if (isMounted) {
          console.log('✅ Ready to speak and receive audio\n');
        }
      } else {
        console.log('\n🔇 MICROPHONE: DISABLING');
        
        const peerIds = Object.keys(peerConnectionsRef.current);

        // Step 1: Remove audio from all peer connections
        if (peerIds.length > 0 && isMounted) {
          console.log(`   Step 1/3: Removing audio from ${peerIds.length} connections...`);
          for (const participantId of peerIds) {
            const pc = peerConnectionsRef.current[participantId];
            if (!pc || !isMounted) continue;
            
            const senders = pc.getSenders();
            const audioSenders = senders.filter(s => s.track?.kind === 'audio');
            for (const sender of audioSenders) {
              try {
                await pc.removeTrack(sender);
                console.log(`   ➖ Removed audio from ${participantMapRef.current[participantId]}`);
              } catch (error) {
                console.error(`   Error removing track:`, error.message);
              }
            }
          }
        }

        // Step 2: Renegotiate to inform peers of track removal
        if (peerIds.length > 0 && isMounted) {
          console.log('   Step 2/3: Renegotiating (informing peers)...');
          for (const participantId of peerIds) {
            const pc = peerConnectionsRef.current[participantId];
            if (pc && isMounted) {
              await renegotiateWithPeer(pc, participantId);
            }
          }
        }

        // Step 3: Release microphone COMPLETELY from OS
        if (isMounted) {
          console.log('   Step 3/3: Releasing microphone from OS...');
          if (localStreamRef.current) {
            console.log('   Stopping tracks...');
            localStreamRef.current.getTracks().forEach(track => {
              console.log(`     ✋ Stopping ${track.kind} track: ${track.label}`);
              track.stop();
            });
            
            // Force clear
            localStreamRef.current = null;
            setLocalStream(null);
            
            console.log('✅ Microphone completely released\n');
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [micEnabled, requestMicrophone, addAudioTracksToPeer, renegotiateWithPeer]);

  // **MAIN: Handle video enable/disable**
  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (videoEnabled) {
        console.log('\n📷 CAMERA: ENABLING');

        if (!localVideoStreamRef.current) {
          console.log('   Step 1/3: Requesting camera...');
          const stream = await requestCamera();
          if (!stream || !isMounted) {
            console.log('   ❌ Failed to get camera or component unmounted');
            return;
          }
          localVideoStreamRef.current = stream;
        }

        await new Promise(r => setTimeout(r, 10));

        const peerIds = Object.keys(peerConnectionsRef.current);
        if (peerIds.length > 0 && isMounted) {
          console.log(`   Step 2/3: Adding video to ${peerIds.length} peer connections...`);
          for (const participantId of peerIds) {
            const pc = peerConnectionsRef.current[participantId];
            if (pc && isMounted) {
              await addVideoTracksToPeer(pc, participantId);
            }
          }
        }

        if (peerIds.length > 0 && isMounted) {
          console.log('   Step 3/3: Renegotiating...');
          for (const participantId of peerIds) {
            const pc = peerConnectionsRef.current[participantId];
            if (pc && isMounted) {
              await renegotiateWithPeer(pc, participantId);
            }
          }
        }

        if (isMounted) {
          console.log('✅ Ready to send video\n');
        }
      } else {
        console.log('\n🚫 CAMERA: DISABLING');

        const peerIds = Object.keys(peerConnectionsRef.current);

        if (peerIds.length > 0 && isMounted) {
          console.log(`   Step 1/3: Removing video from ${peerIds.length} connections...`);
          for (const participantId of peerIds) {
            const pc = peerConnectionsRef.current[participantId];
            if (!pc || !isMounted) continue;

            const senders = pc.getSenders();
            const videoSenders = senders.filter(s => s.track?.kind === 'video');
            for (const sender of videoSenders) {
              try {
                await pc.removeTrack(sender);
                console.log(`   ➖ Removed video from ${participantMapRef.current[participantId]}`);
              } catch (error) {
                console.error(`   Error removing video:`, error.message);
              }
            }
          }
        }

        if (peerIds.length > 0 && isMounted) {
          console.log('   Step 2/3: Renegotiating (informing peers)...');
          for (const participantId of peerIds) {
            const pc = peerConnectionsRef.current[participantId];
            if (pc && isMounted) {
              await renegotiateWithPeer(pc, participantId);
            }
          }
        }

        if (isMounted) {
          console.log('   Step 3/3: Releasing camera from OS...');
          if (localVideoStreamRef.current) {
            localVideoStreamRef.current.getTracks().forEach(track => {
              console.log(`     ✋ Stopping ${track.kind} track: ${track.label}`);
              track.stop();
            });
            localVideoStreamRef.current = null;
            setLocalVideoStream(null);
            console.log('✅ Camera completely released\n');
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [videoEnabled, requestCamera, addVideoTracksToPeer, renegotiateWithPeer]);

  // Create peer connection
  const createPeerConnection = useCallback(async (participantId, isInitiator) => {
    if (peerConnectionsRef.current[participantId]) {
      console.log(`✅ Peer connection already exists for ${participantMapRef.current[participantId]}`);
      return peerConnectionsRef.current[participantId];
    }

    console.log(`\n🔗 Creating peer connection with ${participantMapRef.current[participantId] || participantId}`);
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

    // Remote audio track - ALWAYS handler for receiving audio
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const name = participantMapRef.current[participantId] || 'User';

      const hasAudio = remoteStream.getAudioTracks().length > 0;
      const hasVideo = remoteStream.getVideoTracks().length > 0;

      if (hasAudio) {
        setRemoteStreams(prev => ({ ...prev, [participantId]: remoteStream }));

        const audioId = `remote-audio-${participantId}`;
        let audio = document.getElementById(audioId);

        if (!audio) {
          audio = new Audio();
          audio.id = audioId;
          audio.autoplay = true;
          audio.playsInline = true;
          document.body.appendChild(audio);
          remoteAudioElementsRef.current[participantId] = audio;
        }

        if (audio.srcObject !== remoteStream) {
          audio.srcObject = remoteStream;
          console.log(`📥 Playing live audio from ${name}`);
          audio.play().catch(e => {
            console.warn('Autoplay blocked. User needs to click the page first.', e);
          });
        }
      }

      if (hasVideo) {
        setRemoteVideoStreams(prev => ({ ...prev, [participantId]: remoteStream }));

        const handleVideoRemoval = () => {
          if (remoteStream.getVideoTracks().length === 0) {
            setRemoteVideoStreams(prev => {
              const next = { ...prev };
              delete next[participantId];
              return next;
            });
          }
        };

        remoteStream.onremovetrack = handleVideoRemoval;
        remoteStream.getVideoTracks().forEach(track => {
          track.onended = handleVideoRemoval;
        });
      }
    };

    // Connection state
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔌 Connection state: ${peerConnection.connectionState} for ${participantMapRef.current[participantId]}`);
      if (
        peerConnection.connectionState === 'failed' ||
        peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'closed'
      ) {
        cleanupPeerConnection(participantId);
      }
    };

    peerConnectionsRef.current[participantId] = peerConnection;

    // Step 1: Add local audio FIRST (if mic enabled)
    if (micEnabledRef.current && localStreamRef.current) {
      console.log(`   ➕ Adding local tracks (mic is enabled)`);
      await addAudioTracksToPeer(peerConnection, participantId);
    } else {
      console.log(`   ⏭️ Skipping local tracks (mic is disabled or no stream)`);
    }

    if (videoEnabledRef.current && localVideoStreamRef.current) {
      console.log(`   ➕ Adding local video tracks (camera is enabled)`);
      await addVideoTracksToPeer(peerConnection, participantId);
    }

    // Step 2: Send offer AFTER tracks are added (if initiator)
    if (isInitiator) {
      try {
        console.log(`   📤 Sending offer to ${participantMapRef.current[participantId]}`);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('webrtc_offer', {
          meetingId,
          from: userId,
          to: participantId,
          offer
        });
      } catch (error) {
        console.error('   ❌ Error creating offer:', error.message);
      }
    }

    return peerConnection;
  }, [addAudioTracksToPeer, socket, meetingId, userId]);

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

    setRemoteVideoStreams(prev => {
      const next = { ...prev };
      delete next[participantId];
      return next;
    });
  }, []);

  // Setup WebRTC signaling handlers
  const setupSignalingHandlers = useCallback(() => {
    handlerRefs.current.handleIncomingOffer = async (data) => {
      try {
        const { from, to, offer } = data;
        if (to && to !== userId) return;
        if (from === userId) return;

        console.log(`\n📥 Received offer from ${participantMapRef.current[from]}`);

        let pc = peerConnectionsRef.current[from];
        if (pc && (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed')) {
          console.log(`   Stale connection detected - recreating`);
          cleanupPeerConnection(from);
          pc = null;
        }

        if (!pc) {
          console.log(`   Creating connection (offer arrived first)`);
          pc = await createPeerConnection(from, false);
        }

        if (!pc) return;

        // Polite peer pattern for collision handling
        if (pc.signalingState === 'have-local-offer') {
          console.log(`   Collision detected - using polite peer pattern`);
          if (userId < from) {
            console.log(`   I'm polite - rolling back my offer`);
            await pc.setLocalDescription({ type: 'rollback' });
          } else {
            console.log(`   I'm impolite - ignoring their offer`);
            return;
          }
        }

        console.log(`   Setting remote description...`);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        console.log(`   Creating answer...`);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log(`   Sending answer...`);
        socket.emit('webrtc_answer', {
          meetingId,
          from: userId,
          to: from,
          answer
        });
      } catch (error) {
        console.error('❌ Offer error:', error.message);
      }
    };

    handlerRefs.current.handleIncomingAnswer = async (data) => {
      try {
        const { from, to, answer } = data;
        if (to && to !== userId) return;
        if (from === userId) return;

        console.log(`\n📤 Got answer from ${participantMapRef.current[from]}`);

        const pc = peerConnectionsRef.current[from];
        if (pc?.signalingState === 'have-local-offer') {
          console.log(`   Setting remote description (answer)`);
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } else {
          console.log(`   ⚠️ Expected have-local-offer but got ${pc?.signalingState}`);
        }
      } catch (error) {
        console.error('❌ Answer error:', error.message);
      }
    };

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
  }, [createPeerConnection, socket, meetingId, userId, cleanupPeerConnection]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up audio system on unmount');
      // Release microphone
      if (localStreamRef.current) {
        console.log('   Stopping local stream...');
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (localVideoStreamRef.current) {
        console.log('   Stopping local video stream...');
        localVideoStreamRef.current.getTracks().forEach(track => track.stop());
        localVideoStreamRef.current = null;
      }
      // Close all peer connections
      cleanupAllPeerConnections();
    };
  }, [cleanupAllPeerConnections]);

  return {
    localStream,
    localVideoStream,
    remoteStreams,
    remoteVideoStreams,
    audioError,
    videoError,
    initializeLocalStream: requestMicrophone,
    stopLocalStream: releaseMicrophone,
    initializeVideoStream: requestCamera,
    stopVideoStream: releaseCamera,
    setMicStatus: () => {}, // Mic controlled via micEnabled prop only
    setVideoStatus: () => {}, // Video controlled via videoEnabled prop only
    cleanupAllPeerConnections,
    handleParticipantLeft,
    initializeAudioConnections
  };
};

