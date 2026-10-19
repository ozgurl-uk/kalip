// Sadece CI'da çalışır: önce check (aynı ortamda build + guard), sonra yayın.
// Lokalden deploy yok; yayın PR (preview) ve main'e merge (sürüm) ile CI'dan çıkar.
if (!process.env.CI) {
  console.error("deploy sadece CI'da çalışır (lokalden deploy yok). PR aç; CI yayınlar.");
  process.exit(1);
}
for (const cmd of [["bun", "run", "check"], ["bunx", "void", "deploy", "--platform", "cloudflare", "--dir", "dist/client"]]) {
  const p = Bun.spawnSync(cmd, { stdio: ["inherit", "inherit", "inherit"] });
  if (p.exitCode !== 0) process.exit(p.exitCode ?? 1);
}
