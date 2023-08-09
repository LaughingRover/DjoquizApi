const Models = require("../models");

module.exports = (config = null, callback = null) => {
  if (!config)
    throw new Error("missing config object in db get function. Must provide a config object as first parameter");

  if (!config.query)
    throw new Error("missing 'query' value in config object.");

  if (!config.from)
    throw new Error("missing 'from' value in config object, provide a 'from' value.");

  let active_options = { ...config };
  if (active_options.query.id) {
    active_options.query._id = active_options.query.id;
    delete active_options.query.id;
  }

  Models[active_options.from].find(active_options.query, (err, docs) => {
    if (err) {
      console.trace({ err })
    }

    if (!callback || (typeof callback !== "function"))
      throw new Error("Missing callback function in db get function. callback must be a function")

    callback(err, docs)
  });
}