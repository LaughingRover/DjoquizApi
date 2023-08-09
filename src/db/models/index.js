const { DB_NAMES } = require('../../constants');
const { USER_MODEL, QUIZ_MODEL, QUESTION_MODEL, REFRESH_TOKEN_MODEL, TAG_MODEL, ROUND_MODEL } = DB_NAMES;

module.exports = {
	[USER_MODEL]: require('./user'),
	[TAG_MODEL]: require('./tag'),
	[QUIZ_MODEL]: require('./quiz'),
	[QUESTION_MODEL]: require('./question'),
	[REFRESH_TOKEN_MODEL]: require('./refresh-token'),
	[ROUND_MODEL]: require('./round'),
};
