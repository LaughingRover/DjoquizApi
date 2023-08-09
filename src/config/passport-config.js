/**
 * @author Frank Choongsaeng
 * 
 * @description configures passport for authentication
 * contains local authentication, google authentication,
 * facebook authentication, and twitter authentication
 */

// DEPENDENCIES
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const passwordHash = require("../utils/password-hash");
const md5 = require("md5");
const { DB_NAMES, ROLES } = require("../constants");
const { getOne, create } = require("../db");


/**
 * 
 * VERIFICATION CALLBACKS
 * Verification callbacks are called when an authentication means is triggered.
 * These verification callback are defined for all the different callback 
 */

// verify callback for local signin process
const verifyLocalUser = (email, password, done) => {

    getOne({
        query: { email },
        from: DB_NAMES.USER_MODEL,
    }, (err, user) => {
        // return an err if an error occurred
        if (err) { return done(err); }

        // could not find the user
        if (!user) {
            return done(null, false, { message: "Incorrect username." });
        }

        // compare users password
        user.validPassword(password, (_err, isMatch) => {
            if (!isMatch) return done(null, false, { message: "Incorrect password" })
            return done(null, user);
        })
    });
}

// verify callback for google oauth20
const verifyGoogleUser = (_accessToken, _refreshToken, profile, done) => {
    getOne({
        query: { googleId: profile.id },
        from: DB_NAMES.USER_MODEL,
    }, (err, user) => {
        if (err) {
            return done(err);
        }

        // create the user if the user does not already exist
        // TODO save user photo
        if (!user) {
            return create({
                data: {
                    firstname: profile._json.given_name,
                    lastname: profile._json.family_name,
                    email: profile._json.email,
                    isEmailVerified: profile._json.email_verified,
                    password: profile.id,
                    googleId: profile.id,
                    gender: profile._json.gender,
                    role: ROLES.USER_ROLE,
                    verificationHash: md5(profile._json.email)
                },
                to: DB_NAMES.USER_MODEL
            }, done);
        }

        // return a user if the user has already been created
        done(null, user);
    })
}

// verify callback for facebook
const verifyFacebookUser = (_accessToken, _refreshToken, profile, done) => {
    // return done(null, profile);

    getOne({
        query: { facebookId: profile.id },
        from: DB_NAMES.USER_MODEL,
    }, (err, user) => {
        if (err) {
            return done(err);
        }

        // create the user if the user does not already exist
        // TODO save user photo
        if (!user) {
            return create({
                data: {
                    firstname: profile._json.first_name,
                    lastname: profile._json.last_name,
                    email: profile._json.email || Date.now().toString(),
                    isEmailVerified: Boolean(profile._json.email),
                    password: profile.id,
                    facebookId: profile.id,
                    gender: profile._json.gender || null,
                    role: ROLES.USER_ROLE,
                    verificationHash: md5(profile._json.email || Date.now().toString())
                },
                to: DB_NAMES.USER_MODEL
            }, done);
        }

        // return a user if the user has already been created
        done(null, user);
    })
}

// strategy for signin or singup with email and password
passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, verifyLocalUser));

// strategy for signin or singup with google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, verifyGoogleUser))

// strategy for signin or singup with facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'first_name', 'last_name', 'email', 'gender'],
}, verifyFacebookUser))

passport.serializeUser(function (user, done) {
    console.log('\n serializing user \n')
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    console.log('\n this is the id: \n', id)
    getOne(
        {
            query: { _id: id },
            from: DB_NAMES.USER_MODEL
        },
        (err, user) => {
            done(err, user);
        }
    );
});
