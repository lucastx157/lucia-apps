// Lista de espera do plano pago do Agente da Discórdia.
// Guarda cada inscrição num Blob privado (lista/<hash do WhatsApp>.json), sem duplicar pelo número.
// POST  /api/lista            -> inscreve { nome, whatsapp, nicho, tiktok, origem, aceite }
// GET   /api/lista?contar=1   -> { total }  (número público, para a contagem na página e na live)
// GET   /api/lista?chave=...  -> lista completa (painel do Lucas); &formato=csv baixa planilha
const crypto = require("crypto");
const { put, head, list, get } = require("@vercel/blob");

const LIMITE_IP_HORA = 8;
const usos = new Map();
let cacheTotal = { t: 0, n: 0 };

function responde(res, status, obj, extra) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (extra) for (const k in extra) res.setHeader(k, extra[k]);
  res.end(JSON.stringify(obj));
}
function lerCorpo(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((ok, erro) => {
    let s = ""; req.on("data", c => { s += c; if (s.length > 20000) { erro(new Error("grande")); req.destroy(); } });
    req.on("end", () => { try { ok(JSON.parse(s || "{}")); } catch (e) { erro(e); } });
  });
}
function limpa(v, max) { return String(v || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function contaIP(ip) {
  const h = new Date().toISOString().slice(0, 13), u = usos.get(ip);
  if (!u || u.h !== h) { usos.set(ip, { h, n: 1 }); return 1; }
  u.n += 1; return u.n;
}
async function todos() {
  const blobs = []; let cursor;
  do {
    const r = await list({ prefix: "lista/", cursor, limit: 1000 });
    blobs.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return blobs;
}
async function total() {
  if (Date.now() - cacheTotal.t < 20000) return cacheTotal.n;
  const n = (await todos()).length;
  cacheTotal = { t: Date.now(), n };
  return n;
}
async function lerBlob(pathname) {
  const r = await get(pathname, { access: "private" });
  if (!r || r.statusCode !== 200) return null;
  const txt = await new Response(r.stream).text();
  try { return JSON.parse(txt); } catch (e) { return null; }
}
function iguais(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return responde(res, 503, { code: "sem_banco" });
  const url = new URL(req.url, "https://x");

  if (req.method === "GET") {
    const chave = url.searchParams.get("chave");
    if (chave) {
      if (!process.env.LISTA_CHAVE || !iguais(chave, process.env.LISTA_CHAVE)) return responde(res, 401, { code: "chave" });
      const blobs = await todos();
      const itens = (await Promise.all(blobs.map(b => lerBlob(b.pathname)))).filter(Boolean)
        .sort((a, b) => String(a.data).localeCompare(String(b.data)));
      if (url.searchParams.get("formato") === "csv") {
        const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
        const linhas = [["Número", "Nome", "WhatsApp", "Nicho", "TikTok", "Origem", "Data"].map(q).join(";")]
          .concat(itens.map(i => [i.numero, i.nome, i.whatsapp, i.nicho, i.tiktok, i.origem, i.data].map(q).join(";")));
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="lista-agente-da-discordia.csv"');
        res.setHeader("Cache-Control", "no-store");
        return res.end("﻿" + linhas.join("\r\n"));
      }
      return responde(res, 200, { total: itens.length, itens });
    }
    return responde(res, 200, { total: await total() });
  }

  if (req.method !== "POST") return responde(res, 405, { code: "metodo" });
  const origem = req.headers.origin || "";
  if (origem && !/^https:\/\/agente-da-discordia[a-z0-9-]*\.vercel\.app$/.test(origem)) return responde(res, 403, { code: "origem" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (contaIP(ip) > LIMITE_IP_HORA) return responde(res, 429, { code: "limite" });

  let c;
  try { c = await lerCorpo(req); } catch (e) { return responde(res, 400, { code: "corpo" }); }
  if (c.site) return responde(res, 200, { ok: true, numero: 0 }); // campo isca contra robôs
  const nome = limpa(c.nome, 60);
  let zap = String(c.whatsapp || "").replace(/\D/g, "");
  if (zap.length === 10 || zap.length === 11) zap = "55" + zap;
  const nicho = limpa(c.nicho, 60);
  const tiktok = limpa(c.tiktok, 40).replace(/^@?/, c.tiktok ? "@" : "");
  const fonte = limpa(c.origem, 30) || "site";
  if (nome.length < 2) return responde(res, 400, { code: "nome" });
  if (!/^55\d{10,11}$/.test(zap)) return responde(res, 400, { code: "whatsapp" });
  if (!nicho) return responde(res, 400, { code: "nicho" });
  if (c.aceite !== true) return responde(res, 400, { code: "aceite" });

  const caminho = "lista/" + crypto.createHash("sha256").update(zap).digest("hex").slice(0, 32) + ".json";
  try {
    const existe = await head(caminho).catch(() => null);
    if (existe) {
      const antigo = await lerBlob(caminho);
      return responde(res, 200, { ok: true, repetido: true, numero: antigo && antigo.numero || null });
    }
    const numero = (await total()) + 1;
    const item = { numero, nome, whatsapp: zap, nicho, tiktok, origem: fonte, data: new Date().toISOString() };
    await put(caminho, JSON.stringify(item), { access: "private", contentType: "application/json", addRandomSuffix: false });
    cacheTotal = { t: Date.now(), n: numero };
    return responde(res, 200, { ok: true, numero });
  } catch (e) {
    console.error("lista", e && e.message);
    return responde(res, 500, { code: "falha" });
  }
};
