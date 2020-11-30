const auth = require("./auth.js");

const urlProxy = (req, resp) => {
  const https = require("https");

  const {
    query: { url },
  } = req;

  https.get(url, originalResp => {
    let bodyChunks = "";

    originalResp.on("data", chunck => (bodyChunks += chunck));

    originalResp.on("end", () => {
      resp.status(200).end(bodyChunks);
    });
  });
};

const corsHandler = fn => async (req, resp) => {
  if (auth.verifyToken(req.headers["x-auth-token"])) {
    console.log("I'm allowed");
  } else {
    console.log("I'm not allowed");
  }
  resp.setHeader("Access-Control-Allow-Origin", "*");
  resp.setHeader("Access-Control-Expose-Headers", "*");
  resp.setHeader("Access-Control-Allow-Methods", "GET");

  return await fn(req, resp);
};

module.exports = corsHandler(urlProxy);
