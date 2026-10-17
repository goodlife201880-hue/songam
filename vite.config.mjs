import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {parseEnv} from 'node:util';
const envPath=fileURLToPath(new URL('.env',import.meta.url));
const env=existsSync(envPath)?parseEnv(readFileSync(envPath,'utf8')):{};
const apiPort=Number(process.env.API_PORT || env.API_PORT || 3001);
export default {
 server:{host:'127.0.0.1',port:5173,strictPort:true,proxy:{'/api':{
  target:`http://127.0.0.1:${apiPort}`,
  configure(proxy){proxy.on('error',(_error,_req,res)=>{
   if(res && typeof res.writeHead==='function' && !res.headersSent){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'The backend is unavailable. Check the terminal and your MySQL configuration.'}));}
  });}
 }}}
};
