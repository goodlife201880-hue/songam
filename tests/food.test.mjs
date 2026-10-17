import test from 'node:test';
import assert from 'node:assert/strict';
import {recipeCost,compatibleUnits} from '../shared/food-cost.mjs';
const materials=[{id:1,name:'Beef',unit:'kg',unit_cost:'10',currency:'USD'},{id:2,name:'Garlic',unit:'kg',unit_cost:'4',currency:'USD'}];
test('food cost sums 2kg beef and 50g garlic priced by kilogram',()=>{
 const result=recipeCost([{material_id:1,quantity:'2',unit:'kg'},{material_id:2,quantity:'50',unit:'g'}],materials);
 assert.deepEqual(result.costs,[{currency:'USD',total_cost:'20.2'}]);
 assert.equal(result.ingredients[1].cost,'0.2');
});
test('converts volume, reverse mass conversion and pieces accurately',()=>{
 const rows=[{id:1,name:'Oil',unit:'L',unit_cost:'8',currency:'USD'},{id:2,name:'Spice',unit:'g',unit_cost:'0.1',currency:'USD'},{id:3,name:'Egg',unit:'piece',unit_cost:'0.25',currency:'USD'}];
 assert.equal(recipeCost([{material_id:1,quantity:'25',unit:'ml'},{material_id:2,quantity:'0.5',unit:'kg'},{material_id:3,quantity:'2',unit:'piece'}],rows).costs[0].total_cost,'50.7');
 assert.deepEqual(compatibleUnits('kg'),['kg','g']);
});
test('keeps currencies separate and uses current material costs',()=>{
 const recipe=[{material_id:1,quantity:'2',unit:'kg'},{material_id:2,quantity:'50',unit:'g'}];
 assert.deepEqual(recipeCost(recipe,[materials[0],{...materials[1],currency:'KRW',unit_cost:'4000'}]).costs,[{currency:'USD',total_cost:'20'},{currency:'KRW',total_cost:'200'}]);
 assert.equal(recipeCost(recipe,[{...materials[0],unit_cost:'12'},materials[1]]).costs[0].total_cost,'24.2');
});
test('rejects incomplete recipes, duplicates, invalid quantities and incompatible units',()=>{
 const valid={material_id:1,quantity:'1',unit:'kg'};
 for(const recipe of [[],null,[null],[[]],[{...valid,material_id:999}],[{...valid,quantity:'0'}],[{...valid,quantity:'-1'}],[{...valid,quantity:'0.0001'}],[{...valid,unit:'L'}],[valid,valid]])assert.throws(()=>recipeCost(recipe,materials),{status:400});
});
test('does not round away tiny converted quantities',()=>{
 const result=recipeCost([{material_id:1,quantity:'0.001',unit:'g'}],[{...materials[0],unit_cost:'0.001'}]);
 assert.equal(result.costs[0].total_cost,'0.000000001');
});
