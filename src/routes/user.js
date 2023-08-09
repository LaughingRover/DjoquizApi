const router = require("express").Router();
const controller = require("../controllers/user");
const { authenticateAndDeserializeUser } = require("./middlewares/auth");

router.get('/profile', authenticateAndDeserializeUser, controller.getProfile)

// to get user by id, send a get request with type=user&id=[id]
// to get all users, send a get request with type=all
// to get a user's profile, send a request with type=profile
// TODO: list the possible get requests
router.get("/get", authenticateAndDeserializeUser, controller.get); // TODO: limit information sent when request is not of type=profile

// verify a user's email
router.get("/verify", controller.verify);

// reset a user's password
router.post("/resetpassword", controller.resetpassword); // TODO: should be in auth?

// send a mail to a user
router.post("/sendmail", controller.sendmail);

// update a user
router.post("/update", authenticateAndDeserializeUser, controller.update);

// update a users image
router.post("/updateimage", authenticateAndDeserializeUser, controller.saveImage);

// delete a users image
router.delete("/removeimage", authenticateAndDeserializeUser, controller.removeImage);

// to delete user by id, send a delete request with type=user&id=[id]
router.delete("/delete", authenticateAndDeserializeUser, controller.delete);

module.exports = router;