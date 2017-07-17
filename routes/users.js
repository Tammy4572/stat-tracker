const express = require('express');
const route = express.Router();
const bodyParser = require('body-parser')
const passportJWT = require("passport-jwt");;
const jwt = require('jsonwebtoken');
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const data = require('../models/data');

route.use(bodyParser.json());
route.use(bodyParser.urlencoded());

const jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'supersecretkey';

route.get('/login', (request, response) => {
    response.sendFile(__dirname + '/public/login.html');
});

route.get('signup', (request, response) => {
    response.sendFile(__dirname + '/public/signup.html');
});

route.post('/api/signup', async (request, response) => {
    if (request.body.email && request.body.password && request.body.userName) {
        var user = await data.users.find({ email: request.body.email });
        if (!user[0]) {
            var newUser = await data.users.create({
                userName: request.body.userName,
                email: request.body.email,
                password: request.body.password
            });
            var payload = { id: newUser._id, new: newUser.userName };
            var token = jwt.sign(payload, jwtOptions.secretOrKey);
            return response.json({ message: 'Ok', token: token });
        }
        else {
            return response.status(401).json({ message: 'Provided email is already registered in our system. '});
        }
    } else {
        return response.status(401).json({ message: 'Please complete all signup form fields.'});
    }
});

route.post('/api/login', async (request, response) => {
    if (request.body.email && request.body.password) {
        var email = request.body.email;
        var password = request.body.email;
    }
    var user = await data.users.find({ email: email });
    if (!user[0]) {
        return response.status(401).json({ message: 'User not found. '});
    } if(user[0].password === request.body.password) {
        var payload = { id: user._id, name: user.userName };
        var token = jwt.sign(payload, jwtOptions.secretOrKey);
        return response.json({ message: 'ok', token: token });
    } else {
      return response.status(401).json({ message: 'passwords entered did not match.'});
    }
});

module.exports = route;