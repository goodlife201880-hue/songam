import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGoods} from '../server/imports.mjs';
const goods=[{id:1,name:'Soap',category_id:2,category_name:'Cleaning',unit:'L'}];
const row={goods_id:1,category_id:2,unit:'ml',quantity:'50',total_cost:'4',currency:'USD'};
const data=items=>({imported_on:'2026-01-01',items});
test('goods import uses saved names and categories',()=>{const value=validateGoods(data([{...row,name:'Forged'}]),goods).items[0];assert.equal(value.name,'Soap');assert.equal(value.category_name,'Cleaning');assert.equal(value.goods_id,1);assert.equal(value.unit,'ml');});
test('goods import rejects missing goods, mismatched category and incompatible units',()=>{for(const change of [{goods_id:99},{goods_id:''},{category_id:3},{unit:'kg'},{quantity:'0'},{currency:'EUR'}])assert.throws(()=>validateGoods(data([{...row,...change}]),goods),{status:400});});
