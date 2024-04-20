const bcrypt = require('bcrypt');
const Database = require('../modules/database');

class Auth {
    static async register(username, email, password) {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // check if username is already taken
        const query = {
            text: 'SELECT * FROM users WHERE username = $1',
            values: [username]
        };
        const res = await Database.query(query);
        if (res.rows.length > 0) {
            return { status: 'fail', message: 'Username already taken' };
        }

        // Insert user into database
        const query2 = {
            text: 'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
            values: [username, email, hashedPassword]
        };
        await Database.query(query2);

        return { status: 'success', message: 'Registration successful' };
    }

    static async login(username, password) {
        // Retrieve hashed password from database
        const query = {
            text: 'SELECT password_hash FROM users WHERE username = $1',
            values: [username]
        };
        const res = await Database.query(query);

        // Compare hashed password
        if (res.rows.length === 0) {
            return { status: 'fail', message: 'User not found' };
        }
        if (!await bcrypt.compare(password, res.rows[0].password_hash)) {
            return { status: 'fail', message: 'Incorrect password' };
        }

        // Update last login time
        const query2 = {
            text: 'UPDATE users SET date_last_login = CURRENT_TIMESTAMP WHERE username = $1',
            values: [username]
        };
        await Database.query(query2);

        return { status: 'success', message: 'Login successful'};
    }

    static async changeEmail(username, newEmail) {
        // Update email
        const query = {
            text: 'UPDATE users SET email = $1 WHERE username = $2',
            values: [newEmail, username]
        };
        await Database.query(query);

        return { status: 'success', message: 'Email changed' };
    }

    static async changePassword(username, currentPassword, newPassword) {
        // Retrieve hashed password from database
        const query = {
            text: 'SELECT password_hash FROM users WHERE username = $1',
            values: [username]
        };
        const res = await Database.query(query);

        // Compare hashed password
        if (res.rows.length === 0) {
            return { status: 'fail', message: 'User not found' };
        }
        if (!await bcrypt.compare(currentPassword, res.rows[0].password_hash)) {
            return { status: 'fail', message: 'Incorrect password' };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const query2 = {
            text: 'UPDATE users SET password_hash = $1 WHERE username = $2',
            values: [hashedPassword, username]
        };
        await Database.query(query2);

        return { status: 'success', message: 'Password changed' };
    }

}

module.exports = Auth;
