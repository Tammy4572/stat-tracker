const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
mongoose.Promise = require('bluebird');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const application = express();

const data = require('./models/data');
const activities = require('./routes/activities');
const users = require('./routes/users');

const moment = require('moment');
moment().format();

mongoose.connect('mongodb://localhost:27017/Tracker');

application.use(express.static(__dirname + '/public'));
application.use(bodyParser.json());

application.use(passport.initialize());

application.use(activities);
application.use(users);

const jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'supersecretkey';

const strategy = new JwtStrategy(jwtOptions, async function(jwt_payload, next) {
    var user = await data.users.find({ id: jwt_payload.id });
    if (user) {
        next(null, user);
    } else {
        next(null, false);
    }
});

passport.use(strategy);

application.listen(3000);