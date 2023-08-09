// Imports
const jwt = require('jsonwebtoken');

// used to generate/sign a new access token
function generateAccessToken(user) {
	let userId = user.id || user._id;
	let expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 1 day duration duration
	let accessToken = jwt.sign(
		{
			exp: expires,
			data: JSON.stringify({ id: userId }),
		},
		process.env.ACCESS_TOKEN_SECRET
	);

	return { token: accessToken, expires };
}

// for verifying an access token
function verifyAccessToken(token) {
	if (!token) return false;
	try {
		var decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		if (!decodedUser) return false;
		return decodedUser;
	} catch (err) {
		console.trace({ err });
		return false;
	}
}

// for decoing an access token
function decodeAccessToken(token) {
	if (!token) return false;
	try {
		var decodedUser = jwt.decode(token);
		if (!decodedUser) return false;
		return decodedUser;
	} catch (err) {
		console.trace({ err });
		return false;
	}
}

// for decoing an access token
function decodeVerificationToken(token, secret) {
	if (!token || !secret) return false;
	try {
		var decodedUser = jwt.verify(token, secret);
		if (!decodedUser) return false;
		return decodedUser;
	} catch (err) {
		console.trace({ err });
		return false;
	}
}

function generateLink(email, md5, linkprefix = '') {
	let token = null;
	try {
		token = jwt.sign({ email, md5, date: Date.now() }, md5, {
			expiresIn: '15 minutes',
		});
	} catch (error) {
		console.trace({ error });
	}

	return `${linkprefix}?email=${email}&token=${token}`;
}

// Exports
module.exports = {
	generateAccessToken,
	decodeAccessToken,
	verifyAccessToken,
	decodeVerificationToken,
	generateLink,
};
