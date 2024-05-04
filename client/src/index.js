import React from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';

import App from './App';

// Set up axios
axios.defaults.baseURL = process.env.ENV === 'prod' ? process.env.PUBLIC_URL + '/api' : 'http://localhost:8080/api';
axios.defaults.withCredentials = true;
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with successful response data
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // For example, handle 401 Unauthorized error
    if (error.response.status === 401) {
      // if on /share, store the pl_id to a cookie
      if (window.location.pathname === '/share') {
        console.log('storing pl_id cookie')
        document.cookie = 'share_pl_id=' + new URLSearchParams(window.location.search).get('pl_id');
      }

      // login required, redirect to login page
      window.location.href = '/login';
    } else if (error.response.status === 402) {
      window.location.href = '/profile?platformToLink=' + error.response.data.platform;
    }
    return Promise.reject(error);
  }
);

const root = createRoot(document.getElementById("root"));
root.render(
  <App />
);
