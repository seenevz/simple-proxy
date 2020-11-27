const { KJUR } = require("jsrsasign");

import("jsrsasign");

const verifyToken = token => KJUR.jws.JWS.verifyJWT(token, process.env.SECRET);

module.exports = {
  verifyToken,
};
