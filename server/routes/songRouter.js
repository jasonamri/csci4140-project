const express = require('express');
const Songs = require('../modules/song');
const { ensureLoggedIn, ensureValidSpotifyToken, ensureValidYoutubeToken } = require('../modules/middleware');

const router = express.Router();

router.get('/get/:song_id', ensureLoggedIn, async (req, res) => {
    const result = await Songs.get(req.params.song_id);
    res.json(result);
});

router.post('/create', ensureLoggedIn, async (req, res) => {
    const { platform, song } = req.body;
    const result = await Songs.create(platform, song);
    res.json(result);
});

router.post('/search', ensureLoggedIn, async (req, res) => {
    const { query, count } = req.body;
    const result = await Songs.search(query, count);
    res.json(result);
});

module.exports = router;
