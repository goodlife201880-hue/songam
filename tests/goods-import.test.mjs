import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGoods} from '../server/imports.mjs';
const goods=[{id:1,name:'Soap',category_id:2,category_name:'Cleaning',unit:'L',unit_cost:'8',currency:'USD'}];
const row={goods_id:1,category_id:2,unit:'ml',quantity:'50',total_cost:'4',currency:'USD'};
const data=items=>({imported_on:'2026-01-01',items});
test('goods import uses saved names and categories',()=>{const value=validateGoods(data([{...row,name:'Forged'}]),goods).items[0];assert.equal(value.name,'Soap');assert.equal(value.category_name,'Cleaning');assert.equal(value.goods_id,1);assert.equal(value.unit,'ml');});
test('goods import rejects missing goods, mismatched category and incompatible units',()=>{for(const change of [{goods_id:99},{goods_id:''},{category_id:3},{unit:'kg'},{quantity:'0'}])assert.throws(()=>validateGoods(data([{...row,...change}]),goods),{status:400});});

import {goodsImportCost} from '../shared/goods-import-cost.mjs';
test('goods import computes price and ignores submitted cost and currency',()=>{const result=validateGoods(data([{...row,total_cost:'999',currency:'KRW'}]),goods).items[0];assert.equal(result.total_cost,'0.400');assert.equal(result.currency,'USD');});
test('goods cost handles quantities, conversions, zero prices and rounding',()=>{
 assert.equal(goodsImportCost({quantity:'3',unit:'L'},goods[0]).total_cost,'24.000');
 assert.equal(goodsImportCost({quantity:'0.001',unit:'L'},{...goods[0],unit_cost:'0.5'}).total_cost,'0.001');
 assert.equal(goodsImportCost({quantity:'3',unit:'L'},{...goods[0],unit_cost:'0'}).total_cost,'0.000');
 assert.throws(()=>goodsImportCost({quantity:'99999999',unit:'L'},{...goods[0],unit_cost:'99999999'}),{status:400});
});
