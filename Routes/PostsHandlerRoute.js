const express = require("express");
const router = express.Router();
const { isloggedIn } = require("../middleware & guard/auth-guard");
const { users } = require("../models/UsersModel");
const { posts, genPostId } = require("../models/PostModel");
const {
  viewPostAuth,
  isPostOwner,
  createPost,
} = require("../middleware & guard/posts-guard");
const { createImage } = require("../middleware & guard/file-guard");
const { comments } = require("../models/CommentsModel");
const multer = require("multer");

router.use(isloggedIn);

const upload = multer({
  limits: {
    fieldSize: 1024 * 1024 * 2,
  },
});

router.get("/rev/:postId", async (req, res) => {
  const post = await posts
    .findOne({ postId: req.params.postId })
    .populate("postOwner", "username followers private profileImage")
    .populate({
      path: "postComments",
      populate: {
        path: "comments.commentOwner",
        model: "users",
        select: "username profileImage -_id",
      },
    });
  const user = await users
    .findOne({ _id: req.user._id })
    .select("username profileImage");
  if (!post) return res.status(404).send("Post not found");
  if (!viewPostAuth(post, req.user))
    return res.status(403).send("You can't view this post");
  res.json({ post, user });
});

router.get("/rev/:post_id/:postId/comments", async (req, res) => {
  const post = await posts
    .findOne({ postId: req.params.postId })
    .populate("postOwner", "followers private");
  const s_comments = await comments
    .findOne({
      commentPost: req.params.post_id,
    })
    .populate("comments.commentOwner", "username profileImage ");
  if (!s_comments) return res.status(404).send("Comments not found");
  if (!viewPostAuth(post, req.user))
    return res.status(403).send("You can't view this post");
  res.send(s_comments);
});

router.post(
  "/post/:username/new",
  upload.single("post_image"),
  async (req, res) => {
    const user = await users.findOne({ username: req.params.username });
    if (!user) return res.status(404).send("Invalid user");
    if (!req.body.postHeader)
      return res.status(422).send("Post header required");
    if (!isPostOwner(user, req))
      return res.status(403).send("unauthorized: not your profile");
    if (!req.file) return res.status(422).send("Image required");
    const currTimeImageName = new Date().getTime().toString();
    const newPost = await createPost(
      genPostId(),
      user._id,
      req.body.postHeader,
      new Date()
    );
    const comment = new comments({
      commentPost: newPost._id,
    });
    user.posts.push(newPost._id);
    await comment.save();
    const p_image = await createImage(
      "post-image",
      newPost._id,
      currTimeImageName,
      req.file.originalname,
      req.file.mimetype,
      req.file.buffer
    );
    newPost.postComments.push(comment._id);
    newPost.postPreviewHolder = "img_p_" + currTimeImageName;
    await newPost.save();
    await user.save();
    res.send(newPost);
  }
);

module.exports = router;
