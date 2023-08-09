const { MESSAGES } = require('../../constants');
const {
	DB_NAMES: { USER_MODEL, REFRESH_TOKEN_MODEL },
} = require('../../constants');
const db = require('../../db');
const { decodeAccessToken, verifyAccessToken, generateAccessToken } = require('../../utils/auth-utils');

module.exports.authenticateAndDeserializeUser = (req, res, next) => {
	const cookies = req.cookies;
	if (!cookies) {
		return res.status(401).json({ error: true, message: 'Unauthenticated' });
	}

	const { authToken: accessToken, refreshToken } = cookies;
	let verifiedAccessToken = verifyAccessToken(accessToken);
	// use this to check if the user in authToken is the
	// same stored with the refreshToken
	let decoded = decodeAccessToken(accessToken);
	if (!refreshToken && !decoded) return res.status(401).json({ error: true, message: 'Unauthenticated' });

	// automatically refresh the token if a refreshToken is
	// present but the authToken has expired
	if (!verifiedAccessToken && refreshToken) {
		const db_options = { query: { value: refreshToken }, from: REFRESH_TOKEN_MODEL };
		db.getOne(db_options, (err, token) => {
			if (err) return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });

			if (!token) return res.status(401).json({ error: true, message: 'Unauthenticated' });

			if (token.revoked) return res.status(401).json({ error: true, message: 'Unauthenticated' });

			db.getOne({ query: { _id: token.userId }, from: USER_MODEL }, (err, user) => {
				if (err) return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
				if (!user) return res.status(401).json({ error: true, message: 'Unauthenticated' });

				let { token: newAccessToken } = generateAccessToken(user);
				res.cookie('authToken', newAccessToken, { httpOnly: true, maxAge: 432000000 /* 5 days */, path: '/' });
				res.cookie('refreshToken', refreshToken, {
					httpOnly: false,
					maxAge: 31536000000 /* 365 days */,
					path: '/',
				});
				req.user = JSON.parse(JSON.stringify(user));
				req.token = newAccessToken;
				next();
			});
		});
	} else {
		let user = JSON.parse(verifiedAccessToken.data);
		if (!user.id) return res.status(401).json({ error: true, message: 'Unauthenticated' });

		db.getOne(
			{
				from: USER_MODEL,
				query: { _id: user.id },
			},
			(err, userInfo) => {
				if (err) return res.status(500).json({ error: true, message: 'server error' });
				if (!userInfo) return res.status(401).json({ error: true, message: 'Unauthenticated' });
				req.user = JSON.parse(JSON.stringify(userInfo));
				req.token = accessToken;
				next();
			}
		);
	}
};
