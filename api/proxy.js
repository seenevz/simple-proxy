module.exports = (req, resp) => {
  const https = require("https");
  const {
    query: { url },
  } = req;

  https.get(url, originalResp => {
    let bodyChunks = "";
    const headers = {
      ...originalResp.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "*",
    };

    console.log(headers);

    originalResp.on("data", chunck => (bodyChunks += chunck));
    originalResp.on("end", () => {
      resp.writeHead(200, "ok", headers);
      resp.end(bodyChunks);
    });
  });
};
