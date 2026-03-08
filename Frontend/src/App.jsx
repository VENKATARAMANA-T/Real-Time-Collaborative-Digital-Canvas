import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaintApp from './pages/PaintApp.jsx';
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

function App() {
  

 return (
    <Router>
      <Routes>
        <Route path="/" element={<CollabCanvasApp />} />
        <Route path="/home" element={<CollabCanvasApp />} />
        {/* Previous dashboard route replaced with the new UI */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfileUI />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/activate/:token" element={<ActivateAccount />} />
        <Route path="/help" element={<HelpSystemUI />} />
        <Route path="/paint/:id" element={<PaintApp />} />
        <Route path="/paint" element={<PaintApp />} />
        <Route path="/meeting-canvas/:id" element={<MeetingCanvasEditor />} />
        <Route path="/meeting" element={<Meeting />} />
        <Route path="/meeting/:id" element={<Meeting />} />
        <Route path="/meeting-notes/:id" element={<MeetingNotes />} />
        <Route path="/join-link/:token" element={<JoinByLink />} />
        {/* Completed the routing for this */}
      </Routes>
    </Router>
  );
}

export default App;
