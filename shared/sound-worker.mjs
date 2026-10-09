import {generateLayer} from './sound-library.mjs';
// Long nature beds are rendered off the UI thread, once per arrangement.
self.onmessage=({data})=>{
 try{const samples=generateLayer(data.id,data.seconds,16000,data.settings);self.postMessage({request:data.request,samples},[samples.buffer]);}
 catch(error){self.postMessage({request:data.request,error:error.message});}
};
