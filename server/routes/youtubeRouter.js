const express = require('express');
const router = express.Router();
const YoutubeWrapper = require('../modules/youtube');

const Youtube = new YoutubeWrapper();

router.get('/link', (req, res) => {
    const loginURL = Youtube.getAuthorizeURL();
    res.redirect(loginURL);
});

router.get('/callback', async (req, res) => {
    const { code } = req.query;
    try {
        await Youtube.getAccessToken(code);
        res.redirect('/youtube');
    } catch (error) {
        res.send('An error occurred' + error);
    }
});

router.get('/get-all-pls', async (req, res) => {
    try {
        const playlists = await Youtube.getPlaylists();
        res.send(playlists);
    } catch (error) {
        res.send('An error occurred' + error);
    }
});

module.exports = router;
