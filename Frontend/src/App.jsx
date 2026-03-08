import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaintApp from './pages/PaintApp.jsx';
import SharedCanvas from './pages/SharedCanvas.jsx';
import Meeting from './pages/Meeting.jsx';
import MeetingCanvasEditor from './pages/MeetingCanvasEditor.jsx';
import MeetingNotes from './pages/MeetingNotes.jsx';
import HelpSystemUI from './pages/HelpSystemUI.jsx'; 
import CollabCanvasApp from './components/HomePage/CollabCanvasApp.jsx';
import UserProfileUI from './pages/UserProfileUI.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import ActivateAccount from './pages/ActivateAccount.jsx';
import JoinByLink from './pages/JoinByLink.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NotFoundWindow from './pages/NotFoundWindow.jsx';

function App() {
  

 return (
    <Router>
      <Routes>
        {/* Auth & Public Routes */}
        <Route path="/" element={<CollabCanvasApp />} />
        <Route path="/home" element={<CollabCanvasApp />} />
        <Route path="/login" element={<CollabCanvasApp initialShowAuth={true} initialAuthMode="login" />} />
        <Route path="/register" element={<CollabCanvasApp initialShowAuth={true} initialAuthMode="register" />} />
        <Route path="/forgot-password" element={<CollabCanvasApp initialShowAuth={true} initialAuthMode="forgot" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/activate/:token" element={<ActivateAccount />} />
        <Route path="/shared/:shareToken" element={<SharedCanvas />} />
        <Route path="/join-link/:token" element={<JoinByLink />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfileUI /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><HelpSystemUI /></ProtectedRoute>} />
        <Route path="/paint/:id" element={<ProtectedRoute><PaintApp /></ProtectedRoute>} />
        <Route path="/paint" element={<ProtectedRoute><PaintApp /></ProtectedRoute>} />
        <Route path="/meeting-canvas/:id" element={<ProtectedRoute><MeetingCanvasEditor /></ProtectedRoute>} />
        <Route path="/meeting" element={<ProtectedRoute><Meeting /></ProtectedRoute>} />
        <Route path="/meeting/:id" element={<ProtectedRoute><Meeting /></ProtectedRoute>} />
        <Route path="/meeting-notes/:id" element={<ProtectedRoute><MeetingNotes /></ProtectedRoute>} />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundWindow />} />
      </Routes>
    </Router>
  );
}

export default App;
