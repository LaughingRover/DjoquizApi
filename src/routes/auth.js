const router = require('express').Router();
const controller = require('../controllers/auth');
const { authenticateAndDeserializeUser } = require('./middlewares/auth');

// refresh access token
router.post('/refreshtoken', controller.refreshAccessToken);

// local login route
router.post('/login', controller.loginLocal);

// a silent login route
router.get('/silent', authenticateAndDeserializeUser, controller.silent);

// register route
router.use('/register', controller.register);

// register route
router.get('/logout', authenticateAndDeserializeUser, controller.logout);

module.exports = router;
