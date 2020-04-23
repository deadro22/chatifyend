const express = require("express");
const api_All = require("./Routes/ApiRouteHandler");
const dotenv = require("dotenv");
const error = require("./errors/errorHandler");
const cors = require("cors");

module.exports = function (app) {
  dotenv.config();
  app.use(cors({ origin: "http://36223094.ngrok.io", credentials: true }));
  app.use(express.json());
  app.use(error);
  require("./sessions_handler_stp")(app);
  require("./validators/passport-config")();
  api_All("/api", app);
};
