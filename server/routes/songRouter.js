const express = require('express');
const Songs = require('../modules/song');
const { ensureLoggedIn, ensureValidSpotifyToken, ensureValidYoutubeToken } = require('../modules/middleware');

const router = express.Router();

// is this still externally used?
/*router.get('/get/:song_id', ensureLoggedIn, async (req, res) => {
    const result = await Songs.get(req.params.song_id);
    res.json(result);
});*/

router.post('/search', ensureLoggedIn, ensureValidSpotifyToken, ensureValidYoutubeToken, async (req, res) => {
    const spotify_access_token = req.session.spotify_access_token;
    const youtube_access_token = req.session.youtube_access_token;
    const { query, count } = req.body;
    const result = await Songs.search(spotify_access_token, youtube_access_token, query, count);
    res.json(result);
});

router.post('/precreate', ensureLoggedIn, ensureValidSpotifyToken, ensureValidYoutubeToken, async (req, res) => {
    const spotify_access_token = req.session.spotify_access_token;
    const youtube_access_token = req.session.youtube_access_token;
    const { platform, platform_ref } = req.body;
    const result = await Songs.precreate(spotify_access_token, youtube_access_token, platform, platform_ref);
    res.json(result);
});

router.post('/create', ensureLoggedIn, ensureValidSpotifyToken, ensureValidYoutubeToken, async (req, res) => {
    const spotify_access_token = req.session.spotify_access_token;
    const youtube_access_token = req.session.youtube_access_token;
    const { platform, platform_ref, soft_match_ref } = req.body;
    const result = await Songs.create(spotify_access_token, youtube_access_token, platform, platform_ref, soft_match_ref);
    res.json(result);
});

router.post('/merge', ensureLoggedIn, async (req, res) => {
    const { song_1_id, song_2_id } = req.body;
    const result = await Songs.merge(song_1_id, song_2_id);
    res.json(result);
});

router.post('/link', ensureLoggedIn, ensureValidSpotifyToken, async (req, res) => {
    const spotify_access_token = req.session.spotify_access_token;
    const { song_id, platform, platform_ref } = req.body;
    const result = await Songs.link(spotify_access_token, song_id, platform, platform_ref);
    res.json(result);
});

module.exports = router;
