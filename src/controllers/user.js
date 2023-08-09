/**=======================================================================
                                User Controller
 ========================================================================*/

// Imports
const async = require('async');
const saveImageHelper = require('../utils/saveImage');
const removeImageHelper = require('../utils/removeImage');
const { generateLink, decodeVerificationToken } = require('../utils/auth-utils');
const db = require('../db');
const { DB_NAMES: dbNames, MESSAGES } = require('../constants');
const mailer = require('../utils/mailer');

const { updateUserValidator, verifyEmailValidator, updatePasswordValidator, getUserValidator } = require('../utils/validators');

// CONSTANTS
const EMAIL_REGEX =
	/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d).{4,20}$/;

/**
 *
 * Logs in a user and responds with a token
 * @restrictions available to only anonymous or logged out users.
 * @requires email
 * @requires password
 */
function getProfile(req, res) {
	const params = req.query;

	if (!params.id) {
		return res.status(400).json({ error: true, message: "missing 'id' parameter in query string" });
	}

	let db_config = {
		query: { _id: params.id },
		from: dbNames.USER_MODEL,
	};

	db.getOne(db_config, (err, profile) => {
		if (err) {
			console.trace({ err });
			return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
		}

		if (!profile) return res.status(404).json({ error: true, message: 'profile not found' });

		if (params.type === 'id') return res.status(200).json({ error: false, data: profile });

		res.status(200).json({ error: false, data: profile });
	});
}

/**
 *
 * Logs in a user and responds with a token
 * @restrictions available to only anonymous or logged out users.
 * @requires email
 * @requires password
 */
function getUser(req, res) {
	const params = req.query;

	// if (!params.type) {
	// 	return res.status(400).json({ error: true, message: 'missing type in query string' });
	// }

	// if (!(params.type === 'all' || params.type === 'id')) {
	// 	return res.status(400).json({ error: true, message: "type must be either 'id' or 'all'" });
	// }

	// if (params.type === 'id' && !params.id) {
	// 	return res.status(400).json({ error: true, message: "missing 'id' parameter in query string" });
	// }

    const isValid = getUserValidator(params);
    const errors  = getUserValidator.errors;

    if(!isValid) return res.status(400).json({ error: true, message: 'missing or invalid required fields', errors: errors });

	let db_config = {
		query: params.type === 'id' ? { _id: params.id } : { [params.type]: params[params.type] },
		from: dbNames.USER_MODEL,
	};

	db.get(db_config, (err, result) => {
		if (err) {
			console.trace({ err });
			return res.status(500).json({
				error: true,
				message: MESSAGES.SERVER_ERROR,
			});
		}

		if (result.length === 0) return res.status(404).json({ error: true, message: 'no user(s) found' });

		if (params.type === 'id') return res.status(200).json({ error: false, data: result[0] });

		res.status(200).json(result);
	});
}

/**
 *
 * deletes a user from the db
 * @restrictions available to only superadmin and current user.
 * @requires type query search with accepted values as email || id
 * @requires email if type is email, then email search param is require
 * @requires id if type is id, then id search param is require
 * @example ?type=id&id=1233ddf4789add
 * @example type=email&email=usernamemail.com
 */
function deleteUser(req, res) {
	const params = req.query;

	if (!params.type) {
		return res.status(400).json({ error: true, message: 'missing type in query string' });
	}

	if (!(params.type === 'id')) {
		return res.status(400).json({ error: true, message: "type must be 'id'" });
	}

	if (params.type === 'id' && !params.id) {
		return res.status(400).json({ error: true, message: "missing 'id' parameter in query string" });
	}

	// let db_config = {
	//     query: params.type === 'id' ? { _id: params.id } : { [params.type]: params[params.type] },
	//     from: dbNames.USER_MODEL
	// };

	async.waterfall([
		// get data about the user to be deleted from the db
		function (callback) {
			db.getOne(
				{
					query: { _id: params.id },
					from: dbNames.USER_MODEL,
				},
				(err, userdata) => {
					if (err) {
						console.trace({ err });
						return res.status(500).json({
							error: true,
							message:
								'an error occurred while searching for user, please check the user id and try again.',
						});
					}

					if (!userdata)
						return res
							.status(400)
							.json({ error: true, message: "the user you're trying to delete does not exist" });

					let user = JSON.parse(JSON.stringify(userdata));
					callback(null, user);
				}
			);
		},
		// if the user has an image stored, delete it
		function (user, callback) {
			if (user.photo) {
				removeImageHelper(user.photo, () => {
					callback(null);
				});
			} else callback(null);
		},
		// delete the user from the db
		function () {
			const db_config = {
				query: { [params.type]: params[params.type] },
				from: dbNames.USER_MODEL,
			};
			db.delete(db_config, err => {
				if (err) {
					console.trace({ err });
					return res.status(500).json({
						error: true,
						message:
							'an error occurred while trying to delete user account, please check the information provided and try again.',
					});
				}

				res.status(200).json({ error: false, message: 'user deleted successfully' });
			});
		},
	]);
}

/**
 *
 * Updates a user's data
 * passwords can only be changed through link sent to email
 * @restrictions can only be accessible by a superadmin, admin, or the user.
 * @requires email || password || firstname || lastname || dob || occupation || nationality || language || score || photo || placement || isEmailValid || role
 */
function updateUser(req, res) {
	let isValidRequestObject = updateUserValidator(req.body);
	let validationErrors = updateUserValidator.errors;

	if (!isValidRequestObject)
		return res
			.status(400)
			.json({ error: true, message: 'missing or invalid fields to update', errors: validationErrors });

	const userId = req.user.id;
	let {
		email,
		username,
		firstname,
		middlename,
		lastname,
		gender,
		dob,
		occupation,
		nationality,
		language,
		score,
		rank,
	} = req.body;
	let hashedPassword = undefined;

	async.waterfall([
		// check if the email already exists
		function (callback) {
			if (email) {
				db.get(
					{
						query: { email },
						from: dbNames.USER_MODEL,
					},
					(err, result) => {
						if (err) {
							console.log({ err });
							return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
						}

						if (Array.isArray(result) && result.length >= 1) {
							return res
								.status(409)
								.json({ error: true, message: 'this email is already registered on this platform' });
						}

						callback(null);
					}
				);
			} else callback(null);
		},
		// update the user model with all changes
		function (callback) {
			let new_data = {
				email,
				username,
				firstname,
				middlename,
				lastname,
				gender,
				dob,
				occupation,
				nationality,
				language,
				score,
				rank,
			};

			db.update(
				{
					query: { _id: userId },
					to: dbNames.USER_MODEL,
					data: new_data,
				},
				(err, result) => {
					if (err) {
						console.trace({ err });
						return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
					}

					callback(null, result);
				}
			);
		},
		function (result) {
			if (result.nModified === 0) {
				console.trace({ warning: 'there was a problem with an update action. no user was updated' });
			}

			if (result.nModified > 1) {
				console.trace({
					warning: 'there was a problem with an update action. multiple users may have been updated',
				});
			}

			return res.status(200).json({ error: false, message: 'user updated successfully' });
		},
	]);
}

/**
 *
 * Verify a user's email
 */
function verifyEmail(req, res) {
	const isValid = verifyEmailValidator(req.query);
	const errors = verifyEmailValidator.errors;

	if (!isValid) {
		return res.status(400).json({ error: true, message: 'Missing or invalid request fields', erros: errors });
	}

	const { email, token } = req.query;

	async.waterfall([
		// fetch the user from the db using their email
		function (callback) {
			db.getOne(
				{
					query: { email },
					from: dbNames.USER_MODEL,
				},
				(err, result) => {
					if (err) {
						console.trace({ err });
						return res.status(500).json({ error: true, message: 'unable to find user' });
					}

					if (!result) return res.status(404).json({ error: true, message: 'user not found' });

					callback(null, result);
				}
			);
		},
		// verify the token
		function (userdata, callback) {
			const tokenData = decodeVerificationToken(token, userdata.verificationToken);
			if (!tokenData) return res.status(400).json({ error: true, message: 'invalid or expired token' });

			callback(null, { token: tokenData, user: userdata });
		},
		// check if the email received from the url matches the email in the token
		function (result, callback) {
			if (result.user.email !== email) {
				return res
					.status(400)
					.json({ error: true, message: 'email mismatch. please use the link sent to your email' });
			}

			callback(null, result);
		},

		// compare the md5 stored in token with the one stored in db
		function (result, callback) {
			if (result.user.verificationToken !== result.token.md5) {
				return res
					.status(400)
					.json({ error: true, message: 'unable to verify user. invalid verification credentials' });
			}

			callback(null);
		},
		// update the user data with a verified status by setting isEmailVerified to true
		function () {
			db.update(
				{
					query: { email },
					data: { isEmailVerified: true },
					to: dbNames.USER_MODEL,
				},
				(err, result) => {
					if (err) {
						console.trace({ err });
						res.status(500).json({
							error: true,
							message: MESSAGES.SERVER_ERROR,
						});
					}

					if (result.nModified === 0) {
						console.trace({ warning: 'there was a problem with an update action. no user was updated' });
					}

					if (result.nModified > 1) {
						console.trace({
							warning: 'there was a problem with an update action. multiple users may have been updated',
						});
					}

					return res.status(200).json({ error: false, message: 'email verified successfully' });
				}
			);
		},
	]);
}

/**
 *
 * Updates a user's password
 * a link should be sent to the user's email
 * @requires userId if admin request
 * @requires password
 */
// TODO: change this function to update the users password
function updatePassword(req, res) {
	const isValid = updatePasswordValidator({ ...req.query, ...req.body });
	const errors = updatePasswordValidator.errors;

	if (!isValid) return res.status(400).json({ error: true, message: 'missing or invalid required fieds', errors });

	const { email, token } = req.query;
	const { password } = req.body;

	async.waterfall([
		// fetch the user from the db using their email
		function (callback) {
			db.getOne(
				{
					query: { email },
					from: dbNames.USER_MODEL,
				},
				(err, result) => {
					if (err) {
						console.trace({ err });
						return res.status(500).json({ error: true, message: 'unable to find user' });
					}

					if (!result) return res.status(404).json({ error: true, message: 'user not found' });

					callback(null, result);
				}
			);
		},
		// verify the token
		function (result, callback) {
			const tokenData = decodeVerificationToken(token, result.password);
			if (!tokenData) return res.status(400).json({ error: true, message: 'invalid or expired token' });

			callback(null, {
				user: result,
				token: tokenData,
			});
		},
		// check if the email received from the url matches the email in the token
		function (result, callback) {
			if (result.token.email !== email)
				return res
					.status(400)
					.json({ error: true, message: 'email mismatch. please use the link sent to your email' });

			callback(null, result);
		},
		// compare the md5 stored in token with the one stored in db
		function (result, callback) {
			if (result.user.password !== result.token.md5) {
				return res
					.status(400)
					.json({ error: true, message: 'unable to verify user. invalid verification credentials' });
			}

			callback(null);
		},
		// update the user data with the new password
		function () {
			db.update(
				{
					query: { email },
					data: { password },
					to: dbNames.USER_MODEL,
				},
				(err, result) => {
					if (err) {
						console.trace({ err });
						res.status(500).json({ error: true, message: 'unable to update password. Please try again' });
					}

					if (result.nModified === 0) {
						console.trace({ warning: 'there was a problem with an update action. no user was updated' });
					}

					if (result.nModified > 1) {
						console.trace({
							warning: 'there was a problem with an update action. multiple users may have been updated',
						});
					}

					return res.status(200).json({ error: false, message: 'password updated successfully' });
				}
			);
		},
	]);
}

/**
 *
 * Send an email to a user
 * @requires email
 * @requires mailtype accepted values are verify, or resetpassword
 * @todo allow sending of custom emails by setting mailtype to 'custom'
 */
function sendEmail(req, res) {
	const email =
		req.body.email && typeof req.body.email === 'string' && req.body.email.trim().length > 0
			? req.body.email.trim()
			: false;
	const mailtype =
		req.body.mailtype && typeof req.body.mailtype === 'string' && req.body.mailtype.trim().length > 0
			? req.body.mailtype.trim()
			: false;

	if (!email || !EMAIL_REGEX.test(email)) {
		return res.status(400).json({ error: 'missing or invalid email' });
	}

	if (mailtype !== 'verify' && mailtype !== 'resetpassword') {
		return res
			.status(400)
			.json({ error: 'missing or invalid mailtype value. mailtype must be either resetpassword or verify' });
	}

	async.waterfall([
		// get the user data from db
		function (callback) {
			db.getOne(
				{
					query: { email },
					from: dbNames.USER_MODEL,
				},
				(err, result) => {
					if (err) {
						console.trace({ err });
						return res.status(500).json({ error: true, message: 'unable to find user.' });
					}

					if (!result) {
						return res.status(404).json({ error: true, message: 'email not registered' });
					}

					callback(null, result);
				}
			);
		},
		// check if user email is verified
		// cannot send mail to unverified emails
		function (result, callback) {
			if (!result.isEmailVerified && mailtype !== 'verify')
				return res.status(400).json({
					error: true,
					message: 'can only send verification mails to unverified emails. please verify your email',
				});

			if (result.isEmailVerified && mailtype === 'verify')
				return res.status(200).json({ error: false, message: 'email has already been verified' });

			callback(null, result);
		},
		// use md5, email, and date.now to generate a verification link for the user
		/**@todo extract generateLink function to utils folder */
		function (result, callback) {
			// if mailtype is 'resetpassword' use user's current password hash as a secret key to generate a password
			const verificationToken = {
				verify: result.verificationToken,
				resetpassword: result.password,
			}[mailtype];

			// generate the secure link
			// TODO fix verification
			// let link = generateLink(email, verificationToken, `${req.headers.host}/${mailtype}`);
			let link = generateLink(email, verificationToken, `${req.get('origin')}/${mailtype}`);

			if (!link) {
				return res.status(500).json({ error: true, message: 'could not generate verification link' });
			}

			callback(null, {
				firstname: result.firstname,
				lastname: result.lastname,
				email,
				verificationLink: link,
			});
		},
		// send the user the verification link
		function (result, callback) {
			let config = {
				name: `${result.firstname} ${result.lastname}`,
				from: 'no-reply@djoyow.com',
				to: result.email,
				template: mailtype,
				content: result.verificationLink,
			};

			mailer.sendTemplate(config, err => {
				if (err) {
					console.trace({ err });
					return res.status(500).json({ error: true, message: 'unable to send mail' });
				}

				callback(null);
			});
		},
		// respond with a success status
		function () {
			res.status(200).json({ message: 'mail sent successfully' });
		},
	]);
}

/**
 *
 * Verify a user's email
 * @todo change the purpose of this function to changing the status of the user's isEmailValid to true
 * @restrictions can only be accessible by a superadmin, or the user.
 * @requires userId if admin request
 */
function saveImage(req, res) {
	const imagefile = req.file;
	const { id } = req.user;

	if (!imagefile) {
		return res.status(400).json({ error: true, message: 'no image provided' });
	}

	async.waterfall(
		[
			// check if the user exists
			function (callback) {
				db.getOne(
					{
						query: { _id: id },
						from: dbNames.USER_MODEL,
					},
					(err, result) => {
						callback(err, result);
					}
				);
			},
			// save the image to disk
			function (user, callback) {
				if (!user) return res.status(404).json({ error: true, message: 'user does not exist' });

				saveImageHelper(imagefile, id, imagefilename => {
					if (!imagefilename) {
						console.log(imagefilename);
						res.status(500).json({ error: true, message: 'unable to save image. please try again' });
					}

					callback(null, imagefilename);
				});
			},
			// save the image path to database
			function (imagefilename, callback) {
				db.update(
					{
						query: { _id: id },
						data: { photo: imagefilename },
						to: dbNames.USER_MODEL,
					},
					(err, result) => {
						if (result.nModified === 0) {
							console.trace({
								warning: 'there was a problem with an update action. no user was updated',
							});
						}

						if (result.nModified > 1) {
							console.trace({
								warning:
									'there was a problem with an update action. multiple users may have been updated',
							});
						}

						callback(err);
					}
				);
			},
		],
		function (err) {
			if (err) {
				console.trace({ err });
				return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			return res.status(200).json({ error: false, message: 'image saved successfully' });
		}
	);
}

/**
 *
 * Verify a user's email
 * @todo change the purpose of this function to changing the status of the user's isEmailValid to true
 * @restrictions can only be accessible by a superadmin, or the user.
 * @requires userId if admin request
 */
function removeImage(req, res) {
	const { userId } = req.decoded;

	async.waterfall([
		// find the users information
		function (callback) {
			db.get(
				{
					query: { _id: userId },
					from: dbNames.USER_MODEL,
				},
				(err, result) => {
					if (err) {
						console.trace({ err });
						return res.status(500).json({ error: 'unable to perform operation' });
					}

					if (!result || (Array.isArray(result) && result.length !== 1))
						return res.status(404).json({ error: 'unable to find user' });

					callback(null, result[0]);
				}
			);
		},
		// remove image from user
		function (result, callback) {
			db.update(
				{
					query: { _id: userId },
					data: { photo: null },
					to: dbNames.USER_MODEL,
				},
				err => {
					if (err) {
						console.log({ err });
						return res.status(500).json({ error: 'unable to remove image ' });
					}

					callback(null, result);
				}
			);
		},
		// delete the image using the image name stored in the db
		function (result) {
			const imagefilename = result.photo;

			removeImageHelper(imagefilename, isSuccess => {
				if (!isSuccess) return res.status(500).json({ error: 'unable to perform delete operation' });

				res.status(200).json({ error: false, message: 'image removed successfully' });
			});
		},
	]);
}

// exports
module.exports = {
	verify: verifyEmail,
	update: updateUser,
	get: getUser,
	delete: deleteUser,
	saveImage: saveImage,
	removeImage: removeImage,
	resetpassword: updatePassword,
	sendmail: sendEmail,
	getProfile,
};
