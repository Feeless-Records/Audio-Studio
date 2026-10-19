// Zero-dependency local development server for WebGPU's secure localhost context.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".wasm": "application/wasm" };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!["index.html", "app.js", "text-layout.wasm"].includes(file)) {
    res.writeHead(404); res.end("Not found"); return;
  }
  fs.readFile(path.join(root, file), (err, contents) => {
    if (err) { res.writeHead(500); res.end("Read failed"); return; }
    res.writeHead(200, { "Content-Type": types[path.extname(file)], "Cache-Control": "no-store" });
    res.end(contents);
  });
});
server.listen(4173, "127.0.0.1", () => console.log("Audio Studio: http://localhost:4173"));
