import {GitClient,BRANCH,REPOSITORY} from './git-client.mjs';

const originalRequest=GitClient.prototype.request;
GitClient.prototype.request=async function(path,method='GET',body){
 try{
  return await originalRequest.call(this,path,method,body);
 }catch(error){
  const route=path||'(repo root)';
  let step='GitHub API';
  if(!path)step='repo access';
  else if(path.startsWith('git/ref/heads/'))step='branch access';
  else if(path.startsWith('contents/'))step='file access';
  const status=error.status?('HTTP '+error.status):'';
  const hint=
   error.status===404&&step==='repo access'
    ? 'Token nie widzi repo '+REPOSITORY+'.'
    : error.status===404&&step==='branch access'
      ? 'Repo jest dostępne, ale nie znaleziono brancha '+BRANCH+'.'
      : error.status===404&&step==='file access'
        ? 'Repo i branch są dostępne, ale nie znaleziono tego pliku.'
        : '';
  error.message=[error.message,'Etap: '+step,status,'Endpoint: '+method+' /repos/'+REPOSITORY+'/'+route,hint].filter(Boolean).join(' · ');
  throw error;
 }
};