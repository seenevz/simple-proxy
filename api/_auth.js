const { KJUR } = require("jsrsasign");

const allowedUsers = () => JSON.parse(process.env.ALLOWED_USERS);

const verifyToken = token =>
  KJUR.jws.JWS.verifyJWT(token, process.env.SECRET, {
    alg: ["HS512"],
    sub: allowedUsers(),
  });

const createToken = payload =>
  KJUR.jws.JWS.sign(
    "HS512",
    { alg: "HS512", typ: "JWT" },
    JSON.stringify(payload),
    process.env.SECRET
  );

//   auth.createToken({
//     sub: "seenevz",
//   })

module.exports = {
  verifyToken,
  createToken,
};
