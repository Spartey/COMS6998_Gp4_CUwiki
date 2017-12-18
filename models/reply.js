var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp'); //timestamps plugin for mongoose

// define model =================
// the schema
var ReplySchema = mongoose.Schema({
    content:String,
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
});

//Plugin: mongoose-timestamp
//This will create two auto fields: created_at and updated_at
ReplySchema.plugin(timestamps);
//the models
var Reply = mongoose.model('Reply', ReplySchema);

module.exports = Reply;
