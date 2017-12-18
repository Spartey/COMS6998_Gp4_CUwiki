'use strict';
var express = require('express');
var router = express.Router();

//Models========================================================================
var User = require('../models/user');
var Question = require('../models/question');

router.get('/current', function(req, res) {
    if (req.user) {
        Question.populate(req.user, {path: 'questions'}, function(err, user) {
            console.log("===CURRENT USER!===");
            console.dir(user);
            res.json(user);
        });
    } else {
        console.log("===NOT LOGGED IN===");
        res.json(req.user);
    }
});

//become admin
router.get('/secret', function(req, res) {
    console.log("======SHHH SECRET======")
    console.log(req.user)
    if (req.user) {
        req.user.type = (req.user.type == "normal") ? "admin" : "normal";
        req.user.save(function(err, user) {
            if (err) {
                res.send(err);
            } else {
                res.redirect('back');
            }
        });
    } else {
        res.sendStatus(401);
    }
});

router.get('/', function(req, res) {
    User.find().exec(function(err, users) {
        if (err) {
            res.send(err);
        }
        res.json(users);
    });
});

router.get('/:fb_id', function(req, res) {
    User.findOne({'fb.id': req.params.fb_id}).exec(
        function(err, user) {
            if (err)
                res.send(err);
            Question.populate(user, {path: 'questions'}, function(err, user) {
                res.json(user);
            });
        }
    );
});

router.post('/:user_id', function (req, res) {
    console.log(req.body.type)
    User.update({
        _id: req.params.user_id
    }, {
        type: req.body.type
    }, function (err, user) {
        if (err)
            res.send(err)

        res.json(user)
    });
});

module.exports = router;
