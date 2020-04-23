const { images } = require("../models/FileModel");

module.exports.createImage = async function (
  topicCategory,
  holderId,
  imageNID,
  imageName,
  imageType,
  imageContent
) {
  const p_image = new images({
    topicCategory: topicCategory,
    holderId: holderId,
    imageNID: "img_p_" + imageNID,
    imageName: imageName,
    imageType: imageType,
    imageContent: imageContent,
  });

  await p_image.save();
  return p_image;
};
