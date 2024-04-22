const express = require('express');
const router = express.Router();
const Youtube = require('../modules/youtube');
const { ensureLoggedIn, ensureValidYoutubeToken } = require('../modules/middleware');

router.get('/status', ensureLoggedIn, (req, res) => {
    const result = {
        status: 'success',
        data: {
            youtube_status: req.session.youtube_status
        }
    }
    res.json(result);
});

router.get('/link', (req, res) => {
    const loginURL = Youtube.getAuthorizeURL();
    
    const result = {
        status: 'redirect',
        data: {
            redirect_url: loginURL
        }
    }

    res.json(result);
});

router.get('/callback', ensureLoggedIn, async (req, res) => {
    const { code } = req.query;
    const result = await Youtube.link(req.session.username, code);

    // store tokens in session
    req.session.youtube_access_token = result.data.access_token;
    req.session.youtube_refresh_token = result.data.refresh_token;
    req.session.youtube_token_expires = result.data.token_expiry;
    req.session.youtube_status = 'LINKED';

    res.json(result);
});

router.get('/unlink', ensureLoggedIn, async (req, res) => {
    const result = await Youtube.unlink(req.session.username);

    // remove tokens from session
    req.session.youtube_access_token = null;
    req.session.youtube_refresh_token = null;
    req.session.youtube_token_expires = null;
    req.session.youtube_status = 'UNLINKED';

    res.json(result);
});

router.get('/get-all-pls', ensureLoggedIn, ensureValidYoutubeToken, async (req, res) => {
    const access_token = req.session.youtube_access_token;
    const playlists = await Youtube.getPlaylists(access_token);

    const result = {
        status: 'success',
        data: {
            playlists: playlists
        }
    }

    res.json(result);
});

router.post('/search', ensureLoggedIn, ensureValidYoutubeToken, async (req, res) => {
    const access_token = req.session.youtube_access_token;
    const { query, count } = req.body;
    const songs = await Youtube.search(access_token, query, count);
    //const songs = []; // use if rate limited

    const result = {
        status: 'success',
        data: {
            results: songs
        }
    }

    res.json(result);
});

module.exports = router;
