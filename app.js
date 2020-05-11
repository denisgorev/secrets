//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
//const md5 = require('md5') // hash
//const encrypt = require('mongoose-encryption');
// const bcrypt = require('bcryptjs');

// const saltRounds = 10; //the number of salt additing and hashing

const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose'); 

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({extended: true}));

//session initialization
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  }));

app.use(passport.initialize());
app.use(passport.session()); //use passport to manage session

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    username:
    {
        type: String,
        require: true
    },
    password:
    {
        type: String,
        require: true
    },
});

userSchema.plugin(passportLocalMongoose);

//const secret = process.env.SECRET;

//userSchema.plugin(encrypt, { secret:secret, encryptedFields: ['password'] });

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
})

app.route('/')
    .get((req, res) => {
        res.render('home');
    });
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {

        const user = new User ({
            username: req.body.username,
            password: req.body.password
        });

        req.logIn(user, (err) => {
            if (err){
                console.log(err);
                res.redirect('/login')
            } else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets')
                })

        }
    })
        
        // let eMail = req.body.username;
        // let password = (req.body.password);



        // User.findOne({email: eMail}, (err, found) => {
        //     if (err) {
        //         console.log('rejected');
        //         console.log(err);
        //         res.redirect('/');
        //     } else {
        //         console.log(found);
        //         if (found){
                    // bcrypt.compare(password, found.password, function(err, result) {
                    //     if(result){
                    //         res.render('secrets');
                    //     } else {
                    //         console.log(err);
                    //         res.redirect('/');
                    //     }
                        
                    // });
        //         }


        //     }
        // });
    });

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated){
        res.render('secrets')
    } else {
        res.render('login')
    }

})
app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        

        User.register({username: req.body.username}, req.body.password, (err, user) => {
            if(err){
                console.log(error);
                res.redirect('/register');
            } else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets')
                })

            }

        })

        //let email = req.body.username;
        //let password = md5(req.body.password);
        // let password = req.body.password;
        // bcrypt.hash(password, saltRounds, function(err, hash) {
        //     const newUser = new User({
        //         email: email,
        //         password: hash
        //     })
    
        //     newUser.save((err) => {
        //         if(err){
        //             console.log(err)
        //         } else {
        //             res.render('secrets');
        //         }
        //     });
        // });


    })



app.listen('3000', () => console.log('Server started on port 3000'));