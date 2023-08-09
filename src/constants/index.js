/**
 * CONSTANTS
 */

// DB Model names
module.exports.DB_NAMES = {
	USER_MODEL: 'User',
	TAG_MODEL: 'Tag',
	QUIZ_MODEL: 'Quiz',
	QUESTION_MODEL: 'Question',
	REFRESH_TOKEN_MODEL: 'RefreshToken',
	ROUND_MODEL: 'Round',
};

// Messages that should be sent as responses
module.exports.MESSAGES = {
	LOGIN_SUCCESS: 'Login Successful',
	LOGIN_FAILED: 'Login Failed',
	INVALID_CREDENTIALS: 'Incorrect username or password',
	NO_ACCESS: 'Not authorized to perform this operation, please Login to authenticated',
	AUTHENTICATED: 'Already authenticated',
	SERVER_ERROR: "There's been a problem processing your request. Please try again or contact support",
};

// Required matches or regular expressions
module.exports.REGEX = {
	EMAIL_REGEX:
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	PASSWORD_REGEX: /^(?=.*\d).{4,}$/,
};

// User roles
// TODO: remove user roles implementation from project
/**@deprecated these roles might no longer be implemented in this project*/
module.exports.ROLES = {
	USER_ROLE: 'user',
	ADMIN_ROLE: 'admin',
	NON_USER_ROLE: 'visitor',
	SUPERADMIN_ROLE: 'superadmin',
};
