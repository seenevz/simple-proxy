module.exports = (req, resp) => {
  const https = require("https");
  const {
    query: { proxiedUrl },
  } = req;

  https.get(proxiedUrl, originalResp => {
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
