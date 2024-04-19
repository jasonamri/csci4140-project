import { combineReducers } from 'redux';
import dbReducer from './dbReducer';
import spotifyReducer from './spotifyReducer';

export default combineReducers({
  db: dbReducer,
  spotify: spotifyReducer
});
