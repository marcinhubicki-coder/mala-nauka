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
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(process.env.VERCEL_ENV==='production')return res.status(403).json({error:'Loader działa tylko na preview.'});
  if(process.env.VERCEL_GIT_COMMIT_REF&&process.env.VERCEL_GIT_COMMIT_REF!==BRANCH)return res.status(403).json({error:'Nieprawidłowy branch preview.'});
  try{
    const {filename,content}=req.body||{};
    if(!/^[a-z0-9-]{1,80}\.(?:webp|jpe?g)$/.test(filename||''))return res.status(400).json({error:'Nieprawidłowa nazwa pliku.'});
    if(typeof content!=='string'||content.length<100||content.length>600000)return res.status(400).json({error:'Nieprawidłowy rozmiar obrazu.'});
    const blob=await github('/git/blobs',{method:'POST',body:JSON.stringify({content,encoding:'base64'})});
    return res.status(200).json({sha:blob.sha});
  }catch(error){return res.status(error.status||500).json({error:error.message||'Błąd zapisu bloba.'})}
}