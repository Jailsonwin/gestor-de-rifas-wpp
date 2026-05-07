function calcComplementarTotal(oneQuota, twoQuota, perNumber, qty, discountFlag){
  if(qty <= 0) return 0;
  // Less than 4 numbers: pay per number (no cota discount applies)
  if(qty < 4) return qty * perNumber;
  
  // 4+ numbers: calculate full cotas + extras
  const fullCotas = Math.floor(qty / 4);
  const extras = qty % 4;
  
  // Price of full quotas
  let fullPrice = 0;
  if(fullCotas === 1) fullPrice = oneQuota;
  else if(fullCotas === 2) fullPrice = twoQuota;
  else if(fullCotas > 2){ const pairs = Math.floor(fullCotas/2); const rem = fullCotas % 2; fullPrice = pairs * twoQuota + rem * oneQuota; }
  
  // Price per extra
  let perExtra = perNumber;
  if(discountFlag){ if(fullCotas === 1) perExtra = oneQuota / 4; else if(fullCotas >= 2) perExtra = twoQuota / 8; }
  
  return fullPrice + extras * perExtra;
}

function calcPaidPending(oneQuota, twoQuota, perNumber, qty, paidQty, discountFlag){
  const total = calcComplementarTotal(oneQuota, twoQuota, perNumber, qty, discountFlag);
  const paidValue = calcComplementarTotal(oneQuota, twoQuota, perNumber, paidQty, discountFlag);
  const pendingValue = total - paidValue;
  return {qty, paidQty, paidValue, pendingValue, total};
}

function money(v){ return Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }

const oneQuota = 240; const twoQuota = 437; const perNumber = 65; // exemplo do usuário
console.log('Testes para rifa complementar — cota R$ ' + money(oneQuota) + ', 2cot R$ ' + money(twoQuota) + ', por número R$ ' + money(perNumber));
console.log('Qtd | FullCotas | Extras | Total (sem desconto) | Total (com desconto)');
for(let q=1;q<=12;q++){
  const tNo = calcComplementarTotal(oneQuota,twoQuota,perNumber,q,false);
  const tYes = calcComplementarTotal(oneQuota,twoQuota,perNumber,q,true);
  console.log(`${String(q).padStart(2,' ')}  |    ${Math.floor(q/4)}      |   ${q%4}    | R$ ${money(tNo)} | R$ ${money(tYes)}`);
}

console.log('\nTestes com pagamentos parciais (qty=5):');
console.log('paidQty | paidValue | pendingValue');
for(let p=0;p<=5;p++){
  const r = calcPaidPending(oneQuota,twoQuota,perNumber,5,p,false);
  const r2 = calcPaidPending(oneQuota,twoQuota,perNumber,5,p,true);
  console.log(`${p}       | sem desconto Pago R$ ${money(r.paidValue)} Pendente R$ ${money(r.pendingValue)} | com desconto Pago R$ ${money(r2.paidValue)} Pendente R$ ${money(r2.pendingValue)}`);
}

console.log('\nTestes comparativos (1 numero vs 1 cota):');
console.log('1 numero price vs 1 cota: R$ ' + money(oneQuota/4) + ' vs R$ ' + money(oneQuota));

console.log('\nCaso exemplo do usuário: oneQuota=240, 2 cotas promo R$ 437 (não usado na complementar).\n');

console.log('Observações:');
console.log('- 4 números = 1 cota (R$ ' + money(oneQuota) + ')');
console.log('- 5 números = 1 cota + 1 número extra (sem desconto R$ ' + money(calcComplementarTotal(oneQuota,twoQuota,perNumber,5,false)) + ', com desconto R$ ' + money(calcComplementarTotal(oneQuota,twoQuota,perNumber,5,true)) + ')');
console.log('- Extras com desconto para >=2 cotas usam twoQuota/8 conforme solicitado.');
