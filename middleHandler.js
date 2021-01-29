const express = require("express");
const api_All = require("./Routes/ApiRouteHandler");
const dotenv = require("dotenv");
const error = require("./errors/errorHandler");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

module.exports = function (app) {
  dotenv.config();
  app.use(cors({ credentials: true }));
  app.use(express.json());
  cloudinary.config({
    cloud_name: "hl97dbtat",
    api_key: "273841159585143",
    api_secret: "bMGYonmGD7lLbWIY-PQhB9vK3c4",
  });
  app.use(error);
  require("./sessions_handler_stp")(app);
  require("./validators/passport-config")();
  api_All("/api", app);
};
