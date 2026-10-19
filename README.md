# özgürl.uk app kalıbı

Yeni app: bu kalıptan repo oluştur → `package.json` `name` = app adı, `APP.md`'yi yaz → PR aç.

```sh
bun install
bun run dev     # 127.0.0.1:9999 + https://<APP>-local.ozgurl.uk
bun run check   # tsc + build + standart denetimi (sayfalar, SEO, lisans, adresler)
```

Yeni sayfa: `hakkinda/index.html` gibi bir dosya aç (`<title>` ve `description` yaz); canonical, robots, sitemap ve paylaşım etiketlerini eklenti üretir.

Yayın: PR → `<APP>-pr-<no>.ozgurl.uk`; `development`'a merge → `<APP>-dev.ozgurl.uk`;
`main`'e merge → `version.txt`'deki sürüm (`1.2.3` → `<APP>.ozgurl.uk`, `1.2.3-rc.1` → `<APP>-rc.ozgurl.uk`) ve tag + Release otomatik açılır.

## Merkezi CI
Build, guard ve deploy mantığı bu repodaki `.github/workflows/_*.yml` dosyalarındadır (`workflow_call`).
App repolarındaki `preview.yml`, `development.yml`, `deploy.yml` ve `standart.yml` sadece `ozgurl-uk/kalip/...@v1` çağırır.

**Kalıbı güncellemek (bu repoda):** değişiklik `development`'a PR ile gelir, `main`'e sürüm olarak çıkar. App'lerin kullandığı `v1`
etiketi hareketli bir etikettir; yeni kalıp sürümünü app'lere yaymak için release sonrası taşınır:
`git tag -f v1 <commit> && git push -f origin v1`. Kırıcı bir değişiklik (yeni gerekli secret vb.) için `v2` açılır, app'ler tek tek geçer.
`_*.yml` değişiklikleri `v1` taşınana kadar app'lerde etkili olmaz; önce kalıpta bir deneme dalına işaret ederek dene.

## Lisans
- **Kalıp (bu repo): MIT** (`LICENSE`). Başka topluluklar da alıp kullanabilir.
- **Bu kalıptan açılan app'ler: AGPL-3.0-only** (kod) **+ CC BY-SA 4.0** (yazılar, görseller, içerik). Metinler `.ozgurluk/licenses/` altında.
  Yeni app'te: `cp .ozgurluk/licenses/AGPL-3.0.txt LICENSE`, `LICENSE-CONTENT` dosyasını yaz, `package.json` `license` = `AGPL-3.0-only`.
- `ozgurl.uk` adı ve logo lisansın kapsamında değildir.
