import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from './reducers';
import axios from 'axios';


import App from './App';

axios.defaults.baseURL = 'http://localhost:8080/api';
axios.defaults.withCredentials = true;

const middleware = [thunk];

const store = createStore(rootReducer, applyMiddleware(...middleware));

const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
