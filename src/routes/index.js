const express = require('express');
const router = express.Router();

// Route handlers
const middlewares = require('./middlewares');
const authRouter = require('./auth');
const userRouter = require('./user');
const tagRouter = require('./tag');
const quizRouter = require('./quiz');
const questionRouter = require('./question');
const roundRouter = require('./round');

router.use(middlewares);

router.use('/auth', authRouter);

router.use('/user', userRouter);

router.use('/tag', tagRouter);

router.use('/quiz', quizRouter);

router.use('/question', questionRouter);

// play quiz 
router.use('/round', roundRouter);

router.use(express.static('public'));


module.exports = router;
