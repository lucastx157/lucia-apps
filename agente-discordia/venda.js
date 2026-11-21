(function () {
  var $ = function (id) { return document.getElementById(id); };
  var guarda = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  // De onde a pessoa veio: /live, /tiktok ou ?ref=...
  var caminho = location.pathname.replace(/\/+$/, "").split("/").pop();
  var ref = new URLSearchParams(location.search).get("ref") || (caminho === "live" || caminho === "tiktok" ? caminho : "");
  if (ref) guarda("dm_origem", ref.slice(0, 30));
  var origem = guarda("dm_origem") || "site";

  var fmt = function (n) { return Number(n).toLocaleString("pt-BR"); };
  function contar() {
    fetch("/api/lista?contar=1", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || typeof d.total !== "number") return;
      $("total").textContent = fmt(d.total);
      $("total-txt").textContent = d.total === 1 ? "pessoa já está na fila" : "pessoas já estão na fila";
    }).catch(function () {});
  }
  contar(); setInterval(contar, 20000);

  var fila = $("fila");
  function mostrarFeito(num, repetido) {
    $("meu-num").textContent = num ? "nº " + fmt(num) : "Na fila";
    if (repetido) $("feito-txt").textContent = "Esse WhatsApp já estava na fila. A sua vaga com preço de fundador continua garantida.";
    fila.classList.add("ok");
  }
  var salvo = guarda("dm_fila");
  if (salvo) mostrarFeito(Number(salvo), false);

  var msgs = {
    nome: "Escreva o seu nome.",
    whatsapp: "Confira o WhatsApp: DDD e número, só com algarismos.",
    nicho: "Diga qual é o seu nicho.",
    aceite: "Marque que aceita receber mensagens no WhatsApp.",
    limite: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
    falha: "Não consegui salvar agora. Tente de novo em instantes."
  };

  $("form-fila").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = ev.target, btn = $("enviar"), erro = $("erro");
    erro.textContent = "";
    var dados = {
      nome: f.nome.value, whatsapp: f.whatsapp.value, nicho: f.nicho.value,
      tiktok: f.tiktok.value, site: f.site.value, aceite: f.aceite.checked, origem: origem
    };
    if (dados.nome.trim().length < 2) { erro.textContent = msgs.nome; f.nome.focus(); return; }
    if (dados.whatsapp.replace(/\D/g, "").length < 10) { erro.textContent = msgs.whatsapp; f.whatsapp.focus(); return; }
    if (!dados.nicho.trim()) { erro.textContent = msgs.nicho; f.nicho.focus(); return; }
    if (!dados.aceite) { erro.textContent = msgs.aceite; return; }
    btn.disabled = true; btn.textContent = "Guardando a sua vaga…";
    fetch("/api/lista", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (x.ok && x.j.ok) {
          if (x.j.numero) guarda("dm_fila", String(x.j.numero));
          mostrarFeito(x.j.numero, x.j.repetido); contar();
          fila.scrollIntoView({ behavior: "smooth", block: "start" });
        } else { erro.textContent = msgs[x.j.code] || msgs.falha; }
      })
      .catch(function () { erro.textContent = msgs.falha; })
      .then(function () { btn.disabled = false; btn.textContent = "Garantir minha vaga"; });
  });

  if (location.hash === "#fila" || caminho === "live") setTimeout(function () { fila.scrollIntoView({ block: "start" }); }, 250);
})();
