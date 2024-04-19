// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Spotify from './components/Spotify';

const App = () => (
  <Router>
    <Routes>
      <Route exact path="/" element={< Home />} />
      <Route path="/spotify" element={< Spotify />} />
    </Routes>
  </Router>
);

export default App;
