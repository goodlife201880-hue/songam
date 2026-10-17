import mysql from 'mysql2/promise';
import {readFileSync,writeFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {randomBytes} from 'node:crypto';
import readline from 'node:readline';
import {Writable} from 'node:stream';
const envPath=new URL('../.env',import.meta.url);
let muted=false;
const output=new Writable({write(chunk,encoding,callback){if(!muted)process.stdout.write(chunk,encoding);callback();}});
const rl=readline.createInterface({input:process.stdin,output,terminal:true});
async function ask(prompt,secret=false){muted=false;return new Promise(resolve=>{rl.question(prompt,answer=>{muted=false;if(secret)process.stdout.write('\n');resolve(answer);});muted=secret;});}
let connection;
let step='reading configuration';
const secrets=[];
try {
 const original=readFileSync(envPath,'utf8');const env=parseEnv(original);
 if(env.DB_PASSWORD)secrets.push(env.DB_PASSWORD);
 const database=env.DB_NAME || 'songam_restaurant', user=env.DB_USER || 'songam';
 if(user!=='songam' || database!=='songam_restaurant')throw new Error('This repair only changes the songam account and songam_restaurant database.');
 const admin=await ask('MySQL administrator username [root]: ') || 'root';
 const password=await ask('MySQL administrator password (hidden): ',true);rl.close();
 secrets.push(password);
 step='connecting as administrator';
 connection=await mysql.createConnection({host:env.DB_HOST || '127.0.0.1',port:Number(env.DB_PORT || 3306),user:admin,password,connectTimeout:5000});
 const newPassword=randomBytes(24).toString('hex');secrets.push(newPassword);
 step='creating the database';
 await connection.query('CREATE DATABASE IF NOT EXISTS `songam_restaurant` CHARACTER SET utf8mb4');
 const account="'songam'@'localhost'";
 step='creating the songam account';
 await connection.query(`CREATE USER IF NOT EXISTS ${account} IDENTIFIED BY ?`,[newPassword]);
 step='updating the songam password';
 await connection.query(`ALTER USER ${account} IDENTIFIED BY ?`,[newPassword]);
 step='granting database permissions';
 await connection.query(`GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, REFERENCES ON songam_restaurant.* TO ${account}`);
 let updated=original;
 for(const [key,value] of Object.entries({DB_HOST:'localhost',DB_USER:user,DB_PASSWORD:newPassword,DB_NAME:database})){
  const line=key+'='+JSON.stringify(value);const pattern=new RegExp('^'+key+'=.*$','m');updated=pattern.test(updated)?updated.replace(pattern,()=>line):updated+'\n'+line+'\n';
 }
 step='saving database configuration';
 writeFileSync(envPath,updated);
 step='verifying the songam connection';
 const verify=await mysql.createConnection({host:'localhost',port:Number(env.DB_PORT || 3306),user,password:newPassword,database,connectTimeout:5000});await verify.query('SELECT 1');await verify.end();
 console.log('Database connection repaired and verified. .env updated; administrator password was not saved. Run npm.cmd run setup:manager if this is your first setup, then npm.cmd start.');
} catch(error){rl.close();let detail=String(error.sqlMessage || error.message || 'No details provided');for(const secret of secrets.filter(Boolean))detail=detail.split(secret).join('[redacted]');console.error('Repair failed while '+step);console.error('Code: '+(error.code || 'UNKNOWN')+'; errno: '+(error.errno || 'unknown'));console.error(detail);process.exitCode=1;}finally{if(connection)await connection.end();}


