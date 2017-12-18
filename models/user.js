var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
	fb: {
		id: String,
		access_token: String,
		name: String,
	},
	photo: String,
	questions: [mongoose.Schema.Types.ObjectId],
	type: {type: String, default: "normal"}, //normal or admin
});
