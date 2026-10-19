import { defineConfig } from "void/config";
import { HOST, WORKER } from "./config.ts";

// Worker adı ve domain version.txt'den türer (bkz. config.ts).
// Sadece statik çok sayfalı site (olmayan yol 404.html + 404 statüsü): Worker kodu, API, binding yok. (guard.ts bunu denetler)
export default defineConfig({
  target: "cloudflare",
  output: "static",
  inference: { appType: "static", bindings: { db: false, kv: false } },
  cloudflare: {
    name: WORKER,
    routes: [{ pattern: HOST, custom_domain: true }],
    workers_dev: false,
    preview_urls: false,
  },
});
