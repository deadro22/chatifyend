const express = require("express");
const router = express.Router();
const { isloggedIn } = require("../middleware & guard/auth-guard");
const { createImage } = require("../middleware & guard/file-guard");
const { users } = require("../models/UsersModel");
const { posts } = require("../models/PostModel");
const { images } = require("../models/FileModel");
const multer = require("multer");
const {
  getProfile,
  PrivateProfile,
} = require("../middleware & guard/users-guard");

router.use(isloggedIn);

const upload = multer({
  limits: {
    fieldSize: 1024 * 1024 * 25,
  },
});

router.get("/home", async (req, res) => {
  const authUser = await users.findOne({ _id: req.user._id });
  const s_c = Number(req.query.skp_count);
  const homePosts = await posts
    .find({
      $or: [{ postOwner: authUser.following }, { postOwner: authUser._id }],
    })
    .skip(s_c)
    .populate("postOwner", "username profileImage")
    .populate("postComments")
    .sort({ postDate: -1 })
    .limit(3);
  res.json({ homePosts, authUser });
});

router.get("/profile/:username", async (req, res) => {
  const us_prf = await getProfile(
    req,
    res,
    req.params.username,
    req.query.skp_count
  );
  if (!us_prf) return res.status(404).send("Profile does not exist");
  const fposts = await posts.find({ postOwner: us_prf._id }).select("postId");
  if (us_prf.private) {
    const p_profile = PrivateProfile(req, res, us_prf);
    res.json({ us_prf: p_profile, postsCount: fposts.length, private: true });
  } else {
    res.json({ us_prf, postsCount: fposts.length, private: false });
  }
});

router.get("/profiles/lst", async (req, res) => {
  if (!req.query.username) return res.status(500).send("Username not provided");
  const prf_user_list = await users
    .find({ username: { $regex: req.query.username, $options: "i" } })
    .select("username profileImage followers following");
  if (!prf_user_list || prf_user_list.length < 1)
    return res.status(404).send("No users found");
  res.send({ prf_user_list, authuser: req.user._id });
});

router.post(
  "/profile/:username/update",
  upload.single("profile_image"),
  async (req, res) => {
    const us_prf = await getProfile(req, res, req.params.username);
    if (!us_prf) return res.status(404).send("User does not exist");
    if (!us_prf._id.equals(req.user._id))
      return res.status(403).send("unauthorized: not your profile");
    if (req.file) {
      if (us_prf.profileImage || us_prf.profileImage !== "") {
        await images.findOneAndUpdate(
          { imageNID: us_prf.profileImage, topicCategory: "profile-image" },
          {
            imageContent: req.file.buffer,
            imageType: req.file.mimetype,
            imageName: req.file.originalname,
          }
        );
      } else {
        const currTimeImageName = new Date().getTime().toString();
        const profileImage = await createImage(
          "profile-image",
          us_prf._id,
          currTimeImageName,
          req.file.originalname,
          req.file.mimetype,
          req.file.buffer
        );
        req.body.profileImage = profileImage.imageNID;
      }
    }

    const profileUpdateData = {};
    if (req.body.username) profileUpdateData.username = req.body.username;
    if (req.body.profileDescription)
      profileUpdateData.profileDescription = req.body.profileDescription;
    if (req.body.profileImage)
      profileUpdateData.profileImage = req.body.profileImage;
    const newUser = await users
      .findOneAndUpdate(
        { _id: us_prf._id },
        {
          $set: profileUpdateData,
        },
        { new: true }
      )
      .select("username");
    res.send({ username: newUser.username });
  }
);

router.post("/profile/:username/follow", async (req, res) => {
  const us_prf = await getProfile(req, res, req.params.username);
  if (!us_prf) return res.status(404).send("User does not exist");
  const viewUser = await getProfile(req, res, req.user.username);
  //Follow check
  if (us_prf._id.equals(req.user._id))
    return res.status(422).send("You can't follow yourself");
  if (
    viewUser.following.includes(us_prf._id) &&
    us_prf.followers.includes(viewUser._id)
  )
    return res.status(409).send("You already follow this user");

  //Private Follow Check
  if (us_prf.private) {
    if (us_prf.followRequests.includes(req.user._id))
      return res.status(409).send("You already sent a follow request");
    us_prf.followRequests.push(req.user._id);
    await us_prf.save();
    res.send("Follow request sent");
  } else {
    us_prf.followers.push(req.user._id);
    viewUser.following.push(us_prf._id);
    await us_prf.save();
    await viewUser.save();
    res.send("Done");
  }
});

router.post(
  "/profile/:username/follow/request/accept/:req_user_id",
  async (req, res) => {
    const us_prf = await getProfile(req, res, req.params.username);
    if (!us_prf) return res.status(404).send("User does not exist");
    if (!us_prf._id.equals(req.user._id))
      return res.status(403).send("unauthorized: not your profile");
    const req_user = await users.findOne({ _id: req.params.req_user_id });
    if (!req_user || !us_prf.followRequests.includes(req_user._id)) {
      return res.status(404).send("Invalid user");
    }
    await users.updateOne(
      { username: req.params.username },
      {
        $pull: { followRequests: req_user._id },
        $push: { followers: req_user._id },
      }
    );
    req_user.following.push(us_prf._id);
    await req_user.save();
    res.send("Done");
  }
);

module.exports = router;
