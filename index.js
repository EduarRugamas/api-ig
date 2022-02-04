const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const ig = require('instagram-node').instagram();
const cookieParser = require('cookie-parser');
const morgan = require('morgan');


const app = express();
//config 
const port = process.env.PORT || 3001
ig.use({
    client_id: process.env.IG_CLIENT_ID,
    client_secret: process.env.IG_CLIENT_SECRET
});
//config de morgan 
// app.use(morgan('dev'));

//config pub and views
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

//ruta raiz
app.get('/', (req, res) => {
    res.render('index', { message: 'Welcome to Login with Instagram' })
});

//ruta login
app.get('/login', (req, res) => {
    res.render('login')
});

//ruta Oauth instagram 
app.get('/instagram/authorize', (req, res) => {
    res.redirect(
        ig.get_authorization_url(process.env.IG_URI_REDIRECT, {
            scope: ['email', 'instagram_basic', 'user_profile', 'user_photos', 'user_likes']
        })
    );
});

//ruta de callback of instagram 
app.get('/instagram/callback', (req, res) => {
    console.log('ig callback success');
    ig.authorize_user(req.query.code, process.env.IG_URI_REDIRECT, (err, result) => {
        if (err) return res.send(err);
        res.cookie('igToken', result.access_token);
        // res.send('todo bien');
        res.redirect('/instagram/photos');
    });
});

//ruta de photos
app.get('/instagram/photos', (req, res) => {
    try {

        const accessToken = req.cookies.igToken;

        ig.use({ access_token: accessToken })

        const userId = accessToken.split('.')[0] // ig user id, like: 1633560409
        console.log(userId);
        ig.user_media_recent(userId, (err, result, pagination, remaining, limit) => {
            if (err.code) return res.render('error');
            res.render('photos', { photos: result });
        })
    } catch (e) {
        res.render('error');
    }
});


app.listen(port, () => {
    console.log(`Api Instagram OAuth\nserver on port: ${ port }`);
});