const express = require('express');
const Auth = require('../modules/auth');
const { ensureLoggedIn } = require('../modules/middleware');

const router = express.Router();

router.post('/register', async (req, res) => {
    // execute registration
    const { username, email, password } = req.body;
    const result = await Auth.register(username, email, password);

    // return result
    res.json(result);
});

router.post('/login', async (req, res) => {
    // execute login
    const { username, password } = req.body;
    const result = await Auth.login(username, password);

    // set session if successful
    if (result.status === 'success') {
        const user_data = result.data;
        for (const key in user_data) {
            if (user_data.hasOwnProperty(key)) {
                req.session[key] = user_data[key];
            }
        }
    }

    // return result
    res.json(result);
});

router.get('/logout', (req, res) => {
    // destroy session
    req.session.destroy();

    // create result
    const result = {
        status: 'success'
    }

    // return result
    res.json(result);
});

router.get('/status', (req, res) => {
    // check session
    const result = {
        status: req.session.username ? 'logged-in' : 'logged-out',
        username: req.session.username || ''
    };

    // return result
    res.json(result);
});

router.post('/change-email', ensureLoggedIn, async (req, res) => {
    // execute change email
    const { newEmail } = req.body;
    const result = await Auth.changeEmail(req.session.username, newEmail);

    // return result
    res.json(result);
});

router.post('/change-password', ensureLoggedIn, async (req, res) => {
    // execute change password
    const { currentPassword, newPassword } = req.body;
    const result = await Auth.changePassword(req.session.username, currentPassword, newPassword);

    // return result
    res.json(result);
});

module.exports = router;
