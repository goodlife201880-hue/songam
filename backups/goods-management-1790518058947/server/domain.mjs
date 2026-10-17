import { randomBytes, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
export const permissions = Object.freeze({ manager: ['users','materials','food','imports','exports'], cooker: ['materials','food'], servicer: ['exports'], worker: [], guider: ['exports'] });
export function age(birthday, now = new Date()) { const [y,m,d] = birthday.split('-').map(Number); return now.getUTCFullYear()-y-((now.getUTCMonth()+1<m || (now.getUTCMonth()+1===m && now.getUTCDate()<d))?1:0); }
export function validate(data, creating = true) {
 const name = String(data.name || '').trim(), email = String(data.email || '').trim().toLowerCase(), job = data.job, birthday = data.birthday;
 if (!name || name.length > 120) throw new Error('Name is required (maximum 120 characters).');
 if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email.');
 if (!Object.hasOwn(permissions,job)) throw new Error('Choose a valid job.');
 if (typeof birthday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthday) || !Number.isFinite(Date.parse(birthday)) || new Date(birthday).toISOString().slice(0,10)!==birthday || birthday > new Date().toISOString().slice(0,10) || age(birthday)>120) throw new Error('Enter a valid birthday (age 0�120).');
 const password = data.password || '';
 if (typeof password !== 'string' || ((creating || password) && (password.length<12 || password.length>128))) throw new Error('Password must contain 12�128 characters.');
 const ability=data.ability === undefined ? [...permissions[job]] : data.ability;
 if(!Array.isArray(ability) || ability.some(item=>!permissions.manager.includes(item))) throw new Error('Choose valid management abilities.');
 if(job!=='manager' && ability.includes('users')) throw new Error('Only managers can receive User management access.');
 return {name,email,job,birthday,password,ability:[...new Set(ability)]};
}
export async function hashPassword(password) { const salt=randomBytes(16).toString('hex'); return salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex'); }
export async function verifyPassword(password,stored) { const [salt,key]=stored.split(':'); const actual=Buffer.from(await scrypt(password,salt,64)); const expected=Buffer.from(key,'hex'); return actual.length===expected.length && timingSafeEqual(actual,expected); }
export function publicUser(user) { return {id:user.id,name:user.name,email:user.email,job:user.job,birthday:user.birthday,age:age(user.birthday),ability:userAbilities(user)}; }


export function userAbilities(user) {
 const stored=user.abilities;
 const selected=stored==null ? permissions[user.job] : typeof stored==='string' ? JSON.parse(stored) : stored;
 return selected.filter(item=>permissions.manager.includes(item) && (item!=='users' || user.job==='manager'));
}
