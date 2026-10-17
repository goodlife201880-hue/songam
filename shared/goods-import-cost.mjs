import {recipeCost} from './food-cost.mjs';
export function goodsImportCost(row,item){
 if(!item)throw Object.assign(new Error('Choose an existing goods item.'),{status:400});
 const cost=recipeCost([{material_id:item.id,quantity:row.quantity,unit:row.unit}],[item]).ingredients[0].cost;
 // Round once to the three decimal places stored in import history.
 const [whole,fraction='']=cost.split('.');
 const nano=BigInt(whole)*1000000000n+BigInt(fraction.padEnd(9,'0'));
 const milli=(nano+500000n)/1000000n;
 if(milli>99999999999n)throw Object.assign(new Error('Calculated total exceeds 99,999,999.999. Split this quantity into smaller imports.'),{status:400});
 return {total_cost:String(milli/1000n)+'.'+String(milli%1000n).padStart(3,'0'),currency:item.currency};
}
