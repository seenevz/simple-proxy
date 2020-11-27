const urlProxy = (req, resp) => {
  const https = require("https");

  const {
    query: { url },
  } = req;

  https.get(url, originalResp => {
    let bodyChunks = "";

    originalResp.on("data", chunck => (bodyChunks += chunck));

    originalResp.on("end", () => {
      resp.writeHead(200, "ok", headers);
      resp.end(bodyChunks);
    });
  });
};

const corsHandler = fn => async (req, resp) => {
  resp.setHeader("Access-Control-Allow-Origin", "*");
  resp.setHeader("Access-Control-Expose-Headers", "*");
  resp.setHeader("Access-Control-Allow-Methods", "GET");

  return await fn(req, resp);
};

module.exports = corsHandler(urlProxy);