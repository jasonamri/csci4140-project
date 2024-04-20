const express = require('express');
const Songs = require('../modules/song');
const { ensureLoggedIn } = require('../modules/middleware');

const router = express.Router();

router.get('/get/:song_id', ensureLoggedIn, async (req, res) => {
    const result = await Songs.get(req.params.song_id);
    res.json(result);
});

module.exports = router;
