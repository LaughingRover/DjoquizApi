const jwtUtils = require("./auth-utils")

module.exports = (email, md5, linkprefix = "") => {
    let token = false;
    try {
        token = jwtUtils.generateCommonToken({ email, md5, date: Date.now() }, md5);
    } catch (error) {
        console.trace({ error });
    }

    return `${linkprefix}?email=${email}&token=${token}`
};