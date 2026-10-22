// Shared atomic vocabulary. A type describes one responsibility, not a new
// component per style, screen, state or piece of content.
export const ATOM_TYPES=Object.freeze({
 text:{name:'Tekst',kind:'text',purpose:'Treść z rolą typograficzną'},
 icon:{name:'Ikona',kind:'icon',purpose:'Pojedynczy symbol'},
 image:{name:'Obraz',kind:'image',purpose:'Grafika, ilustracja lub avatar'},
 button:{name:'Przycisk',kind:'button',purpose:'Pojedyncza akcja'},
 input:{name:'Pole tekstowe',kind:'input',purpose:'Wprowadzanie tekstu'},
 choice:{name:'Opcja',kind:'text',purpose:'Wybór jednej wartości'},
 toggle:{name:'Przełącznik',kind:'toggle',purpose:'Przełączanie stanu'},
 slider:{name:'Suwak',kind:'toggle',purpose:'Sterowanie wartością lub przesunięciem'},
 progress:{name:'Postęp',kind:'meter',purpose:'Wskazanie postępu'},
 timer:{name:'Zegar',kind:'timer',purpose:'Odmierzanie czasu'},
 badge:{name:'Etykieta',kind:'text',purpose:'Krótki komunikat lub stan'},
 surface:{name:'Powierzchnia',kind:'background',purpose:'Wypełnienie lub podkład'},
 key:{name:'Klawisz',kind:'key',purpose:'Pojedynczy przycisk PIN'}
});
export const ATOM_TYPE_IDS=Object.freeze(Object.keys(ATOM_TYPES));
// A group can have many atoms, but is not itself an atom. Layout wrappers are
// implementation details rather than new entries in the base vocabulary.
export function atomTypeFor({kind,recipe='',level='atom'}={}){
 if(level!=='atom')return null;
 if(kind==='container')return null;
 if(kind==='background')return 'surface';
 if(kind==='meter')return 'progress';
 if(kind==='key')return 'key';
 if(kind==='timer')return 'timer';
 if(kind==='input')return 'input';
 if(kind==='icon')return 'icon';
 if(kind==='image')return 'image';
 if(kind==='button')return 'button';
 if(kind==='toggle')return /slider|range|drag/i.test(recipe)?'slider':'toggle';
 if(kind==='text'){
  if(/jelly-option|choice|pin-option/.test(recipe))return 'choice';
  if(/badge|status|state/.test(recipe))return 'badge';
  return 'text';
 }
 return null;
}
export function countDesignConcepts(records){
 const registered=records.filter(row=>row.registered);
 const shared=registered.filter(row=>new Set(row.uses.map(use=>use.view)).size>=2);
 const atomTypes=new Set(registered.map(atomTypeFor).filter(Boolean));
 return {atomVocabulary:ATOM_TYPE_IDS.length,activeAtomTypes:atomTypes.size,sharedBuildingBlocks:shared.length,groups:registered.filter(row=>row.level==='group').length,families:registered.filter(row=>row.level==='family').length,instances:records.reduce((sum,row)=>sum+row.uses.length,0)};
}
