"""Gera o catálogo de um cliente a partir do modelo.
Uso: python3 build.py pasta-do-cliente
A pasta precisa ter config.json, produtos.json e a pasta img/ (e vid/, se houver vídeos).
O resultado é pasta-do-cliente/index.html, pronto para publicar."""
import json, sys, html, os
pasta = sys.argv[1]
cfg = json.load(open(os.path.join(pasta, 'config.json'), encoding='utf-8'))
prods = json.load(open(os.path.join(pasta, 'produtos.json'), encoding='utf-8'))
tpl = open(os.path.join(os.path.dirname(__file__), 'template.html'), encoding='utf-8').read()
e = html.escape
TEMA = {'towel': 'f1', 'sheet': 'f2', 'sound': 'f3', 'beam': 'f4'}
ids = {str(p['id']) for p in prods}
def destaque(d):
    if str(d['id']) not in ids:
        prods.append({'id': d['id'], 'nome': d['titulo'], 'cat': d['categoria'], 'img': d['img']})
    claro = d['efeito'] == 'sheet'
    st_txt = ' style="color:#0a0a0a"' if claro else ''
    st_p = ' style="color:#222"' if claro else ''
    b1 = ' style="background:#0a0a0a;color:#fff;border-color:#0a0a0a"' if claro else ''
    b2 = ' style="color:#0a0a0a;border-color:#0a0a0a"' if claro else ''
    beat = ' id="beat"' if d['efeito'] == 'sound' else ''
    return f'''<section class="feat {TEMA[d['efeito']]}" data-fx="{d['efeito']}">
  <canvas></canvas>
  <div class="in wrap">
    <div class="pic"{beat}><img src="{e(d['img'])}" alt="{e(d['titulo'])}"></div>
    <div{st_txt}>
      <h3>{e(d['titulo'])}</h3>
      <p{st_p}>{e(d['texto'])}</p>
      <div class="acts"><button class="btn w"{b1} data-add="{e(str(d['id']))}">Adicionar ao pedido</button><button class="btn o"{b2} data-ask="{e(str(d['id']))}">Perguntar ao {e(cfg['nome_curto'])}</button></div>
    </div>
  </div>
</section>'''
out = tpl
for i, d in enumerate(cfg['destaques'][:4], 1):
    out = out.replace('{{DESTAQUE_%d}}' % i, destaque(d))
hist = '\n'.join(f'      <p>{e(p)}</p>' for p in cfg['historia'])
rep = {'{{HISTORIA}}': hist, '{{FOTO_HISTORIA}}': cfg['foto_historia'], '{{FONE}}': cfg['whatsapp'],
       '{{FONE_EXIBICAO}}': cfg['whatsapp_exibicao'], '{{NOME_CURTO}}': cfg['nome_curto'], '{{NOME}}': cfg['nome'],
       '{{SUBTITULO}}': cfg['subtitulo'], '{{CHAMADA}}': cfg['chamada'], '{{CHAVE}}': cfg['chave'],
       '{{CATEGORIAS}}': json.dumps(cfg['categorias'], ensure_ascii=False),
       '{{PRODUTOS}}': json.dumps(prods, ensure_ascii=False, separators=(',', ':'))}
for k, v in rep.items():
    out = out.replace(k, v)
assert '{{' not in out, 'Faltou preencher algum campo do config.json'
open(os.path.join(pasta, 'index.html'), 'w', encoding='utf-8').write(out)
print('Catálogo gerado:', os.path.join(pasta, 'index.html'), '-', len(prods), 'produtos')
