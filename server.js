// server.js
'use strict';
// set up ========================
var express  = require('express');
var app      = express();                               // create our app w/ express
var mongoose = require('mongoose');
var morgan = require('morgan');             // log requests to the console (express4)

var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var bleach = require('bleach'); // sanitize XSS
var fs = require('fs'); //file system

// configuration =================

mongoose.connect('localhost', 'questionJS');     // connect to mongoDB database

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
//CUSTOM middleware to escape anything in req.body/query/params, recursively
app.use(function(req, res, next) {
    var whitelist = [
        'a',
        'b',
        'i',
        'em',
        'strong',
        'strike',
        'u',
        'div',
        'span',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'h7',
        'sub',
        'sup',
        'p',
        'img',
    ]

    var options = {
        mode: 'white',
        list: whitelist,
    }

    function sanitize(obj) {
        for (var key in obj) {
            //loop through the keys
            if (obj.hasOwnProperty(key)) {
                //sanitize every possible keys
                if (typeof(obj[key]) === "object") {
                    sanitize(obj[key]);
                } else if (typeof(obj[key]) === "string") {
                    obj[key] = bleach.sanitize(obj[key], options);
                }
                //ignore other cases.
            }
        }
    }
    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    next();
});
//for debug use
app.use(function(req, res, next) {
    console.log('=============incoming request=============');
    console.dir({
        url: req.url,
        method: req.method,
        body: req.body,
    });
    next();
})
// routes ======================================================================
//CORS
app.all('*', function(req, res, next) {
    res.set({
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Headers' : 'accept, content-type, X-Requested-With'
    });
    console.log("===set headers!===");
    next();
});

// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: true,}));
app.use(passport.initialize());
app.use(passport.session());
// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

var authroutes = require('./routes/auth')(passport);
app.use('/auth', authroutes);

var apiroutes = require('./routes/api');
app.use('/api', apiroutes);

//static pages, default route
app.all(/^(.*)$/, function(req, res, next) {
    if (!req.params[0]) {
        req.params[0] = "index.html";
    }
    var filename = "./public/" + req.params[0] ? req.params[0] : "index.html";
    fs.stat(filename, function(err, stat) {
        if (err) {
            res.status(404);
            res.send("<h1>404 Not found</h1>");
        }
        res.sendfile(filename);
    });
});

// listen (start app with node server.js) ======================================
app.listen(8080,'0.0.0.0');
console.log("App listening on port 8080");
