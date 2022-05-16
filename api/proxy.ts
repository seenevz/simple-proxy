import { VercelRequest, VercelResponse } from "@vercel/node";
import https from "https"
import auth from "./_auth"

type AsyncReqHandler = (req: VercelRequest, resp: VercelResponse) => Promise<void>

const urlProxy = (req: VercelRequest, resp: VercelResponse) => {
  return new Promise<void>((resolve, reject) => {
    const {
      query: { url },
      headers,
      method,
      body,
    } = req;

    const { hostname, pathname, searchParams } = new URL(url as string);

    const originalReq = https.request(
      {
        hostname,
        path: pathname,
        searchParams,
        method,
      },
      originalResp => {
        // resp.writeHead(originalResp.statusCode, {
        //   ...originalResp.headers,
        //   ...resp.headers,
        // });

        originalResp.on("data", chunk => resp.write(chunk));

        originalResp.on("end", () => {
          resp.end();
          resolve();
        });

        originalResp.on("error", reject);
      }
    );
    console.log(originalReq.path, pathname);

    let reqBody = "";
    if (headers["content-type"]) {
      originalReq.setHeader("content-type", headers["content-type"]);
      reqBody = headers["content-type"].includes("application/json")
        ? JSON.stringify(body)
        : new URLSearchParams(body).toString();
    }

    originalReq.setHeader("x-api-key", headers["x-api-key"] || "");
    console.log(originalReq.getHeaders());

    originalReq.end(reqBody);
  });
};


const corsHandler = (fn: AsyncReqHandler) => async (req: VercelRequest, resp: VercelResponse) => {
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
    return await fn(req, resp);
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
