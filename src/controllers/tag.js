/**=======================================================================
                                Questions Controller
 ========================================================================*/

// Imports
const asyncLib = require('async');
const db = require('../db');
const { DB_NAMES, MESSAGES } = require('../constants');
const { createTagValidator, updateTagValidator } = require('../utils/validators');

/*
 * Creates a new tag
 */
function create(req, res) {
	const isValid = createTagValidator(req.body);
	const errors = createTagValidator.errors;

	if (!isValid) return res.status(400).json({ error: false, message: 'missing or invalid required fields', errors });

	const { name, description, type } = req.body;
	asyncLib.waterfall(
		[
			// CHECK IF THE TAG ALREADY EXISTS
			function (callback) {
				db.getOne(
					{
						query: { name },
						from: DB_NAMES.TAG_MODEL,
					},
					(err, result) => {
						if (result) {
							return res.status(500).json({ error: true, message: `tag name already exists` });
						}
						callback(err);
					}
				);
			},
			// CREATE THE TAG
			function (callback) {
				db.create(
					{
						data: { name, description, type },
						to: DB_NAMES.TAG_MODEL,
					},
					callback
				);
			},
			function (createdTag) {
				res.status(201).json({ error: false, message: 'Tag created successfully', data: createdTag });
			},
		],
		function (error) {
			if (error) {
				console.trace({ error });
				res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}
		}
	);
}

/*
 * Updates a tag
 */
function update(req, res) {
	const isValid = updateTagValidator(req.body);
	const errors = updateTagValidator.errors;

	if (!isValid) return res.status(400).json({ error: false, message: 'missing or invalid required fields', errors });
	const { id, name, description, type } = req.body;

	asyncLib.waterfall(
		[
			// CHECK IF THE TAG ALREADY EXISTS
			function (callback) {
				db.getOne(
					{
						query: { name },
						from: DB_NAMES.TAG_MODEL,
					},
					(err, result) => {
						if (result) {
							return res.status(500).json({ error: true, message: `tag name already exists` });
						}
						callback(err);
					}
				);
			},
			// CREATE THE TAG
			function (callback) {
				db.create(
					{
						data: { name, description, type },
						to: DB_NAMES.TAG_MODEL,
					},
					callback
				);
			},
			function (createdTag) {
				res.status(201).json({ error: false, message: 'Tag created successfully', data: createdTag });
			},
		],
		function (error) {
			if (error) {
				console.trace({ error });
				res.status(500).json({ error: true, message: MESSAGES.SERVER_ERROR });
			}
		}
	);
}

/*
 *  getAll Method *************edited
 *
 *  Role   : get all questions
 *  Enter  : req, res
 *  Return : questions
 */

function get(req, res) {
	const query = req.query;

	if (!query.type) {
		return res.status(400).json({ error: true, message: 'missing type in query string' });
	}

	if (!(query.type === 'all' || query.type === 'id')) {
		return res.status(400).json({ error: true, message: "type must be either 'id' or 'all'" });
	}

	if (query.type === 'id' && !query.id) {
		return res.status(400).json({ error: true, message: "missing 'id' parameter in query string" });
	}

	let db_config = {
		query: query.type === 'id' ? { _id: query.id } : {},
		from: DB_NAMES.TAG_MODEL,
	};

	db.get(db_config, (err, result) => {
		if (err) {
			console.trace({ err });
			return res.status(500).json({
				error: true,
				message: MESSAGES.SERVER_ERROR,
			});
		}

		if (query.type === 'id' && result.length === 0)
			return res.status(404).json({ error: true, message: `tag not found` });

		if (query.type === 'id') return res.status(200).json({ error: false, data: result[0] });

		res.status(200).json({ error: false, data: result });
	});
}

/*
 *  deleteById question Method
 *
 *  Role   : Delete question and update number of question in questionnaire
 **/

function deleteTag(req, res) {
	const id = req.query.id;
	const userId = req.body.userData.userId;
	let questionnaireId = null;

	if (id == null) {
		return res.status(400).json({ error: 'missing parameters' });
	}

	res.status(200).json({ error: true, message: 'route not working yet' });
}

// Exports modules
module.exports.create = create;
module.exports.update = update;
module.exports.get = get;
module.exports.delete = deleteTag;
