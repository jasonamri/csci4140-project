const express = require('express');
const Functions = require('../modules/functions');
const { ensureLoggedIn } = require('../modules/middleware');

const router = express.Router();

router.post('/deduplicate', ensureLoggedIn, async (req, res) => {
    const { playlist_ids } = req.body;

    if (playlist_ids.length < 1) {
        res.json({
            status: 'fail',
            message: 'At least 1 playlist is required to deduplicate'
        });
        return;
    }

    const result = await Functions.deduplicate(req.session.username, playlist_ids);
    res.json(result);
});

router.post('/clone', ensureLoggedIn, async (req, res) => {
    const { playlist_ids } = req.body;

    if (playlist_ids.length < 1) {
        res.json({
            status: 'fail',
            message: 'At least 1 playlist is required to clone'
        });
        return;
    }

    const result = await Functions.clone(req.session.username, playlist_ids);
    res.json(result);
});

router.post('/merge', ensureLoggedIn, async (req, res) => {
    const { playlist_ids } = req.body;

    if (playlist_ids.length < 2) {
        res.json({
            status: 'fail',
            message: 'At least 2 playlists are required to merge'
        });
        return;
    }

    const result = await Functions.merge(req.session.username, playlist_ids);
    res.json(result);
});

router.post('/overlap', ensureLoggedIn, async (req, res) => {
    const { playlist_ids } = req.body;

    if (playlist_ids.length < 2) {
        res.json({
            status: 'fail',
            message: 'At least 2 playlists are required to overlap'
        });
        return;
    }

    const result = await Functions.overlap(req.session.username, playlist_ids);
    res.json(result);
});

module.exports = router;
