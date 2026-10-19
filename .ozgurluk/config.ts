// Tek kaynak (miras, düzenleme): app adı package.json "name", sürüm version.txt.
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
export const APP = JSON.parse(readFileSync(new URL("package.json", root), "utf8")).name as string;
export const VERSION = readFileSync(new URL("version.txt", root), "utf8").trim();

// App adı adreslerin kökü: ASCII, küçük harf, tireli; adres soneklerıyla çakışmasın.
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(APP)) throw new Error(`package.json name geçersiz: "${APP}" (sadece a-z, 0-9 ve tek tire; Türkçe harf yok)`);
if (/-(dev|rc|local|pr-\d+)$/.test(APP)) throw new Error(`package.json name "-dev|-rc|-local|-pr-N" ile bitemez (adres çakışması): ${APP}`);

// Yayın hedefi sürümden gelir:
//   1.2.3               → <APP>.ozgurl.uk              (prod)
//   1.2.3-rc.1          → <APP>-rc.ozgurl.uk
// PR preview'ı için CI sadece PR_NUMBER verir → <APP>-pr-<no>.ozgurl.uk
// `development` branch'i için CI CHANNEL=dev verir → <APP>-dev.ozgurl.uk (sürümden bağımsız)
const pre = VERSION.match(/^\d+\.\d+\.\d+(?:-(rc)\.\d+)?$/);
if (!pre) throw new Error(`version.txt geçersiz: "${VERSION}" (X.Y.Z veya X.Y.Z-rc.N olmalı)`);
if (process.env.CHANNEL && process.env.CHANNEL !== "dev") throw new Error(`bilinmeyen CHANNEL: ${process.env.CHANNEL}`);
export const MODE: string | undefined = process.env.PR_NUMBER ? `pr-${process.env.PR_NUMBER}` : process.env.CHANNEL ?? pre[1];
export const SUFFIX = MODE ? `-${MODE}` : "";

// Kimlik değerleri tek yerde: alan adı, Worker/tunnel öneki ve yayın hedefleri.
export const DOMAIN = "ozgurl.uk";
export const PREFIX = "ozgurluk";
export const WORKER = `${PREFIX}-${APP}${SUFFIX}`;
export const HOST = `${APP}${SUFFIX}.${DOMAIN}`;

export const DEV_HOST = "127.0.0.1"; // IPv4 sabit: başka bir servisin aynı portta tunnel'a sızmasını engeller
export const DEV_PORT = 9999;

