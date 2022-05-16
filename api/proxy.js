const auth = require("./_auth.js");

const urlProxy = (req, resp) => {
  const https = require("https");

  const {
    query: { url },
    headers,
  } = req;

  const { hostname, pathname, searchParams, host } = new URL(url);

  https.get(
    { headers: { ...headers, host }, hostname, pathname, searchParams },
    originalResp => {
      resp.writeHead(originalResp.statusCode, {
        ...originalResp.headers,
        ...resp.headers,
      });

      originalResp.on("data", chunk => resp.write(chunk));

      originalResp.on("end", () => {
        resp.end();
      });

      originalResp.on("error", console.error);
    }
  );
};

const corsHandler = fn => (req, resp) => {
  resp.setHeader("Access-Control-Allow-Origin", "*");
  resp.setHeader("Access-Control-Allow-Headers", "*");
  resp.setHeader("Access-Control-Expose-Headers", "*");
  resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  //To authenticate, request must have an header called x-auth-token with a valid token
  if (req.method === "OPTIONS") {
    resp.status(200).end();
    return;
  }

  try {
    //check if user is allowed
    // if (auth.verifyToken(req.headers["x-auth-token"])) {
    return fn(req, resp);
    // } else {
    //   resp.status(401).end();
    //   return;
    // }
  } catch (error) {
    //If token is malformed, it will throw an error while trying to verify
    console.error(error);

    resp.status(400).end();
    return;
  }
};

module.exports = corsHandler(urlProxy);
