const bcrypt = require("bcrypt");

// hash passwords
function hashPass(password, callback) {
  var salt = parseInt(process.env.SALT_OR_ROUNDS);
  bcrypt.hash(password, salt, callback);
}

// function to compare passwords
function comparePass(passwordString, hash, callback) {
  bcrypt.compare(passwordString, hash, callback)
}

module.exports = {
  hashPass,
  comparePass
}