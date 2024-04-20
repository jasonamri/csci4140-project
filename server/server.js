// npm module imports
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// local import
const indexRouter = require('./routes/indexRouter');
const authRouter = require('./routes/authRouter');
const spotifyRouter = require('./routes/spotifyRouter');
const youtubeRouter = require('./routes/youtubeRouter');
const playlistRouter = require('./routes/playlistRouter');
const songRouter = require('./routes/songRouter');
const Database = require('./modules/database');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// setup session
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    pool: Database.pool,
    tableName: 'sessions'
  }),
  secret: 'csci4140',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

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
app.use('/api/auth', authRouter);
app.use('/api/playlist', playlistRouter);
app.use('/api/song', songRouter);

// launch express
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`App listening on port: ${port}`));

// test database connection
Database.test();
Database.init();
