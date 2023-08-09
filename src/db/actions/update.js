const Models = require('../models');

module.exports = (config = null, callback = null) => {
	if (!config) Throw('missing config object in db update function. Must provide a config object as first parameter');

	if (!config.data) Throw("missing 'data' value in config object.");

	if (!config.query) Throw("missing 'query' value in config object.");

	if (!config.to) Throw("missing 'to' value in config object, provide a 'to' value.");

	let active_options = { ...config };

	Models[active_options.to].updateOne(
		active_options.query,
		active_options.overwriteSet
			? active_options.data
			: {
					$set: active_options.data,
			  },
		{
			omitUndefined: true,
            upsert: active_options.upsert || false,
		},
		(err, docs) => {
			if (err) {
				console.trace({ err });
			}

			if (!callback || typeof callback !== 'function')
				Throw ('Missing callback function in db update function. callback must be a function');

			callback(err, docs);
		}
	);
};
