import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
	return apiUrl.replace(/\/api\/?$/, '');
};

export const useSocket = ({ meetingId, userId, username, silentJoin = false, refreshKey = null }) => {
	const [socket, setSocket] = useState(null);
	const socketUrl = useMemo(() => getSocketUrl(), []);

	useEffect(() => {
		if (!meetingId || !userId) return;

		const nextSocket = io(socketUrl, {
			withCredentials: true
		});

		nextSocket.emit('join_meeting', {
			meetingId,
			userId,
			username: username || 'Guest',
			silent: silentJoin
		});

		setSocket(nextSocket);

		return () => {
			const silentDisconnect = refreshKey ? sessionStorage.getItem(refreshKey) === '1' : false;
			nextSocket.emit('leave_meeting', {
				meetingId,
				silent: silentDisconnect
			});
			nextSocket.disconnect();
			setSocket(null);
		};
	}, [meetingId, userId, username, socketUrl, silentJoin, refreshKey]);

	return socket;
};
