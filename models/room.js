var mongoose = require('mongoose');

module.exports = mongoose.model('Room', {
	name: String,
	// questions: [Schema.Types.ObjectId] // store questions' mongoDB id
});
