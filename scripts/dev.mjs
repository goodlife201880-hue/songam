import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
if(!existsSync('.env')) {
 console.error('Missing .env. Copy .env.example to .env, fill in your MySQL settings, then run npm.cmd run setup:manager once.');
 process.exit(1);
}
if(!existsSync('node_modules/mysql2/package.json')) {
 console.error('MySQL dependency missing. Run npm.cmd install --include=dev first.');
 process.exit(1);
}
const children=[];
let stopping=false;
function stop(code=0) {if(stopping)return;stopping=true;for(const child of children)child.kill();process.exitCode=code;}
const backend=spawn(process.execPath,['--env-file=.env','server/index.mjs'],{cwd:root,stdio:['inherit','pipe','inherit']});children.push(backend);
let started=false, output='';
backend.stdout.on('data',chunk=>{
 process.stdout.write(chunk);output+=chunk.toString();
 if(!started && output.includes('Songam API:')) {
  started=true;
  const frontend=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--configLoader','native'],{cwd:root,stdio:'inherit'});children.push(frontend);
  frontend.on('error',error=>{console.error(error.message);stop(1);});
  frontend.on('exit',code=>stop(code || 0));
 }
});
backend.on('error',error=>{console.error(error.message);stop(1);});
backend.on('exit',code=>{if(!stopping)console.error('Backend stopped. Check MySQL settings in .env and the error above.');stop(code || 1);});
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
