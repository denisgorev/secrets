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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const VKontakteStrategy = require('passport-vk-strategy').Strategy;


const app = express();

app.use(require('cookie-parser')());


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

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true,  useFindAndModify: false });
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    vkontakteId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//const secret = process.env.SECRET;

//userSchema.plugin(encrypt, { secret:secret, encryptedFields: ['password'] });

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
User.findById(id, function(err, user) {
    User.findById(id)
        .then(function (user) { done(null, user); })
        .catch(done);
});
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new VKontakteStrategy(
    {
      clientID:     process.env.VKONTAKTE_APP_ID, // VK.com docs call it 'API ID', 'app_id', 'api_id', 'client_id' or 'apiId'
      clientSecret: process.env.VKONTAKTE_APP_SECRET,
      callbackURL:  "http://localhost:3000/auth/vkontakte/callback"
    },
    function(accessToken, refreshToken, params, profile, done) {
        // console.log(params.email); // getting the email
        User.findOrCreate({ vkontakteId: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
})

app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile'] })
)

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/vkontakte', 
    passport.authenticate('vkontakte'), 
    function(req, res){
        // The request will be redirected to vk.com for authentication, so
        // this function will not be called.
      });

app.get('/auth/vkontakte/callback',
  passport.authenticate('vkontakte', {
    successRedirect: '/secrets',
    failureRedirect: '/login',
    //session:false
  }),
)


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
    User.find({'secret':{$ne:null}}, (err, foundUsers) => {
        if (err){
            console.log(err);
        } else {
            res.render('secrets', {usersWithSecret: foundUsers})
        }
    })

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

app.route('/submit')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('submit')
        } else {
            res.redirect('/login')
        }
    })

    .post((req, res) => {
        const submittedSecret = req.body.secret;
        console.log(req.user);
        User.findOneAndUpdate({_id: req.user._id}, {secret: submittedSecret}, {new: true}, (err, doc) => {
            if(err){
                console.log(err)
            } else {
                console.log(doc);
                res.redirect('/secrets');
            }
        })
    })



app.listen('3000', () => console.log('Server started on port 3000'));