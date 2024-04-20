// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// pages
import Landing from './components/Landing';
import Home from './components/Landing';
import Playlist from './components/Playlist';
import Import from './components/Import';
import Share from './components/Share';
import Login from './components/Login';
import Register from './components/Register';
import Logout from './components/Logout';
import Spotify from './components/Spotify';
import Youtube from './components/Youtube';
import Profile from './components/Profile';
import LinkSpotify from './components/LinkSpotify';
import CallbackSpotify from './components/CallbackSpotify';
import LinkYoutube from './components/LinkYoutube';
import CallbackYoutube from './components/CallbackYoutube';

const App = () => (
  <Router>
    <Routes>
      <Route exact path="/" element={< Landing />} />
      <Route path="/home" element={< Home />} />
      <Route path="/profile" element={< Profile />} />
      <Route path="/playlist" element={< Playlist />} />
      <Route path="/import" element={< Import />} />
      <Route path="/share" element={< Share />} />
      <Route path="/login" element={< Login />} />
      <Route path="/register" element={< Register />} />
      <Route path="/logout" element={< Logout />} />
      <Route path="/spotify" element={< Spotify />} />
      <Route path="/youtube" element={< Youtube />} />
      <Route path="/link-spotify" element={< LinkSpotify />} />
      <Route path="/callback-spotify" element={< CallbackSpotify />} />
      <Route path="/link-youtube" element={< LinkYoutube />} />
      <Route path="/callback-youtube" element={< CallbackYoutube />} />
    </Routes>
  </Router>
);

export default App;
