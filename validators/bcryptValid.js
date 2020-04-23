const bcrypt = require("bcryptjs");

module.exports.hashPass = async (password) => {
  const salt = await bcrypt.genSalt(13.5);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};
module.exports.comparePass = async (password, hash) => {
  const res = await bcrypt.compare(password, hash);
  if (!res) return false;
  return true;
};
