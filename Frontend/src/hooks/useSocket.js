import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
	return apiUrl.replace(/\/api\/?$/, '');
};

export const useSocket = ({ meetingId, userId, username, silentJoin = false, refreshKey = null }) => {
	const [socket, setSocket] = useState(null);
	const socketUrl = useMemo(() => getSocketUrl(), []);
	const hasJoinedRef = useRef(false);

	useEffect(() => {
		// Need at least a userId to connect (meetingId is optional for dashboard mode)
		if (!userId) return;

		const nextSocket = io(socketUrl, {
			withCredentials: true,
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
		});

		const joinRooms = (silent) => {
			nextSocket.emit('join_user_room', { userId });
			if (meetingId) {
				nextSocket.emit('join_meeting', {
					meetingId,
					userId,
					username: username || 'Guest',
					silent
				});
			}
		};

		// Join rooms on initial connect
		nextSocket.on('connect', () => {
			if (!hasJoinedRef.current) {
				joinRooms(silentJoin);
				hasJoinedRef.current = true;
			} else {
				// Reconnect: re-join rooms silently (don't trigger join notifications)
				joinRooms(true);
				console.log('🔄 Socket reconnected, re-joined rooms');
			}
		});

		nextSocket.on('connect_error', (err) => {
			console.warn('⚠️ Socket connection error:', err.message);
		});

		setSocket(nextSocket);

		return () => {
			hasJoinedRef.current = false;
			if (meetingId) {
				const silentDisconnect = refreshKey ? sessionStorage.getItem(refreshKey) === '1' : false;
				nextSocket.emit('leave_meeting', {
					meetingId,
					silent: silentDisconnect
				});
			}
			nextSocket.disconnect();
			setSocket(null);
		};
	}, [meetingId, userId, username, socketUrl, silentJoin, refreshKey]);

	return socket;
};
