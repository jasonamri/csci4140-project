import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Logout = () => {
  const [message, setMessage] = useState('Logging out...');

  useEffect(() => {
    const logoutUser = async () => {
        const response = await axios.get('/api/auth/logout');
        setMessage(response.data.message);
    };

    logoutUser();
  }, []);

  return (
    <div>
      <h1>Logout</h1>
      <p>{message}</p>
    </div>
  );
};

export default Logout;
