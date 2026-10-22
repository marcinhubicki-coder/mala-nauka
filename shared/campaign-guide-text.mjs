// Known grammatical forms of the guide; other named characters keep their voices.
export function campaignGuideText(value,character='girl'){
 const text=String(value);if(character!=='boy'||!text.includes('Iskierk'))return text;
 return text.replaceAll('Iskierka','Iskier').replaceAll('Iskierki','Iskiera').replaceAll('Iskierkę','Iskiera').replaceAll('Iskierce','Iskierowi').replaceAll('Iskierką','Iskierem').replaceAll('Grota odpowiada jej','Grota odpowiada mu').replaceAll('aż sama zaczyna','aż sam zaczyna');
}
