const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/yourdb', { useNewUrlParser: true, useUnifiedTopology: true });

//to test the passwords
const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');

const app = express();
// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(cors());
app.options('*', cors());
app.use(cors({
    origin: 'http://localhost:9090', // replace with the domain of your client
    methods: ['GET', 'POST'], // the methods you want to allow
    credentials: true // allow session cookies to be sent with the requests
  }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'loginLogout', resave: false, saveUninitialized: false }));

// app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function (username, password, done) {
    User.findOne({ username: username }).then(user => {
        console.log('FIND ONE: ', username, password, user);
        if (!user) {
            console.log('Incorrect username.');
            return done(null, false, { message: 'Incorrect username.' });
        }
        // We need to return the Promise here
        return user.validPassword(password).then(isMatch => {
            if (!isMatch) {
                console.log('Incorrect password.');
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }).catch(err => done(err));
}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

let ipUserMap = new Map();
console.log('App post definition');
app.post('/login', (req, res, next) => {
    console.log('Trying to login...')
    console.log('BODY : ', req.body)
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // console.log('IP : ',ip)
    // if (ipUserMap.has(ip)) {
    //     return res.status(403).send('You are already logged in from this IP address.');
    // }

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.log(err)
            return next(err);
        }
        if (!user) {
            return res.redirect('/noUserOrPassword');
        }
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            ipUserMap.set(ip, user.username);
            return res.redirect('/loggedIn');
        });
    })(req, res, next);
});

app.get('/loggedIn', (req, res) => {
    return(res.send({message:'You are logged in.'}));
  });


app.get('/logout', (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    ipUserMap.delete(ip);
    req.logout((err) => {
        if (err) {
            // Handle error
            console.error(err);
            res.status(500).send({message: 'Error logging out.'});
        } else {
            res.send({message:'You are logged out.'});
        }
    });   
});

app.get('/noUserOrPassword', (req, res) => {
    res.send({message:'User not found or incorrect password.', status: 200, success: false});
});


let port = 9090;
app.listen(port, () => {
    console.log(`*** Server is running on port ${port} ***`);
});

