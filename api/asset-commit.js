const OWNER='marcinhubicki-coder';
const REPO='mala-nauka';
const BRANCH='tools/manual-asset-loader';

function token(){return process.env.GITHUB_ASSET_LOADER_TOKEN||process.env.GITHUB_TOKEN||''}
async function github(path,options={}){
  const t=token();
  if(!t)throw Object.assign(new Error('Brak konfiguracji zapisu do GitHub (GITHUB_ASSET_LOADER_TOKEN).'),{status:503});
  const response=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${t}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(data.message||`GitHub ${response.status}`),{status:response.status});
  return data;
}
function decodeFile(data){return Buffer.from((data.content||'').replace(/\n/g,''),'base64').toString('utf8')}
function esc(value){return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
async function textBlob(content){return github('/git/blobs',{method:'POST',body:JSON.stringify({content,encoding:'utf-8'})})}
function addMappings(text,items){
  const marker='export const WORD_SCENES = new Map([';
  const at=text.indexOf(marker);
  if(at<0)throw new Error('Nie znaleziono WORD_SCENES.');
  const active=items.filter(x=>!text.includes(`['${esc(x.word)}',`));
  if(!active.length)return {text,active};
  const lines='\n  // Manual assets added with admin loader.\n'+active.map(x=>`  ['${esc(x.word)}', { key:'${esc(x.filename.replace(/\.(?:webp|jpe?g)$/,''))}', asset:'${esc(x.filename)}', layouts:['bubble'] }],`).join('\n');
  return {text:text.slice(0,at+marker.length)+lines+text.slice(at+marker.length),active};
}
function addOffline(text,items){
  const start=text.indexOf('const CORE=['),end=text.indexOf('];',start);
  if(start<0||end<0)throw new Error('Nie znaleziono listy CORE w sw.js.');
  const fresh=items.filter(x=>!text.includes(`'./assets/scenes/${x.filename}'`));
  if(!fresh.length)return text;
  let head=text.slice(0,end).replace(/\s*$/,'');
  if(!head.endsWith(','))head+=',';
  return head+'\n'+fresh.map(x=>`  './assets/scenes/${x.filename}',`).join('\n')+'\n'+text.slice(end);
}
function updateCoverage(text,items){
  const report=JSON.parse(text),names=new Set(items.map(x=>x.word));
  report.missing=(report.missing||[]).filter(x=>!names.has(x.word));
  report.missingWords=report.missing.length;
  report.assignedWords=report.totalWords-report.missingWords;
  report.uniqueImages=(report.uniqueImages||0)+items.length;
  report.missingByCategory=Object.fromEntries(Object.keys(report.missingByCategory||{}).map(category=>[category,report.missing.filter(x=>x.category===category).length]));
  return JSON.stringify(report,null,2)+'\n';
}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(process.env.VERCEL_ENV==='production')return res.status(403).json({error:'Loader działa tylko na preview.'});
  if(process.env.VERCEL_GIT_COMMIT_REF&&process.env.VERCEL_GIT_COMMIT_REF!==BRANCH)return res.status(403).json({error:'Nieprawidłowy branch preview.'});
  try{
    const items=req.body?.items;
    if(!Array.isArray(items)||!items.length||items.length>100)return res.status(400).json({error:'Nieprawidłowa paczka.'});
    for(const x of items){
      if(typeof x.word!=='string'||x.word.length>80||!/^[a-z0-9-]{1,80}\.(?:webp|jpe?g)$/.test(x.filename||'')||!/^[0-9a-f]{40}$/.test(x.blobSha||''))return res.status(400).json({error:'Nieprawidłowe dane elementu.'});
    }
    const ref=await github('/git/ref/heads/'+BRANCH);
    const baseSha=ref.object.sha;
    const commit=await github('/git/commits/'+baseSha);
    const enc=encodeURIComponent(BRANCH);
    const [sceneFile,swFile,reportFile]=await Promise.all([
      github('/contents/spelling/scenes.mjs?ref='+enc),
      github('/contents/sw.js?ref='+enc),
      github('/contents/ortografia/missing-scenes.json?ref='+enc)
    ]);
    const mapped=addMappings(decodeFile(sceneFile),items),active=mapped.active;
    if(!active.length)return res.status(409).json({error:'Te słowa są już przypisane w repo.'});
    for(const x of active){
      try{
        await github('/contents/assets/scenes/'+x.filename+'?ref='+enc);
        return res.status(409).json({error:`Plik ${x.filename} już istnieje.`});
      }catch(e){if(e.status!==404)throw e}
    }
    const nextSw=addOffline(decodeFile(swFile),active);
    const nextReport=updateCoverage(decodeFile(reportFile),active);
    const [sceneBlob,swBlob,reportBlob]=await Promise.all([textBlob(mapped.text),textBlob(nextSw),textBlob(nextReport)]);
    const tree=await github('/git/trees',{method:'POST',body:JSON.stringify({base_tree:commit.tree.sha,tree:[
      ...active.map(x=>({path:'assets/scenes/'+x.filename,mode:'100644',type:'blob',sha:x.blobSha})),
      {path:'spelling/scenes.mjs',mode:'100644',type:'blob',sha:sceneBlob.sha},
      {path:'sw.js',mode:'100644',type:'blob',sha:swBlob.sha},
      {path:'ortografia/missing-scenes.json',mode:'100644',type:'blob',sha:reportBlob.sha}
    ]})});
    const made=await github('/git/commits',{method:'POST',body:JSON.stringify({message:`Add ${active.length} manual spelling asset${active.length===1?'':'s'}`,tree:tree.sha,parents:[baseSha]})});
    await github('/git/refs/heads/'+BRANCH,{method:'PATCH',body:JSON.stringify({sha:made.sha,force:false})});
    return res.status(200).json({sha:made.sha,count:active.length,url:`https://github.com/${OWNER}/${REPO}/commit/${made.sha}`});
  }catch(error){return res.status(error.status||500).json({error:error.message||'Błąd tworzenia commita.'})}
}