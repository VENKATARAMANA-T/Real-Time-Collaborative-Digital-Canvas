import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

const NotFoundWindow = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 items-center justify-center font-sans overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Glass Card */}
      <div className="relative z-10 p-10 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 shadow-2xl max-w-lg w-full text-center flex flex-col items-center">
        
        {/* Animated Icon */}
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse">
          <AlertCircle size={48} className="text-red-500" />
        </div>

        {/* 404 Text */}
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-zinc-100 mb-4 tracking-wide">Page Not Found</h2>
        
        <p className="text-zinc-400 mb-10 leading-relaxed">
          The canvas you are looking for seems to have been erased. <br/> The route you entered is invalid or has expired.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800/50 text-zinc-300 font-medium hover:bg-zinc-700/50 border border-zinc-700/50 transition-all hover:-translate-y-0.5"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:-translate-y-0.5"
          >
            <Home size={18} />
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundWindow;
