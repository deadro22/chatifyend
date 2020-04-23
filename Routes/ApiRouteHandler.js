const users = require("./UsersAuthRoute");
const usersInter = require("./UserInterRoute");
const posts = require("./PostsHandlerRoute");
const postsInter = require("./PostInterHandler");
const imageHandler = require("./ImageHandler");

module.exports = function (ln, app) {
  app.use(ln + "/users/", users);
  app.use(ln + "/users/", usersInter);
  app.use(ln + "/posts/", posts);
  app.use(ln + "/upld/imgs", imageHandler);
};
