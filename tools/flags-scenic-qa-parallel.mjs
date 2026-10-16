// Each engine keeps its own server, browser and output folder. Merge evidence
// only after both exit, so neither engine can erase the other's screenshots.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,readdir,readFile,writeFile,copyFile,unlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=process.env.SCENIC_QA_OUT||join(root,'docs/flags-adventure/qa-scenic'),scratch=await mkdtemp(join(tmpdir(),'scenic-qa-'));
const engines=['chromium','webkit'],phase=process.env.SCENIC_QA_PHASE||'full';
try{
 const results=await Promise.all(engines.map(engine=>new Promise(done=>{
  const child=spawn(process.execPath,[join(root,'tools/flags-scenic-qa.mjs')],{cwd:root,env:{...process.env,SCENIC_QA_PHASE:phase,SCENIC_QA_ENGINE:engine,SCENIC_QA_OUT:join(scratch,engine)},stdio:'inherit'});
  child.once('error',error=>done({engine,code:1,error:String(error)}));child.once('exit',code=>done({engine,code}));
 })));
 await mkdir(out,{recursive:true});for(const file of await readdir(out))if(file.endsWith('.jpg')||file==='report.json')await unlink(join(out,file));
 const reports=[];
 for(const engine of engines){
  const source=join(scratch,engine);let report;
  try{report=JSON.parse(await readFile(join(source,'report.json'),'utf8'));}catch{continue;}
  reports.push(report);for(const file of await readdir(source))if(file.endsWith('.jpg'))await copyFile(join(source,file),join(out,file));
 }
 const merged={phase,passed:reports.reduce((n,r)=>n+r.passed,0),total:reports.reduce((n,r)=>n+r.total,0),reports:reports.flatMap(r=>r.reports)};
 await writeFile(join(out,'report.json'),JSON.stringify(merged,null,2)+'\n');
 if(reports.length!==engines.length||results.some(r=>r.code!==0)||!merged.total)throw Error('Both browser engines must finish successfully: '+JSON.stringify(results));
 console.log(`PASS ${merged.passed}/${merged.total} scenic scenarios (${phase}, both engines)`);
}finally{await rm(scratch,{recursive:true,force:true});}
