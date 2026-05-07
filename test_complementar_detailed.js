// Test script for complementar raffle pricing model
// Model: 4 nums = 1 cota, 8 nums = 2 cotas, etc.
// Extras with discount: 1 cota completion uses cota/4, 2 cotas uses 2cotas/8

function calcComplementarTotal(oneQuota, twoQuota, perNumber, qty, discountFlag){
  if(qty <= 0) return 0;
  if(qty < 4) return qty * perNumber;
  const fullCotas = Math.floor(qty / 4);
  const extras = qty % 4;
  let fullPrice = 0;
  if(fullCotas === 1) fullPrice = oneQuota;
  else if(fullCotas === 2) fullPrice = twoQuota;
  else if(fullCotas > 2){ const pairs = Math.floor(fullCotas/2); const rem = fullCotas % 2; fullPrice = pairs * twoQuota + rem * oneQuota; }
  let perExtra = perNumber;
  if(discountFlag){ if(fullCotas === 1) perExtra = oneQuota / 4; else if(fullCotas >= 2) perExtra = twoQuota / 8; }
  return fullPrice + extras * perExtra;
}

function money(v){ return Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }

const oneQuota = 240;
const twoQuota = 437;
const perNumber = 65;

console.log('=== RIFA COMPLEMENTAR - Pricing Model ===\n');
console.log(`Config: 1 cota = R$ ${money(oneQuota)} | 2 cotas = R$ ${money(twoQuota)} | Per número = R$ ${money(perNumber)}\n`);

console.log('--- CASE 1: Less than 4 numbers (paga por número) ---');
for(let q = 1; q <= 3; q++){
  const t = calcComplementarTotal(oneQuota, twoQuota, perNumber, q, false);
  console.log(`${q} número(s): R$ ${money(t)} (${q} × R$ ${money(perNumber)})`);
}

console.log('\n--- CASE 2: Exactly 4, 8, 12... numbers (full cotas) ---');
for(let cotas = 1; cotas <= 3; cotas++){
  const q = cotas * 4;
  const noDisc = calcComplementarTotal(oneQuota, twoQuota, perNumber, q, false);
  console.log(`${q} número(s) (${cotas} cota${cotas>1?'s':''}): R$ ${money(noDisc)}`);
}

console.log('\n--- CASE 3: 5-7 numbers (1 cota + extras) ---');
for(let q = 5; q <= 7; q++){
  const noDisc = calcComplementarTotal(oneQuota, twoQuota, perNumber, q, false);
  const withDisc = calcComplementarTotal(oneQuota, twoQuota, perNumber, q, true);
  const extras = q - 4;
  console.log(`${q} número(s): SEM desconto R$ ${money(noDisc)} (1 cota + ${extras} × R$ ${money(perNumber)}) | COM desconto R$ ${money(withDisc)} (1 cota + ${extras} × R$ ${money(oneQuota/4)})`);
}

console.log('\n--- CASE 4: Exactly 8 numbers (2 cotas) ---');
const noDisc8 = calcComplementarTotal(oneQuota, twoQuota, perNumber, 8, false);
console.log(`8 número(s) (2 cotas): R$ ${money(noDisc8)}`);

console.log('\n--- CASE 5: 9-11 numbers (2 cotas + extras) ---');
for(let q = 9; q <= 11; q++){
  const noDisc = calcComplementarTotal(oneQuota, twoQuota, perNumber, q, false);
  const withDisc = calcComplementarTotal(oneQuota, twoQuota, perNumber, q, true);
  const extras = q - 8;
  console.log(`${q} número(s): SEM desconto R$ ${money(noDisc)} (2 cotas + ${extras} × R$ ${money(perNumber)}) | COM desconto R$ ${money(withDisc)} (2 cotas + ${extras} × R$ ${money(twoQuota/8)})`);
}

console.log('\n--- CASE 6: Paid partial (example: 5 numbers, 2 paid) ---');
const totalQty = 5;
const paidQty = 2;
const totalPrice = calcComplementarTotal(oneQuota, twoQuota, perNumber, totalQty, true);
const paidPrice = calcComplementarTotal(oneQuota, twoQuota, perNumber, paidQty, true);
const pendingPrice = totalPrice - paidPrice;
console.log(`Total 5 números com desconto: R$ ${money(totalPrice)}`);
console.log(`Pago (2 números): R$ ${money(paidPrice)}`);
console.log(`Pendente (3 números): R$ ${money(pendingPrice)}`);
