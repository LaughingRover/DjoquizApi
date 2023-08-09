/**=======================================================================
                                Questions Controller
 ========================================================================*/

// Imports
const asyncLib = require('async');
const db = require('../db');
const { DB_NAMES, MESSAGES } = require('../constants');
const {
	createQuestionValidator,
	updateQuestionValidator,
	getQuestionValidator,
	deleteQuestionValidator,
	getCorrectQuestionValidator,
} = require('../utils/validators');

/*
 * CREATE QUESTIONS
 */
function create(req, res) {
	const isValid = createQuestionValidator(req.body);
	const errors = createQuestionValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'invalid or missing required fields', errors: errors });

	const { quizId, id, ...questionData } = req.body;

	asyncLib.waterfall(
		[
			// check if the quiz already exist
			function (callback) {
				db.getOne({ query: { _id: quizId }, from: DB_NAMES.QUIZ_MODEL }, (err, res) =>
					callback(err, JSON.parse(JSON.stringify(res)))
				);
			},
			// check if the current user is the owner of the quiz
			function (quiz, callback) {
                if(!quiz) return res.status(400).json({ error: true, message: 'quiz not found'});
				if (req.user.id !== quiz.ownerId) res.status(403).json({ error: true, message: 'Unauthorized' });

				callback(null);
			},
            // check if the id for the question has already been used
            function (callback) {
                db.getOne({
                    query: { _id: id },
                    from: DB_NAMES.QUESTION_MODEL
                }, callback)
            },
			// create the question
			function (question, callback) {
                if(question) return res.status(400).json({ error: true, message: 'question id already in use' });
                console.log({id})
				db.create(
					{
						data: { quizId, _id: id, ...questionData },
						to: DB_NAMES.QUESTION_MODEL,
					},
					callback
				);
			},
		],
		function (error, newQuestion) {
			if (error) {
				console.trace(error);
				return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			res.status(200).json({ error: false, message: 'question added successfully', data: newQuestion });
		}
	);
}

/*
 *  UPDATE QUESTION
 */
function update(req, res) {
	const isValid = updateQuestionValidator(req.body);
	const errors = updateQuestionValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'invalid or missing required fields', errors: errors });

	const { id, ...updateData } = req.body;

	asyncLib.waterfall(
		[
			// check if the question already exist
			function (callback) {
				db.getOne({ query: { _id: id }, from: DB_NAMES.QUESTION_MODEL }, callback);
			},
			// update the question
			function (question, callback) {
                if(!question) {
                    updateData._id = id
                }
				db.update(
					{
						to: DB_NAMES.QUESTION_MODEL,
						query: { _id: id },
						data: updateData,
                        // create a new question if one doesn't already exist
                        upsert: true,
					},
					callback
				);
			},
		],
		function (error, updatedQuestion) {
			if (error) {
				console.trace(error);
				return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			if (updatedQuestion.nModified === 0) {
				console.trace({
					warning: 'there was a problem with an update action. no question was updated',
				});
			}

			if (updatedQuestion.nModified > 1) {
				console.trace({
					warning: 'there was a problem with an update action. multiple questions may have been updated',
				});
			}

			res.status(200).json({ error: false, message: 'question updated successfully' });
		}
	);
}

/*
 *  GET QUESTION
 */
function get(req, res) {
	const query = req.query;

	let isValid = getQuestionValidator(query);
	let errors = getQuestionValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'missing or invalid request data', errors: errors });

	const db_config = {
		query: {},
		from: DB_NAMES.QUESTION_MODEL,
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

		// we need to remove the correct answers from the questions
		// to avoid users from seeing the correct answer
		const quizzes = JSON.parse(JSON.stringify(result));
		// const quizWithoutCorrectAnswers = quizzes.map(quiz => {
		// 	// delete quiz.correctAnswer;
		// 	// delete quiz.comment;
		// 	return quiz;
		// });

		if (query.type === 'id') return res.status(200).json({ error: false, data: quizzes[0] });

        res.status(200).json({ error: false, data: quizzes });
	});
}

/*
 *  GET CORRRECT ANSWER FOR QUESTION
 */
function getCorrect(req, res) {
	const query = req.query;

	let isValid = getCorrectQuestionValidator(query);
	let errors = getCorrectQuestionValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'missing or invalid request data', errors: errors });

	const db_config = {
		query: { _id: query.id },
		from: DB_NAMES.QUESTION_MODEL,
	};

	db.getOne(db_config, (err, result) => {
		if (err) {
			console.trace({ err });
			return res.status(500).json({
				error: true,
				message: MESSAGES.SERVER_ERROR,
			});
		}

		res.status(200).json({ error: false, data: { correctAnswer: result.correctAnswer, comment: result.comment } });
	});
}

/*
 *  DELETE QUIZ
 */
function deleteQuestion(req, res) {
	const isValid = deleteQuestionValidator(req.query);
	const errors = deleteQuestionValidator.errors;

	if (!isValid)
		return res.status(400).json({ error: true, message: 'missing or invalid required fields', errors: errors });
    // TODO check if the user has the right to delete this quiz
	const { id, quizId } = req.query;
    console.log(req.body);

	asyncLib.waterfall(
		[
			// check if the quiz exist
			function (callback) {
				db.getOne({ from: DB_NAMES.QUESTION_MODEL, query: { _id: id } }, callback);
			},
			// delete the quiz
			function (question, callback) {
				if (!question) res.statu(404).json({ error: true, message: 'question not found' });

				db.delete({ from: DB_NAMES.QUESTION_MODEL, query: { _id: id } }, callback);
			},
		],
		function (err, result) {
			if (err) {
				console.trace(err);
				res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			res.status(200).json({ error: true, message: 'question deleted successfully', data: result });
		}
	);
}

// Exports modules
module.exports.create = create;
module.exports.get = get;
module.exports.getCorrect = getCorrect;
module.exports.delete = deleteQuestion;
module.exports.update = update;
