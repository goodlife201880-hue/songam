export function money(value,currency){
 const amount=Number(value).toLocaleString(undefined,{maximumFractionDigits:3});
 return currency==='USD'?'$'+amount+' USD':currency==='KRW'?'₩'+amount+' KRW':amount+' (currency not set)';
}
export function costTotals(rows){
 const totals=new Map();
 for(const row of rows){const key=row.currency || null;totals.set(key,(totals.get(key)||0)+Number(row.total_cost));}
 return [...totals].map(([currency,total])=>money(total,currency)).join(' · ') || 'No usage';
}
