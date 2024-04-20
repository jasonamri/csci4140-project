const express = require('express');
const router = express.Router();
const SpotifyWrapper = require('../modules/spotify');
const { ensureLoggedIn } = require('../modules/middleware');

const Spotify = new SpotifyWrapper();


// token refresh middleware
const ensureValidToken = async (req, res, next) => {
    const refresh_token = req.session.spotify_refresh_token;
    const token_expiry = req.session.spotify_token_expiry;

    if (token_expiry < Date.now()) {
        const result = await Spotify.refreshAccessToken(req.session.username, refresh_token);
        req.session.spotify_access_token = result.data.access_token;
        req.session.spotify_token_expiry = result.data.token_expiry;
    }

    next();
}

router.get('/status', ensureLoggedIn, (req, res) => {
    const result = {
        status: 'success',
        data: {
            spotify_status: req.session.spotify_status
        }
    }
    res.json(result);
});

router.get('/link', (req, res) => {
    const redirectURL = Spotify.getAuthorizeURL();

    const result = {
        status: 'redirect',
        data: {
            redirect_url: redirectURL
        }
    }

    res.json(result);
});

router.get('/callback', ensureLoggedIn, async (req, res) => {
    const { code } = req.query;
    const result = await Spotify.link(req.session.username, code);

    // store tokens in session
    req.session.spotify_access_token = result.data.access_token;
    req.session.spotify_refresh_token = result.data.refresh_token;
    req.session.spotify_token_expiry = result.data.token_expiry;
    req.session.spotify_status = 'LINKED';

    res.json(result);
});

router.get('/unlink', ensureLoggedIn, async (req, res) => {
    const result = await Spotify.unlink(req.session.username);

    // remove tokens from session
    req.session.spotify_access_token = null;
    req.session.spotify_refresh_token = null;
    req.session.spotify_token_expiry = null;
    req.session.spotify_status = 'UNLINKED';

    res.json(result);
});

router.get('/get-all-pls', ensureLoggedIn, ensureValidToken, async (req, res) => {
    const access_token = req.session.spotify_access_token;
    const playlists = await Spotify.getPlaylists(access_token);

    const result = {
        status: 'success',
        data: {
            playlists: playlists
        }
    }
    console.log(result)
    res.json(result);
});

module.exports = router;
