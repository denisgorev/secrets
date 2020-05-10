//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
//const md5 = require('md5')
//const encrypt = require('mongoose-encryption');
const bcrypt = require('bcryptjs');

const saltRounds = 10; //the number of salt additing and hashing

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
        let password = (req.body.password);



        User.findOne({email: eMail}, (err, found) => {
            if (err) {
                console.log('rejected');
                console.log(err);
                res.redirect('/');
            } else {
                console.log(found);
                if (found){
                    bcrypt.compare(password, found.password, function(err, result) {
                        if(result){
                            res.render('secrets');
                        } else {
                            console.log(err);
                            res.redirect('/');
                        }
                        
                    });
                }


            }
        });
    });
app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        let email = req.body.username;
        //let password = md5(req.body.password);
        let password = req.body.password;
        bcrypt.hash(password, saltRounds, function(err, hash) {
            const newUser = new User({
                email: email,
                password: hash
            })
    
            newUser.save((err) => {
                if(err){
                    console.log(err)
                } else {
                    res.render('secrets');
                }
            });
        });


    })



app.listen('3000', () => console.log('Server started on port 3000'));