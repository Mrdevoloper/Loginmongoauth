const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserVerificationSchema = new Schema(
	{
		userId: String,
		UniqueString: String,
		created_at: Date,
        expired_at: Date
	},
	{
		collection: 'User_Verification',
	},
);

const UserVerification = mongoose.model('UserVerification', UserVerificationSchema);

module.exports = UserVerification;
