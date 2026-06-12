import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { startCron } from "./lib/syncJob";

const dev = process.env.NODE_ENV !== "production";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    startCron();

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url ?? "/", true);
      void handle(req, res, parsedUrl);
    });

    server.listen(port, hostname, () => {
      console.log(
        `> SEO Dashboard ready on http://${hostname}:${port} (${dev ? "development" : "production"})`
      );
    });
  })
  .catch((error: unknown) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
