const Models = require("../models");

module.exports = (config = null, callback = null) => {
    if (!config)
        throw ("missing config object in db create function. Must provide a config object as first parameter");

    if (!config.data)
        throw ("missing 'data' value in config object.");

    if (!config.to)
        throw ("missing 'to' value in config object, provide a 'to' value.");

    let active_options = config;

    Models[active_options.to].create(active_options.data, (err, docs) => {
        if (err) {
            console.trace({ err })
        }

        if (!callback || typeof callback !== "function")
            throw ("Missing callback function in db create function. callback must be a function");

        callback(err, docs)
    });
}