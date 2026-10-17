import test from 'node:test';
import assert from 'node:assert/strict';
import {periodRange,decimal,date} from '../server/material-domain.mjs';
test('statistics periods handle leap days and year boundaries',()=>{
 assert.deepEqual(periodRange('month','2024-02-15'),{start:'2024-02-01',end:'2024-03-01'});
 assert.deepEqual(periodRange('day','2024-02-29'),{start:'2024-02-29',end:'2024-03-01'});
 assert.deepEqual(periodRange('year','2024-12-31'),{start:'2024-01-01',end:'2025-01-01'});
 assert.throws(()=>date('2023-02-29'));assert.throws(()=>periodRange('week','2024-01-01'));
});
test('cost and quantity validation preserves decimal precision',()=>{
 assert.equal(decimal('0'), '0');assert.equal(decimal('1.125',true),'1.125');
 for(const value of ['-1','NaN','1.0001','100000000'])assert.throws(()=>decimal(value));assert.throws(()=>decimal('0',true));
});


import {currency} from '../server/material-domain.mjs';
import {money,costTotals} from '../src/material-money.mjs';
test('material currency accepts only USD and KRW',()=>{
 for(const value of ['USD','KRW'])assert.equal(currency(value),value);
 for(const value of ['',null,undefined,'EUR','usd'])assert.throws(()=>currency(value),{status:400});
});
test('cost totals keep dollars and won separate, including the same material',()=>{
 const rows=[{id:1,currency:'USD',total_cost:'2.5'},{id:1,currency:'KRW',total_cost:'3000'},{id:2,currency:'USD',total_cost:'1.25'}];
 assert.equal(costTotals(rows),money(3.75,'USD')+' · '+money(3000,'KRW'));
 assert.equal(costTotals([]),'No usage');
});
