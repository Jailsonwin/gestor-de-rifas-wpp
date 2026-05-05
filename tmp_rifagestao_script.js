
const animals = [
  ["🦤","Avestruz"],["🦅","Águia"],["🫏","Burro"],["🦋","Borboleta"],["🦮","Cachorro"],
  ["🐐","Cabra"],["🐏","Carneiro"],["🐫","Camelo"],["🐍","Cobra"],["🐇","Coelho"],
  ["🐴","Cavalo"],["🐘","Elefante"],["🐓","Galo"],["🐈","Gato"],["🐊","Jacaré"],
  ["🦁","Leão"],["🐒","Macaco"],["🐷","Porco"],["🦚","Pavão"],["🦃","Peru"],
  ["🐂","Touro"],["🐅","Tigre"],["🐻","Urso"],["🦌","Veado"],["🐮","Vaca"]
];

const defaultHeader = `292 - RIFA JP FISHING BRASIL VIP*

▪︎ PRÊMIO

1 LUGAR UMA DAS OPÇÕES 👇🏻
✅VARA CAPTURE 7' 30LB 5 PARTES
✅ALDEBARAN DC 2025
✅METANIUM DC 2024
✅PIX 1900,00

2 LUGAR UMA DAS OPÇÕES 👇🏻
✅BOLSA DRESS M IMPERMEÁVEL
✅PIX 500,00

3 LUGAR UMA DAS OPÇÕES 👇🏻
✅FACA SHIMANO

💰VALOR POR COTA R$ 178,00
💰2 COTAS R$ 320,00

👉🏻 APENAS 25 números

✅PIX
Pix/Email: jpfishingbrasil@gmail.com

🚨 SORTEIO PELO JOGO DO BICHO DE RIO DE JANEIRO
🚨 PAGAMENTO IMEDIATO
🚨 ENVIAR O COMPROVANTE DO PAGAMENTO NO GRUPO`;

const defaultRifaDaRifaHeader = `🔥 RIFA DA RIFA 🔥

Valendo {{quantidadeNumerosSorteados}} números da rifa principal número {{numeroRifaPrincipal}}.

Valor da cota original: R$ {{valorCotaOriginal}}
Valor de cada número da rifa da rifa: R$ {{valorCalculado}}

Apenas {{quantidadeNumeros}} números.`;

const emptyMainRaffle = (type) => ({
  id: crypto.randomUUID(),
  type,
  createdAt: new Date().toISOString(),
  finishedAt: null,
  numeroRifa: "",
  numWinners: 3,
  header: defaultHeader,
  numbers: Array.from({length:25},(_,i)=>({number:i+1,animal:animals[i][1],emoji:animals[i][0],buyer:"",paid:false})),
  values:{oneQuota:178,twoQuotaPromo:320},
  winners:[],
  winnerNumbers:{w1:"",w2:"",w3:""},
  history:[],
  finalMessage:"",
  lastWinnerMessage:"",
  resultTemplates: getDefaultResultTemplates(),
  lastSavedAt:null,
  hasUnsavedChanges:true,
  payWholeBuyer:false
});

const emptyRifaDaRifa = () => ({
  id: crypto.randomUUID(),
  type:"rifaDaRifa",
  createdAt: new Date().toISOString(),
  finishedAt:null,
  numeroRifaReferencia: "",
  header: defaultRifaDaRifaHeader,
  numeroRifaPrincipal:"",
  valorCotaOriginal:100,
  quantidadeNumeros:5,
  numbers:Array.from({length:5},(_,i)=>({number:i+1,buyer:"",paid:false})),
  winners:[],
  winnerNumbers:{w1:"",w2:"",w3:""},
  history:[],
  finalMessage:"",
  lastWinnerMessage:"",
  resultTemplates: getDefaultResultTemplates(),
  lastSavedAt:null,
  hasUnsavedChanges:true,
  payWholeBuyer:false
});

let state = loadState();
let current = "premium";

function loadState(){
  const saved = localStorage.getItem("rifas_whatsapp_app_v1");
  if(saved){
    const s = JSON.parse(saved);
    ["premium","vip2"].forEach(k=>{ if(s[k]){ s[k].numeroRifa=s[k].numeroRifa||""; s[k].winnerNumbers=s[k].winnerNumbers||{w1:"",w2:"",w3:""}; s[k].resultTemplates = s[k].resultTemplates || getDefaultResultTemplates(); }});
    if(s.rifaDaRifa){ s.rifaDaRifa.numeroRifaReferencia=s.rifaDaRifa.numeroRifaReferencia||""; s.rifaDaRifa.winnerNumbers=s.rifaDaRifa.winnerNumbers||{w1:"",w2:"",w3:""}; s.rifaDaRifa.resultTemplates = s.rifaDaRifa.resultTemplates || getDefaultResultTemplates(); }
    return s;
  }
  return {premium:emptyMainRaffle("premium"), vip2:emptyMainRaffle("vip2"), rifaDaRifa:emptyRifaDaRifa(), savedRaffles:[]};
}
function persist(){ localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state)); render(); }
function active(){ return state[current]; }
function toast(msg){
  const el=document.getElementById("toast");
  el.textContent=msg;
  el.style.display="block";
  el.style.animation='none';
  el.offsetHeight; // reflow
  el.style.animation='slideIn 0.25s ease';
  setTimeout(()=>el.style.display="none",2400);
}
function logAction(type, detail="", message=""){
  active().history.unshift({date:new Date().toLocaleDateString("pt-BR"), time:new Date().toLocaleTimeString("pt-BR"), type, detail, message});
}
function markDirty(){ active().hasUnsavedChanges = true; }
function savedStatusHtml(r){
  if(r.lastSavedAt && !r.hasUnsavedChanges) return '<span class="saved-status saved">✓ Salva</span>';
  if(r.lastSavedAt && r.hasUnsavedChanges) return '<span class="saved-status dirty">⚠ Alterações pendentes</span>';
  return '<span class="saved-status dirty">⚠ Não salva</span>';
}
function bulkPayControlHtml(){
  const checked = active().payWholeBuyer ? 'checked' : '';
  return `<div class="bulk-pay-control" title="Ao marcar um número como pago, todos os números do mesmo comprador são pagos juntos.">
    <span>Pagar comprador inteiro</span>
    <label class="switch"><input type="checkbox" ${checked} onchange="togglePayWholeBuyer(this.checked)"><span class="slider"></span></label>
  </div>`;
}
function setTab(tab){ 
  current=tab; 
  document.body.className = tab === 'vip2' ? 'vip' : tab === 'premium' ? 'premium' : '';
  render(); 
}
function closeModal(){ document.getElementById("modal").close(); }
function openModal(title, body, options = {}){
  document.getElementById("modalTitle").textContent=title;
  document.getElementById("modalBody").innerHTML=body;
  document.getElementById("modalConfigBtn").style.display = options.config ? "inline-flex" : "none";
  document.getElementById("modalCopyBtn").style.display = options.copy ? "inline-flex" : "none";
  document.getElementById("modal").showModal();
}

function copyModalResult(){
  const resultEl = document.getElementById("winnerResult");
  const msg = (resultEl && resultEl.textContent.trim()) || active().lastWinnerMessage || "";
  if(!msg){ toast("Nenhum resultado para copiar ⚠️"); return; }
  navigator.clipboard.writeText(msg);
  toast("Resultado copiado ✅");
}

function getDefaultResultTemplates(){
  return {
    vacant: `🏆 RESULTADO DA RIFA\n\n🔢 Número sorteado: {{numero}}\n❌ Este número não possui comprador.\n\nA rifa vai para o próximo sorteio.`,
    partial: `🏆 RESULTADO DA RIFA\n\n🎯 Número sorteado: {{numero}}\nGanhador: {{buyer}}{{paid}}\n\n⚠️ Ainda existem {{vagos}} número(s) vagos nesta rifa.\n\n{{buyer}}, você deseja:\n1️⃣ Comprar os números vagos e garantir o prêmio?\n2️⃣ Aguardar o próximo sorteio?`,
    normal: `🏆 RESULTADO DA RIFA\n\n{{winners}}\nParabéns aos ganhadores! 🎉`
  };
}

function openResultTemplatesModal(){
  const r = active();
  const t = r.resultTemplates || getDefaultResultTemplates();
  openModal("Templates de resultado", `
    <p class="small" style="margin-bottom:12px">Personalize a mensagem de cada cenário de resultado. Use <strong>{{numeroRifa}}</strong>, <strong>{{numeroRifaReferencia}}</strong>, <strong>{{numeroRifaPrincipal}}</strong>, <strong>{{numero}}</strong>, <strong>{{buyer}}</strong>, <strong>{{paid}}</strong>, <strong>{{vagos}}</strong> e <strong>{{winners}}</strong>.</p>
    <h3 style="margin-bottom:6px">1) Primeiro número vazio</h3>
    <textarea id="templateVacant" style="min-height:120px">${escapeHtml(t.vacant)}</textarea>
    <h3 style="margin:18px 0 6px">2) Ganhador com números vagos</h3>
    <textarea id="templatePartial" style="min-height:120px">${escapeHtml(t.partial)}</textarea>
    <h3 style="margin:18px 0 6px">3) Todos vendidos / resultado normal</h3>
    <textarea id="templateNormal" style="min-height:120px">${escapeHtml(t.normal)}</textarea>
    <div class="actions" style="margin-top:18px"><button class="green" onclick="saveResultTemplates()">Salvar templates</button><button onclick="closeModal()">Cancelar</button></div>
  `);
}

function saveResultTemplates(){
  const r = active();
  r.resultTemplates = {
    vacant: document.getElementById("templateVacant").value,
    partial: document.getElementById("templatePartial").value,
    normal: document.getElementById("templateNormal").value
  };
  markDirty();
  localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state));
  toast("Templates salvos ✅");
  closeModal();
}

function formatResultTemplate(template, ctx){
  return String(template || "")
    .replaceAll("{{numeroRifa}}", ctx.numeroRifa || "")
    .replaceAll("{{numeroRifaReferencia}}", ctx.numeroRifaReferencia || "")
    .replaceAll("{{numeroRifaPrincipal}}", ctx.numeroRifaPrincipal || "")
    .replaceAll("{{numero}}", ctx.numero || "")
    .replaceAll("{{buyer}}", ctx.buyer || "")
    .replaceAll("{{paid}}", ctx.paid || "")
    .replaceAll("{{vagos}}", String(ctx.vagos || ""))
    .replaceAll("{{winners}}", ctx.winners || "")
    .replaceAll("{{animal}}", ctx.animal || "")
    .replaceAll("{{emoji}}", ctx.emoji || "");
}

function summaryCardsHtml(){
  const r = active();
  const filled = countFilled();
  const total = r.numbers.length;
  const paid = r.numbers.filter(n=>n.buyer.trim()&&n.paid).length;
  const pending = r.numbers.filter(n=>n.buyer.trim()&&!n.paid).length;
  const pct = Math.round((filled/total)*100);
  return `
    <div class="summary-row">
      <div class="summary-card"><div class="summary-card-label">Preenchidos</div><div class="summary-card-value orange">${filled}<span style="font-size:13px;color:var(--txt-muted)">/${total}</span></div></div>
      <div class="summary-card"><div class="summary-card-label">Pagos</div><div class="summary-card-value green">${paid}</div></div>
      <div class="summary-card"><div class="summary-card-label">Pendentes</div><div class="summary-card-value dim">${pending}</div></div>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}

function render(){
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
  const btn=document.getElementById("tab-"+current); if(btn) btn.classList.add("active");
  current==="rifaDaRifa" ? renderRifaDaRifa() : renderMainRaffle();
  document.getElementById("preview").textContent = generateMessage();
}

function renderMainRaffle(){
  const r=active();
  const canWin = countFilled()>=20;
  document.getElementById("main").innerHTML = `
    <h2>${current==="premium"?"Rifa Premium":"Rifa VIP 2"} ${savedStatusHtml(r)}</h2>
    ${summaryCardsHtml()}
    <label>Número da rifa</label>
    <input placeholder="Ex: 292" value="${escapeAttr(r.numeroRifa||'')}" oninput="updateNumeroRifa(this.value)">
    <label>Número de vencedores</label>
    <select onchange="updateNumWinners(this.value)">
      <option value="1" ${r.numWinners==1?'selected':''}>1 vencedor</option>
      <option value="2" ${r.numWinners==2?'selected':''}>2 vencedores</option>
      <option value="3" ${r.numWinners==3?'selected':''}>3 vencedores</option>
    </select>
    <label>Cabeçalho editável <span style="font-weight:400;color:var(--txt-dim);font-size:10px;text-transform:none">use {{numeroRifa}} para inserir o número acima</span></label>
    <textarea oninput="updateHeader(this.value)">${escapeHtml(r.header)}</textarea>
    <div class="actions">
      <button class="primary mobile-copy" onclick="copyMessage()">📋 Copiar</button>
      <button onclick="showHistory()">🕐 Histórico</button>
      <button id="btnWinnersMain" class="green" ${canWin?"":"disabled"} onclick="showWinners()">🏆 Ganhadores</button>
      <button class="yellow" onclick="showValues()">💰 Valores</button>
      <button class="green" onclick="saveRaffle()">💾 Salvar</button>
      ${bulkPayControlHtml()}
    </div>
    <table>
      <thead><tr><th>Nº</th><th>Animal</th><th>Comprador</th><th class="paid-cell">Pago</th></tr></thead>
      <tbody>
        ${r.numbers.map((n,i)=>`
          <tr class="${n.paid?'row-paid':'row-pending'}">
            <td><span class="num-badge">${n.number}</span></td>
            <td><div class="animal"><span>${n.emoji}</span><span class="animal-name">${n.animal}</span></div></td>
            <td><div class="buyer-wrap"><input placeholder="Nome do comprador" value="${escapeAttr(n.buyer)}" autocomplete="off" oninput="updateBuyer(${i},this.value); showBuyerSuggestions(${i}, this)" onfocus="onBuyerFocus(${i}, this)" onkeydown="handleBuyerKeydown(event, ${i}, this)" onblur="hideBuyerSuggestionsLater(this); finalizeBuyer(${i}, this)"><div class="buyer-suggest"></div></div></td>
            <td class="paid-cell"><label class="switch"><input type="checkbox" ${n.paid?"checked":""} onchange="handlePaidToggle(${i},this.checked)"><span class="slider"></span></label></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function renderRifaDaRifa(){
  const r=active();
  ensureRifaDaRifaCount();
  document.getElementById("main").innerHTML = `
    <h2>Rifa da Rifa ${savedStatusHtml(r)}</h2>
    ${summaryCardsHtml()}
    <label>Número da rifa de referência <span style="font-weight:400;color:var(--txt-dim);font-size:10px;text-transform:none">(rifa da qual esta é derivada)</span></label>
    <input placeholder="Ex: 292" value="${escapeAttr(r.numeroRifaReferencia||'')}" oninput="updateNumeroRifaReferencia(this.value)">
    <div class="two" style="margin-top:4px">
      <div><label>Número da rifa principal <span style="font-weight:400;color:var(--txt-dim);font-size:10px;text-transform:none">use {{numeroRifaPrincipal}} no cabeçalho</span></label><input value="${escapeAttr(r.numeroRifaPrincipal)}" oninput="updateField('numeroRifaPrincipal',this.value)"></div>
      <div><label>Valor da cota original</label><input type="number" step="0.01" value="${r.valorCotaOriginal}" oninput="updateField('valorCotaOriginal',Number(this.value))"></div>
    </div>
    <label>Quantidade de números</label>
    <select onchange="changeRifaDaRifaCount(Number(this.value))">
      <option value="5" ${r.quantidadeNumeros==5?"selected":""}>5 números — sorteia 2 números principais</option>
      <option value="10" ${r.quantidadeNumeros==10?"selected":""}>10 números — sorteia 4 números principais</option>
    </select>
    <div style="margin-top:10px"><span class="pill orange">Valor por número: R$ ${money(calcRifaDaRifaValue())}</span></div>
    <label>Cabeçalho editável com variáveis</label>
    <textarea oninput="updateHeader(this.value)">${escapeHtml(r.header)}</textarea>
    <div class="actions">
      <button class="primary mobile-copy" onclick="copyMessage()">📋 Copiar</button>
      <button onclick="showHistory()">🕐 Histórico</button>
      <button class="green" onclick="showWinners()">🏆 Ganhadores</button>
      <button class="yellow" onclick="showValues()">💰 Valores</button>
      <button class="green" onclick="saveRaffle()">💾 Salvar</button>
      ${bulkPayControlHtml()}
    </div>
    <table>
      <thead><tr><th>Nº</th><th>Comprador</th><th class="paid-cell">Pago</th></tr></thead>
      <tbody>
        ${r.numbers.map((n,i)=>`
          <tr class="${n.paid?'row-paid':'row-pending'}">
            <td><span class="num-badge">${n.number}</span></td>
            <td><div class="buyer-wrap"><input placeholder="Nome do comprador" value="${escapeAttr(n.buyer)}" autocomplete="off" oninput="updateBuyer(${i},this.value); showBuyerSuggestions(${i}, this)" onfocus="onBuyerFocus(${i}, this)" onkeydown="handleBuyerKeydown(event, ${i}, this)" onblur="hideBuyerSuggestionsLater(this); finalizeBuyer(${i}, this)"><div class="buyer-suggest"></div></div></td>
            <td class="paid-cell"><label class="switch"><input type="checkbox" ${n.paid?"checked":""} onchange="handlePaidToggle(${i},this.checked)"><span class="slider"></span></label></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function updateHeader(v){ active().header=v; markDirty(); logAction("Atualização","Cabeçalho alterado"); localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state)); document.getElementById("preview").textContent=generateMessage(); updateSavedBadgeOnly(); }
function updateBuyer(i,v){ active().numbers[i].buyer=v; markDirty(); localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state)); document.getElementById("preview").textContent=generateMessage(); updateSavedBadgeOnly(); updateWinnerButtonOnly(); }

function onBuyerFocus(i,input){ input.dataset.originalBuyer = input.value || ""; showBuyerSuggestions(i, input); }
function finalizeBuyer(i,input){ const original = input.dataset.originalBuyer || ""; const current = input.value || ""; if(original !== current){ logAction("Atualização", `Número ${i+1}: comprador alterado de "${original}" para "${current}"`); localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state)); } }

function existingBuyers(exceptIndex){
  const seen = new Set();
  return active().numbers
    .map((n,idx)=>({idx, name:(n.buyer || "").trim()}))
    .filter(x => x.name && x.idx !== exceptIndex)
    .filter(x => { const k=x.name.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; })
    .map(x=>x.name);
}
function showBuyerSuggestions(i, input){
  const box = input.parentElement.querySelector('.buyer-suggest');
  const q = (input.value || '').trim().toLowerCase();
  const buyers = existingBuyers(i).filter(name => !q || name.toLowerCase().includes(q)).slice(0,5);
  if(!buyers.length){ box.style.display='none'; box.innerHTML=''; return; }
  box.innerHTML = buyers.map((name,idx)=>'<button type="button" class="'+(idx===0?'active':'')+'" onmousedown="selectBuyerSuggestion('+i+', \''+encodeURIComponent(name)+'\', this)">'+escapeHtml(name)+'</button>').join('');
  box.style.display='block';
}
function selectBuyerSuggestion(i, encodedName, el){
  const name = decodeURIComponent(encodedName.trim());
  const wrap = el.closest('.buyer-wrap');
  const input = wrap.querySelector('input');
  input.value = name;
  updateBuyer(i, name);
  wrap.querySelector('.buyer-suggest').style.display='none';
  input.focus();
}
function handleBuyerKeydown(ev, i, input){
  if(ev.key !== 'Tab') return;
  const box = input.parentElement.querySelector('.buyer-suggest');
  const first = box && box.querySelector('button');
  if(first && box.style.display !== 'none'){
    ev.preventDefault();
    first.dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
  }
}
function hideBuyerSuggestionsLater(input){
  setTimeout(()=>{ const box = input.parentElement && input.parentElement.querySelector('.buyer-suggest'); if(box) box.style.display='none'; },150);
}
function togglePayWholeBuyer(v){ active().payWholeBuyer = v; markDirty(); logAction("Configuração", `Pagar comprador inteiro ${v ? "ativado" : "desativado"}`); persist(); }
function handlePaidToggle(i,v){
  const r = active();
  const item = r.numbers[i];
  const buyer = (item.buyer || "").trim();
  if(v && r.payWholeBuyer && buyer){
    const buyerNumbers = r.numbers.filter(n => (n.buyer || "").trim().toLowerCase() === buyer.toLowerCase());
    if(buyerNumbers.length > 1){ showBulkPayConfirm(buyer, buyerNumbers); render(); return; }
  }
  updatePaid(i,v);
}
function showBulkPayConfirm(buyer, buyerNumbers){
  const summary = getBuyerSummary().find(b => b.buyer.trim().toLowerCase() === buyer.toLowerCase());
  const nums = buyerNumbers.map(n => n.number).join(", ");
  const total = summary ? summary.total : 0;
  const alreadyPaid = buyerNumbers.filter(n => n.paid).map(n => n.number);
  const pending = buyerNumbers.filter(n => !n.paid).map(n => n.number);
  const safeBuyer = encodeURIComponent(buyer);
  openModal("Confirmar pagamento do comprador", `
    <p style="margin-bottom:14px">O comprador <strong>${escapeHtml(buyer)}</strong> possui <strong>${buyerNumbers.length}</strong> número(s) nesta rifa.</p>
    <div class="message-box">Números: ${escapeHtml(nums)}${alreadyPaid.length ? `<br>Já pagos: ${escapeHtml(alreadyPaid.join(", "))}` : ""}${pending.length ? `<br>Pendentes: ${escapeHtml(pending.join(", "))}` : ""}<br>Valor total: <strong>R$ ${money(total)}</strong><br>Pendente agora: <strong>R$ ${money(summary ? summary.pendingValue : 0)}</strong></div>
    <p class="small" style="margin-top:10px">Apenas os números pendentes serão ativados; os já pagos permanecem.</p>
    <div class="actions"><button class="green" onclick="confirmBulkPay('${safeBuyer}')">Confirmar pagamento de todos</button><button onclick="closeModal(); render();">Cancelar</button></div>
  `);
}
function confirmBulkPay(encodedBuyer){
  const buyer = decodeURIComponent(encodedBuyer);
  const key = buyer.trim().toLowerCase();
  const changed = [];
  active().numbers.forEach(n => { if((n.buyer || "").trim().toLowerCase() === key){ n.paid = true; changed.push(n.number); } });
  markDirty(); logAction("Pagamento", `Comprador ${buyer}: números ${changed.join(", ")} marcados como pagos`);
  closeModal(); persist(); toast("Comprador marcado como pago ✅");
}
function updatePaid(i,v){ active().numbers[i].paid=v; markDirty(); logAction("Pagamento",`Número ${i+1}: marcado como ${v?"pago":"pendente"}`); persist(); }
function updateField(k,v){ active()[k]=v; markDirty(); logAction("Atualização",`${k} alterado`); persist(); }
function updateSavedBadgeOnly(){ const old=document.querySelector('#main .saved-status'); if(old) old.outerHTML=savedStatusHtml(active()); }
function updateWinnerButtonOnly(){ const b=document.getElementById('btnWinnersMain'); if(b) b.disabled = countFilled() < 20; }
function updateNumeroRifa(v){ active().numeroRifa=v; markDirty(); logAction("Atualização","Número da rifa alterado para: "+v); localStorage.setItem("rifas_whatsapp_app_v1",JSON.stringify(state)); document.getElementById("preview").textContent=generateMessage(); }
function updateNumWinners(v){ active().numWinners=Number(v); markDirty(); logAction("Atualização","Número de vencedores alterado para: "+v); localStorage.setItem("rifas_whatsapp_app_v1",JSON.stringify(state)); }
function updateNumeroRifaReferencia(v){ active().numeroRifaReferencia=v; markDirty(); logAction("Atualização","Número da rifa de referência alterado para: "+v); localStorage.setItem("rifas_whatsapp_app_v1",JSON.stringify(state)); }
function countFilled(){ return active().numbers.filter(n=>n.buyer.trim()).length; }
function ensureRifaDaRifaCount(){ if(current!=="rifaDaRifa") return; changeRifaDaRifaCount(active().quantidadeNumeros, false); }
function changeRifaDaRifaCount(q, rerender=true){
  const r=active(); r.quantidadeNumeros=q;
  while(r.numbers.length<q) r.numbers.push({number:r.numbers.length+1,buyer:"",paid:false});
  r.numbers=r.numbers.slice(0,q).map((n,i)=>({...n,number:i+1}));
  if(rerender){ markDirty(); logAction("Atualização",`Quantidade de números alterada para ${q}`); persist(); }
}

function generateMessage(){
  const r=active();
  if(current==="rifaDaRifa"){
    const header = applyVars(r.header);
    return header + "\n\n" + r.numbers.map(n=>`${String(n.number).padStart(2,"0")}- ${n.buyer || ""}${n.paid && n.buyer ? " ✅" : ""}`).join("\n");
  }
  const header = (r.header||"").trim().replaceAll("{{numeroRifa}}", r.numeroRifa||"");
  return header + "\n\n" + r.numbers.map(n=>`${n.emoji}${n.number}- ${n.buyer || ""}${n.paid && n.buyer ? " ✅" : ""}`).join("\n");
}
function applyVars(text){
  const r=active();
  const sorteados = r.quantidadeNumeros===5 ? 2 : 4;
  return text.replaceAll("{{numeroRifaPrincipal}}", r.numeroRifaPrincipal || "").replaceAll("{{valorCotaOriginal}}", money(Number(r.valorCotaOriginal||0))).replaceAll("{{quantidadeNumeros}}", r.quantidadeNumeros).replaceAll("{{quantidadeNumerosSorteados}}", sorteados).replaceAll("{{valorCalculado}}", money(calcRifaDaRifaValue()));
}
function calcRifaDaRifaValue(){ const r=active(); const qty = r.quantidadeNumeros===5 ? 2 : 4; return Number(r.valorCotaOriginal||0) * qty / r.quantidadeNumeros; }
async function copyMessage(){
  const msg=generateMessage();
  await navigator.clipboard.writeText(msg);
  active().finalMessage=msg;
  logAction("Copiar","Mensagem copiada para WhatsApp",msg);
  localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state));
  toast("Mensagem copiada ✅");
}

function showValues(){
  const r=active();
  if(current==="rifaDaRifa"){ const unit = calcRifaDaRifaValue(); openModal("Valores da Rifa da Rifa", renderValuesTable(unit)); return; }
  openModal("Valores", `
    <div class="two">
      <div><label>Valor de 1 cota</label><input id="oneQuota" type="number" step="0.01" value="${r.values.oneQuota||0}"></div>
      <div><label>Valor promocional 2+ cotas</label><input id="twoQuotaPromo" type="number" step="0.01" value="${r.values.twoQuotaPromo||0}"></div>
    </div>
    <div class="actions"><button class="green" onclick="saveValueConfig()">Salvar valores</button><button class="primary" onclick="copyValues()">Copiar resumo</button></div>
    <div id="valuesArea" style="margin-top:14px">${renderValuesTable()}</div>
  `);
}
function saveValueConfig(){
  active().values.oneQuota=Number(document.getElementById("oneQuota").value||0);
  active().values.twoQuotaPromo=Number(document.getElementById("twoQuotaPromo").value||0);
  markDirty(); logAction("Valores","Configuração de valores atualizada");
  localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state));
  document.getElementById("valuesArea").innerHTML=renderValuesTable();
  document.getElementById("preview").textContent=generateMessage();
  toast("Valores salvos ✅");
}
function getBuyerSummary(unitOverride=null){
  const r=active(); const map={};
  r.numbers.filter(n=>n.buyer.trim()).forEach(n=>{ const key=n.buyer.trim(); if(!map[key]) map[key]={buyer:key,numbers:[],paid:0,pending:0}; map[key].numbers.push(n.number); n.paid ? map[key].paid++ : map[key].pending++; });
  return Object.values(map).map(b=>{
    const qty=b.numbers.length; let unit = unitOverride;
    if(unit===null){ unit = qty===1 ? Number(r.values.oneQuota||0) : Number(r.values.twoQuotaPromo||0)/2; }
    const total=qty*unit, paid=b.paid*unit, pending=b.pending*unit;
    return {...b,qty,total,paidValue:paid,pendingValue:pending,status:b.paid===qty?"Pago":b.paid>0?"Parcial":"Pendente"};
  });
}
function renderValuesTable(unitOverride=null){
  const rows=getBuyerSummary(unitOverride);
  if(!rows.length) return `<p class="small">Nenhum comprador preenchido ainda.</p>`;
  return `<table><thead><tr><th>Comprador</th><th>Cotas</th><th>Números</th><th>Total</th><th>Pagas</th><th>Pendentes</th><th>Valor pago</th><th>Pendente</th><th>Status</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${escapeHtml(r.buyer)}</td><td>${r.qty}</td><td>${r.numbers.join(", ")}</td><td>R$ ${money(r.total)}</td><td>${r.paid}</td><td>${r.pending}</td><td>R$ ${money(r.paidValue)}</td><td>R$ ${money(r.pendingValue)}</td><td><span class="pill ${r.status==='Pago'?'orange':''}">${r.status}</span></td></tr>`).join("")}
  </tbody></table>`;
}
async function copyValues(){
  const rows=getBuyerSummary(current==="rifaDaRifa"?calcRifaDaRifaValue():null);
  const msg="💰 RESUMO DE VALORES\n\n"+rows.map(r=>`${r.buyer}\nCotas: ${r.qty}\nNúmeros: ${r.numbers.join(", ")}\nTotal: R$ ${money(r.total)}\nPago: R$ ${money(r.paidValue)}\nPendente: R$ ${money(r.pendingValue)}\nStatus: ${r.status}`).join("\n\n");
  await navigator.clipboard.writeText(msg);
  logAction("Copiar valores","Resumo de valores copiado",msg);
  localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state));
  toast("Resumo copiado ✅");
}

function showWinners(){
  const max = active().numbers.length;
  const wn = active().winnerNumbers || {w1:"",w2:"",w3:""};
  const numWinners = active().numWinners || 3;
  const fields = [];
  for(let i=1; i<=numWinners; i++){
    fields.push(`<div><label>${i}º sorteado</label><input id="w${i}" type="number" min="1" max="${max}" value="${wn['w'+i]||''}"></div>`);
  }
  openModal("Ganhadores", `
    <p class="small" style="margin-bottom:14px">Informe os números sorteados. Se o 1º não tiver comprador, o sistema gera a mensagem correta automaticamente.</p>
    <div class="two">
      ${fields.join('')}
    </div>
    <div class="actions"><button class="green" onclick="calculateWinners()">🏆 Gerar resultado</button></div>
    <div id="winnerResult" class="message-box" style="margin-top:14px;display:none"></div>
  `, {config:true, copy:true});
  // show previous result if exists
  if(active().lastWinnerMessage){
    setTimeout(()=>{ const el=document.getElementById("winnerResult"); if(el){ el.textContent=active().lastWinnerMessage; el.style.display="block"; } },50);
  }
}
function calculateWinners(){
  const r = active();
  const numWinners = r.numWinners || 3;
  const winnerVals = {};
  const inputNums = [];
  for(let i=1; i<=numWinners; i++){
    const val = document.getElementById("w"+i)?.value || "";
    winnerVals["w"+i] = val;
    if(val) inputNums.push(Number(val));
  }
  // save the entered numbers
  r.winnerNumbers = winnerVals;
  const vacant = r.numbers.some(n=>!n.buyer.trim());
  const totalNums = r.numbers.length;
  const vagosCount = r.numbers.filter(n=>!n.buyer.trim()).length;

  // Resolve winners: for each drawn number find first that has a buyer
  // But we also need to handle the scenario where the 1st drawn has no buyer at all
  const firstNum = inputNums[0];
  const raffleHeader = current==="rifaDaRifa"
    ? `Rifa de referência: ${r.numeroRifaReferencia||'—'}${r.numeroRifaPrincipal?` / Rifa principal: ${r.numeroRifaPrincipal}`:''}\n\n`
    : `Nº da rifa: ${r.numeroRifa||'—'}\n\n`;
  let msg = "";

  // Scenario 1: 1st drawn number has no buyer → no winner, goes to next draw
  if(firstNum){
    const firstEntry = r.numbers.find(n=>n.number===firstNum);
    if(firstEntry && !firstEntry.buyer.trim()){
      const body = formatResultTemplate(r.resultTemplates.vacant, {
        numero: String(firstNum).padStart(2,"0"),
        numeroRifa: r.numeroRifa || "",
        numeroRifaReferencia: r.numeroRifaReferencia || "",
        numeroRifaPrincipal: r.numeroRifaPrincipal || "",
        buyer: "",
        paid: "",
        vagos: String(vagosCount),
        winners: ""
      });
      msg = raffleHeader + body;
      active().winners=[]; active().lastWinnerMessage=msg; markDirty();
      logAction("Ganhadores","Nenhum comprador no número sorteado: "+firstNum, msg);
      localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state));
      const el=document.getElementById("winnerResult"); el.textContent=msg; el.style.display="block";
      navigator.clipboard.writeText(msg); toast("Resultado copiado ✅");
      return;
    }
  }

  // Collect all winners (only from numbers that have buyers)
  const winners=[];
  inputNums.forEach((num,idx)=>{
    const found=r.numbers.find(n=>n.number===num);
    if(found && found.buyer.trim()) winners.push({order:idx+1,num, buyer:found.buyer, paid:found.paid, animal:found.animal||"", emoji:found.emoji||""});
  });

  if(!winners.length){
    const body = `Nenhum dos números sorteados possui comprador.\nA rifa vai para o próximo sorteio.`;
    msg = raffleHeader + body;
  } else {
    if(vacant){
      const firstWinner = winners[0];
      const paidLabel = firstWinner.paid ? " ✅" : "";
      const winnerLine = `🎯 Número sorteado: ${String(firstWinner.num).padStart(2,"0")}${current==="rifaDaRifa" ? "" : (firstWinner.animal ? ` - ${firstWinner.animal}` : "")}\n🏆 Ganhador: ${firstWinner.buyer}${paidLabel}`;
      const body = formatResultTemplate(r.resultTemplates.partial, {
        numero: String(firstWinner.num).padStart(2,"0"),
        numeroRifa: r.numeroRifa || "",
        numeroRifaReferencia: r.numeroRifaReferencia || "",
        numeroRifaPrincipal: r.numeroRifaPrincipal || "",
        buyer: firstWinner.buyer,
        paid: paidLabel,
        vagos: String(vagosCount),
        winners: winnerLine
      });
      msg = raffleHeader + body;
    } else {
      const winnersText = winners.map(w=>{
        const animalText = current==="rifaDaRifa" ? "" : (w.animal ? ` - ${w.animal}` : "");
        return `${w.order}º número sorteado: ${String(w.num).padStart(2,"0")}${animalText}\nGanhador: ${w.buyer}${w.paid?" ✅":""}`;
      }).join("\n\n");
      const body = formatResultTemplate(r.resultTemplates.normal, {
        numero: String(winners[0].num).padStart(2,"0"),
        numeroRifa: r.numeroRifa || "",
        numeroRifaReferencia: r.numeroRifaReferencia || "",
        numeroRifaPrincipal: r.numeroRifaPrincipal || "",
        buyer: winners[0].buyer,
        paid: winners[0].paid ? " ✅" : "",
        vagos: String(vagosCount),
        winners: winnersText
      });
      msg = raffleHeader + body;
    }
  }

  active().winners=winners; active().lastWinnerMessage=msg; markDirty();
  logAction("Ganhadores","Resultado de ganhadores gerado",msg);
  localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state));
  const el=document.getElementById("winnerResult"); el.textContent=msg; el.style.display="block";
  navigator.clipboard.writeText(msg); toast("Resultado copiado ✅");
}

function showHistory(){
  const h=active().history;
  openModal("Histórico da rifa atual", h.length ? `<table><thead><tr><th>Data</th><th>Hora</th><th>Ação</th><th>Detalhe</th></tr></thead><tbody>${h.map(x=>`<tr><td>${x.date}</td><td>${x.time}</td><td>${escapeHtml(x.type)}</td><td>${escapeHtml(x.detail||"")}</td></tr>`).join("")}</tbody></table>` : `<p class="small">Sem histórico ainda.</p>`);
}
function showSavedRaffles(){
  const body = `
    <div class="two">
      <div><label>Filtrar por dia</label><input id="filterSavedDate" type="date" oninput="renderSavedRafflesList()"></div>
      <div><label>Filtrar por número/texto</label><input id="filterSavedText" placeholder="Ex: 292, VIP, Premium..." oninput="renderSavedRafflesList()"></div>
    </div>
    <div id="savedRafflesList" style="margin-top:14px"></div>`;
  openModal("Histórico de Rifas Salvas", body);
  renderSavedRafflesList();
}
function renderSavedRafflesList(){
  const area=document.getElementById('savedRafflesList'); if(!area) return;
  const date=document.getElementById('filterSavedDate')?.value || '';
  const text=(document.getElementById('filterSavedText')?.value || '').toLowerCase();
  let items=(state.savedRaffles||[]).map((r,i)=>({...r,_idx:i}));
  if(date) items=items.filter(r=>(r.savedAt||'').slice(0,10)===date);
  if(text) items=items.filter(r=>JSON.stringify({type:r.type,header:r.header,numeroRifaPrincipal:r.numeroRifaPrincipal,finalMessage:r.finalMessage}).toLowerCase().includes(text));
  if(!items.length){ area.innerHTML='<p class="small">Nenhuma rifa salva encontrada.</p>'; return; }
  area.innerHTML = `<table><thead><tr><th>Data</th><th>Tipo</th><th>Nº Rifa</th><th>Resumo</th><th>Ações</th></tr></thead><tbody>${items.map(r=>`<tr><td>${new Date(r.savedAt||r.createdAt).toLocaleString('pt-BR')}</td><td><span class="pill">${labelType(r.type)}</span></td><td>${r.type==='rifaDaRifa' ? escapeHtml(r.numeroRifaReferencia||'—') : escapeHtml(r.numeroRifa||'—')}</td><td>${escapeHtml((r.header||'').split('\n')[0] || 'Sem cabeçalho')}</td><td><button onclick="showSavedRaffleDetails(${r._idx})">Ver detalhes</button></td></tr>`).join('')}</tbody></table>`;
}
function showSavedRaffleDetails(idx){
  const r=(state.savedRaffles||[])[idx]; if(!r) return;
  const winners=(r.winners||[]).length ? (r.winners||[]).map(w=>`${w.order}º - ${String(w.num).padStart(2,'0')} - ${escapeHtml(w.buyer||'')}`).join('<br>') : 'Não informado';
  const valuesHtml = renderValuesTableForRaffle(r);
  const numLabel = r.type==='rifaDaRifa' ? `Rifa de referência: <strong>${escapeHtml(r.numeroRifaReferencia||'—')}</strong>` : `Número da rifa: <strong>${escapeHtml(r.numeroRifa||'—')}</strong>`;
  openModal('Detalhes da rifa salva', `
    <p style="margin-bottom:12px"><span class="pill">${labelType(r.type)}</span> &nbsp; <span class="small">Salva em ${new Date(r.savedAt||r.createdAt).toLocaleString('pt-BR')}</span> &nbsp; <span class="small">${numLabel}</span></p>
    <h3>Template / Cabeçalho</h3><div class="message-box">${escapeHtml(r.header||'')}</div>
    <h3>Ganhadores</h3><div class="message-box">${winners}</div>
    <h3>Valores</h3>${valuesHtml}
    <h3>Mensagem final</h3><div class="message-box">${escapeHtml(r.finalMessage||'')}</div>
    <h3>Histórico</h3>${(r.history||[]).length ? `<table><thead><tr><th>Data</th><th>Hora</th><th>Ação</th><th>Detalhe</th></tr></thead><tbody>${(r.history||[]).map(x=>`<tr><td>${x.date}</td><td>${x.time}</td><td>${escapeHtml(x.type)}</td><td>${escapeHtml(x.detail||'')}</td></tr>`).join('')}</tbody></table>` : '<p class="small">Sem histórico.</p>'}
  `);
}
function labelType(t){ return t==='premium'?'Premium':t==='vip2'?'VIP 2':'Rifa da Rifa'; }
function renderValuesTableForRaffle(r){
  const rows=getBuyerSummaryFromRaffle(r);
  if(!rows.length) return '<p class="small">Sem compradores.</p>';
  return `<table><thead><tr><th>Comprador</th><th>Cotas</th><th>Números</th><th>Total</th><th>Pagas</th><th>Pendentes</th><th>Valor pago</th><th>Pendente</th><th>Status</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${escapeHtml(row.buyer)}</td><td>${row.qty}</td><td>${row.numbers.join(', ')}</td><td>R$ ${money(row.total)}</td><td>${row.paid}</td><td>${row.pending}</td><td>R$ ${money(row.paidValue)}</td><td>R$ ${money(row.pendingValue)}</td><td>${row.status}</td></tr>`).join('')}</tbody></table>`;
}
function getBuyerSummaryFromRaffle(r){
  const map={};
  (r.numbers||[]).filter(n=>(n.buyer||'').trim()).forEach(n=>{ const key=n.buyer.trim(); if(!map[key]) map[key]={buyer:key,numbers:[],paid:0,pending:0}; map[key].numbers.push(n.number); n.paid?map[key].paid++:map[key].pending++; });
  return Object.values(map).map(b=>{
    const qty=b.numbers.length; let unit=0;
    if(r.type==='rifaDaRifa'){ unit = Number(r.valorCotaOriginal||0) * (Number(r.quantidadeNumeros)===5 ? 2 : 4) / Number(r.quantidadeNumeros||1); }
    else { unit = qty===1 ? Number(r.values?.oneQuota||0) : Number(r.values?.twoQuotaPromo||0)/2; }
    const total=qty*unit, paid=b.paid*unit, pending=b.pending*unit;
    return {...b,qty,total,paidValue:paid,pendingValue:pending,status:b.paid===qty?'Pago':b.paid>0?'Parcial':'Pendente'};
  });
}
function saveRaffle(){
  if(!active().lastWinnerMessage){ toast('Informe os ganhadores antes de salvar ⚠️'); showWinners(); return; }
  const msg=generateMessage();
  active().finalMessage=msg; active().lastSavedAt=new Date().toISOString(); active().hasUnsavedChanges=false;
  logAction("Salvar","Rifa salva no histórico local",msg);
  const r=JSON.parse(JSON.stringify(active())); r.savedAt=active().lastSavedAt;
  state.savedRaffles.unshift(r);
  localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state)); render(); toast("Rifa salva ✅");
}
function exportJSON(){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="rifas-backup.json"; a.click(); URL.revokeObjectURL(a.href);
}
function getLastSavedRaffleByType(type){
  return (state.savedRaffles||[]).find(r=>r.type===type) || null;
}
function applySavedConfigToNewRaffle(base, saved){
  if(!saved) return base;
  if(base.type === "rifaDaRifa"){
    base.numeroRifaReferencia = saved.numeroRifaReferencia || base.numeroRifaReferencia;
    base.numeroRifaPrincipal = saved.numeroRifaPrincipal || base.numeroRifaPrincipal;
    base.valorCotaOriginal = Number(saved.valorCotaOriginal || base.valorCotaOriginal);
    base.quantidadeNumeros = Number(saved.quantidadeNumeros || base.quantidadeNumeros);
    base.header = saved.header || base.header;
    base.payWholeBuyer = !!saved.payWholeBuyer;
    if(base.quantidadeNumeros !== base.numbers.length){
      base.numbers = Array.from({length:base.quantidadeNumeros},(_,i)=>({number:i+1,buyer:"",paid:false}));
    }
  } else {
    base.numeroRifa = saved.numeroRifa || base.numeroRifa;
    base.header = saved.header || base.header;
    base.values = saved.values ? {...saved.values} : base.values;
    base.payWholeBuyer = !!saved.payWholeBuyer;
  }
  base.resultTemplates = saved.resultTemplates ? {...saved.resultTemplates} : base.resultTemplates;
  return base;
}
function resetCurrent(){
  if(!confirm("Limpar todos os dados desta aba?")) return;
  const lastSaved = getLastSavedRaffleByType(current);
  const fresh = current==="rifaDaRifa" ? emptyRifaDaRifa() : emptyMainRaffle(current);
  state[current] = applySavedConfigToNewRaffle(fresh, lastSaved);
  state[current].hasUnsavedChanges = true;
  state[current].lastSavedAt = null;
  localStorage.setItem("rifas_whatsapp_app_v1", JSON.stringify(state));
  render();
}
function money(v){ return Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function escapeHtml(s){ return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function escapeAttr(s){ return escapeHtml(s).replaceAll("\n"," "); }
render();
