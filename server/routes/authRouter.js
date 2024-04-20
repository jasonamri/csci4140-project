const express = require('express');
const Auth = require('../modules/auth');

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
        console.log('setting session', username);
        req.session.username = username;
        console.log('session set', req.session.username);
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
    console.log('checking status', req.session.username)
    // check session
    const result = {
        status: req.session.username ? 'logged-in' : 'logged-out',
        username: req.session.username || ''
    };

    // return result
    res.json(result);
});

router.post('/change-email', async (req, res) => {
    // check session
    if (!req.session.username) {
        res.json({ status: 'fail', message: 'Not logged in' });
        return;
    }

    // execute change email
    const { newEmail } = req.body;
    const result = await Auth.changeEmail(req.session.username, newEmail);

    // return result
    res.json(result);
});

router.post('/change-password', async (req, res) => {
    // check session
    console.log('checking session', req.session.username)
    if (!req.session.username) {
        res.json({ status: 'fail', message: 'Not logged in' });
        return;
    }

    // execute change password
    const { currentPassword, newPassword } = req.body;
    const result = await Auth.changePassword(req.session.username, currentPassword, newPassword);

    // return result
    res.json(result);
});

module.exports = router;
