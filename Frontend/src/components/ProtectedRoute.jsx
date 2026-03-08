import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 items-center justify-center">
        <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-lg">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login without saving the attempted URL
    // (Only shared links like JoinByLink or SharedCanvas should save their URL for post-login redirect)
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
