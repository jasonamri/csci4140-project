const Spotify = require('./spotify');
const Youtube = require('./youtube');

const ensureLoggedIn = (req, res, next) => {
    if (req.session.username) {
        next(); // proceed to the next middleware or route handler
    } else {
        res.status(401).json({ status: 'unauthorized', message: 'Must be logged in!' });
    }
}

const ensureValidSpotifyToken = async (req, res, next) => {
    const refresh_token = req.session.spotify_refresh_token;
    const token_expiry = new Date(req.session.spotify_token_expires).getTime();

    if (token_expiry < Date.now()) {
        console.log('Refreshing Spotify token');
        const result = await Spotify.refreshAccessToken(req.session.username, refresh_token);
        req.session.spotify_access_token = result.data.access_token;
        req.session.spotify_token_expires = result.data.token_expiry;
    }

    next();
}

const ensureValidYoutubeToken = async (req, res, next) => {
    const refresh_token = req.session.youtube_refresh_token;
    const token_expiry = new Date(req.session.youtube_token_expires).getTime();

    if (token_expiry < Date.now()) {
        console.log('Refreshing Youtube token');
        const result = await Youtube.refreshAccessToken(req.session.username, refresh_token);
        req.session.youtube_access_token = result.data.access_token;
        req.session.youtube_token_expires = result.data.token_expiry;
    }

    next();
}

module.exports = { ensureLoggedIn, ensureValidSpotifyToken, ensureValidYoutubeToken };
