import { createServer } from "http";
import { parse } from "url";
import * as path from "path";
import { loadEnvConfig } from "@next/env";
import next from "next";
import { startCron } from "./lib/syncJob";

// Load .env before reading PORT / NODE_ENV / HOST so the values in the file
// apply even when the shell doesn't export them (PM2, systemd, plain node).
// When compiled, this file lives in dist/, so walk one level up.
const projectDir =
  path.basename(__dirname) === "dist" ? path.dirname(__dirname) : __dirname;
loadEnvConfig(projectDir);

const dev = process.env.NODE_ENV !== "production";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
// Deliberately NOT process.env.HOSTNAME — on Linux that variable usually
// holds the machine's hostname, which would silently bind the wrong
// interface and make Nginx's proxy to 127.0.0.1 fail with 502.
const host = process.env.HOST ?? "0.0.0.0";

const app = next({ dev, dir: projectDir });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    startCron();

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url ?? "/", true);
      void handle(req, res, parsedUrl);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use by another process.\n` +
            `Find it with:  ss -tlnp | grep ':${port}'\n` +
            `Then either stop that service or set a different PORT in .env ` +
            `(and update the proxy_pass port in your Nginx config).`
        );
      } else {
        console.error("Server failed to start:", error);
      }
      process.exit(1);
    });

    server.listen(port, host, () => {
      console.log(
        `> SEO Dashboard ready on http://${host}:${port} (${dev ? "development" : "production"})`
      );
    });
  })
  .catch((error: unknown) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
