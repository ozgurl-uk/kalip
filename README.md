# kalip

ozgurl.uk uygulama kalıbı. Kurallar: [AGENTS.md](AGENTS.md) · Katkı: [CONTRIBUTING.md](CONTRIBUTING.md) · Lisans: MIT

```sh
bun install
bun run dev     # 127.0.0.1:9999 + https://<APP>-local.ozgurl.uk
bun run check   # tsc + build + guard
```

Yeni app lisansı: AGPL-3.0 (kod) + CC BY-SA 4.0 (içerik), bkz. `.ozgurluk/licenses/`.

Merkezi CI bu repodaki `.github/workflows/_*.yml` dosyalarıdır, app'ler `@main` ile çağırır: `main`'e giren her sürüm app'lere hemen yansır.
