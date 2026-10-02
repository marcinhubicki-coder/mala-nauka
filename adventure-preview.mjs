import { FLAGS } from './data/flags.mjs';

const phone=document.querySelector('#phone'),screen=document.querySelector('#screen');
const device=document.querySelector('#device'),open=document.querySelector('#open');
const country=document.querySelector('#flag-country'),countryLabel=document.querySelector('[for="flag-country"]');
const params=new URLSearchParams(location.search);
const records=new Map(FLAGS.map(record=>[record.id,record]));
for(const record of [...FLAGS].sort((a,b)=>a.country.localeCompare(b.country,'pl'))){
  const option=document.createElement('option');option.value=record.id;option.textContent=record.country;country.append(option);
}
country.value=records.has(params.get('country'))?params.get('country'):'pl';
const paths={
  profiles:'profile-preview-frame.html',wizard:'ortografia/wizard-preview-frame.html',
  flags:'flagi/preview-frame.html','flag-material':'flagi/preview-frame.html?country=pl&scene=material',
  'flag-question':'flagi/preview-frame.html?country=pl','flag-map':'flagi/preview-frame.html?country=pl&state=wrong',
  'flag-long':'flagi/preview-frame.html?country=cf&state=wrong','flag-nepal':'flagi/preview-frame.html?country=np',
  'flag-square':'flagi/preview-frame.html?country=ch','flag-country':'flagi/preview-frame.html?country=pl&variant=countries',
  'flag-capital':'flagi/preview-frame.html?country=lk&variant=capitals',progress:'progress-preview-frame.html'
};
function resize(){const [w,h]=device.value.split(',');phone.style.width=w+'px';phone.style.height=h+'px';}
function change(){
  const material=screen.value==='flag-material';country.hidden=countryLabel.hidden=!material;
  const path=paths[screen.value]||'ortografia/result-preview-frame.html?case='+screen.value+'&animate=1';
  const url=new URL(path,location.href);
  if(material)url.searchParams.set('country',country.value);
  else if(['flag-question','flag-map'].includes(screen.value))url.searchParams.set('country',country.value);
  open.href=url.href;url.searchParams.set('safe','1');
  if(screen.value==='progress')url.searchParams.set('chrome','1');
  phone.src=url.href;resize();
}
screen.addEventListener('change',change);device.addEventListener('change',resize);
country.addEventListener('change',()=>{
  change();const url=new URL(location.href);url.searchParams.set('screen','flag-material');url.searchParams.set('country',country.value);history.replaceState(null,'',url);
});
if([...screen.options].some(option=>option.value===params.get('screen')))screen.value=params.get('screen');
change();
