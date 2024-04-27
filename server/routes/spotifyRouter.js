const express = require('express');
const router = express.Router();
const Spotify = require('../modules/spotify');
const { ensureLoggedIn, ensureValidSpotifyToken } = require('../modules/middleware');

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
    req.session.spotify_token_expires = result.data.token_expiry;
    req.session.spotify_status = 'LINKED';

    res.json(result);
});

router.get('/unlink', ensureLoggedIn, async (req, res) => {
    const result = await Spotify.unlink(req.session.username);

    // remove tokens from session
    req.session.spotify_access_token = null;
    req.session.spotify_refresh_token = null;
    req.session.spotify_token_expires = null;
    req.session.spotify_status = 'UNLINKED';

    res.json(result);
});

router.get('/get-all-pls', ensureLoggedIn, ensureValidSpotifyToken, async (req, res) => {
    const access_token = req.session.spotify_access_token;
    const playlists = await Spotify.getPlaylists(access_token);

    const result = {
        status: 'success',
        data: {
            playlists: playlists
        }
    }

    res.json(result);
});

router.post('/search', ensureLoggedIn, ensureValidSpotifyToken, async (req, res) => {
    const access_token = req.session.spotify_access_token;
    const { query, count } = req.body;
    const songs = await Spotify.search(access_token, query, count);

    const result = {
        status: 'success',
        data: {
            results: songs
        }
    }

    res.json(result);
});

router.post('/pull', ensureLoggedIn, ensureValidSpotifyToken, async (req, res) => {
    const access_token = req.session.spotify_access_token;
    const { platform_ref } = req.body;
    const songs = await Spotify.pull(access_token, platform_ref);

    const result = {
        status: 'success',
        data: {
            songs: songs
        }
    }

    res.json(result);
});

module.exports = router;
