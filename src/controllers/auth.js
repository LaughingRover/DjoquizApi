const asyncLib = require('async');
const md5 = require('md5');
const db = require('../db');
const { hashPass } = require('#utils/password-hash');
const { MESSAGES, DB_NAMES } = require('../constants');
const { generateAccessToken } = require('../utils/auth-utils');
const { v4: uuidv4 } = require('uuid');
const { registerValidator, loginValidator } = require('../utils/validators');

// TODO: check user, accesstoken, and refreshToken before renewing an accessToken
// TODO: a refresh token should be able to refresh only one accessToken
// TODO: a refresh token must be accompanied by an access token before it can work
function refreshAccessToken(req, res) {
	const refreshToken = req.body.refreshToken;
	if (!refreshToken) return res.status(400).json({ error: true, message: 'Missing required field' });

	const db_options = { query: { value: refreshToken }, from: DB_NAMES.REFRESH_TOKEN_MODEL };

	db.getOne(db_options, (err, token) => {
		if (err) return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });

		if (!token) return res.status(401).json({ error: true, message: 'invalid token' });

		if (token.revoked) return res.status(401).json({ error: true, message: 'invalid token' });

		db.getOne({ query: { _id: token.userId }, from: DB_NAMES.USER_MODEL }, (err, user) => {
			if (err) return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			if (!user) return res.status(401).json({ error: true, message: 'invalid token' });

			let newAccessToken = generateAccessToken(user);
			res.status(200).json({
				error: false,
				message: 'token generated successfully',
				data: { accessToken: newAccessToken },
			});
		});
	});
}

function loginLocal(req, res) {
	let isValidRequestObject = loginValidator(req.body); // validate request data using json schema
	let errors = loginValidator.errors; // get the errors if there are any

	if (!isValidRequestObject)
		return res.status(400).json({ error: true, message: 'missing or invalid required fields', errors: errors });

	let newRefreshToken = uuidv4();
	let { email, password } = req.body;

	db.getOne(
		{
			query: { email },
			from: DB_NAMES.USER_MODEL,
		},
		(err, user) => {
			// return an err if an error occurred
			if (err) {
				return res.status(500).json({ error: true, message: 'internal server error' });
			}

			// could not find the user
			if (!user) {
				return res.status(400).json({ error: true, message: 'Incorrect email/username.' });
			}

			// compare users password
			user.validPassword(password, (_err, isMatch) => {
				if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

				// create and store tokens
				db.create(
					{
						to: DB_NAMES.REFRESH_TOKEN_MODEL,
						data: {
							value: newRefreshToken,
							userId: user.id || user._id,
							isRevoked: false,
							createdAt: Date.now(),
							revokedAt: null,
						},
					},
					(_err, _result) => {
						if (_err) return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });

						let { token } = generateAccessToken(user);
						res.cookie('authToken', token, { httpOnly: true, maxAge: 432000000 /* 5 days */, path: '/' });
						res.cookie('refreshToken', newRefreshToken, {
							httpOnly: false,
							maxAge: 31536000000 /* 365 days */,
							path: '/',
						});
						res.status(200);
						res.json({
							error: false,
							message: MESSAGES.LOGIN_SUCCESS,
							data: {
								userId: user.id || user._id,
							},
						});
					}
				);
			});
		}
	);
}

/**
 * SILENT LOGIN ROUTE
 * Users who have a valid token will be loggedIn and also get their
 * userId back
 */
function silent(req, res) {
    res.status(200).json({ eror: false, message: 'logged in', data: { id: req.user.id }})
}

/**
 *
 * Register a new user's data
 * @restrictions available to only anonymous or logged out users.
 * @requires email
 * @requires password
 * @requires firstname
 * @requires lastname
 */
function register(req, res) {
	let valid = registerValidator(req.body);
	const errors = registerValidator.errors;

	if (!valid) {
		return res.status(400).json({ error: true, message: errors.message, errors });
	}
	const { email, password } = req.body;

	asyncLib.waterfall([
		// check if the email is already registered
		function (callback) {
			const config = {
				query: { email },
				from: DB_NAMES.USER_MODEL,
			};
			db.getOne(config, (err, userdata) => {
				if (err) {
					console.trace({ err });
					return res.status(500).json({
						error: true,
						message: MESSAGES.SERVER_ERROR,
					});
				}
				callback(null, userdata);
			});
		},
		// hash the password
		function (userFound, callback) {
			if (!userFound) {
				hashPass(password, (err, hashedPassword) => {
					if (err) {
						console.trace({ err });
						return res.status(500).json({
							error: true,
							message: MESSAGES.SERVER_ERROR,
						});
					}

					callback(null, hashedPassword);
				});
			} else {
				return res.status(409).json({
					error: true,
					message: 'that email has already been registered',
				});
			}
		},
		/**
		 * verification hash will be stored to db but not sent to user.
		 * verification hash is used for creating confirmation link sent to user
		 * confirmation link to reset password and verify email will contain the following object
		 * {
		 *   email: userEmail,
		 *   verificationHash: md5,
		 *   date: Date.now()
		 * }
		 * confirmation link to verify will be in the format
		 *   /verify?email=[users email]&vt=[token]
		 * */
		// TODO create a verificationHash
		// create verificationHash
		function (hashedPassword, callback) {
			let verificationHash = md5(email);
			callback(null, { verificationHash, hashedPassword });
		},
		// create new user in the db
		function (result) {
			let config = {
				data: {
					email: email,
					birthday: null,
					score: 0,
					placement: 0,
					password: result.hashedPassword,
					verificationToken: result.verificationHash,
					isEmailVerified: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				to: DB_NAMES.USER_MODEL,
			};
			db.create(config, err => {
				if (err) {
					console.trace({ err });
					return res.status(500).json({
						error: true,
						message: MESSAGES.SERVER_ERROR,
					});
				}

				// continue to log in the user
				loginLocal(req, res);
			});
		},
	]);
}

/**
 * LOGOUT A USER
 */
function logout(req, res) {
	res.cookie('authToken', 'deleted', { httpOnly: true, maxAge: 0 /* 5 days */, path: '/' });
	res.cookie('refreshToken', 'deleted', {
		httpOnly: false,
		maxAge: 0 /* 365 days */,
		path: '/',
	});
	res.status(200).json({ error: false, message: 'user logged out successfully' });
}

module.exports = {
	loginLocal,
	silent,
	register,
	refreshAccessToken,
	logout,
};
