'use strict';
var express = require('express');
var router = express.Router();

module.exports = function(passport) {
	// route for facebook authentication and login
	// different scopes while logging in
	router.get('/login/facebook',
		passport.authenticate('facebook', {scope : ['basic_info']}
	));

	// handle the callback after facebook has authenticated the user
	router.get('/login/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/',
			failureRedirect : '/'
		})
	);

	/**
	 * USAGE:
	 * POST /auth/login/facebook/token
	 * WITH DATA: {
	 * 		access_token: <TOKEN_HERE>
 	 * }
	 **/
	router.post('/login/facebook/token',
		passport.authenticate('facebook-token'), function (req, res) {
	    // do something with req.user
	    res.send(req.user? 200 : 401);
	});

	router.get('/logout/facebook', function(req, res){
		req.logout();
		res.redirect('/');
	});
    return router;
}
