<!-- --- INÍCIO: cálculo de frete via CEP + tabela 1..50km --- -->
<script>
// ---------- CONFIGURAÇÃO (troque para as coordenadas da SUA loja) ----------
const STORE_COORDS = { lat: -23.55052, lon: -46.633308 }; // EXEMPLO: São Paulo (troque aqui)
const BASE_FEE = 3.50;   // tarifa base (R$)
const PER_KM = 1.50;     // R$ por km
const FRETE_GRATIS_ACIMA = 120.00; // frete grátis acima desse total (R$)

// ---------- FUNÇÃO HAVERSINE (distância em km entre duas coordenadas) ----------
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = v => v * Math.PI / 180;
  const R = 6371; // raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ---------- GERAR TABELA DE TARIFAS (1..50 km) ----------
const tarifas = [];
for (let km=1; km<=50; km++){
  // Exemplo linear: base + per_km * km
  const valor = +(BASE_FEE + PER_KM * km).toFixed(2);
  tarifas.push({ km, valor });
}

// ---------- FUNÇÃO PARA GEOCODIFICAR CEP (Nominatim OpenStreetMap) ----------
async function geocodeCep(cep){
  // Remove tudo que não for número
  cep = (cep || '').replace(/\D/g,'');
  if(!cep || cep.length !== 8) return null;
  // Nominatim aceita postalcode + country
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${cep}&country=Brazil&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers:{ 'Accept':'application/json' }});
    const data = await res.json();
    if(data && data.length > 0){
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch(e){
    console.error("Erro geocoding:", e);
    return null;
  }
}

// ---------- FUNÇÃO PRINCIPAL: calcula e exibe frete a partir do CEP e total do pedido ----------
async function calcularFretePorCep(cep, totalPedido){
  const resultadoEl = document.getElementById('frete'); // elemento que exibe frete
  const tabelaEl = document.getElementById('tabela-tarifas'); // elemento oculto da tabela
  resultadoEl.innerText = "Calculando frete...";
  tabelaEl.style.display = 'none';

  // geocode
  const coords = await geocodeCep(cep);
  if(!coords){
    resultadoEl.innerText = "CEP não encontrado. Verifique e tente novamente.";
    return null;
  }

  // calcula distância (km)
  const distancia = haversineKm(STORE_COORDS.lat, STORE_COORDS.lon, coords.lat, coords.lon);
  const distanciaRounded = +(distancia.toFixed(2));

  // aplica regra frete grátis
  if(totalPedido >= FRETE_GRATIS_ACIMA){
    resultadoEl.innerHTML = `Distância: ${distanciaRounded} km — <strong>Frete: GRÁTIS</strong>`;
    // opcional: mostrar tabela e destacar linha
    montarTabelaMostrar(distanciaRounded);
    return { distancia: distanciaRounded, frete: 0 };
  }

  // busca tarifa mais apropriada na tabela (se distancia > 50, usa fórmula linear)
  let freteValor;
  if(distanciaRounded <= 50){
    // usa tabela exata para km inteiro (arredonda para cima)
    const kmInt = Math.max(1, Math.ceil(distanciaRounded));
    freteValor = tarifas[kmInt - 1].valor;
  } else {
    // se >50 km aplica fórmula linear (exemplo)
    freteValor = +(BASE_FEE + PER_KM * distanciaRounded).toFixed(2);
  }

  resultadoEl.innerHTML = `Distância: ${distanciaRounded} km — <strong>Frete: R$ ${freteValor.toFixed(2)}</strong>`;
  montarTabelaMostrar(distanciaRounded);
  return { distancia: distanciaRounded, frete: freteValor };
}

// ---------- monta tabela (oculta inicialmente) e mostra quando tiver CEP válido ----------
function montarTabelaMostrar(distanciaHighlight){
  const tabelaEl = document.getElementById('tabela-tarifas');
  tabelaEl.innerHTML = '';
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  tarifas.forEach(row => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #333';
    const tdKm = document.createElement('td');
    tdKm.style.padding = '6px';
    tdKm.innerText = `${row.km} km`;
    const tdVal = document.createElement('td');
    tdVal.style.padding = '6px';
    tdVal.innerText = `R$ ${row.valor.toFixed(2)}`;
    if(distanciaHighlight && row.km === Math.ceil(distanciaHighlight)){
      tr.style.background = '#222';
      tdKm.style.fontWeight = 'bold';
      tdVal.style.fontWeight = 'bold';
    }
    tr.appendChild(tdKm);
    tr.appendChild(tdVal);
    table.appendChild(tr);
  });
  tabelaEl.appendChild(table);
  tabelaEl.style.display = 'block';
}

// ---------- UTIL: chamada ligada a um botão no checkout ----------
async function calcularFreteBotao(){
  const cep = document.getElementById('cep').value || '';
  // pega total atual do pedido (se tiver campo total)
  const totalTexto = document.getElementById('total') ? document.getElementById('total').dataset.valor : null;
  const totalPedido = totalTexto ? parseFloat(totalTexto) : 0;
  await calcularFretePorCep(cep, totalPedido);
}

// Se quiser calcular automaticamente ao digitar (auto):
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-calcular-frete');
  if(btn) btn.onclick = calcularFreteBotao;
});
</script>
<!-- --- FIM cálculo de frete --- -->

