const asyncLib = require('async');
const db = require('../db');
const { MESSAGES, DB_NAMES } = require('../constants');
const { createRoundValidator, updateRoundValidator, getRoundValidator } = require('../utils/validators');
const _ = require('lodash');

/**
 * GET A SINGLE GAME PLAY ROUND
 */
function getRound(req, res) {
	const isValid = getRoundValidator(req.query);
	const errors = getRoundValidator.errors;

	if (!isValid) return res.status(400).json({ error: true, message: 'missing or invalid required fields', errors });

	const { id } = req.query;

	db.getOne(
		{
			query: { _id: id },
			from: DB_NAMES.ROUND_MODEL,
		},
		(err, result) => {
			if (err) {
				return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			res.status(200).json({ error: false, data: result });
		}
	);
}

/**
 * CREATE A NEW SINGLE GAME PLAY ROUND
 */
// TODO check return an existing round if it already exists
function startRound(req, res) {
	const isValid = createRoundValidator(req.body);
	const errors = createRoundValidator.errors;

	if (!isValid) return res.status(400).json({ error: true, message: 'missing or invalid required fields', errors });

	const { quizId } = req.body;
	let playerId = req.user ? req.user.id : null;

	asyncLib.waterfall(
		[
			// check if the quiz exists
			function (cb) {
				db.getOne(
					{
						from: DB_NAMES.QUIZ_MODEL,
						query: { _id: quizId },
					},
					cb
				);
			},
			// find the quiz questions
			function (quiz, cb) {
				if (!quiz) return res.status(404).json({ erro: true, message: 'quiz not found' });

				db.get(
					{
						from: DB_NAMES.QUESTION_MODEL,
						query: { quizId: quizId },
					},
					cb
				);
			},
			// create the round
			function (questions, cb) {
				let questionsId = questions.map(q => q._id);
				db.create(
					{
						data: { playerId, quizId, score: 0, questions: questionsId, createdAt: new Date() },
						to: DB_NAMES.ROUND_MODEL,
					},
					(err, result) =>
						cb(err, {
							...JSON.parse(JSON.stringify(result)),
							questions: JSON.parse(JSON.stringify(questions)),
						})
				);
			},
		],
		function (err, round) {
			if (err) {
				console.trace(err);
				return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			// delete the correct answers before sending a response
			for (index in round.questions) {
				delete round.questions[index].comment;
				delete round.questions[index].correctAnswers;
			}

			// respond with the round details
			res.status(201).json({ error: false, message: 'round started', data: round });
		}
	);
}

/**
 * UPDATE AN EXISTING SINGLE GAME PLAY ROUND
 */
function updateRound(req, res) {
	const isValid = updateRoundValidator(req.body);
	const errors = updateRoundValidator.errors;

	if (!isValid) return res.status(400).json({ error: true, message: 'missing or invalid required fields', errors });

	const { id, questionId, response, timeSpent, hasEnded } = req.body;
	let playerId = req.user ? req.user.id : null;
	let roundData = null;

	asyncLib.waterfall(
		[
			// check if the round already exists before updating
			function (cb) {
				db.getOne({ query: { _id: id }, from: DB_NAMES.ROUND_MODEL }, cb);
			},
			// check if the round has ended
			function (round, cb) {
				if (!round) return res.status(404).json({ error: false, message: 'unable to find round' });
				if (round.hasEnded)
					return res
						.status(400)
						.json({ error: true, message: 'cannont update a round that has alreay ended' });
				roundData = round;
				cb(null);
			},
			// // refuse an update if question has already been answered
			function (cb) {
				let hasAlreadyBeenAnswered = roundData.answered.includes(questionId);
				if (hasAlreadyBeenAnswered)
					return res.status(400).json({ error: true, message: 'this question has already been answered' });
				cb(null);
			},
			// fetch the question from db
			function (cb) {
				db.getOne({ query: { _id: questionId }, from: DB_NAMES.QUESTION_MODEL }, cb);
			},
			// calculate the user score on this question
			function (question, cb) {
				if (!question) return res.status(404).json({ error: true, message: 'could not find question' });

				// check if the user choice is same as the correct answers
				let scoreForCorrectness = _.isEqual(question.correctAnswers.sort(), response.sort()) ? 1000 : 0;
				// ((maxTime - timeSpent) / maxTime) * scoreForCorrectness
				let score = Math.ceil(((60 - timeSpent) / 60) * scoreForCorrectness);
				cb(null, { question, score });
			},
			// update the round
			function (data, cb) {
				db.update(
					{
						query: { _id: id },
						to: DB_NAMES.ROUND_MODEL,
						data: {
							$inc: { score: data.score, totalTime: timeSpent },
							$set: { hasEnded },
							$push: { answered: questionId },
						},
						overwriteSet: true,
					},
					(err, roundUpdateResult) => cb(err, { roundUpdateResult, ...data })
				);
			},
			// update the user if the round has ended
			function (data, cb) {
				if (hasEnded) {
					db.update(
						{
							query: { _id: playerId },
							to: DB_NAMES.USER_MODEL,
							data: { score: data.score + roundData.score },
						},
						(err, userUpdateResult) => cb(err, { userUpdateResult, ...data })
					);
				} else cb(null, data);
			},
		],
		function (err, data) {
			if (err) {
				console.trace({ err });
				return res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}

			if (data.roundUpdateResult.nModified === 0) {
				console.trace({ warning: 'there was a problem with an update action. no round was updated' });
			}
			if (data.roundUpdateResult.nModified > 1) {
				console.trace({
					warning: 'there was a problem with an update action. multiple rounds have been updated',
				});
			}

			if (data.userUpdateResult && data.userUpdateResult.nModified === 0) {
				console.trace({ warning: 'there was a problem with an update action. no user was updated' });
			}
			if (data.userUpdateResult && data.userUpdateResult.nModified > 1) {
				console.trace({
					warning: 'there was a problem with an update action. multiple users have been updated',
				});
			}

			res.status(200).json({
				error: false,
				message: 'progress updated',
				data: {
					isCorrect: data.question.correctAnswers.includes(response),
					correctAnswers: data.question.correctAnswers,
					comment: data.question.comment,
					score: data.score,
					totalScore: hasEnded ? data.score + roundData.score : undefined,
					totalTime: hasEnded ? timeSpent + roundData.totalTime : undefined,
				},
			});
		}
	);
}

// module.exports.get = getRound;
module.exports.get = getRound;
module.exports.start = startRound;
module.exports.update = updateRound;
