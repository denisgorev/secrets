//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require('md5')
//const encrypt = require('mongoose-encryption');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email:
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

//const secret = process.env.SECRET;

//userSchema.plugin(encrypt, { secret:secret, encryptedFields: ['password'] });

const User = new mongoose.model('User', userSchema);

app.route('/')
    .get((req, res) => {
        res.render('home');
    });
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        let eMail = req.body.username;
        let password = md5(req.body.password);
        User.findOne({email: eMail, password: password}, (err, found) => {
            if (err || found===null) {
                console.log(found);
                console.log('not found');
                res.redirect('/');
            } else {
                console.log(found);
                res.render('secrets')
            }
        });
    });
app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        let email = req.body.username;
        let password = md5(req.body.password);
        const newUser = new User({
            email: email,
            password: password
        })

        newUser.save((err) => {
            if(err){
                console.log(err)
            } else {
                res.render('secrets');
            }
        });
    })



app.listen('3000', () => console.log('Server started on port 3000'));