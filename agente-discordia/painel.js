(function () {
  var $ = function (id) { return document.getElementById(id); };
  var chave = "";
  try { chave = sessionStorage.getItem("dm_painel") || ""; } catch (e) {}
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function carregar() {
    $("erro").textContent = "";
    fetch("/api/lista?chave=" + encodeURIComponent(chave), { cache: "no-store" }).then(function (r) {
      if (r.status === 401) throw new Error("Senha errada.");
      if (!r.ok) throw new Error("Não consegui carregar agora.");
      return r.json();
    }).then(function (d) {
      try { sessionStorage.setItem("dm_painel", chave); } catch (e) {}
      $("entrar").style.display = "none"; $("area").style.display = "block";
      $("csv").href = "/api/lista?formato=csv&chave=" + encodeURIComponent(chave);
      var porOrigem = {}, hoje = new Date().toISOString().slice(0, 10), deHoje = 0;
      d.itens.forEach(function (i) { porOrigem[i.origem] = (porOrigem[i.origem] || 0) + 1; if (String(i.data).slice(0, 10) === hoje) deHoje++; });
      var cards = [["Total na fila", d.total], ["Entraram hoje", deHoje]];
      Object.keys(porOrigem).sort(function (a, b) { return porOrigem[b] - porOrigem[a]; }).forEach(function (o) { cards.push(["Vieram de: " + o, porOrigem[o]]); });
      $("cards").innerHTML = cards.map(function (c) { return '<div class="card"><b>' + esc(c[1]) + "</b><span>" + esc(c[0]) + "</span></div>"; }).join("");
      $("lista").innerHTML = d.itens.slice().reverse().map(function (i) {
        var msg = encodeURIComponent("Olá, " + i.nome + "! Aqui é o Lucas, do Agente da Discórdia. Você está na fila do plano pago (nº " + i.numero + ").");
        var dt = new Date(i.data).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        return '<div class="item"><div><b>nº ' + esc(i.numero) + " · " + esc(i.nome) + "</b><small>" + esc(i.nicho) + (i.tiktok ? " · " + esc(i.tiktok) : "") + " · veio de " + esc(i.origem) + " · " + esc(dt) + '</small></div><a href="https://wa.me/' + esc(i.whatsapp) + "?text=" + msg + '" target="_blank" rel="noopener">WhatsApp</a></div>';
      }).join("") || "<p>Ninguém na fila ainda.</p>";
    }).catch(function (e) {
      $("entrar").style.display = "block"; $("area").style.display = "none"; $("erro").textContent = e.message;
    });
  }
  $("entrar").addEventListener("submit", function (ev) { ev.preventDefault(); chave = $("chave").value.trim(); carregar(); });
  $("atualizar").addEventListener("click", carregar);
  if (chave) carregar();
})();
