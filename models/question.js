var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp'); //timestamps plugin for mongoose
var deepPopulate = require('mongoose-deep-populate')(mongoose);
// define model =================
// the schema
var QuestionSchema = mongoose.Schema({
    completed: Boolean,
    wholeMsg: {type: String, required: true},
    head: {type: String, required: true}, //the head
    desc: String, //the description
    headLastChar: String,
    linkedDesc: String,
    new: Boolean,
    roomId: String,
    upVote: Number,
    downVote: Number,
    echo: Number, //this is upvote - downvote
    tags: [String],
    reply: [{type: mongoose.Schema.Types.ObjectId, ref: 'Reply'}],
    //polling function
    type: String, //'question' or 'polling' or 'image'
    choices: [{
        name: String,
        votes: Number,
    }],
    totalVote: Number,
    status: String, //either one of "open" or "closed"
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    attachment: {type: String, default:''}, //url to the attachment image. Only effective for 'image' type
});

//Plugin: mongoose-timestamp
//This will create two auto fields: created_at and updated_at
QuestionSchema.plugin(timestamps);
QuestionSchema.plugin(deepPopulate, {
  populate: {
    'reply.user': {
      select: 'fb.name photo',
    },
  }
});
//the models
var Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;
