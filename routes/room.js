'use strcit'
var express = require('express');
var router = express.Router();

var Room = require('../models/room');

router.get('/', function(req, res) {
    Room.find().exec(function(err, rooms) {
        if (err) {
            res.send(err);
        }
        res.json(rooms);
    });
});

module.exports = router;
