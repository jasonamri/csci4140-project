import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Avatar,
  Stack,
  Typography,
  TextField,
  Button,
  Link,
  Alert
} from '@mui/material';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import './styles/Login.css';

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
      // if share_pl_id cookie is set, clear it and redirect to /share?pl_id=share_pl_id
      if (document.cookie.includes('share_pl_id')) {
        const share_pl_id = document.cookie.split('share_pl_id=')[1].split(';')[0];
        document.cookie = 'share_pl_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/share?pl_id=' + share_pl_id);
        return;
      }

      // otherwise go to /home
      navigate('/home');
    } else {
      setLoginResult('Login failed: ' + response.data.message || 'An error occurred');
      e.target.querySelector('button').disabled = false;
    }
  };

  return (
    <div className='login'>
      <Grid>
        <Paper elevation={10} sx={{ margin: '50px auto', height: '450px', width: '300px'}}>
          <Stack alignItems={'center'}>
            <Avatar sx={{ mt: '30px', width: '50px', height: '50px' }}><LockPersonIcon></LockPersonIcon></Avatar>
            <Typography variant='h4' sx={{ mt: '20px', mb: '20px' }}>Log In</Typography>
            <form onSubmit={onSubmit}>
              <TextField type="text" placeholder="Username" name="username" required value={username} onChange={onChange} sx={{ margin: "10px", width: "280px" }}></TextField>
              <TextField type="password" placeholder="Password" name="password" required value={password} onChange={onChange} sx={{ margin: "10px", width: "280px" }}></TextField>
              <Button variant="contained" type="submit" sx={{ display: "block", margin: "auto", mt: "10px", width: "100px" }}>Login</Button>
            </form>
            <Typography sx={{ mt: '20px' }}>Don't have an account? <Link onClick={() => { navigate('/register') }}>Sign Up</Link></Typography>
            {loginResult && <Alert severity="info" sx={{ mt: '50px' }}>{loginResult}</Alert>}
          </Stack>
        </Paper>
      </Grid>
    </div>
  );
};

export default Login;
