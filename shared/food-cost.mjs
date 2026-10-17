const units={kg:['mass',1000],g:['mass',1],L:['volume',1000],ml:['volume',1],piece:['count',1]};
function invalid(message){throw Object.assign(new Error(message),{status:400});}
export function compatibleUnits(unit){return Object.keys(units).filter(key=>units[key][0]===units[unit]?.[0]);}
function milli(value,positive=false){
 const text=String(value);
 if(!/^\d{1,8}(\.\d{1,3})?$/.test(text))invalid('Enter a nonnegative amount with at most 3 decimal places.');
 const [whole,fraction='']=text.split('.');
 const result=BigInt(whole)*1000n+BigInt(fraction.padEnd(3,'0'));
 if(positive && result===0n)invalid('Ingredient quantity must be greater than zero.');
 return result;
}
function amount(nano){
 const whole=nano/1000000000n, fraction=String(nano%1000000000n).padStart(9,'0').replace(/0+$/,'');
 return String(whole)+(fraction?'.'+fraction:'');
}
export function recipeCost(ingredients,materials){
 if(!Array.isArray(ingredients)||!ingredients.length||ingredients.length>100)invalid('Add between 1 and 100 ingredients.');
 const lookup=new Map(materials.map(m=>[String(m.id),m])),seen=new Set(),totals=new Map();
 const lines=ingredients.map(row=>{
  if(!row||typeof row!=='object'||Array.isArray(row))invalid('Choose a material and quantity for every ingredient.');
  const material=lookup.get(String(row.material_id));
  if(!material)invalid('Choose an existing material for every ingredient.');
  if(seen.has(String(material.id)))invalid('Use each material once; combine its quantities into one row.');
  seen.add(String(material.id));
  if(!compatibleUnits(material.unit).includes(row.unit))invalid('Choose a compatible unit for '+material.name+'.');
  if(!['USD','KRW'].includes(material.currency))invalid('Set the cost currency for '+material.name+' first.');
  // Integer arithmetic retains exact costs through kg/g and L/ml conversions.
  const nano=milli(row.quantity,true)*milli(material.unit_cost)*BigInt(units[row.unit][1])*1000n/BigInt(units[material.unit][1]);
  totals.set(material.currency,(totals.get(material.currency)||0n)+nano);
  return {material_id:material.id,name:material.name,quantity:String(row.quantity),unit:row.unit,unit_cost:String(material.unit_cost),material_unit:material.unit,currency:material.currency,cost:amount(nano)};
 });
 return {ingredients:lines,costs:[...totals].map(([currency,total_cost])=>({currency,total_cost:amount(total_cost)}))};
}
export function foodMoney(value,currency){return (currency==='USD'?'$':'₩')+Number(value).toLocaleString(undefined,{maximumFractionDigits:9})+' '+currency;}
export function foodCostText(costs){return costs.map(row=>foodMoney(row.total_cost,row.currency)).join(' + ');}
