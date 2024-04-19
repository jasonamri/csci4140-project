import { SPOTIFY_GET_ALL_PLAYLISTS } from "../constants/actionTypes";

const initialState = {
    playlists: []
    };

export default function(state = initialState, action) {
    switch (action.type) {
        case SPOTIFY_GET_ALL_PLAYLISTS:
            return {
                ...state,
                playlists: action.payload
            };
        default:
            return state;
    }
}
