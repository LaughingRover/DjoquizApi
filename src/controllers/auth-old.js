const async = require('async');
const moment = require('moment');
const md5 = require('md5');
const passport = require('passport');
const db = require('#db');
const { REFRESH_TOKEN } = require('#constants/dbNames');
const { hashPass } = require('#utils/password-hash');
const { MESSAGES, REGEX, DB_NAMES, ROLES } = require('#constants');
const { generateAccessToken } = require('../utils/auth-utils');
const { v4: uuidv4 } = require('uuid');

module.exports.login = (req, res) => {
    let newRefreshToken = uuidv4();

    db.create(
        {
            to: REFRESH_TOKEN,
            data: {
                value: newRefreshToken,
                userId: req.user.id,
                isRevoked: false,
                createdAt: Date.now(),
                revokedAt: null
            },
        },
        (_err, _result) => {
            res.status(200).json({
                success: true,
                message: MESSAGES.LOGIN_SUCCESS,
                data: {
                    userId: req.user.id,
                    accessToken: generateAccessToken(req.user),
                    refreshToken: newRefreshToken,
                    sessionId: req.session
                },
            });
        }
    );
};

module.exports.localAuthHandler = (req, res, next) => {

    passport.authenticate('local', (err, user, info) => {
        console.log({ err, user, info });

        if (err) return res.status(500).json({ error: true, message: 'internal server error' });
        if (!user)
            return res.status(401).json({ error: true, message: info.message || 'incorrect username or password' });

        req.logIn(user, function (err) {
            if (err) return res.status(500).json({ error: true, message: 'internal server error' });
            next();
        });
    })(req, res, next);
};

/**
 *
 * Register a new user's data
 * @restrictions available to only anonymous or logged out users.
 * @requires email
 * @requires password
 * @requires firstname
 * @requires lastname
 */
module.exports.register = (req, res) => {
    // Params
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    if (firstname == null || lastname == null || email == null || password == null) {
        return res.status(400).json({
            success: false,
            message: 'missing parameters',
        });
    }

    if (firstname.length <= 2) {
        return res.status(400).json({
            success: false,
            message: 'firstname is too short',
        });
    }

    if (lastname.length <= 2) {
        return res.status(400).json({
            success: false,
            message: 'lastname is too short',
        });
    }

    if (!REGEX.EMAIL_REGEX.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'invalid email',
        });
    }

    if (!REGEX.PASSWORD_REGEX.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'password invalid. Password Length must be between 4 - 20 and include at least One number)',
        });
    }

    async.waterfall([
        // check if the email is already registered
        function (callback) {
            const config = {
                query: { email },
                from: DB_NAMES.USER_MODEL,
            };
            db.getOne(config, (err, userdata) => {
                if (err) {
                    console.trace({ err });
                    return res.status(500).json({
                        success: false,
                        message: MESSAGES.SERVER_ERROR,
                    });
                }
                callback(null, userdata);
            });
        },
        // hash the password
        function (userFound, callback) {
            if (!userFound || (Array.isArray(userFound) && userFound.length !== 1)) {
                hashPass(password, (err, hashedPassword) => {
                    if (err) {
                        console.trace({ err });
                        return res.status(500).json({
                            success: false,
                            message: MESSAGES.SERVER_ERROR,
                        });
                    }

                    callback(null, hashedPassword);
                });
            } else {
                return res.status(409).json({
                    success: false,
                    message: 'that email has already been registered',
                });
            }
        },
        /**
         * verification hash will be stored to db but not sent to user.
         * verification hash is used for creating confirmation link sent to user
         * confirmation link to reset password and verify email will contain the following object
         * {
         *   email: userEmail,
         *   verificationHash: md5,
         *   date: Date.now()
         * }
         * confirmation link to verify will be in the format
         *   /verify?email=[users email]&vt=[token]
         * @todo create a verificationHash
         * */
        // create verificationHash
        function (hashedPassword, callback) {
            let verificationHash = md5(email);
            callback(null, { verificationHash, hashedPassword });
        },
        // create new user in the db
        function (result) {
            let config = {
                data: {
                    firstname: firstname,
                    lastname: lastname,
                    email: email,
                    birthday: null,
                    gender: null,
                    score: 0,
                    placement: 0,
                    password: result.hashedPassword,
                    photo: null,
                    verificationHash: result.verificationHash,
                    role: ROLES.USER_ROLE,
                    isEmailVerified: false,
                    createdAt: moment(new Date(), 'DD MM YYYY hh:mm:ss'),
                    updatedAt: moment(new Date(), 'DD MM YYYY hh:mm:ss'),
                },
                to: DB_NAMES.USER_MODEL,
            };
            db.create(config, (err, userdata) => {
                if (err) {
                    console.trace({ err });
                    return res.status(500).json({
                        success: false,
                        message: MESSAGES.SERVER_ERROR,
                    });
                }

                let returnData = {
                    firstname: userdata.firstname,
                    lastname: userdata.lastname,
                    email: userdata.email,
                    id: userdata._id,
                    isEmailVerified: userdata.isEmailVerified,
                    createdAt: userdata.createdAt,
                };

                // allow passport to login the user
                req.login(userdata, err => {
                    if (err)
                        return res.status(500).json({
                            success: true,
                            message: MESSAGES.LOGIN_FAILED,
                            data: returnData,
                        });

                    return res.status(201).json({
                        success: true,
                        message: MESSAGES.LOGIN_SUCCESS,
                        data: returnData,
                    });
                });
            });
        },
    ]);
};
