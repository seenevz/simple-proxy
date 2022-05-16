import { VercelRequest, VercelResponse } from "@vercel/node";
import { ClientRequest } from "http";
import { IncomingHttpHeaders, } from "http2";
import https from "https"
import auth from "./_auth"

type AsyncReqHandler = (req: VercelRequest, resp: VercelResponse) => Promise<void>

const filterHeaders = (headers: IncomingHttpHeaders) => Object.entries(headers).filter((header) => header[0] === "content-type" || (header[0].includes("x-") && header[0] !== 'x-auth-token'))

const addHeaders = (req: ClientRequest, headers: IncomingHttpHeaders) => filterHeaders(headers).forEach(([key, val]) => req.setHeader(key, val ?? ""))

const urlProxy = (req: VercelRequest, resp: VercelResponse) => {
  return new Promise<void>((resolve, reject) => {
    const {
      query: { url },
      headers,
      method,
      body,
    } = req;

    const { hostname, pathname, searchParams } = new URL(url as string);

    const proxyReq = https.request(
      {
        hostname,
        path: pathname,
        searchParams,
        method,
      },
      proxyResp => {
        resp.writeHead(proxyResp.statusCode || 200, {
          ...proxyResp.headers,
          ...resp.getHeaders(),
        });

        proxyResp.on("data", chunk => resp.write(chunk));

        proxyResp.on("end", () => {
          resp.end();
          resolve();
        });

        proxyResp.on("error", reject);
      }
    );

    let reqBody = "";
    if (headers["content-type"]) {
      proxyReq.setHeader("content-type", headers["content-type"]);
      reqBody = headers["content-type"].includes("application/json")
        ? JSON.stringify(body)
        : new URLSearchParams(body).toString();
    }

    addHeaders(proxyReq, headers)
    console.log(proxyReq.getHeaders());

    proxyReq.end(reqBody);
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
