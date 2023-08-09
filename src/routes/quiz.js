const router = require('express').Router();
const controller = require('../controllers/quiz');
const { authenticateAndDeserializeUser } = require('./middlewares/auth');

// to get quiz by id, send a get request with type=id&id=[id]
// to get all quiz, send a get request with type=all
router.get('/get', controller.get);

// to get the number of questions in a quiz
router.get('/questioncount', controller.getQuizQuestionCount);

// to get the number of questions in a quiz
router.get('/plays', controller.getQuizPlays);

// to delete quiz by id, send a delete request with type=id&id=[id]
// to delete send a delete request with ?type=many
router.delete("/delete", authenticateAndDeserializeUser, controller.delete);

// update a quiz
router.post('/update', authenticateAndDeserializeUser, controller.update);

// update image a quiz
router.post('/updateimage', authenticateAndDeserializeUser, controller.saveImage);

// create a quiz
router.post('/create', authenticateAndDeserializeUser, controller.create);

module.exports = router;
