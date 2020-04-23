const express = require("express");
const router = express.Router();
const { images } = require("../models/FileModel");
const { createImage } = require("../middleware & guard/file-guard");
const multer = require("multer");

const upload = multer({});

router.get("/image/preview/:imgTPC/:imageName", async (req, res) => {
  const image = await images.findOne({
    imageNID: req.params.imageName,
    topicCategory: req.params.imgTPC,
  });
  if (!image) return res.status(404).send("Image not found");
  res.setHeader("Content-type", image.imageType);
  res.send(image.imageContent);
});

router.post(
  "/site/logo/img/change",
  upload.single("site-image"),
  async (req, res) => {
    if (!req.file) return res.status(422).send("Invalid image");
    const currTimeImageName = new Date().getTime().toString();
    const prf_image = await createImage(
      "site-image",
      undefined,
      currTimeImageName,
      req.file.originalname,
      req.file.mimetype,
      req.file.buffer
    );
    res.send("Logo Image added");
  }
);

module.exports = router;
