const router = require("express").Router();

router.use("/", (req, res) => {
  console.dir({req: req});
  res.json({"status": "test complete"});
});

module.exports = router;