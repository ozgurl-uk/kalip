// Build çıktısını ozgurl.uk standardına göre denetler. `vite build` sonrası `bun .ozgurluk/guard.ts`.
// Amaç: her şey ozgurl.uk'e bağlı kalsın, saldırıda faturaya dönüşecek hiçbir şey yayınlanmasın.
// Yayınlanan tek şey dist/client (void deploy --dir dist/client); dist/ssr asla yüklenmez.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { APP, DOMAIN, MODE, PREFIX } from "./config.ts";

const ASSETS = "dist/client";
const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

// package.json üstverisi app adıyla tutarlı olmalı (name değişince eski kalmasın).
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (!pkg.description) fail("package.json description boş");
// homepage: app'lerde (AGPL) zorunlu ve adresle aynı; kalıpta (MIT, canlı sitesi yok) isteğe bağlı ama varsa tutarlı.
if (pkg.homepage ? pkg.homepage !== `https://${APP}.${DOMAIN}` : pkg.license === "AGPL-3.0-only") fail(`package.json homepage "https://${APP}.${DOMAIN}" olmalı: ${pkg.homepage}`);
if (!new RegExp(`^git\\+https://github\\.com/[^/]+/${APP}\\.git$`).test(pkg.repository?.url ?? "")) fail(`package.json repository.url git+https://github.com/<org>/${APP}.git olmalı: ${pkg.repository?.url}`);
if (!new RegExp(`^https://github\\.com/[^/]+/${APP}/issues$`).test(pkg.bugs?.url ?? "")) fail(`package.json bugs.url https://github.com/<org>/${APP}/issues olmalı: ${pkg.bugs?.url}`);
if (!/^bun@\d+\.\d+\.\d+$/.test(pkg.packageManager ?? "")) fail(`package.json packageManager "bun@X.Y.Z" olmalı: ${pkg.packageManager}`);

// Lisans: kalıp MIT; app'ler AGPL-3.0-only (kod) + CC BY-SA 4.0 (içerik, LICENSE-CONTENT).
const license = pkg.license;
if (!existsSync("LICENSE")) fail("LICENSE yok");
if (license !== "MIT" && license !== "AGPL-3.0-only") fail(`package.json license "MIT" (kalıp) ya da "AGPL-3.0-only" (app) olmalı: ${license}`);
if (license === "AGPL-3.0-only" && !existsSync("LICENSE-CONTENT")) fail("AGPL app'te LICENSE-CONTENT (CC BY-SA 4.0 içerik lisansı) yok");

// Void'in ürettiği Cloudflare config'i (JSONC, yorum yok)
const cfg = JSON.parse(readFileSync(".void-wrangler.jsonc", "utf8"));
const allowed = new Set(["name", "routes", "workers_dev", "preview_urls", "compatibility_date", "account_id"]);
for (const key of Object.keys(cfg)) {
  if (!allowed.has(key)) fail(`izin verilmeyen config alanı: ${key} (binding, trigger, vars vb. yasak)`);
}
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
if (!new RegExp(`^${esc(PREFIX)}-[a-z0-9-]+$`).test(cfg.name ?? "")) fail(`Worker adı "${PREFIX}-" ile başlamalı: ${cfg.name}`);
if (cfg.workers_dev !== false) fail("workers_dev: false olmalı (workers.dev yasak)");
if (cfg.preview_urls !== false) fail(`preview_urls: false olmalı (preview'lar ${DOMAIN} altında)`);
if (!Array.isArray(cfg.routes) || cfg.routes.length !== 1) fail("tam olarak 1 route olmalı");
for (const r of cfg.routes ?? []) {
  if (!r.custom_domain || !new RegExp(`^[a-z0-9-]+\\.${esc(DOMAIN)}$`).test(r.pattern)) fail(`route *.${DOMAIN} tek seviye custom_domain olmalı: ${JSON.stringify(r)}`);
}

// Üçüncü parti kaynak yok: yayınlanacak dosyalarda script/link/img/iframe dışarıya işaret etmemeli.
const ext = /<(script|link|img|iframe|source|video|audio)\b[^>]*\b(src|href)\s*=\s*["']?(https?:)?\/\//gi;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
for (const file of walk(ASSETS)) {
  if (!/\.(html|js|css)$/.test(file)) continue;
  // canonical kendi adresimizi gösteren bir meta bilgisidir, kaynak yüklemez.
  const src = readFileSync(file, "utf8").replace(/<link\s+rel="canonical"[^>]*>/g, "");
  if (ext.test(src)) fail(`üçüncü parti kaynak: ${file}`);
  ext.lastIndex = 0;
  if (/\bimport\s*(\(|[^;]*from\s*)["'](https?:)?\/\//.test(src)) fail(`uzak import: ${file}`);
  if (/@import\s+url\(["']?(https?:)?\/\//.test(src)) fail(`uzak CSS import: ${file}`);
}

// SEO: her sayfa JS'siz okunabilir tam HTML olmalı (başlık, açıklama, tek h1, lang) ve 404.html olmalı.
if (!existsSync(join(ASSETS, "404.html"))) fail("404.html yok (olmayan yollar 404 statüsüyle bu sayfayı göstermeli)");
for (const file of walk(ASSETS).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  const rel = file.slice(ASSETS.length + 1);
  const is404 = rel === "404.html";
  if (!/<html[^>]*\blang="tr"/.test(html)) fail(`${rel}: <html lang="tr"> yok`);
  if (!/<title>[^<]{3,}<\/title>/.test(html)) fail(`${rel}: <title> yok/çok kısa`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) fail(`${rel}: description yok/çok kısa (en az 20 karakter)`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(`${rel}: tam olarak 1 <h1> olmalı`);
  if (!/<main[\s>]/.test(html)) fail(`${rel}: <main> yok`);
  if (!is404 && !html.includes('rel="canonical"')) fail(`${rel}: canonical yok`);
  const noindex = html.includes('content="noindex,nofollow"');
  if (!is404 && noindex !== !!MODE) fail(`${rel}: robots yanlış (prod index, diğerleri noindex olmalı)`);
}

if (errors.length) {
  console.error("ozgurl.uk standardı ihlal edildi:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`ok: ${cfg.name} → ${cfg.routes.map((r: any) => r.pattern).join(", ")}`);
