const express = require('express');
const router = express.Router();
const SpotifyWrapper = require('../modules/spotify');

const Spotify = new SpotifyWrapper();

router.get('/link', (req, res) => {
    const loginURL = Spotify.getAuthorizeURL();
    res.redirect(loginURL);
});

router.get('/callback', async (req, res) => {
    const { code } = req.query;
    try {
        await Spotify.getAccessToken(code);
        res.redirect('/spotify');
    } catch (error) {
        res.send('An error occurred' + error);
    }
});

router.get('/get-all-pls', async (req, res) => {
    try {
        const playlists = await Spotify.getPlaylists();
        res.send(playlists);
    } catch (error) {
        res.send('An error occurred' + error);
    }
});

module.exports = router;
