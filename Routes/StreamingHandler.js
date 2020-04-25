const express = require("express");
const router = express.Router();
const fs = require("fs");

router.post("/stream/:streamId", (req, res) => {
  console.log(req.body);
  //const rdStream = fs.createReadStream(req.body.fstream);
  //res.header("Content-Type", "video/mp4");
  //rdStream.pipe(res);
  res.send("FGF");
});

module.exports = router;
