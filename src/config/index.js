// TODO remove this
// use this for module resolution and
// remove relative paths from the project
require('module-alias/register');

// NOW WE CAN START USING ABSOLUTE PATHS
// FOR THE REST OF MY PROJECT

// configure environment variables
require('./env-config');

// configure database and connect database
require('./db-config').connect();
