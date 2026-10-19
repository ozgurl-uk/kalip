# Katkı rehberi

## Akış
Branch'ler: **`development`** (varsayılan, entegrasyon) ve **`main`** (sürüm). İkisi de korumalı, doğrudan push kapalı.

1. `development`'tan branch aç: `feat/kisa-ad`, `fix/kisa-ad`, `docs/kisa-ad`.
2. Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/tr/): `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`.
3. `development`'a PR aç. CI `bun run check` çalıştırır ve `<APP>-pr-<no>.ozgurl.uk` preview'ını yayınlar.
4. En az 1 onay + yeşil CI → **squash merge** (özellik PR'ları). Merge olunca `<APP>-dev.ozgurl.uk` güncellenir (sürümden bağımsız, tag yok).
   Repo owner'ı ve admin'ler onay şartını atlayıp kendi PR'ını merge edebilir; **CI yeşil olmak zorundadır**, kimse atlayamaz.
5. **Sürüm çıkarmak için** `development` → `main` PR'ı aç. Bu PR'da **`version.txt`'i artır** ([SemVer](https://semver.org/lang/tr/)) ve `CHANGELOG.md`'ye bir bölüm ekle (aynı sürüm iki kez yayınlanamaz; tag varsa PR kırmızı olur).
6. Sürüm PR'ını (`development` → `main`) **merge commit** ile birleştir, squash yapma: squash `development`'ı `main`'den ayrıştırır, sonraki sürüm PR'ında çakışma çıkar.
   `main`'e merge olunca CI otomatik yayınlar: `version.txt`'deki sürüm deploy edilir, `vX.Y.Z` tag'i ve GitHub Release açılır.

## Sürüm → adres
| `version.txt` | Adres | Release |
|---|---|---|
| `1.2.3` | `<APP>.ozgurl.uk` | normal |
| `1.2.3-rc.1` | `<APP>-rc.ozgurl.uk` | pre-release |

Aynı sürüm iki kez yayınlanamaz: tag zaten varsa PR kırmızı olur. Yeni app'in ilk sürümü `0.1.0`'dır (doğrudan `<APP>.ozgurl.uk`); önce denemek istersen `0.1.0-rc.1` ile merge et.

## Lisans
Katkın, reponun lisansı altında yayınlanır: kod için `LICENSE`, içerik için `LICENSE-CONTENT` (app'lerde AGPL-3.0 ve CC BY-SA 4.0; kalıpta MIT).

## Standart
`AGENTS.md`'deki kurallar herkes için geçerlidir: HTML + CSS + TypeScript, üçüncü parti yok, veri toplama yok.
