# ozgurl.uk standardı

> Bu dosya `ozgurl-uk/kalip` reposundan miras alınır. **App reposunda düzenleme.**
> Değişiklik kalıba PR ile gelir; CI (`standart` job) farklılığı yakalar.

## APP.md: app'e özel kurallar
`APP.md` her app'e özeldir ve **işe başlamadan önce okunur**. App'in amacı, kitlesi, tonu, kaynakları ve
"şunu asla yapma" kuralları orada yazar. Bir iş `APP.md` ile çelişiyorsa dur ve sor.
- `APP.md` bu dosyadaki kurallara **ekleme** yapar, onları **gevşetemez** (örn. "bu app'te üçüncü parti font kullan" yazılamaz).
- Agent, app'in amacı ya da sınırları değişince `APP.md`'yi güncel tutar; kural eklemek insan kararıdır.

## 1. Her şey ozgurl.uk'e bağlı
- Her app tek bir adreste yaşar: `<APP>.ozgurl.uk` (tek seviye subdomain).
- `main` (sürüm) adresi `version.txt`'den türer: `1.2.3` → `<APP>.ozgurl.uk`; `1.2.3-rc.N` → `<APP>-rc.ozgurl.uk`.
  `development` branch'i her zaman `<APP>-dev.ozgurl.uk`; PR preview → `<APP>-pr-<no>.ozgurl.uk`.
- `bun run dev` otomatik olarak `<APP>-local.ozgurl.uk` adresini açar (tunnel + DNS kendiliğinden kurulur).
- `workers.dev`, `pages.dev`, başka domain, başka hosting **yok**.
- Worker adı her zaman `ozgurluk-<APP>` (preview: `ozgurluk-<APP>-<mode>`).
- Kod `github.com/ozgurl-uk` altındadır; hesap/kaynak/servis başka bir yere bağlanmaz.

## 2. Saldırıda mali yansıma yok
- **Sadece statik dosya.** Worker kodu, binding (D1/KV/R2/AI/Queues...), trigger, `runWorkerFirst` yasak.
  Statik asset istekleri ücretsiz ve sınırsızdır; Worker çağrısı olmadığı için fatura oluşamaz.
- Hesap **Workers Free** planında kalır. Paid plana geçmek, R2/D1/KV/AI/Queues/Stream vb. eklemek,
  domain satın almak (Registrar) yasak. Gerekirse önce insan kararı, ayrı tartışma.
- CI token'ı sadece: Workers Scripts edit, Workers Routes edit, `ozgurl.uk` DNS edit. Billing/Registrar yetkisi yok.
- `bun run check` (= `tsc` + `vite build` + `.ozgurluk/guard.ts`) bu kuralları her build'de denetler. Guard'ı gevşetme.
- Backend gerekiyorsa Cloudflare'de değil, kendi sunucumuzda servis + tunnel ile çözülür (ayrı karar).

## 3. App kuralları
- HTML + CSS + TypeScript. Framework yok. Vite dev sunucusu ve paketleme içindir; dev tunnel'ı `.ozgurluk/dev-url.ts` kurar.
- **Void** (`voidPlugin`) sadece dev/deploy katmanıdır. `void/db`, `void/kv`, `void/storage`, `void/ai`, `routes/`, `pages/`, auth, cron, API **kullanılmaz**; `void.config.ts` değişmez.
- TypeScript `strict`; `bun run check` içinde `tsc` hatasız geçmeli. `any` sadece dış JSON sınırında.
- Paket yöneticisi ve script çalıştırıcı **Bun** (`bun install`, `bun run`, `bun .ozgurluk/*.ts`).
  Node **≥ 24.21** gerekir (Void şartı; `.nvmrc` var, `nvm use`). `cf` ve Vite Node üzerinde çalışır (Bun runtime'ı `cf` desteklemiyor); `--bun` bayrağı kullanma.
  npm/yarn/pnpm ve `package-lock.json` yok; kilit dosyası `bun.lock`.
- Üçüncü parti script, font, görsel, tracker, analytics, cookie yok. CSP (`public/_headers`) bunu tarayıcıda da zorlar.
- Kullanıcı verisi toplanmaz; hesaplamalar tarayıcıda yapılır. `localStorage` sadece kullanıcının kendi kolaylığı için.
- Türkçe, mobil öncelikli, erişilebilir (semantik HTML, kontrast, klavye), açık/koyu tema.
- **Çok sayfalı statik site (SEO öncelikli).** Her sayfa `<slug>/index.html` (ana sayfa kökte `index.html`) ve JS'siz okunabilen tam HTML'dir:
  içerik HTML'in içinde durur, JS sadece etkileşim ekler. Olmayan yol `404.html` ile gerçek **404** döner (SPA fallback yok).
- Sayfa sadece `<title>` ve `<meta name="description">` (en az 20 karakter) yazar; tek `<h1>`, `<main>`, `lang="tr"` zorunlu.
  Canonical, robots, paylaşım (og/twitter), favicon, tema rengi ve sürüm etiketlerini `.ozgurluk/pages.ts` ekler; elle yazma.
- Prod (`<APP>.ozgurl.uk`) `index,follow` + `sitemap.xml`; rc/dev/pr/local her zaman `noindex` + `Disallow: /`.
- Yeni sayfa: `<slug>/index.html` oluştur (slug küçük harf, ASCII, tireli) ve menüye ekle. Sayfalar otomatik bulunur.

## 4. Repo yapısı
```
version.txt          sürüm (tek kaynak; yayın adresi buradan türer)
package.json         "name" = app adı (APP)
APP.md               app'e özel amaç ve notlar
index.html, <slug>/index.html, 404.html, src/   app'in kendisi        public/   olduğu gibi kopyalananlar (favicon.svg, görseller)
.ozgurluk/           MİRAS, düzenleme: config.ts, vite.config.ts, void.config.ts, pages.ts, dev-url.ts, guard.ts, deploy.ts, tsconfig.json
vite.config.ts, void.config.ts, tsconfig.json   .ozgurluk/'a işaret eden tek satırlık dosyalar (miras)
public/_headers      güvenlik başlıkları / CSP (miras)
AGENTS.md, CLAUDE.md, CONTRIBUTING.md, .nvmrc, .gitignore, .github/pull_request_template.md   (miras)
.github/workflows/{preview,development,deploy,standart}.yml   kalıptaki merkezi iş akışlarını (_*.yml) çağıran ince dosyalar (miras)
```
- Değiştirdiğin yerler: `package.json` `name`, `description`, `homepage` (app'lerde zorunlu; kalıpta yok), `repository`, `bugs` (hepsi `name` ile tutarlı olmalı, guard denetler), `version.txt`, `CHANGELOG.md`, `APP.md`, `index.html`, `src/`, `public/` (`_headers` hariç).
- CI mantığı (build, guard, deploy) app'te değil **kalıpta, merkezi**dir (`ozgurl-uk/kalip/.github/workflows/_*.yml@main`); app'teki workflow dosyaları sadece onları çağırır. App'e `_*.yml` ve `.github/actions` kopyalanmaz.
- `standart` CI job'ı miras dosyaları kalıpla karşılaştırır; farklıysa PR kırmızı olur. Kural değişikliği kalıba PR ile gelir.

## 5. İş akışı
Ayrıntı `CONTRIBUTING.md`. Özet:
1. Branch'ler: `development` (varsayılan, entegrasyon) ve `main` (sürüm); ikisi de korumalı, değişiklik PR ile gelir.
2. `bun run dev` ile lokalde çalış (`https://<APP>-local.ozgurl.uk` otomatik açılır); PR'dan önce `bun run check`.
   Sadece lokal istersen `OZGURLUK_LOCAL=1 bun run dev`. Dev adresi herkese açıktır; gizli bir şey koyma.
3. İşi `development`'a PR ile getir → `<APP>-pr-<no>.ozgurl.uk` preview'ı; mobil + masaüstü kontrol et. PR kapanınca preview silinir.
4. Onay (owner/admin onay şartını atlayabilir, CI'ı atlayamaz) + squash merge (özellik PR'ları) → `<APP>-dev.ozgurl.uk` güncellenir.
5. **Sürüm:** `development` → `main` PR'ında `version.txt` artırılır (aynı sürüm iki kez yayınlanamaz) ve `CHANGELOG.md`'ye bölüm eklenir.
   Yeni app'in ilk sürümü `0.1.0` olur (prod'a çıkar); önce denemek için `0.1.0-rc.1` yazılır.
6. Sürüm PR'ı **merge commit** ile birleştirilir (squash değil). `main`'e merge → CI sürümü yayınlar, `vX.Y.Z` tag'i ve Release'i açar. Elle tag/deploy yok.
7. Lokalden deploy yok (`bun run deploy` sadece CI'da çalışır). Agent'lar PR'ı insan "merge" demeden birleştirmez.

## 6. Lisans
- Kalıp MIT. App'ler: kod **AGPL-3.0-only** (`LICENSE`), içerik **CC BY-SA 4.0** (`LICENSE-CONTENT`); `package.json` `license` = `AGPL-3.0-only`.
- Üçüncü parti kod/içerik/görsel ekleme (zaten yasak); lisansı belirsiz hiçbir şey repoya girmez.
- `guard.ts` lisans dosyalarının varlığını denetler. Lisans metinleri `.ozgurluk/licenses/` altında, miras.

## 7. cf CLI
- Komut: `cf cli search "<iş>"`; doküman: `cf docs search "<soru>"` (sorgulara isim/domain/ID yazma).
- Yazma işlemlerinden önce `--dry-run`.
