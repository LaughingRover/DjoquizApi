require('./config');

const http = require('http');
const express = require('express');
const morgan = require('morgan');
const apiV1Router = require('./routes');

const app = express();
const port = process.env.PORT;
const server = http.Server(app); // for use with socket.io in future

// console logger
app.use(morgan('dev', {})); // TODO: move morgan to config and add more configurations

// route handlers
app.use(
	'/api/v1',
	(_req, res, next) => {
		res.setHeader('X-Powered-By', 'Djoyow');
		next();
	},
	apiV1Router
);

// app.use(express.static('public'));


// server start
server.listen(port, () => {
	console.log('Server started. Listening on port ' + port);
});
