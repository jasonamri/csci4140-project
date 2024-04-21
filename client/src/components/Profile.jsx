import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordChangeMessage, setPasswordChangeMessage] = useState('');

    const navigate = useNavigate();

    const handleChangePassword = async e => {
        e.preventDefault();

        try {
            const response = await axios.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            setPasswordChangeMessage(response.data.message);
        } catch (error) {
            setPasswordChangeMessage('An error occurred while changing password.');
        }
    };

    const [newEmail, setNewEmail] = useState('');
    const [emailChangeMessage, setEmailChangeMessage] = useState('');

    const handleChangeEmail = async e => {
        e.preventDefault();

        try {
            const response = await axios.post('/auth/change-email', {
                newEmail,
            });
            setEmailChangeMessage(response.data.message);
        } catch (error) {
            setEmailChangeMessage('An error occurred while changing email.');
        }
    };

    return (
        <div>
            <button onClick={() => navigate('/home')}>Back to Home</button>
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword}>
                <label>
                    Current Password:
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </label>
                <br />
                <label>
                    New Password:
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </label>
                <br />
                <button type="submit">Change Password</button>
            </form>
            <p>{passwordChangeMessage}</p>

            <h2>Change Email</h2>
            <form onSubmit={handleChangeEmail}>
                <label>
                    New Email:
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />
                </label>
                <br />
                <button type="submit">Change Email</button>
            </form>
            <p>{emailChangeMessage}</p>

            <h2>Manage Spotify Integration</h2>
            <a href="/link-spotify">Link Spotify</a>

            <h2>Manage YouTube Integration</h2>
            <a href="/link-youtube">Link YouTube</a>
        </div>
    );
};

export default Profile;
