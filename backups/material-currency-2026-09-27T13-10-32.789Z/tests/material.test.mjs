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
