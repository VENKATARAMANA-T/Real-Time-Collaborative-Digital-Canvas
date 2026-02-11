import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaintApp from './pages/PaintApp.jsx';
import HelpSystemUI from './pages/HelpSystemUI.jsx'; 
import CollabCanvasApp from './components/HomePage/CollabCanvasApp.jsx';
import UserProfileUI from './pages/UserProfileUI.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

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
        <Route path="/help" element={<HelpSystemUI />} />
        <Route path="/paint/:id" element={<PaintApp />} />
        <Route path="/paint" element={<PaintApp />} />
        {/* Completed the routing for this */}
      </Routes>
    </Router>
  );
}

export default App;
