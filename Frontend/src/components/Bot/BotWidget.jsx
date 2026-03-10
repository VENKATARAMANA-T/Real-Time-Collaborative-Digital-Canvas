import React, { useState, useEffect, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import './BotWidget.css';

const BotWidget = ({ onClose, onAction, contextSnapshot }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your AI Assistant. I can help you understand the platform or even perform actions on the canvas for you. Try asking me to 'Draw a red circle'!" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    // Always keep the latest onAction so stale closures in setTimeouts never use an old one
    const onActionRef = useRef(onAction);
    useEffect(() => { onActionRef.current = onAction; }, [onAction]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAction = (fullContent) => {
        // Balanced-bracket parser — handles nested arrays in DRAW_MULTIPLE correctly
        let cleanedContent = fullContent;
        const actions = [];
        let i = 0;
        while (i < fullContent.length) {
            const start = fullContent.indexOf('[ACTION:', i);
            if (start === -1) break;
            const jsonStart = fullContent.indexOf('{', start);
            if (jsonStart === -1) break;
            // Count braces to find the matching closing }
            let depth = 0;
            let jsonEnd = -1;
            for (let j = jsonStart; j < fullContent.length; j++) {
                if (fullContent[j] === '{') depth++;
                else if (fullContent[j] === '}') {
                    depth--;
                    if (depth === 0) { jsonEnd = j; break; }
                }
            }
            if (jsonEnd === -1) break;
            const closingBracket = fullContent.indexOf(']', jsonEnd);
            if (closingBracket === -1) break;

            const jsonStr  = fullContent.slice(jsonStart, jsonEnd + 1);
            const fullTag  = fullContent.slice(start, closingBracket + 1);
            try {
                const actionData = JSON.parse(jsonStr);
                actions.push(actionData);
            } catch (e) {
                console.error('Failed to parse AI action:', e, jsonStr);
            }
            cleanedContent = cleanedContent.replace(fullTag, '');
            i = closingBracket + 1;
        }
        // Dispatch actions with small delays so React re-renders between each
        // (prevents stale closure when CLEAR is followed by DRAW etc.)
        // Use onActionRef so each callback uses the latest handleBotAction from PaintApp
        actions.forEach((action, idx) => {
            setTimeout(() => onActionRef.current?.(action), idx * 80);
        });
        return cleanedContent.trim();
    };

    // Strip any partial or complete [ACTION: ...] blocks from display during streaming
    const stripActionForDisplay = (text) => {
        // Remove complete [ACTION: {...}] tags (handles nested braces/arrays)
        let clean = text;
        let found = true;
        while (found) {
            found = false;
            const start = clean.indexOf('[ACTION:');
            if (start === -1) break;
            const jsonStart = clean.indexOf('{', start);
            if (jsonStart === -1) { clean = clean.slice(0, start); break; }
            let depth = 0, jsonEnd = -1;
            for (let j = jsonStart; j < clean.length; j++) {
                if (clean[j] === '{') depth++;
                else if (clean[j] === '}') { depth--; if (depth === 0) { jsonEnd = j; break; } }
            }
            if (jsonEnd === -1) { clean = clean.slice(0, start); break; }
            const closingBracket = clean.indexOf(']', jsonEnd);
            if (closingBracket === -1) { clean = clean.slice(0, start); break; }
            clean = clean.slice(0, start) + clean.slice(closingBracket + 1);
            found = true;
        }
        return clean.trim();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        let assistantMessage = '';
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bot/chat`;

            await fetchEventSource(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    message: userMessage,
                    contextSnapshot: contextSnapshot || {}
                }),
                onmessage(msg) {
                    if (msg.data === '[DONE]') {
                        setIsTyping(false);
                        // On stream end: process full message — execute actions, clean display
                        const finalClean = handleAction(assistantMessage);
                        setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1].content = finalClean;
                            return newMessages;
                        });
                        return;
                    }
                    try {
                        const { content, error } = JSON.parse(msg.data);
                        if (content) {
                            assistantMessage += content;
                            // During streaming: hide [ACTION:...] block from display
                            const displayContent = stripActionForDisplay(assistantMessage);
                            setMessages(prev => {
                                const newMessages = [...prev];
                                newMessages[newMessages.length - 1].content = displayContent;
                                return newMessages;
                            });
                        }
                    } catch (err) {
                        console.error('Error parsing stream chunk:', err);
                    }
                },
                onerror(err) {
                    console.error("SSE Error:", err);
                    setIsTyping(false);
                    throw err;
                }
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsTyping(false);
            const errorMessage = error?.message?.includes('GROQ')
                ? "The AI bot is not configured. Please ask your administrator to set up the GROQ_API_KEY."
                : error?.message?.includes('Network')
                ? "Network error. Please check if the backend server is running."
                : "Sorry, I encountered an error connecting to the AI service. Please make sure the backend is running and the GROQ_API_KEY is configured.";
            setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: errorMessage, isError: true }]);
        }
    };

    return (
        <div className="bot-widget-container animate-in fade-in zoom-in duration-300">
            <div className="bot-widget-header">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ color: '#137fec', fontSize: '22px', fontFamily: "'Material Symbols Outlined'" }}>smart_toy</span>
                    <span className="font-bold text-[15px]">AI Assistant</span>
                </div>
                <button onClick={onClose} title="Close" className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-white/50 hover:text-white" style={{ fontSize: '20px', fontFamily: "'Material Symbols Outlined'" }}>close</span>
                </button>
            </div>

            <div className="bot-widget-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`message-bubble ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isTyping && (
                    <div className="message-bubble assistant typing">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="bot-widget-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    autoFocus
                />
                <button type="submit" disabled={isTyping} title="Send message">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', fontFamily: "'Material Symbols Outlined'" }}>send</span>
                </button>
            </form>
        </div>
    );
};

export default BotWidget;
