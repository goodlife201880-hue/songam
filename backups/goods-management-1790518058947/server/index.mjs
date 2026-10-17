import {initializeImports,importRoute} from './imports.mjs';
import {initializeFoods,foodRoute} from './foods.mjs';
import {initializeMaterials,materialRoute} from './materials.mjs';
import http from 'node:http';
import {randomBytes,createHash} from 'node:crypto';
import {pool,initialize} from './db.mjs';
import {validate,hashPassword,verifyPassword,publicUser,permissions,userAbilities} from './domain.mjs';
const digest=value=>createHash('sha256').update(value).digest('hex');
const port=Number(process.env.API_PORT || 3001);
const allowedOrigins=new Set((process.env.APP_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173').split(','));
const attempts=new Map();
function send(res,status,data,headers={}) {res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));}
function fail(status,message) {throw Object.assign(new Error(message),{status});}
async function body(req) {let input='';for await (const chunk of req) {input+=chunk;if(Buffer.byteLength(input)>16384) fail(413,'Request is too large.');} try {return JSON.parse(input || '{}');} catch {fail(400,'Invalid JSON.');}}
function cookie(value,clear=false) {return `songam_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear?0:28800}${process.env.COOKIE_SECURE==='true'?'; Secure':''}`;}
console.log('Connecting to MySQL (connection timeout: 5 seconds)...');
try {
 await initialize();
 await initializeMaterials();
 await initializeFoods();
 await initializeImports();
} catch(error) {
 const code=error.code || 'DATABASE_ERROR';
 const target=(process.env.DB_HOST || '127.0.0.1')+':'+(process.env.DB_PORT || '3306');
 console.error('MySQL startup failed at '+target+' ('+code+').');
 if(code==='ETIMEDOUT') console.error('MySQL did not complete its connection handshake. Check or restart the MySQL service and confirm DB_PORT points to MySQL.');
 else if(code==='ECONNREFUSED') console.error('Start the MySQL service and check DB_HOST/DB_PORT in .env.');
 else if(code==='ER_ACCESS_DENIED_ERROR' || code==='ER_DBACCESS_DENIED_ERROR') console.error('MySQL rejected the account or database permissions. Run npm.cmd run db:repair.');
 else console.error('Check the MySQL server log for details.');
 await pool.end();
 process.exit(1);
}
const dummyHash=await hashPassword(randomBytes(32).toString('hex'));
const server=http.createServer(async(req,res)=>{
 try {
  const path=new URL(req.url,'http://localhost').pathname;
  const mutating=!['GET','HEAD'].includes(req.method);
  if(mutating && (!allowedOrigins.has(req.headers.origin) || !String(req.headers['content-type']).startsWith('application/json'))) fail(403,'Request origin or content type is not allowed.');
  if(path==='/api/login' && req.method==='POST') {
   const key=req.socket.remoteAddress; const now=Date.now(); let attempt=attempts.get(key); if(!attempt || now>attempt.until) {attempt={count:0,until:now+900000};attempts.set(key,attempt);} if(++attempt.count>15) fail(429,'Too many login attempts. Try again in 15 minutes.');
   const data=await body(req); if(typeof data.email!=='string' || typeof data.password!=='string' || data.password.length>128) fail(400,'Email and password are required.');
   const [rows]=await pool.execute('SELECT users.*, (SELECT abilities FROM user_abilities WHERE user_id=users.id) AS abilities FROM users WHERE email=?',[data.email.trim().toLowerCase()]);const user=rows[0]; const valid=await verifyPassword(data.password,user?.password_hash || dummyHash);if(!user || !valid) fail(401,'Incorrect email or password.');
   attempts.delete(key);const token=randomBytes(32).toString('hex');await pool.execute('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 8 HOUR))',[digest(token),user.id]);return send(res,200,{user:publicUser(user)},{'Set-Cookie':cookie(token)});
  }
  const token=(req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('songam_session='))?.slice(15);
  if(!token) fail(401,'Please sign in.');
  const [rows]=await pool.execute('SELECT u.*, (SELECT abilities FROM user_abilities WHERE user_id=u.id) AS abilities FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP()',[digest(token)]);const user=rows[0];if(!user) fail(401,'Session expired. Please sign in.');
  if(path==='/api/me' && req.method==='GET') return send(res,200,{user:publicUser(user)});
  if(path==='/api/logout' && req.method==='POST') {await pool.execute('DELETE FROM sessions WHERE token_hash=?',[digest(token)]);return send(res,200,{ok:true},{'Set-Cookie':cookie('',true)});}
  if(path.startsWith('/api/imports/')) {if(!userAbilities(user).includes('imports')) fail(403,'Import management access is required.');return send(res,200,await importRoute(req,user,body));}
  if(path.startsWith('/api/food/')) {if(!userAbilities(user).includes('food')) fail(403,'Food management access is required.');return send(res,200,await foodRoute(req,user,body));}
  if(path.startsWith('/api/materials/')) {if(!userAbilities(user).includes('materials')) fail(403,'Material management access is required.');return send(res,200,await materialRoute(req,user,body));}
  const module=path.match(/^\/api\/modules\/(materials|food|imports|exports)$/)?.[1];
  if(module && req.method==='GET') {if(!userAbilities(user).includes(module)) fail(403,'You cannot manage this page.');return send(res,200,{records:[]});}
  if(user.job!=='manager' || !userAbilities(user).includes('users')) fail(403,'Only managers can manage users.');
  if(path==='/api/users' && req.method==='GET') {const [users]=await pool.query('SELECT users.*, (SELECT abilities FROM user_abilities WHERE user_id=users.id) AS abilities FROM users ORDER BY name,id');return send(res,200,{users:users.map(publicUser)});}
  if(path==='/api/user-logs' && req.method==='GET') {const [logs]=await pool.query('SELECT * FROM user_logs ORDER BY id DESC LIMIT 200');return send(res,200,{logs});}
  const idMatch=path.match(/^\/api\/users\/(\d+)$/);const id=idMatch?Number(idMatch[1]):null;
  const creating=path==='/api/users' && req.method==='POST';const updating=id && req.method==='PUT';const deleting=id && req.method==='DELETE';
  if(!creating && !updating && !deleting) fail(404,'Not found.');
  let data; if(!deleting) {try {data=validate(await body(req),creating);} catch(error) {fail(error.status || 400,error.message);}}
  const passwordHash=data?.password?await hashPassword(data.password):null;
  const connection=await pool.getConnection();
  try {
   await connection.beginTransaction();await connection.query('SELECT id FROM management_lock WHERE id=1 FOR UPDATE');
   const [actors]=await connection.execute('SELECT users.*, (SELECT abilities FROM user_abilities WHERE user_id=users.id) AS abilities FROM users WHERE id=?',[user.id]);if(actors[0]?.job!=='manager' || !userAbilities(actors[0]).includes('users')) fail(403,'Only managers can manage users.');
   let existing;
   if(id) {const [targets]=await connection.execute('SELECT users.*, (SELECT abilities FROM user_abilities WHERE user_id=users.id) AS abilities FROM users WHERE id=?',[id]);existing=targets[0];if(!existing) fail(404,'User not found.');if(id===user.id && (deleting || data.job!=='manager' || !data.ability.includes('users'))) fail(400,'You cannot delete or demote your own manager account.');if(existing.job==='manager' && (deleting || data.job!=='manager' || !data.ability.includes('users'))) {const [managers]=await connection.query("SELECT COUNT(*) AS total FROM users WHERE job='manager' AND JSON_CONTAINS((SELECT abilities FROM user_abilities WHERE user_id=users.id), '\"users\"')");if(managers[0].total<=1) fail(400,'At least one manager must remain.');}}
   if(creating) {const [result]=await connection.execute('INSERT INTO users (name,email,password_hash,job,birthday) VALUES (?,?,?,?,?)',[data.name,data.email,passwordHash,data.job,data.birthday]);await connection.execute('INSERT INTO user_abilities (user_id,abilities) VALUES (?,?)',[result.insertId,JSON.stringify(data.ability)]);}
   if(updating) {await connection.execute('INSERT INTO user_abilities (user_id,abilities) VALUES (?,?) ON DUPLICATE KEY UPDATE abilities=VALUES(abilities)',[id,JSON.stringify(data.ability)]);await connection.execute('UPDATE users SET name=?,email=?,job=?,birthday=? WHERE id=?',[data.name,data.email,data.job,data.birthday,id]);if(passwordHash) await connection.execute('UPDATE users SET password_hash=? WHERE id=?',[passwordHash,id]);if(passwordHash || existing.job!==data.job || JSON.stringify(userAbilities(existing))!==JSON.stringify(data.ability)) await connection.execute('DELETE FROM sessions WHERE user_id=?',[id]);}
   if(deleting) await connection.execute('DELETE FROM users WHERE id=?',[id]);
   await connection.execute('INSERT INTO user_logs (actor,action,subject) VALUES (?,?,?)',[user.email,creating?'Created user':updating?'Updated user':'Deleted user',data?.email || existing.email]);
   await connection.commit();return send(res,200,{ok:true});
  } catch(error) {await connection.rollback();throw error;} finally {connection.release();}
 } catch(error) {if(error.code==='ER_DUP_ENTRY') return send(res,409,{error:'That email is already in use.'});if(!error.status) console.error(error.code || error.message);send(res,error.status || 500,{error:error.status?error.message:'Database or server error. Check backend configuration.'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Songam API: http://127.0.0.1:${port}`));
setInterval(()=>{for(const [key,value] of attempts) if(Date.now()>value.until) attempts.delete(key);pool.query('DELETE FROM sessions WHERE expires_at<=UTC_TIMESTAMP()').catch(()=>{});},900000).unref();
