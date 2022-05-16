const { KJUR } = require("jsrsasign");

const allowedUsers = () => JSON.parse(process.env.ALLOWED_USERS as string) as string[];

const verifyToken = (token: string) =>
  allowedUsers().reduce(
    (_, sub) =>
      KJUR.jws.JWS.verifyJWT(token, process.env.SECRET, {
        alg: ["HS512"],
        sub,
      }),
    false
  );

const createToken = (payload: Record<string, string>) =>
  KJUR.jws.JWS.sign(
    "HS512",
    { alg: "HS512", typ: "JWT" },
    JSON.stringify(payload),
    process.env.SECRET
  );

// console.log(
//   createToken({
//     sub: "seenevz",
//   })
// );

export default {
  verifyToken,
  createToken,
};
