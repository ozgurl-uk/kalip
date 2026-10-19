// Çok sayfalı statik site: <slug>/index.html + 404.html. Her sayfa JS'siz, tam HTML olarak yayınlanır (SEO).
// Sayfa sadece <title> ve <meta name="description"> yazar; ortak etiketleri (canonical, robots, paylaşım,
// favicon, tema rengi, sürüm) bu eklenti enjekte eder. Prod dışı ortamlar noindex olur.
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { HtmlTagDescriptor, Plugin } from "vite";
import { APP, HOST, MODE, VERSION } from "./config.ts";

const root = resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", "dist", "src", "public"]);

/** Kökteki index.html, <slug>/index.html ve 404.html dosyaları. */
export function discoverPages(): { name: string; file: string; path: string }[] {
  const pages = [{ name: "index", file: join(root, "index.html"), path: "/" }];
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith(".") || SKIP.has(d.name)) continue;
    if (existsSync(join(root, d.name, "index.html"))) pages.push({ name: d.name, file: join(root, d.name, "index.html"), path: `/${d.name}/` });
  }
  return pages;
}

const INDEXABLE = !MODE; // sadece prod indekslenir (rc/dev/pr/local noindex)
const attr = (html: string, re: RegExp) => html.match(re)?.[1]?.trim() ?? "";

export function pages(): Plugin {
  const list = discoverPages();
  const has404 = existsSync(join(root, "404.html"));
  return {
    name: "ozgurluk:pages",
    config: () => ({
      appType: "mpa" as const,
      // Sadece client ortamı HTML girdilerini alır (Worker ortamı değil).
      environments: {
        client: {
          build: {
            rollupOptions: {
              input: Object.fromEntries([...list.map((p) => [p.name, p.file]), ...(has404 ? [["404", join(root, "404.html")]] : [])]),
            },
          },
        },
      },
    }),
    transformIndexHtml(html, ctx) {
      const is404 = /(^|\/)404\.html$/.test(ctx.path);
      const path = is404 ? "/404.html" : ctx.path.replace(/index\.html$/, "");
      const url = `https://${HOST}${path}`;
      const title = attr(html, /<title>([^<]*)<\/title>/);
      const description = attr(html, /<meta\s+name="description"\s+content="([^"]*)"/);
      const meta = (a: Record<string, string>): HtmlTagDescriptor => ({ tag: "meta", attrs: a, injectTo: "head" });
      const tags: HtmlTagDescriptor[] = [
        meta({ name: "robots", content: INDEXABLE && !is404 ? "index,follow" : "noindex,nofollow" }),
        meta({ name: "theme-color", content: "#ffffff" }),
        meta({ name: "version", content: VERSION }),
        { tag: "link", attrs: { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }, injectTo: "head" },
        meta({ property: "og:site_name", content: APP }),
        meta({ property: "og:locale", content: "tr_TR" }),
        meta({ property: "og:type", content: "website" }),
        meta({ property: "og:title", content: title }),
        meta({ property: "og:description", content: description }),
        meta({ name: "twitter:card", content: "summary" }),
      ];
      if (!is404) {
        tags.push({ tag: "link", attrs: { rel: "canonical", href: url }, injectTo: "head" }, meta({ property: "og:url", content: url }));
      }
      return { html: html.replaceAll("%VERSION%", VERSION), tags };
    },
    generateBundle() {
      // robots.txt ve sitemap.xml sadece client çıktısında, build sırasında üretilir.
      if (this.environment?.name && this.environment.name !== "client") return;
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: INDEXABLE ? `User-agent: *\nAllow: /\nSitemap: https://${HOST}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n",
      });
      if (INDEXABLE) {
        const urls = list.map((p) => `  <url><loc>https://${HOST}${p.path}</loc></url>`).join("\n");
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        });
      }
    },
  };
}
