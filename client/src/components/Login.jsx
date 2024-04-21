import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loginResult, setLoginResult] = useState('');

    const navigate = useNavigate();

    const { username, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();

        setLoginResult('Processing login...')
        
        //disable login button
        e.target.querySelector('button').disabled = true;

        const data = {
            username,
            password
        };
        const response = await axios.post('/auth/login', data);
        if (response.data.status === 'success') {
            navigate('/home');
        } else {
            setLoginResult('Login failed: ' + response.data.message || 'An error occurred');
            e.target.querySelector('button').disabled = false;
        }
    };

    return (
        <div>
            <form onSubmit={onSubmit}>
                <input type="text" placeholder="Username" name="username" value={username} onChange={onChange} required />
                <input type="password" placeholder="Password" name="password" value={password} onChange={onChange} required />
                <button type="submit">Login</button>
            </form>
            {loginResult && <p>{loginResult}</p>}
        </div>
    );
};

export default Login;
