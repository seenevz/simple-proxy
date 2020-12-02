const auth = require("./auth.js");

const urlProxy = (req, resp) => {
  const https = require("https");

  const {
    query: { url },
  } = req;

  https.get(url, originalResp => {
    const headers = { ...originalResp.headers, ...req.headers };

    resp.writeHead(200, headers);

    originalResp.on("data", chunk => resp.write(chunk));

    originalResp.on("end", () => {
      resp.end();
    });
  });
};

const corsHandler = fn => async (req, resp) => {
  resp.setHeader("Access-Control-Allow-Origin", (req.headers.origin || "*"));
  resp.setHeader("Access-Control-Allow-Headers", "x-auth-token");
  resp.setHeader("Access-Control-Expose-Headers", "*");
  resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  resp.end();

  //To authenticate, request must have an header called x-auth-token with a valid token
  if (req.method === "OPTIONS") {
    resp.status(200).end();
    return;
  }

  try {
    //check if user is allowed
    if (auth.verifyToken(req.headers["x-auth-token"])) {
      return await fn(req, resp);
    } else {
      resp.status(401).end();
      return;
    }
  } catch (error) {
    //If token is malformed, it will throw an error while trying to verify
    resp.status(400).end();
    return;
  }
};

module.exports = corsHandler(urlProxy);
