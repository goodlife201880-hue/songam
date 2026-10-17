import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../src/api.js';
test('API errors are actionable and never expose JSON parser errors',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>new Response('',{status:500});
  await assert.rejects(api('/login'),/backend is unavailable/);
  globalThis.fetch=async()=>new Response('<html>Bad gateway</html>',{status:502});
  await assert.rejects(api('/login'),/backend is unavailable/);
  globalThis.fetch=async()=>{throw new Error('network');};
  await assert.rejects(api('/login'),/Cannot reach the server/);
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'Database unavailable'}),{status:503});
  await assert.rejects(api('/login'),/Database unavailable/);
  globalThis.fetch=async()=>new Response(JSON.stringify({user:{name:'Manager'}}));
  assert.equal((await api('/me')).user.name,'Manager');
 } finally {globalThis.fetch=original;}
});
