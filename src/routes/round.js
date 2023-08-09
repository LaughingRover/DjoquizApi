const router = require('express').Router();
const controller = require('../controllers/round');
const { authenticateAndDeserializeUser } = require('./middlewares/auth');

// to get question by id, send a get request with type=id&id=[id]
// router.get('/get', authenticateAndDeserializeUser, controller.get);

// to start a new round
router.post('/start', authenticateAndDeserializeUser, controller.start);

// to update a new round
router.post('/update', authenticateAndDeserializeUser, controller.update);

module.exports = router;
