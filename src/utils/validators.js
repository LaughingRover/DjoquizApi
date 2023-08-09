const mongoose = require('mongoose');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajv = new Ajv.default();
addFormats(ajv);
ajv.addKeyword({
	keyword: '_djoyow-id-checker',
	error: { message: 'id should be a valid objectId' },
	validate: function (_, value) {
		return mongoose.isValidObjectId(value);
	},
});

// REGISTRATION VALIDATOR
module.exports.registerValidator = ajv.compile({
	type: 'object',
	properties: {
		email: {
			type: 'string',
			format: 'email',
		},
		password: { type: 'string' },
		username: { type: 'string' },
	},
	required: ['email', 'password'],
	additionalProperties: false,
});

// LOGIN VALIDATOR
module.exports.loginValidator = ajv.compile({
	type: 'object',
	properties: {
		email: {
			type: 'string',
			format: 'email',
		},
		username: { type: 'string' },
		password: { type: 'string' },
	},
	anyOf: [
		{
			required: ['email', 'password'],
		},
		{
			required: ['username', 'password'],
		},
	],
	additionalProperties: false,
});

// UPDATE USER VALIDATOR
module.exports.updateUserValidator = ajv.compile({
	type: 'object',
	properties: {
		username: { type: 'string' },
		firstname: { type: 'string' },
		middlename: { type: 'string' },
		lastname: { type: 'string' },
		email: { type: 'string', format: 'email' },
		dob: { type: 'string', format: 'date-time' },
		nationality: { type: 'string' },
		occupation: { type: 'string' },
		language: { type: 'string' },
		gender: { enum: ['male', 'female'] },
	},
	anyOf: [
		{ required: ['username'] },
		{ required: ['firstname'] },
		{ required: ['middlename'] },
		{ required: ['lastname'] },
		{ required: ['email'] },
		{ required: ['dob'] },
		{ required: ['nationality'] },
		{ required: ['occupation'] },
		{ required: ['language'] },
		{ required: ['gender'] },
	],
	additionalProperties: false,
});

// GET USER VALIDATOR
module.exports.getUserValidator = ajv.compile({
	type: 'object',
	properties: {
		id: { type: 'string', '_djoyow-id-checker': true },
		type: { type: 'string', enum: ['all', 'id'] },
	},
	additionalProperties: false,
});

// VERIFY EMAIL VALIDATOR
module.exports.verifyEmailValidator = ajv.compile({
	type: 'object',
	properties: {
		email: { type: 'string', format: 'email' },
		token: { type: 'string' },
	},
	required: ['email', 'token'],
	additionalProperties: false,
});

// UPDATE PASSWORD VALIDATOR
module.exports.updatePasswordValidator = ajv.compile({
	type: 'object',
	properties: {
		email: { type: 'string', format: 'email' },
		token: { type: 'string' },
		password: { type: 'string' },
	},
	required: ['email', 'token', 'password'],
	additionalProperties: false,
});

// CREATE QUIZ VALIDATOR
module.exports.createQuizValidator = ajv.compile({
	type: 'object',
	properties: {
		title: {
			type: 'string',
			default: 'Untitled',
		},
		status: {
			type: 'string',
			enum: ['draft', 'published'],
			default: 'draft',
		},
		references: {
			type: 'array',
		},
		image: {
			type: 'string',
		},
		tagsId: {
			type: 'array',
			items: { type: 'string', '_djoyow-id-checker': true },
		},
	},
	additionalProperties: false,
});

// UPDATE QUIZ VALIDATOR
module.exports.updateQuizValidator = ajv.compile({
	type: 'object',
	properties: {
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		title: {
			type: 'string',
		},
		status: {
			type: 'string',
		},
		references: {
			type: 'array',
		},
		image: {
			type: 'string',
		},
		tagsId: {
			type: 'array',
			items: {
				type: 'string',
				'_djoyow-id-checker': true,
			},
		},
	},
	required: ['id'],
	anyOf: [
		{ required: ['title'] },
		{ required: ['ownerId'] },
		{ required: ['image'] },
		{ required: ['status'] },
		{ required: ['tags'] },
	],
	additionalProperties: false,
});

// PUBLISH QUIZ VALIDATOR
module.exports.publishQuizValidator = ajv.compile({
	type: 'object',
	properties: {
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
	},
	required: ['id'],
	additionalProperties: false,
});

// GET QUIZ VALIDATOR
module.exports.getQuizValidator = ajv.compile({
	type: 'object',
	properties: {
		type: {
			type: 'string',
			enum: ['all', 'id', 'title', 'ownerId', 'tags'],
		},
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		title: {
			type: 'string',
		},
		ownerId: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		tags: {
			type: 'string',
		},
	},
	required: ['type'],
	if: {
		properties: {
			type: { const: 'all' },
		},
	},
	else: {
		oneOf: [{ required: ['id'] }, { required: ['title'] }, { required: ['ownerId'] }, { required: ['tags'] }],
	},
	additionalProperties: false,
});

// GET QUIZ QUESTIONS COUNT VALIDATOR
module.exports.getQuizQuestionsCountValidator = ajv.compile({
	type: 'object',
	properties: {
		quizId: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
	},
	required: ['quizId'],
	additionalProperties: false,
});

// DELETE QUIZ VALIDATOR
module.exports.deleteQuizValidator = ajv.compile({
	type: 'object',
	properties: {
		type: {
			type: 'string',
			enum: ['id'],
		},
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
	},
	required: ['type', 'id'],
	additionalProperties: false,
});

// GET QUESTION VALIDATOR
module.exports.getQuestionValidator = ajv.compile({
	type: 'object',
	properties: {
		type: {
			type: 'string',
			enum: ['all', 'id', 'quizId'],
		},
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		quizId: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
	},
	required: ['type'],
	if: {
		properties: { type: { const: 'all' } },
	},
	else: {
		oneOf: [{ required: ['quizId'] }, { required: ['id'] }],
	},
	additionalProperties: false,
});

// GET CORRECT ANSWER FOR QUESTION VALIDATOR
module.exports.getCorrectQuestionValidator = ajv.compile({
	type: 'object',
	properties: {
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
	},
	required: ['id'],
	additionalProperties: false,
});

// CREATE QUESTION VALIDATOR
module.exports.createQuestionValidator = ajv.compile({
	type: 'object',
	properties: {
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		quizId: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		question: {
			type: 'string',
		},
		answers: {
			type: 'array',
			items: { type: 'string' },
			uniqueItems: true,
			minItems: 2,
			maxItems: 4,
		},
		correctAnswers: {
			type: 'array',
			items: { type: 'string' },
			uniqueItems: true,
			minItems: 1,
			maxItems: 4,
		},
		comment: {
			type: 'string',
		},
		sortOrder: {
			type: 'number',
		},
	},
	required: ['id', 'quizId', 'question', 'answers', 'correctAnswer'],
	additionalProperties: false,
});

// UPDATE QUESTION VALIDATOR
module.exports.updateQuestionValidator = ajv.compile({
	type: 'object',
	properties: {
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		quizId: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		question: {
			type: 'string',
		},
		answers: {
			type: 'array',
			items: { type: 'string' },
			uniqueItems: true,
			minItems: 2,
			maxItems: 4,
		},
		correctAnswers: {
			type: 'array',
			items: { type: 'string' },
			uniqueItems: true,
			minItems: 1,
			maxItems: 4,
		},
		comment: {
			type: 'string',
		},
		sortOrder: {
			type: 'number',
		},
	},
	required: ['id'],
	anyOf: [
		{ required: ['question'] },
		{ required: ['answers'] },
		{ required: ['correctAnswer'] },
		{ required: ['comment'] },
		{ required: ['sortOrder'] },
	],
	additionalProperties: false,
});

// DELETE QUIZ VALIDATOR
module.exports.deleteQuestionValidator = ajv.compile({
	type: 'object',
	properties: {
		type: {
			type: 'string',
			enum: ['id'],
		},
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
	},
	required: ['type', 'id'],
	additionalProperties: false,
});

// CREATE ROUND VALIDATOR
module.exports.createRoundValidator = ajv.compile({
	type: 'object',
	properties: {
		quizId: { type: 'string', '_djoyow-id-checker': true },
	},
	required: ['quizId'],
	additionalProperties: false,
});

// UPDATE ROUND VALIDATOR
module.exports.updateRoundValidator = ajv.compile({
	type: 'object',
	properties: {
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		questionId: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		response: { type: 'array', items: { type: 'string' }, maxItems: 4, minItems: 1 },
		timeSpent: { type: 'number', minimum: 0, maximum: 59 },
		hasEnded: { type: 'boolean', default: false },
	},
	required: ['id', 'questionId', 'response', 'timeSpent', 'hasEnded'],
	additionalProperties: false,
});

// UPDATE ROUND VALIDATOR
module.exports.getRoundValidator = ajv.compile({
	type: 'object',
	properties: {
		type: { type: 'string', enum: ['id'] },
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
	},
	required: ['id', 'type'],
	additionalProperties: false,
});

// CREATE A TAG
module.exports.createTagValidator = ajv.compile({
	type: 'object',
	properties: {
		type: {
			type: 'string',
			enum: ['country', 'general'],
		},
		name: {
			type: 'string',
		},
	},
	required: ['name'],
});

// UPDATE A TAG
module.exports.updateTagValidator = ajv.compile({
	type: 'object',
	properties: {
		id: {
			type: 'string',
			'_djoyow-id-checker': true,
		},
		type: {
			type: 'string',
			enum: ['country', 'general'],
		},
		name: {
			type: 'string',
		},
	},
	required: ['id'],
	anyOf: [{ required: ['type'] }, { required: ['name'] }],
});
