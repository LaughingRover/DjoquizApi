const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const router = express.Router();
const fileParser = require('./fileParser');


// FIX CORS TO ALLOW ORIGIN
//router.use(cors());
router.use(cors());


router.use(fileParser);

router.use(express.urlencoded({ extended: true }));

router.use(express.json());

router.use(cookieParser());

module.exports = router;
