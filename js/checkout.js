<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Finalizar Pedido | Adega GS</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root{--bg:#0f0f0f;--card:#111;--accent:#25d366;--gold:#ffd700;--muted:#aaa}
  *{box-sizing:border-box}
  body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:#fff}
  header{background:#000;padding:14px 16px;text-align:center;position:sticky;top:0;z-index:5}
  header h2{margin:0;color:var(--gold)}
  .container{padding:16px;max-width:820px;margin:0 auto}
  .item{display:flex;justify-content:space-between;align-items:center;padding:10px;border-radius:8px;background:var(--card);margin-bottom:8px}
  .item strong{display:block}
  .total-box{margin-top:12px;padding:12px;border-radius:8px;background:#0b0b0b}
  label{display:block;margin-top:12px;color:var(--muted)}
  input,select,textarea{width:100%;padding:10px;margin-top:6px;border-radius:8px;border:1px solid #222;background:#0b0b0b;color:#fff}
  textarea{min-height:80px}
  .row{display:flex;gap:10px}
  .row > *{flex:1}
  .btn{display:inline-block;padding:12px;border-radius:10px;border:none;font-weight:bold;cursor:pointer}
  .btn-wpp{background:var(--accent);color:#000;width:100%;margin-top:12px}
  .btn-voltar{background:#444;color:#fff;width:100%;margin-top:8px}
  .small-muted{color:#999;font-size:13px;margin-top:6px}
  #tabela-tarifas{display:none;margin-top:12px;background:#0b0b0b;padding:10px;border-radius:8px;color:#fff;max-height:240px;overflow:auto}
  .note{font-size:13px;color:#bbb;margin-top:8px}
  .flex-between{display:flex;justify-content:space-between;align-items:center;gap:8px}
  .badge{background:#222;padding:6px 8px;border-radius:8px}
</style>
</head>
<body>
<header>
  <h2>🛒 Finalizar Pedido — Adega GS Oficial</h2>
</header>

<div class="container">
  <div id="lista"></div>

  <div class="total-box">
    <div class="flex-between">
      <div><strong id="total-text">Total: R$ 0,00</strong></div>
      <div class="badge">Itens: <span id="contador-itens">0</span></div>
    </div>

    <div id="frete" class="note"></div>
    <div id="tabela-tarifas"></div>
  </div>

  <h3 style="margin-top:14px">👤 Dados do cliente</h3>
  <input id="nome" placeholder="Nome completo" />
  <input id="endereco" placeholder="Endereço (Rua, número, complemento/opcional)" />
  <div class="row">
    <input id="cep" placeholder="CEP (00000-000)" />
    <input id="cpf" placeholder="CPF (opcional)" />
  </div>

  <label for="pagamento">💳 Forma de pagamento</label>
  <select id="pagamento">
    <option value="Pix">Pix</option>
    <option value="Débito">Débito</option>
    <option value="Crédito">Crédito</option>
  </select>

  <label for="cupom">Cupom de desconto (opcional)</label>
  <input id="cupom" placeholder="Insira o código (ex: CUPOM3)" />
  <div class="small-muted">Ex.: CUPOM3 = R$ 3,00 de desconto</div>

  <label for="obs">Observações (opcional)</label>
  <textarea id="obs" placeholder="Observações sobre o pedido, entrega, etc."></textarea>

  <div style="margin-top:12px;display:flex;gap:8px">
    <button id="btn-calcular-frete" class="btn" style="background:#333;color:#fff">Calcular frete (usar CEP)</button>
    <button id="btn-limpar-cupom" class="btn" style="background:#222;color:#fff">Limpar cupom</button>
  </div>

  <button class="btn btn-wpp" onclick="finalizar()">📲 Finalizar no WhatsApp</button>
  <button class="btn btn-voltar" onclick="voltar()">⬅ Continuar comprando</button>

  <div class="note">Frete grátis para pedidos a partir de <strong>R$ 120,00</strong>.</div>
</div>

<script>
/* ===================== CONFIGURAÇÃO =====================
 * Troque STORE_COORDS para as coordenadas da sua loja (latitude, longitude)
 * Exemplo: { lat: -23.55052, lon: -46.633308 }
 */
const STORE_COORDS = { lat: -23.55052, lon: -46.633308 }; // substitua se desejar
const BASE_FEE = 3.50;    // tarifa base R$
const PER_KM = 1.50;      // R$ por km para tabela linear
const FRETE_GRATIS_ACIMA = 120.00; // frete grátis acima deste total
const SAMPLE_COUPON = { code: "CUPOM3", discountValue: 3.00 }; // exemplo de cupom

/* ===================== UTILIDADES ===================== */
function toBRL(v){ return v.toFixed(2).replace('.',','); }

/* Haversine (km) */
function haversineKm(lat1, lon1, lat2, lon2){
  const toRad = v => v * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* Tabela 1..50 km (gera array) */
const tarifas = [];
for(let km=1; km<=50; km++){
  tarifas.push({ km, valor: +(BASE_FEE + PER_KM * km).toFixed(2) });
}

/* ===================== LER CARRINHO (localStorage) ===================== */
let pedido = JSON.parse(localStorage.getItem("pedido")) || []; // array de {nome, preco}

function renderPedido(){
  const lista = document.getElementById('lista');
  lista.innerHTML = '';
  let total = 0;
  pedido.forEach((p, idx) => {
    total += Number(p.preco || 0);
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<div>
        <strong>${p.nome}</strong>
        <div class="small-muted">R$ ${toBRL(Number(p.preco || 0))}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button onclick="removerItem(${idx})" class="btn" style="background:#aa2222;color:#fff;padding:6px 8px;border-radius:6px">Remover</button>
      </div>`;
    lista.appendChild(div);
  });

  const contador = document.getElementById('contador-itens');
  contador.innerText = pedido.length;

  // aplica cupom se houver
  let cupom = (document.getElementById('cupom') || {}).value || sessionStorage.getItem('cupom') || '';
  let desconto = 0;
  if(cupom && cupom.toUpperCase() === SAMPLE_COUPON.code) desconto = SAMPLE_COUPON.discountValue;

  // frete placeholder (até calcular)
  let freteInfo = JSON.parse(sessionStorage.getItem('freteInfo') || 'null');

  // total antes do frete
  let subtotal = total;
  // aplica desconto de cupom
  subtotal = Math.max(0, subtotal - desconto);

  // se freteInfo já calculado, use; senão mostre total sem frete
  let freteValor = (freteInfo && typeof freteInfo.frete === 'number') ? Number(freteInfo.frete) : 0;
  // se frete grátis por regra:
  if(subtotal >= FRETE_GRATIS_ACIMA) {
    freteValor = 0;
  }

  const totalFinal = subtotal + freteValor;

  // atualiza elemento total (data-valor para scripts externos)
  const elTotalText = document.getElementById('total-text');
  elTotalText.innerText = `Total: R$ ${toBRL(totalFinal)}`;
  elTotalText.dataset.valor = totalFinal.toFixed(2);

  // atualiza frete display (caso já calc)
  const freteEl = document.getElementById('frete');
  if(freteInfo && freteInfo.distancia != null){
    if(subtotal >= FRETE_GRATIS_ACIMA){
      freteEl.innerHTML = `Distância: ${freteInfo.distancia} km — <strong>Frete: GRÁTIS</strong>`;
    } else {
      freteEl.innerHTML = `Distância: ${freteInfo.distancia} km — <strong>Frete: R$ ${toBRL(freteValor)}</strong>`;
    }
  } else {
    freteEl.innerHTML = `Insira o CEP e clique em "Calcular frete" para ver o valor.`;
  }
}

function removerItem(i){
  pedido.splice(i,1);
  localStorage.setItem('pedido', JSON.stringify(pedido));
  sessionStorage.removeItem('freteInfo'); // recalcular frete se mudar itens
  renderPedido();
}

/* ===================== GEOCODING CEP (Nominatim) ===================== */
async function geocodeCep(cep){
  cep = (cep || '').replace(/\D/g,'');
  if(!cep || cep.length !== 8) return null;
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${cep}&country=Brazil&format=json&limit=1`;
  try{
    const res = await fetch(url, {headers:{'Accept':'application/json'}});
    const data = await res.json();
    if(data && data.length>0){
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  }catch(e){
    console.error("Erro geocode:", e);
    return null;
  }
}

/* ===================== CALCULAR FRETE ===================== */
function montarTabelaMostrar(distanciaHighlight){
  const tabelaEl = document.getElementById('tabela-tarifas');
  tabelaEl.innerHTML = '';
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  tarifas.forEach(row=>{
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #222';
    tr.style.padding = '6px';
    const td1 = document.createElement('td');
    td1.style.padding = '6px';
    td1.innerText = `${row.km} km`;
    const td2 = document.createElement('td');
    td2.style.padding = '6px';
    td2.innerText = `R$ ${toBRL(row.valor)}`;
    if(distanciaHighlight && row.km === Math.ceil(distanciaHighlight)){
      tr.style.background = '#111';
      td1.style.fontWeight = 'bold';
      td2.style.fontWeight = 'bold';
    }
    tr.appendChild(td1);
    tr.appendChild(td2);
    table.appendChild(tr);
  });
  tabelaEl.appendChild(table);
  tabelaEl.style.display = 'block';
}

async function calcularFretePorCep(cep){
  const totalData = parseFloat((document.getElementById('total-text') || {}).dataset.valor || '0');
  const resultadoEl = document.getElementById('frete');
  resultadoEl.innerText = 'Calculando frete...';
  document.getElementById('tabela-tarifas').style.display = 'none';

  const coords = await geocodeCep(cep);
  if(!coords){
    resultadoEl.innerText = 'CEP não encontrado. Verifique e tente novamente.';
    return;
  }

  const distancia = haversineKm(STORE_COORDS.lat, STORE_COORDS.lon, coords.lat, coords.lon);
  const distanciaRounded = +distancia.toFixed(2);

  // frete grátis por total (subtotal sem frete)
  // precisamos recomputar subtotal sem frete e sem desconto temporariamente:
  let subtotal = pedido.reduce((s,p)=> s + Number(p.preco || 0), 0);
  const cupomVal = (document.getElementById('cupom')||{}).value || sessionStorage.getItem('cupom') || '';
  let desconto = 0;
  if(cupomVal && cupomVal.toUpperCase() === SAMPLE_COUPON.code) desconto = SAMPLE_COUPON.discountValue;
  subtotal = Math.max(0, subtotal - desconto);

  if(subtotal >= FRETE_GRATIS_ACIMA){
    resultadoEl.innerHTML = `Distância: ${distanciaRounded} km — <strong>Frete: GRÁTIS</strong>`;
    montarTabelaMostrar(distanciaRounded);
    sessionStorage.setItem('freteInfo', JSON.stringify({ distancia: distanciaRounded, frete: 0 }));
    renderPedido();
    return;
  }

  // usa tabela para <=50 km
  let freteValor;
  if(distanciaRounded <= 50){
    const kmInt = Math.max(1, Math.ceil(distanciaRounded));
    freteValor = tarifas[kmInt - 1].valor;
  } else {
    freteValor = +(BASE_FEE + PER_KM * distanciaRounded).toFixed(2);
  }

  resultadoEl.innerHTML = `Distância: ${distanciaRounded} km — <strong>Frete: R$ ${toBRL(freteValor)}</strong>`;
  montarTabelaMostrar(distanciaRounded);
  sessionStorage.setItem('freteInfo', JSON.stringify({ distancia: distanciaRounded, frete: freteValor }));
  renderPedido();
}

/* ===================== AÇÕES DO CHECKOUT ===================== */
document.getElementById('btn-calcular-frete').addEventListener('click', async ()=>{
  const cep = document.getElementById('cep').value || '';
  if(!cep.replace(/\D/g,'')){
    alert('Digite um CEP válido (somente números).');
    return;
  }
  await calcularFretePorCep(cep);
});

document.getElementById('btn-limpar-cupom').addEventListener('click', ()=>{
  document.getElementById('cupom').value = '';
  sessionStorage.removeItem('cupom');
  renderPedido();
});

// auto salvar cupom em sessão
document.getElementById('cupom').addEventListener('change', (e)=>{
  const v = (e.target.value||'').trim().toUpperCase();
  if(v) sessionStorage.setItem('cupom', v);
  else sessionStorage.removeItem('cupom');
  renderPedido();
});

function voltar(){ window.location.href = 'index.html'; }

function validarCampos(){
  const nome = document.getElementById('nome').value.trim();
  const endereco = document.getElementById('endereco').value.trim();
  if(!nome) { alert('Informe o nome do cliente'); return false; }
  if(!endereco) { alert('Informe o endereço completo'); return false; }
  return true;
}

/* montar a mensagem e abrir WhatsApp */
function finalizar(){
  if(pedido.length === 0){ alert('Carrinho vazio. Adicione produtos antes de finalizar.'); return; }
  if(!validarCampos()) return;

  // recalc final total e frete
  const freteInfo = JSON.parse(sessionStorage.getItem('freteInfo') || 'null');
  let subtotal = pedido.reduce((s,p)=> s + Number(p.preco || 0), 0);
  const cupomVal = (document.getElementById('cupom')||{}).value || sessionStorage.getItem('cupom') || '';
  let desconto = 0;
  if(cupomVal && cupomVal.toUpperCase() === SAMPLE_COUPON.code) desconto = SAMPLE_COUPON.discountValue;
  subtotal = Math.max(0, subtotal - desconto);

  let freteValor = 0;
  if(freteInfo && typeof freteInfo.frete === 'number'){
    freteValor = Number(freteInfo.frete);
  }
  if(subtotal >= FRETE_GRATIS_ACIMA) freteValor = 0;

  const totalFinal = subtotal + freteValor;

  // montar texto
  const linhasItens = pedido.map(p => `- ${p.nome} — R$ ${toBRL(Number(p.preco||0))}`).join('%0A');
  const nome = encodeURIComponent(document.getElementById('nome').value.trim());
  const endereco = encodeURIComponent(document.getElementById('endereco').value.trim());
  const cep = encodeURIComponent(document.getElementById('cep').value.trim());
  const cpf = encodeURIComponent(document.getElementById('cpf').value.trim());
  const pagamento = encodeURIComponent(document.getElementById('pagamento').value);
  const obs = encodeURIComponent(document.getElementById('obs').value.trim());
  const cupomEnc = encodeURIComponent(cupomVal || '');

  let texto = `🛒 *Pedido Adega GS Oficial*%0A%0A`;
  texto += `${linhasItens}%0A%0A`;
  texto += `Subtotal: R$ ${toBRL(subtotal)}%0A`;
  texto += `Frete: R$ ${toBRL(freteValor)}%0A`;
  texto += `*Total: R$ ${toBRL(totalFinal)}*%0A%0A`;
  texto += `👤 Nome: ${nome}%0A`;
  texto += `📍 Endereço: ${endereco}%0A`;
  texto += `📮 CEP: ${cep}%0A`;
  texto += `🪪 CPF: ${cpf}%0A`;
  texto += `💳 Pagamento: ${pagamento}%0A`;
  if(cupomVal) texto += `🎟️ Cupom: ${cupomEnc}%0A`;
  if(obs) texto += `%0A📝 Observações:%0A${obs}%0A`;

  const waUrl = "https://wa.me/5511981654980?text=" + texto;
  // abrir WhatsApp
  window.open(waUrl);
}

/* ===================== INICIALIZAÇÃO ===================== */
document.addEventListener('DOMContentLoaded', ()=>{
  renderPedido();
  // Se houver CEP salvo e frete recalculado, tentar exibir
  const freteInfo = JSON.parse(sessionStorage.getItem('freteInfo') || 'null');
  if(freteInfo) {
    document.getElementById('frete').innerText = `Distância: ${freteInfo.distancia} km — Frete: R$ ${toBRL(Number(freteInfo.frete||0))}`;
  }
});
</script>
</body>
</html>
