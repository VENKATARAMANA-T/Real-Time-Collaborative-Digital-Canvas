import { useEffect, useMemo, useState } from 'react';
import { chatAPI } from '../../services/api';

const formatTime = (timestamp) => {
	if (!timestamp) return '';
	return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function ChatBox({ meetingDbId, socket, currentUsername }) {
	const [messages, setMessages] = useState([]);
	const [inputValue, setInputValue] = useState('');
	const [flash, setFlash] = useState(null);

	const normalizedUsername = useMemo(() => currentUsername || 'Me', [currentUsername]);

	useEffect(() => {
		if (!meetingDbId) return;

		const loadHistory = async () => {
			try {
				const data = await chatAPI.getHistory(meetingDbId);
				const history = (data.messages || []).map((msg, index) => ({
					id: `${meetingDbId}-${index}`,
					username: msg.username,
					msg: msg.msg,
					time: msg.time
				}));
				setMessages(history);
			} catch (error) {
				setFlash('Failed to load chat history');
				window.setTimeout(() => setFlash(null), 3000);
			}
		};

		loadHistory();
	}, [meetingDbId]);

	useEffect(() => {
		if (!socket) return;

		const handleReceive = (message) => {
			setMessages((prev) => [
				...prev,
				{
					id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					username: message.username,
					msg: message.msg,
					time: Date.now()
				}
			]);
		};

		const handleError = (payload) => {
			const message = payload?.message || 'Chat error';
			setFlash(message);
			window.setTimeout(() => setFlash(null), 3000);
		};

		socket.on('receive_message', handleReceive);
		socket.on('chat_error', handleError);

		return () => {
			socket.off('receive_message', handleReceive);
			socket.off('chat_error', handleError);
		};
	}, [socket]);

	const handleSend = () => {
		const trimmed = inputValue.trim();
		if (!trimmed || !socket || !meetingDbId) return;
		socket.emit('send_message', { meetingId: meetingDbId, msg: trimmed });
		setInputValue('');
	};

	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="flex-1 flex flex-col h-full">
			<div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
				{messages.length === 0 && (
					<div className="text-xs text-slate-500">No messages yet.</div>
				)}
				{messages.map((message) => {
					const isMe = message.username === normalizedUsername;
					return (
						<div key={message.id} className="space-y-2">
							<div className="flex items-center justify-between">
								<span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-primary' : 'text-slate-400'}`}>
									{isMe ? 'Me' : message.username}
								</span>
								<span className="text-[9px] text-slate-500">{formatTime(message.time)}</span>
							</div>
							<div
								className={`border rounded-2xl p-3 text-sm shadow-sm ${
									isMe
										? 'bg-primary/10 border-primary/20 text-slate-200 rounded-tr-none'
										: 'bg-white/5 border-white/5 text-slate-300 rounded-tl-none'
								}`}
							>
								{message.msg}
							</div>
						</div>
					);
				})}
			</div>

			<div className="p-4 border-t border-border-dark bg-background-dark">
				{flash && (
					<div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
						{flash}
					</div>
				)}
				<div className="relative">
					<input
						type="text"
						placeholder="Type..."
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
						onKeyDown={handleKeyDown}
						className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all pr-12"
					/>
					<button
						className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
						onClick={handleSend}
						type="button"
					>
						<span className="material-symbols-outlined text-[20px] filled">send</span>
					</button>
				</div>
			</div>
		</div>
	);
}

export default ChatBox;
