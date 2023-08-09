/**=======================================================================
                                User Controller
 ========================================================================*/

// Imports
const asyncLib = require('async');
const saveImageHelper = require('../utils/saveImage');
const db = require('../db');
const { DB_NAMES, MESSAGES } = require('../constants');
const {
	getQuizValidator,
	getQuizQuestionsCountValidator,
	createQuizValidator,
	updateQuizValidator,
	deleteQuizValidator,
} = require('../utils/validators');

/*
 * CREATE QUIZ
 */
function create(req, res) {
	const isValidRequestData = createQuizValidator(req.body);
	const validationErrors = createQuizValidator.errors;
	if (!isValidRequestData)
		return res
			.status(400)
			.json({ error: true, message: 'missing or invalid required fields', errors: validationErrors });

	asyncLib.waterfall(
		[
			function (callback) {
				db.create(
					{
						data: { ...req.body, ownerId: req.user.id, status: 'draft', createdAt: Date.now() },
						to: DB_NAMES.QUIZ_MODEL,
					},
					callback
				);
			},
		],
		function (err, result) {
			if (err) {
				console.trace({ err });
				return res.status(500).json({ error: true, message: 'unable to create quiz' });
			}

			return res.status(201).json({ error: false, message: 'quiz created successfully', data: result });
		}
	);
}

/*
 *  GET QUIZ
 *  Find questionnaire by id, title, tags, or user
 *  expects search query to have type.
 */
function get(req, res) {
	const query = req.query;

	let isValid = getQuizValidator(query);
	let errors = getQuizValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'missing or invalid request data', errors: errors });

	const db_config = {
		query: {},
		from: DB_NAMES.QUIZ_MODEL,
	};

	if (query.type !== 'all') {
		db_config.query = { [query.type === 'id' ? '_id' : query.type]: query[query.type] };
	}

	db.get(db_config, (err, result) => {
		if (err) {
			console.trace({ err });
			return res.status(500).json({
				error: true,
				message: MESSAGES.SERVER_ERROR,
			});
		}

		if (query.type === 'id' && result.length === 0)
			return res.status(500).json({
				error: true,
				message: MESSAGES.SERVER_ERROR,
			});

		if (query.type === 'id') return res.status(200).json({ error: false, data: result[0] });

		res.status(200).json({ error: false, data: result });
	});
}

/*
 *  GET QUIZ QUESTIONS COUNT
 */
function getQuizQuestionCount(req, res) {
	const query = req.query;

	let isValid = getQuizQuestionsCountValidator(query);
	let errors = getQuizQuestionsCountValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'missing or invalid request data', errors: errors });

	const db_config = {
		query: { quizId: query.quizId },
		from: DB_NAMES.QUESTION_MODEL,
	};

	db.get(db_config, (err, result) => {
		if (err) {
			console.trace({ err });
			return res.status(500).json({
				error: true,
				message: MESSAGES.SERVER_ERROR,
			});
		}

		res.status(200).json({ error: false, data: { quizId: query.quizId, questionCount: result.length } });
	});
}

/*
 *  GET QUIZ PLAYS COUNT
 */
function getQuizPlays(req, res) {
	const query = req.query;

	let isValid = getQuizQuestionsCountValidator(query);
	let errors = getQuizQuestionsCountValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'missing or invalid request data', errors: errors });

	const db_config = {
		query: { quizId: query.quizId },
		from: DB_NAMES.ROUND_MODEL,
	};

	db.get(db_config, (err, result) => {
		if (err) {
			console.trace({ err });
			return res.status(500).json({
				error: true,
				message: MESSAGES.SERVER_ERROR,
			});
		}

		res.status(200).json({ error: false, data: { quizId: query.quizId, playCount: result.length } });
	});
}

/*
 *  Update Quiz
 */
function update(req, res) {
	// Params
	const isValid = updateQuizValidator(req.body);
	const errors = updateQuizValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'missing or invalid required fields', errors: errors });

	const { id, ...updateData } = req.body;

	asyncLib.waterfall(
		[
			// check if quiz id already exists
			function (callback) {
				db.getOne(
					{
						query: { _id: req.body.id },
						from: DB_NAMES.QUIZ_MODEL,
					},
					(err, result) => callback(err, JSON.parse(JSON.stringify(result)))
				);
			},
			// check if the logged in user owns the quiz
			function (quiz, callback) {
				if (!quiz) return res.status(404).json({ error: true, message: 'quiz not found.' });

				if (req.user.id !== quiz.ownerId) return res.status(403).json({ error: true, message: 'Unauthorized' });

				callback(null);
			},
			// update the quiz
			function (callback) {
				console.log(updateData);
				db.update(
					{
						data: updateData,
						to: DB_NAMES.QUIZ_MODEL,
						query: { _id: id },
					},
					callback
				);
			},
			function (result, callback) {
				if (result.nModified === 0) {
					console.trace({
						warning: 'there was a problem with an update action. no quiz was updated',
					});
				}

				if (result.nModified > 1) {
					console.trace({
						warning: 'there was a problem with an update action. multiple quizzes may have been updated',
					});
				}
				callback(null);
			},
		],
		function (error) {
			if (error) {
				return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			return res.status(200).json({ error: false, message: 'quiz updated successfully' });
		}
	);
}

/*
 *  DELETE QUIZ
 */

function deleteQuiz(req, res) {
	const isValid = deleteQuizValidator(req.query);
	const errors = deleteQuizValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'missing or invalid required fields', errors: errors });

	const { id } = req.query;

	asyncLib.waterfall(
		[
			// check if the quiz exist
			function (callback) {
				db.getOne({ from: DB_NAMES.QUIZ_MODEL, query: { _id: id } }, callback);
			},
			// delete the quiz
			function (quiz, callback) {
				if (!quiz) res.statu(404).json({ error: true, message: 'quiz not found' });

				db.delete({ from: DB_NAMES.QUIZ_MODEL, query: { _id: id } }, callback);
			},
		],
		function (err, result) {
			if (err) {
				console.trace(err);
				res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			res.status(200).json({ error: true, message: 'quiz deleted successfully', data: result });
		}
	);
}

/**
 *  Verify a user's email
 */
function saveImage(req, res) {
	const { id } = req.body;
	const imagefile = req.file;
    console.log(imagefile)

	if (!imagefile) {
		return res.status(400).json({ error: true, message: 'no image provided' });
	}

	asyncLib.waterfall(
		[
			// check if the quiz exists
			function (callback) {
				db.getOne(
					{
						query: { _id: id },
						from: DB_NAMES.QUIZ_MODEL,
					},
					callback
				);
			},
			// save the image to disk
			function (quiz, callback) {
				if (!quiz) return res.status(404).json({ error: true, message: 'quiz not found' });

				// prepend quiz to the id and send to the function
				// aim is to make sure the files that are produced
				// don't ever have a conflicting name
				const newName = 'quiz-' + id;
				saveImageHelper(imagefile, newName, imagefilename => {
					if (!imagefilename) {
						console.log({ imagefilename });
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
						data: { image: imagefilename },
						to: DB_NAMES.QUIZ_MODEL,
					},
					(err, result) => {
						if (result.nModified === 0) {
							console.trace({
								warning: 'there was a problem with an update action. no quiz was updated',
							});
						}

						if (result.nModified > 1) {
							console.trace({
								warning:
									'there was a problem with an update action. multiple quizzes may have been updated',
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

// Exports modules
module.exports.create = create;
module.exports.get = get;
module.exports.getQuizQuestionCount = getQuizQuestionCount;
module.exports.getQuizPlays = getQuizPlays;
module.exports.update = update;
module.exports.delete = deleteQuiz;
module.exports.saveImage = saveImage;
