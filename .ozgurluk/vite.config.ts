import { defineConfig } from "vite";
import { voidPlugin } from "void";
import { DEV_HOST, DEV_PORT } from "./config.ts";
import { devUrl } from "./dev-url.ts";
import { pages } from "./pages.ts";

export default defineConfig({
  server: { host: DEV_HOST, port: DEV_PORT, strictPort: false },
  plugins: [pages(), voidPlugin(), devUrl()],
});
