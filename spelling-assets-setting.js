const STORAGE_KEY='malaNauka.spelling.assetsOnly';
const root=document.querySelector('#app');

function isEnabled(){
  try{return localStorage.getItem(STORAGE_KEY)==='1';}catch{return false;}
}

function saveEnabled(enabled){
  try{localStorage.setItem(STORAGE_KEY,enabled?'1':'0');}catch{}
}

function mount(){
  if(!root||root.dataset.view!=='settings'||root.querySelector('[data-spelling-assets-setting]'))return;
  const installation=root.querySelector('.installation');
  if(!installation)return;

  const card=document.createElement('section');
  card.className='card';
  card.dataset.spellingAssetsSetting='1';
  card.innerHTML=`<label class="setting" for="spelling-assets-only"><span><strong>Ortografia: tylko słowa z ilustracją</strong><small>Tryb testowy — losuje wyłącznie słowa z podpiętym assetem.</small></span><input id="spelling-assets-only" type="checkbox" role="switch" ${isEnabled()?'checked':''}></label>`;
  installation.insertAdjacentElement('beforebegin',card);

  card.querySelector('#spelling-assets-only')?.addEventListener('change',event=>{
    saveEnabled(event.target.checked);
  });
}

new MutationObserver(mount).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-view']});
mount();
