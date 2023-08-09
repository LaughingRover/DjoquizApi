const router = require('express').Router();
const controller = require('../controllers/question');
const { authenticateAndDeserializeUser } = require('./middlewares/auth');

// get correct answer
router.get('/correct', authenticateAndDeserializeUser, controller.getCorrect);

// to get question by id, send a get request with type=id&id=[id]
router.get('/get', authenticateAndDeserializeUser, controller.get);

// to delete question by id, send a delete request with type=id&id=[id]
router.delete('/delete', authenticateAndDeserializeUser, controller.delete);

// update a question
router.post('/update', authenticateAndDeserializeUser, controller.update);

// update many questions
router.post('/update', authenticateAndDeserializeUser, controller.update);

// create a question
router.post('/create', authenticateAndDeserializeUser, controller.create);


module.exports = router;
