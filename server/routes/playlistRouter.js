const express = require('express');
const Playlists = require('../modules/pl');
const { ensureLoggedIn } = require('../modules/middleware');

const router = express.Router();

router.post('/create', ensureLoggedIn, async (req, res) => {
    const { name, creation_type, songs, platform, platform_ref } = req.body;
    const result = await Playlists.create(req.session.username, name, creation_type, songs, platform, platform_ref);
    res.json(result);
});

router.post('/pull/:pl_id', ensureLoggedIn, async (req, res) => {
    const { songs, platform } = req.body;
    const result = await Playlists.pull(req.session.username, req.params.pl_id, songs, platform);
    res.json(result);
});

router.post('/push/:pl_id', ensureLoggedIn, async (req, res) => {
    const { platform, platform_ref } = req.body;
    const result = await Playlists.push(req.session.username, req.params.pl_id, platform, platform_ref);
    res.json(result);
});

router.get('/get/:pl_id', ensureLoggedIn, async (req, res) => {
    const result = await Playlists.get(req.session.username, req.params.pl_id);
    res.json(result);
});

router.get('/get-all', ensureLoggedIn, async (req, res) => {
    const result = await Playlists.getAll(req.session.username);
    res.json(result);
});

router.get('/get-songs/:pl_id', ensureLoggedIn, async (req, res) => {
    const result = await Playlists.getSongs(req.session.username, req.params.pl_id);
    res.json(result);
});

router.post('/share/:pl_id', ensureLoggedIn, async (req, res) => {
    const result = await Playlists.share(req.session.username, req.params.pl_id, );
    res.json(result);
});

router.get('/add-song/:pl_id/:song_id', ensureLoggedIn, async (req, res) => {
    const result = await Playlists.addSong(req.session.username, req.params.pl_id, req.params.song_id);
    res.json(result);
});

router.get('/remove-song/:pl_id/:song_id', ensureLoggedIn, async (req, res) => {
    const result = await Playlists.removeSong(req.session.username, req.params.pl_id, req.params.song_id);
    res.json(result);
});

module.exports = router;
