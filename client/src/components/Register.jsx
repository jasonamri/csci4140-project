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

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [registrationResult, setRegistrationResult] = useState('');

    const navigate = useNavigate();

  const { username, email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();

    const data = {
      username,
      email,
      password
    };
    const res = await axios.post('/auth/register', data);
    setRegistrationResult(res.data.message);
  };

  return (
    <div>
      <Grid>
        <Paper elevation={10} sx={{ margin: '50px auto', height: '520px', width: '300px'}}>
          <Stack alignItems={'center'}>
            <Avatar sx={{ mt: '30px', width: '50px', height: '50px' }}></Avatar>
            <Typography variant='h4' sx={{ mt: '20px', mb: '20px' }}>Sign Up</Typography>
            <form onSubmit={onSubmit}>
              <TextField type="text" placeholder="Username" name="username" required value={username} onChange={onChange} sx={{ margin: "10px", width: "280px" }}></TextField>
              <TextField type="email" placeholder="Email" name="email" required value={email} onChange={onChange} sx={{ margin: "10px", width: "280px" }}></TextField>
              <TextField type="password" placeholder="Password" name="password" required value={password} onChange={onChange} sx={{ margin: "10px", width: "280px" }}></TextField>
              <Button variant="contained" type="submit" sx={{ display: "block", margin: "auto", mt: "10px", width: "100px" }}>Sign Up</Button>
            </form>
            <Typography sx={{ mt: '20px' }}>Already have an account? <Link onClick={() => { navigate('/login') }}>Log In</Link></Typography>
            {registrationResult && <Alert severity="info" sx={{ mt: '50px' }}>{registrationResult}</Alert>}
          </Stack>
        </Paper>
      </Grid>
    </div>
  );
};

export default Register;
