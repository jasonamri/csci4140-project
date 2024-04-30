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
