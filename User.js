const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	redditUsername: {
		type: String,
		unique: true,
		index: true
	},
	ethereumAddress: String
});

module.exports = mongoose.model("User", UserSchema);