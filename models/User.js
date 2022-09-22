const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
	{
		name: String,
		email: String,
		password: String,
		dateOfBirth: Date
	},
	{
		collection: 'User_collection',
	},
);

const user = mongoose.model('user', UserSchema);

module.exports = user;
