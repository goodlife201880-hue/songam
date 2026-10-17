import test from 'node:test';
import assert from 'node:assert/strict';
import {permissions,age,validate,hashPassword,verifyPassword,publicUser} from '../server/domain.mjs';
const user={id:1,name:'Test User',email:'TEST@example.com',password:'test-password-123',job:'worker',birthday:'2000-09-28'};
test('permissions match all five jobs',()=>{assert.deepEqual(permissions.manager,['users','materials','food','imports','exports']);assert.deepEqual(permissions.cooker,['materials','food']);assert.deepEqual(permissions.servicer,['exports']);assert.deepEqual(permissions.guider,['exports']);assert.deepEqual(permissions.worker,[]);for(const job of ['cooker','servicer','guider','worker'])assert.ok(!permissions[job].includes('users'));});
test('age changes on birthday',()=>{assert.equal(age(user.birthday,new Date('2026-09-27')),25);assert.equal(age(user.birthday,new Date('2026-09-28')),26);});
test('invalid jobs, dates, email and passwords are rejected',()=>{assert.equal(validate(user).email,'test@example.com');for(const changes of [{job:'admin'},{birthday:'2000-02-30'},{birthday:'2999-01-01'},{email:'invalid'},{password:'short'}])assert.throws(()=>validate({...user,...changes}));assert.doesNotThrow(()=>validate({...user,password:''},false));});
test('passwords are salted and verified',async()=>{const first=await hashPassword(user.password), second=await hashPassword(user.password);assert.notEqual(first,second);assert.equal(await verifyPassword(user.password,first),true);assert.equal(await verifyPassword('wrong',first),false);});
test('public user never exposes passwords and ignores submitted ability',()=>{const result=publicUser({...user,password_hash:'secret',ability:['users']});assert.ok(!('password' in result));assert.ok(!('password_hash' in result));assert.deepEqual(result.ability,[]);});

test('assigned abilities override job defaults and reject invalid grants',()=>{
 assert.deepEqual(validate({...user,ability:['food','exports']}).ability,['food','exports']);
 assert.throws(()=>validate({...user,ability:['users']}),/Only managers/);
 assert.throws(()=>validate({...user,ability:['invalid']}),/valid management/);
 assert.deepEqual(publicUser({...user,abilities:'["food","exports"]'}).ability,['food','exports']);
 assert.deepEqual(publicUser({...user,job:'manager',abilities:'[]'}).ability,[]);
});

test('goods ability is separately assignable without changing existing permissions',()=>{assert.deepEqual(validate({...user,ability:['goods']}).ability,['goods']);assert.deepEqual(publicUser({...user,abilities:'["materials"]'}).ability,['materials']);assert.deepEqual(publicUser({...user,abilities:'["goods"]'}).ability,['goods']);});
