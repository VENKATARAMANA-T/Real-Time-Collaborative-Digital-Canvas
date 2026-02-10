import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import PaintApp from './pages/PaintApp.jsx';
function App() {
  

 return (
    <Router>
      <Routes>

        <Route path="/paint" element={<PaintApp />} />
       
      </Routes>
    </Router>
  );
}

export default App
