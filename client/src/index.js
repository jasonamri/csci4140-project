import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from './reducers';
import axios from 'axios';


import App from './App';

// Set up axios
axios.defaults.baseURL = 'http://localhost:8080/api';
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
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


const middleware = [thunk];

const store = createStore(rootReducer, applyMiddleware(...middleware));

const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
