import {validatePublishedCatalog} from './library-index.mjs';

export const ASSET_ORIGIN='https://mala-nauka-assets.vercel.app/';
export const ASSET_CATALOG_URL=new URL('asset-catalog.json',ASSET_ORIGIN).href;
export const MANAGED_ASSET_PATH=/^assets\/managed\/([0-9a-f]{64})\.(png|jpe?g|webp|avif)$/;
export const sha256=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');

export async function readPublishedCatalog(fetcher=fetch,url=ASSET_CATALOG_URL){
 let response;
 try{response=await fetcher(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});}
 catch(error){throw Error('Nie można odczytać publicznego indeksu biblioteki. Sprawdź sieć i przekierowania logowania: '+error.message);}
 if(!response.ok)throw Error('Indeks biblioteki nie odpowiada: HTTP '+response.status);
 if(!response.headers?.get('content-type')?.includes('application/json'))throw Error('Biblioteka zwróciła stronę zamiast JSON. Sprawdź publiczny adres biblioteki i ochronę wdrożenia.');
 return validatePublishedCatalog(await response.json());
}

export function assertPublishedAssets(assets,published){
 const index=new Map(published.files.map(file=>[file.path,file]));
 for(const asset of assets){
  const file=index.get(asset.path);
  if(!file||file.sha256!==asset.sha||file.size!==asset.size)throw Error('Nieopublikowana lub niezgodna grafika: '+asset.path);
 }
}

// Verify the bytes through the same public URL used by the PWA rewrite.
// A manifest entry alone cannot prove that an image is actually available.
export async function verifyPublishedImages(expected,fetcher=fetch){
 for(let offset=0;offset<expected.length;offset+=4)await Promise.all(expected.slice(offset,offset+4).map(async file=>{
  const response=await fetcher(new URL(file.path,ASSET_ORIGIN).href,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Grafika biblioteki nie odpowiada: HTTP '+response.status+' '+file.path);
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength!==file.size||await sha256(bytes)!==file.sha)throw Error('Niezgodne bajty grafiki w bibliotece: '+file.path);
 }));
}
