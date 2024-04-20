// npm module imports
const express = require('express');
const cors = require('cors');
const path = require('path');

// local import
const indexRouter = require('./routes/indexRouter');
const spotifyRouter = require('./routes/spotifyRouter');
const youtubeRouter = require('./routes/youtubeRouter');
const Database = require('./modules/database');

const app = express();
app.use(cors());
app.use(express.json());

// serve React build
/*
const DIST_DIR = path.join('../', 'client', 'dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.use(express.static(DIST_DIR));

app.get('/', (req, res) => {
  res.sendFile(HTML_FILE);
});
*/


// server backend
app.use('/api/', indexRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/youtube', youtubeRouter);

// launch express
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`App listening on port: ${port}`));

// test database connection
Database.test();
Database.init();
