'use strict';
var express = require('express');
var router = express.Router();

var Autolinker = require( 'autolinker' ); //auto linker

//Models========================================================================
var Question = require('../models/question');
var Room = require('../models/room');
var User = require('../models/user');
var Reply = require('../models/reply');

//Helper========================================================================
function prepareNewOrUpdatedQuestion(req, question) {
    //prepare the strings
    var wholeMsg = req.body.wholeMsg || "";
    var firstAndLast = getFirstAndRestSentence(wholeMsg);
    //process the whole Msg
    var head = req.body.head || firstAndLast[0];
    var desc = req.body.desc || firstAndLast[1];
    if (wholeMsg === "") wholeMsg = head + desc;
    var tags = req.body.tags;
    if (!tags) {
        tags = wholeMsg.match(/#(\w+)/g);
        for(var key in tags) {
            tags[key] = tags[key].match(/#(\w+)/)[1];
        }
    }
    console.log(`tags: ${tags}`);
    // console.log("user _id: " + userId);

    if (!question) question = {};

    var obj = {
        wholeMsg : wholeMsg,
        head: head,
        headLastChar: head.slice(-1),
        desc: desc,
        linkedDesc: Autolinker.link(desc, {newWindow: false, stripPrefix: false}),
        tags: tags,
    };

    if (req.body.status) {
        obj.status = req.body.status;
    }

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            question[key] = obj[key];
        }
    }
}

//add the new question only fields
function prepareNewQuestion (req, question) {
    var user = req.user ? req.user._id : null;
    //process the choices
    if (req.body.choices) {
        console.dir(req.body);
        var choices = [];
        req.body.choices.forEach(function(name) {
            // console.log(`the name: ${name}`);
            choices.push({
                name: name,
                votes: 0,
            });
        });
    }
    if (!question) question = {};
    var obj = {
        totalVote: 0,
        echo: 0,
        roomId: req.body.roomId,
        upVote: 0,
        downVote: 0,
        user: user,
        completed: false,
        //for polling
        type: req.body.type || 'question', //question or polling or image
        choices: choices || [],
        status: req.body.status || 'open',
        attachment: req.body.attachment || '',
    };

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            question[key] = obj[key];
        }
    }
}

/** api ========================================================================
 * ---CRUD----------------------------------------------------------------------
 * GET /
 * GET /:question_id
 * POST /
 * POST /:question_id
 * DELETE /:question_id
 * ---METHODS-------------------------------------------------------------------
 * GET /:question_id/toggle-complete
 * GET /:question_id/add-echo
 * GET /:question_id/minus-echo
 * GET /:question_id/vote-down
 * GET /:question_id/vote-down-cancel
 */
// GET all questions
router.get('/', function(req, res) {
    /** determine the ordering
     * The parameters supplied as GET query
     * e.g. localhost:8080/api/questions?sort=echo&order=asc
     * sort=[field] the field name to sort
     * order=asc OR desc
     */
    var sortDict = {};
    sortDict[req.query.sort || "echo"] =
        ((req.query.order || "desc") == "asc" ? 1 : -1);
    delete req.query.sort;
    delete req.query.order;
    // use mongoose to get all questions in the database
    console.log(req.query);
    Question.find(req.query)
    .sort(sortDict)
    .populate('reply')
    .deepPopulate('reply.user')
    .populate('user', 'fb.name photo')
    .exec(function(err, questions) {
            if (err) {res.send(err);}
        res.json(questions);
    });
});

// GET one question
router.get('/:question_id', function (req, res) {
    Question.findById(req.params.question_id)
    .populate('reply')
    .deepPopulate('reply.user')
    .populate('user', 'fb.name photo')
    .exec(function(err, question){
        if (err) {
            res.send(err);
        } else {
            res.json(question);
        }
    });
});

// CREATE question and send back all questions after creation
router.post('/', function(req, res) {
    // get and return all the questions after you create another
    var return_question = function() {
        Question.find().sort({echo: -1}).exec(function(err, questions) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                res.json(questions);
            }
        });
    }

    var set_roomId = function () {
        Room.find({name: req.body.roomId}, function(err, room) {
			if (err) {
                console.log(err);
				res.send(err);
			}
            else {
                // console.log(room);
    			if (room.length == 0) {
    				Room.create({name: req.body.roomId}, function(err, room) {
    					if (err) {
                            console.log(err);
        				    res.send(err);
                        } else {
                            return_question();
                        }
    				});
    			} else {
                    return_question();
    			}
            }
		});
    };

    // create the model object
    var question = {};
    prepareNewQuestion(req, question);
    prepareNewOrUpdatedQuestion(req, question);
    Question.create(question, function(err, question) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            if (req.user) { //the user exists
                console.log("add question " + question._id + " to " + req.user._id);
                User.findOne({_id: req.user._id}, function(err, user) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        user.questions.push(question._id);
                        user.save(function(err) {
                            if (err) {
                                console.log(err);
                                res.send(err);
                            }
                            else {
                                set_roomId();
                            }
                        });
                    }
                });
            } else {
                set_roomId();
            }
        }


    });
});

// UPDATE question and send back all questions after creation
router.post('/:question_id', function(req, res) {
    //prepare the strings
    var wholeMsg = req.body.wholeMsg;
    //process the whole Msg
    var firstAndLast = getFirstAndRestSentence(wholeMsg);
    var head = firstAndLast[0];
    var desc = firstAndLast[1];

    // modify a question, information comes from AJAX request from Angular
    var question = {};
    prepareNewOrUpdatedQuestion(req, question);
    Question.update({//condition
        _id: req.params.question_id
    }, question, function(err, question) {
        if (err) {
            res.send(err);
        }

        Question.find().sort({createdAt: -1}).exec(function(err, questions) {
            if (err) {
                res.send(err);
            }
            res.json(questions);
        });
    });
});

router.post('/:question_id/reply', function(req, res) {
    Question.findById(req.params.question_id, function(err, question) {
        if (err) {
            res.send(err);
        } else {
            Reply.create({ //create a reply
                content: req.body.replyContent,
                user: req.user ? req.user._id: null,
                parent: question._id,
            }, function(err, reply) {
                if (err) {
                    res.send(err);
                } else {
                    question.reply.push(reply._id); //add reply to the question
                    question.save(function(err, question) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.send(200);
                        }
                    });
                }
            });
        }
    });
});

// toogle-complete for the specified Question
router.get('/:question_id/toggle-complete', function(req, res) {
    Question.findOne({
        _id: req.params.question_id
    }).exec(function(err, question) {
        if (err) res.send(err);
        Question.update({
            _id: req.params.question_id
        }, {
            completed : !question.completed
            // echo: question.echo + 1
        }, function (err, question) {
            if (err) res.send(err);
            Question.find().sort({createdAt: -1}).exec(function(err, questions) {
                if (err) {
                    res.send(err);
                }
                res.json(questions);
            });
        });
    });
    //remember this operation so that the client doesn't repeat
});

// add one echo for the specified Question
router.get('/:question_id/add-echo', function(req, res) {
    //add one echo
    Question.findOne({
        _id: req.params.question_id
    }).exec(function(err, question) {
        if (err) res.send(err);
		var upVote = question.upVote + 1;
        Question.update({
            _id: req.params.question_id
        }, {
			upVote: upVote,
			echo: upVote - question.downVote,
        }, function (err, question) {
            if (err) res.send(err);
            Question.find().sort({createdAt: -1}).exec(function(err, questions) {
                if (err) {
                    res.send(err);
                }
                res.json(questions);
            });
        });
    });
    //remember this operation so that the client doesn't repeat
});

// cancel one echo for the specified Question
router.get('/:question_id/minus-echo', function(req, res) {
    //delete one echo from the question
    Question.findOne({
        _id: req.params.question_id
    }).exec(function(err, question) {
        if (err) res.send(err);
		var upVote = question.upVote - 1;
        Question.update({
            _id: req.params.question_id
        }, {
			upVote: upVote,
			echo: upVote - question.downVote,
        }, function (err, question) {
            if (err) res.send(err);
            Question.find().sort({createdAt: -1}).exec(function(err, questions) {
                if (err)
                res.send(err)
                res.json(questions);
            });
        });
    });
    //remember this operation so that the client doesn't repeat
});

// add one votedown for the specified Question
router.get('/:question_id/vote-down', function(req, res) {
    //add one echo
    Question.findOne({
        _id: req.params.question_id
    }).exec(function(err, question) {
        if (err) res.send(err);
		var downVote = question.downVote + 1
        Question.update({
            _id: req.params.question_id
        }, {
			downVote: downVote,
			echo: question.upVote - downVote,
        }, function (err, question) {
            if (err) res.send(err);
            Question.find().sort({createdAt: -1}).exec(function(err, questions) {
                if (err)
                res.send(err)
                res.json(questions);
            });
        });
    });
    //remember this operation so that the client doesn't repeat
});

router.get('/:question_id/vote-down-cancel', function(req, res) {
    //add one echo
    Question.findOne({
        _id: req.params.question_id
    }).exec(function(err, question) {
        if (err) res.send(err);
		var downVote = question.downVote - 1
        Question.update({
            _id: req.params.question_id
        }, {
            downVote: downVote,
			echo: question.upVote - downVote,
        }, function (err, question) {
            if (err) res.send(err);
            Question.find().sort({createdAt: -1}).exec(function(err, questions) {
                if (err)
                res.send(err)
                res.json(questions);
            });
        });
    });
    //remember this operation so that the client doesn't repeat
});

// delete a question
router.delete('/:question_id', function(req, res) {

    Question.remove({
        _id : req.params.question_id
    }, function(err, question) {

        function removeFromUserQuestions(callback) {
            User.findById(question.user).exec(function(err, user) {
                if (err) {
                    res.send(err);
                } else {
                    if (user) {
                        for (var key in user.questions) {
                            if (user.questions[key] == question._id) {
                                user.questions = user.questions.splice(key, 1);
                                break;
                            }
                        }
                        user.save(function(err) {
                            if (err) {
                                res.send(err);
                            } else {
                                callback();
                            }
                        });
                    }
                    else {
                        callback();
                    }
                }
            });
        }

        function removeReplies() {
            //remove all the replies
            Reply.find({parent: question._id}).remove().exec(function(err, question) {
                if (err) {
                    res.send(err);
                } else {
                    res.sendStatus(200);
                }
            });
        }


        if (err) {
            res.send(err);
        } else {
            //remove from the user's questions
            removeFromUserQuestions(
                removeReplies
            );
        }
    });
});

//vote up a polling
router.get('/:question_id/:choice_id/vote-up', function(req, res) {
    Question.findById(req.params.question_id, function(err, question) {
        if (err) {
            res.send(err);
        } else {
            if (question == null) {
                res.send("question not found");
            } else {
                if (question.type === "polling") {
                    if (question.status === "open") {
                        var choice = question.choices.id(req.params.choice_id);
                        choice.votes = choice.votes + 1;
                        question.totalVote += 1;
                        question.save(function(err, question) {
                            //console.log(question);
                            if (err) {
                                res.send(err);
                            } else {
                                res.send("success");
                            }
                        });
                    }
                    else {
                        res.send("the question is closed");
                    }
                }
                else {
                    res.send("the question is not a polling");
                }
            }
        }
    })
})

// helper ===========================================================
// Get the first sentence and rest
function getFirstAndRestSentence($string) {
	var head = $string;
	var desc = "";

	var separators = [". ", "? ", "! ", '\n'];

	var firstIndex = -1;
	for (var i in separators) {
		var index = $string.indexOf(separators[i]);
		if (index == -1) continue;
		if (firstIndex == -1) {firstIndex = index; continue;}
		if (firstIndex > index) {firstIndex = index;}
	}

	if (firstIndex !=-1) {
		head = $string.slice(0, firstIndex+1);
		desc = $string.slice(firstIndex+1);
	}
	return [head, desc];
};

module.exports = router;
