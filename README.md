# Smart Playlist Manager
**Smart Playlist Manager is a user-friendly web application that enables all-in-one playlist management, syncing, and two-way conversion between Spotify and YouTube playlists. Smart Playlist Manager allows you to manage your YouTube and Spotify playlists on one platform, and easily share your playlists with friends who use a different streaming service.**

**Smart Playlist Manager seeks to address the interoperability challenges between Spotify and YouTube. In particular, our project serves users who want to manage and sync their playlists between YouTube and Spotify and share these playlists with others.**

*This project is made available under the MIT license. See more in the LICENSE file.*

## Website Link

[**View a Live Demo**](https://app.jasonamri.com/spm/)

## Installation Instructions
After cloning the repository, run `npm run install-all` to install all required dependencies.

Setup a YouTube Data API v3 instance on Google Cloud Console, and a Spotify App on the Spotify for Developers Portal. Next, set up the environment files as described below.

To run the project in development mode, run the frontend and backend separately:
- `cd client && npm start` to run the frontend
- `cd server && npm start` to run the backend

To run the project in production mode, run `npm run prod` to build the frontend and serve the backend.

To start using the project, go to http://localhost:3000/register to register for an account and start using Smart Playlist Manager.

## Environmental Variables

`client/.env`
- PUBLIC_URL - React base URL. Usually '/' (or blank), but may be a subdirectory such as '/spm' (*optional*) 

`server/.env`
- CALLBACK_URL - Complete URL used for OAuth callbacks with platforms. Usually 'http://localhost:8080' in development and the live URL in production (e.g. 'https://app.jasonamri.com/spm')
- PORT - port on which Express server listens (*optional*)
- DATABASE_URL - Postgres database connection URL (starts with 'postgres://...')
- SPOTIFY_CLIENT_ID - Spotify API client ID (from Spotify for Developers Portal)
- SPOTIFY_CLIENT_SECRET - Spotify API client secret (from Spotify for Developers Portal)
- YOUTUBE_CLIENT_ID - YouTube API client ID (from Google Cloud Console)
- YOUTUBE_CLIENT_SECRET - YouTube API client secret (from Google Cloud Console)

## Directory Structure

Below is an outline of the project's directory structure along with a description of the contents and functionality of each directory and file.

- client
    - public
        - index.html - static html page to be populated by React
    - src
        - components
            - styles
                - home.css - external stylesheet for Home component
                - login.css - external stylesheet for Login component
            - CallbackSpotify.jsx - Spotify OAuth callback handler
            - CallbackYoutube.jsx - Youtube OAuth callback handler
            - Home.jsx - Home page/main screen (/home)
            - Import.jsx - Import page (/import)
            - Landing.jsx - Site landing page (/)
            - Login.jsx - Account login page (/login)
            - Logout.jsx - *unused*
            - Playlist.jsx - Playlist page (/playlist?pl_id=__)
            - Register.jsx - Account registration page (/register)
            - Share.jsx - Share page (/share)
            - Spotify.jsx - *unused*
            - Youtube.jsx - *unused*
        - App.jsx - App router
        - index.js - Main entry point and axios setup
    - package.json - frontend npm config
    - .env - frontend environment variables (described below)
- server
    - modules
        - auth.js - Authenication and user management functions
        - database.js - Postgres database wrapper functions
        - functions.js - Advanced playlist functions
        - middleware.js - User login and token expiration management middleware
        - pl.js - Playlist management functions
        - song.js - Song management functions
        - spotify.js - Spotify API wrapper
        - youtube.js - YouTube API wrapper
    - routes
        - authRouter.js - Express router for authentication routes
        - functionsRouter.js - Express router for advanced playlist function routes
        - indexRouter.js - *unused*
        - playlistRouter.js - Express router for playlist management routes
        - songRouter.js - Express router for song management routes
        - spotifyRouter.js - Express router for Spotify API requests
        - youtubeRouter.js - Express router for YouTube API requests
    - server.js - Main entry point and express server setup
    - package.json - backend npm config
    - .env - backend environment variabels (described below)
- .eslintrc.json - linter settings
- .gitignore
- .travis.yml
- LICENSE - MIT license file
- package.json - development packages
- README.md

---
Thank you for reviewing our project. For further questions or clarifications, please do not hesitate to contact us.