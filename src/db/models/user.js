// TODO if a users info is requested, check if the email address is valid and return it, otherwise, return null
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { comparePass } = require('../../utils/password-hash');

function hashPassword(next) {
	const SALT_FACTOR = 5;
	const updatevalues = this._update['$set'];

	if (!updatevalues.password) return next();

	bcrypt.hash(updatevalues.password, SALT_FACTOR, (err, hashedPassword) => {
		if (err) return next(err);

		this._update['$set'].password = hashedPassword;
		next();
	});
}

function setUpdateTime(next) {
    this._update['$set'].updatedAt = new Date().toISOString();
    next();
}

const User = new mongoose.Schema(
	{
		googleId: { type: String },
		facebookId: { type: String },
		twitterId: { type: String },
		firstname: { type: String },
		middlename: { type: String },
		lastname: { type: String },
		email: { type: String, required: true, unique: true },
		username: { type: String },
		dob: { type: Date },
		gender: { type: String },
		nationality: { type: String },
        language: { type: String },
		score: { type: Number },
		rank: { type: Number },
		password: { type: String, required: true },
		photo: { type: String },
		verificationToken: { type: String },
		isEmailVerified: { type: Boolean },
		role: { type: String },
		createdAt: { type: Date },
		updatedAt: { type: Date, default: Date.now },
	},
	{
		toJSON: {
			transform: (_doc, ret) => {
				ret.id = ret._id;
				delete ret._id;
				delete ret.__v;
				delete ret.password;
				delete ret.verificationToken;
			},
		},
	}
);

User.pre('update', setUpdateTime);
User.pre('updateOne', setUpdateTime);
User.pre('updateOne', hashPassword);
User.methods.validPassword = function (pass, callback) {
	comparePass(pass, this.password, callback);
};

module.exports = mongoose.model('User', User);
