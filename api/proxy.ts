import { VercelRequest, VercelResponse } from "@vercel/node";
import { ClientRequest } from "http";
import { IncomingHttpHeaders, } from "http2";
import https from "https"
import auth from "./_auth"

type AsyncReqHandler = (req: VercelRequest, resp: VercelResponse) => Promise<void>

const headersRegex = /content-type|cookie|accept|x-\S*/i

const filterHeaders = (headers: IncomingHttpHeaders) => Object.entries(headers).filter(header => !!headersRegex.exec(header[0]) && header[0] !== 'x-auth-token ')

const addHeaders = (req: ClientRequest, headers: IncomingHttpHeaders) => filterHeaders(headers).forEach(([key, val]) => req.setHeader(key, val ?? ""))

const urlProxy = (req: VercelRequest, resp: VercelResponse) => {
  return new Promise<void>((resolve, reject) => {
    const {
      query: { url },
      headers,
      method,
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
        if (proxyResp.headers["set-cookie"]) proxyResp.headers["set-cookie"].forEach((cookie, i, arr) => arr[i] = cookie.replace('samesite=lax', 'samesite=None; Secure'))
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

    addHeaders(proxyReq, headers)

    req.on("data", chunk => proxyReq.write(chunk))

    req.on("end", () => proxyReq.end())

    req.on("error", reject)

  });
};


const corsHandler = (fn: AsyncReqHandler) => async (req: VercelRequest, resp: VercelResponse) => {
  // const { protocol, hostname, port } = new URL(req.headers.origin!)
  resp.setHeader("Access-Control-Allow-Origin", req.headers.origin!);
  resp.setHeader("Access-Control-Allow-Headers", "x-api-key, x-auth-token");
  resp.setHeader("Access-Control-Expose-Headers", "*");
  resp.setHeader("Access-Control-Allow-Credentials", "true")
  resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  //To authenticate, request must have an header called x-auth-token with a valid token
  if (req.method === "OPTIONS") {
    resp.status(200).end();
    return;
  }

  try {
    //check if user is allowed
    if (auth.verifyToken(req.headers["x-auth-token"] as string)) {
      return await fn(req, resp);
    } else {
      resp.status(401).end();
      return;
    }
  } catch (error) {
    //If token is malformed, it will throw an error while trying to verify
    console.error(error);

    resp.status(400).end();
    return;
  }
};

module.exports = corsHandler(urlProxy);
