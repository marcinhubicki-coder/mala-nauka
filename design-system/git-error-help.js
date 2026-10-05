(()=>{
 const explain=element=>{
  const value=element?.textContent?.trim()||'';
  if(value==='GitHub: Not Found'){
   element.textContent='GitHub 404 Not Found · Nie udało się odczytać repozytorium, brancha albo pliku konfiguracyjnego. Studio używa repo marcinhubicki-coder/mala-nauka i brancha design/system-v1. Najczęstsza przyczyna: wklejony token nie ma faktycznego dostępu do tego repozytorium. Sprawdź, czy wklejasz aktualny token po zapisaniu jego uprawnień.';
  }else if(value==='GitHub nie przyjął tokenu.'){
   element.textContent='GitHub 401 · Token jest nieprawidłowy, wygasł albo został unieważniony.';
  }else if(value.startsWith('Token potrzebuje uprawnienia')){
   element.textContent='GitHub 403 · Token widzi repozytorium, ale nie ma prawa zapisu. Ustaw Contents: Read and write dla mala-nauka.';
  }
 };
 const observer=new MutationObserver(()=>{
  const element=document.getElementById('git-error');
  if(element&&element.textContent.trim())explain(element);
 });
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();