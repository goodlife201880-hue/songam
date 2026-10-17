import {goodsImportCost} from './goods-import-cost.mjs';
function invalid(message){throw Object.assign(new Error(message),{status:400});}
export function exportPrice(row,foods,goods){
 if(!row||!['food','goods'].includes(row.type))invalid('Choose Food or Goods.');
 const item=(row.type==='food'?foods:goods).find(item=>String(item.id)===String(row.item_id));
 if(!item)invalid('Choose an existing '+(row.type==='food'?'food':'goods item')+'.');
 if(row.type==='food'&&(!/^\d+$/.test(String(row.quantity))||Number(row.quantity)<1))invalid('Food quantity must be a positive whole number of servings.');
 const price=row.type==='food'?item.serving_price:item.unit_cost;
 if(price==null)invalid('Set a cost for '+item.name+' in Goods management first.');
 const priceUnit=row.type==='food'?'piece':item.unit;
 if(row.type==='goods'&&String(row.category_id)!==String(item.category_id))invalid('Choose goods from the selected category.');
 if(row.type==='food'&&row.unit!=='serving')invalid('Food quantities are in servings.');
 const calculated=goodsImportCost({quantity:row.quantity,unit:row.type==='food'?'piece':row.unit},{...item,unit:priceUnit,unit_cost:price});
 return {type:row.type,item_id:item.id,name:item.name,quantity:String(row.quantity),unit:row.unit,unit_price:String(price),price_unit:row.type==='food'?'serving':item.unit,total_price:calculated.total_cost,currency:calculated.currency};
}
export function exportTotals(rows){
 const totals=new Map();
 for(const row of rows){const [whole,fraction='']=String(row.total_price).split('.');const milli=BigInt(whole)*1000n+BigInt(fraction.padEnd(3,'0'));totals.set(row.currency,(totals.get(row.currency)||0n)+milli);}
 return [...totals].map(([currency,milli])=>({currency,total_price:String(milli/1000n)+'.'+String(milli%1000n).padStart(3,'0')}));
}
