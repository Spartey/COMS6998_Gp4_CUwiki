var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token');
var User = require('../models/user');
var fbConfig = require('../fb.js');
var http = require('http');

// facebook will send back the tokens and profile
function reaction(access_token, refresh_token, profile, done) {
    console.log("=======returned profile========");
    console.dir(profile);

    // asynchronous
    process.nextTick(function() {

        // find the user in the database based on their facebook id
        User.findOne({'fb.id': profile.id }, function(err, user) {

            // if there is an error, stop everything and return that
            // ie an error connecting to the database
            if (err)
                return done(err);

            // if the user is found, then log them in
            if (user) {
                return done(null, user); // user found, return that user
            } else {
                // if there is no user found with that facebook id, create them
                var newUser = new User();

                // set all of the facebook information in our user model
                newUser.fb.id    = profile.id; // set the users facebook id
                newUser.fb.access_token = access_token; // we will save the token that facebook provides to the user
                newUser.fb.name  = profile.displayName;
                newUser.photo = profile.photos ? profile.photos[0].value : "img/avatar.png";
                newUser.type = 'normal'
                // save our user to the database
                newUser.save(function(err) {
                    if (err)
                        throw err;

                    // if successful, return the new user
                    return done(null, newUser);
                });
            }
        });
    });
}

module.exports = function(passport) {

    passport.use('facebook', new FacebookStrategy({
        clientID        : fbConfig.appID,
        clientSecret    : fbConfig.appSecret,
        callbackURL     : fbConfig.callbackUrl,
        profileFields: ['id', 'name','picture.type(small)', 'emails', 'displayName', 'about', 'gender']
    }, reaction));

    passport.use('facebook-token', new FacebookTokenStrategy({
        clientID        : fbConfig.appID,
        clientSecret    : fbConfig.appSecret,
        profileFields: ['id', 'name','picture.type(small)', 'emails', 'displayName', 'about', 'gender']
    }, reaction));
};
