import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaintApp from './pages/PaintApp.jsx';
import HelpSystemUI from './pages/HelpSystemUI.jsx'; 
import CollabCanvasApp from './components/HomePage/CollabCanvasApp.jsx';
import UserProfileUI from './pages/UserProfileUI.jsx';

function App() {
  

 return (
    <Router>
      <Routes>
        <Route path="/home" element={<CollabCanvasApp />} />
        <Route path="/profile" element={<UserProfileUI />} />
        <Route path="/help" element={<HelpSystemUI />} />
        <Route path="/paint" element={<PaintApp />} />
       
      </Routes>
    </Router>
  );
}

export default App;
