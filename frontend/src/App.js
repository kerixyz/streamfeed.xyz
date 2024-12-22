import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Navbar from './components/NavBar';

import './App.css'
import Research from './pages/Research';
// import Feedback from './pages/Feedback';

function App() {
//   console.log('REACT_APP_API_BASE_URL at build:', process.env.REACT_APP_API_BASE_URL);

  return (
    <div>
    <Navbar />

    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:streamer" element={<Chat />} /> {/* Dynamic route for streamer */}
        <Route path="/research" element={<Research />} /> 
        {/* <Route path="/feedback" element={<Feedback />} /> */}
      </Routes>
    </Router>
    </div>
  );
}

export default App;
