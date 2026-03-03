import React, { useState } from 'react';

const HelpOptionsButton = ({ onBotClick, onWalkthroughClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
            {/* Options Menu */}
            {isOpen && (
                <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={() => {
                            if (onWalkthroughClick) onWalkthroughClick();
                            else window.dispatchEvent(new CustomEvent('start-walkthrough'));
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-full shadow-lg border transition-all group"
                        style={{
                            background: '#1a242f',
                            borderColor: '#2d3a4b',
                        }}
                    >
                        <span className="material-icons text-sm group-hover:scale-110 transition-transform" style={{ color: '#137fec' }}>auto_awesome</span>
                        <span className="text-sm font-medium">Guided Walkthrough</span>
                    </button>

                    <button
                        onClick={() => {
                            onBotClick();
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-full shadow-lg border transition-all group"
                        style={{
                            background: '#1a242f',
                            borderColor: '#2d3a4b',
                        }}
                    >
                        <span className="material-icons text-sm group-hover:scale-110 transition-transform" style={{ color: '#3b9af5' }}>smart_toy</span>
                        <span className="text-sm font-medium">AI Assistant Bot</span>
                    </button>
                </div>
            )}

            {/* Main Help Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${isOpen ? 'rotate-90' : 'hover:scale-110'
                    } text-white`}
                style={{
                    background: isOpen ? '#2d3a4b' : 'linear-gradient(135deg, #137fec, #1065c0)',
                    boxShadow: isOpen ? 'none' : '0 4px 20px rgba(19,127,236,0.4)',
                }}
                title="Help & Support"
            >
                <span className="material-icons">{isOpen ? 'close' : 'help_outline'}</span>
            </button>
        </div>
    );
};

export default HelpOptionsButton;
