// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// pages
import Landing from './components/Landing';
import Home from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import Logout from './components/Logout';
import Spotify from './components/Spotify';
import Profile from './components/Profile';

const App = () => (
  <Router>
    <Routes>
      <Route exact path="/" element={< Landing />} />
      <Route path="/home" element={< Home />} />
      <Route path="/profile" element={< Profile />} />
      <Route path="/login" element={< Login />} />
      <Route path="/register" element={< Register />} />
      <Route path="/logout" element={< Logout />} />
      <Route path="/spotify" element={< Spotify />} />
    </Routes>
  </Router>
);

export default App;
