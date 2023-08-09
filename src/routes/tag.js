const router = require('express').Router();
const controller = require('../controllers/tag');

// to get tag by id, send a get request with type=id&id=[id]
// to get all tags, send a get request with type=all
router.get('/get', controller.get);

// to delete tag by id, send a delete request with type=id&id=[id]
// to delete many send a delete request with ?type=many
router.delete('/delete', controller.delete);

// create a tag
router.post('/create', controller.create);

// update a tag
router.post('/update', controller.update);

module.exports = router;
