const ensureLoggedIn = (req, res, next) => {
    if (req.session.username) {
        next(); // proceed to the next middleware or route handler
    } else {
        res.status(401).json({ status: 'unauthorized', message: 'Must be logged in!' });
    }
}

module.exports = { ensureLoggedIn };
