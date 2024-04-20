import axios from 'axios';
import { SPOTIFY_GET_ALL_PLAYLISTS } from '../constants/actionTypes';

const spotify__get_all_pls = () => dispatch => {
  axios({
    method: 'get',
    url: 'http://localhost:8080/api/spotify/get-all-pls',
    timeout: 1000
  }).then(response => {
    dispatch({
      type: SPOTIFY_GET_ALL_PLAYLISTS,
      payload: response.data.data.playlists
    });
  }).catch(error => {
    console.error('Error fetching Spotify status:', error);
  });
};

export { spotify__get_all_pls };
