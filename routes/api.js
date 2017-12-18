'use strict';

var express = require('express');
var router = express.Router();

// helper that may be required later ==========================================
var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

var question_route = require("./question");
var user_route = require("./user");
var room_route = require("./room");
router.use('/questions', question_route);
router.use('/users', user_route);
router.use('/rooms', room_route);
module.exports = router;
