// `bun run dev` → https://<APP>-local.ozgurl.uk (herkese açık; gizli şey koyma).
// İlk çalıştırmada tunnel + DNS kendiliğinden kurulur, sonrakilerde sadece bağlanır.
// Cloudflare girişi/internet yoksa uyarır, lokal çalışmaya devam eder. Kapatmak: OZGURLUK_LOCAL=1
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { userInfo } from "node:os";
import type { AddressInfo } from "node:net";
import type { Plugin } from "vite";
import { APP, DEV_HOST, DOMAIN, PREFIX } from "./config.ts";

const ZONE = DOMAIN;
const HOST = `${APP}-local.${ZONE}`;
// Kişi başına ayrı tunnel: ekipte herkes aynı URL düzenini kullanır, son çalıştıran URL'yi alır.
const TUNNEL = `${PREFIX}-${APP}-${userInfo().username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

const cf = (...args: string[]): any => {
  const out = execFileSync("cf", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return out.trim() ? JSON.parse(out) : null;
};

export function devUrl(): Plugin {
  let child: ChildProcess | undefined;
  return {
    name: "ozgurluk:dev-url",
    apply: "serve",
    config: () => ({ server: { allowedHosts: [HOST] } }),
    configureServer(server) {
      if (process.env.OZGURLUK_LOCAL === "1") return;
      server.httpServer?.once("listening", () => {
        const port = (server.httpServer!.address() as AddressInfo).port;
        try {
          let tunnel = cf("tunnels", "list").find((t: any) => t.name === TUNNEL && !t.deleted_at);
          tunnel ??= cf("tunnels", "create", "--body", JSON.stringify({ name: TUNNEL, config_src: "cloudflare" }));
          cf("tunnels", "config", "update", tunnel.id, "--body", JSON.stringify({
            config: { ingress: [{ hostname: HOST, service: `http://${DEV_HOST}:${port}` }, { service: "http_status:404" }] },
          }));
          const target = `${tunnel.id}.cfargotunnel.com`;
          const rec = cf("dns", "records", "list", "--zone", ZONE).find((r: any) => r.name === HOST);
          const body = JSON.stringify({ type: "CNAME", name: HOST, content: target, proxied: true });
          if (!rec) cf("dns", "records", "create", "--zone", ZONE, "--body", body);
          else if (rec.content !== target) cf("dns", "records", "update", rec.id, "--zone", ZONE, "--body", body);
          child = spawn("cf", ["tunnels", "run", tunnel.id, "--log-level", "warn"], { stdio: "ignore" });
          server.config.logger.info(`\n  \x1b[32m➜\x1b[0m  \x1b[1mDev URL:\x1b[0m  https://${HOST}\n`);
        } catch (e: any) {
          server.config.logger.warn(`dev URL kurulamadı (lokal devam): ${String(e.stderr ?? e.message).split("\n")[0]}`);
        }
      });
      server.httpServer?.once("close", () => child?.kill());
      process.once("exit", () => child?.kill());
    },
  };
}
