// Presentation varies; answers retain the country identity expected by Session.
export function scenicMode(question,requested){
 const mode=question?.flagGameType||requested;
 return ['countries','capitals'].includes(mode)?mode:'flags';
}
export const choiceText=(record,mode)=>mode==='capitals'?record.capital:record.country;
export const sessionValue=(record,question,hosted)=>!hosted||question.kind==='flag-country'?record.id:record.country;
export function questionInk(mode){
 return {countryName:mode!=='countries',capitalName:false,capitalHeading:mode==='countries',flag:false,selectedLabel:mode!=='countries'};
}
export const FULL_INK={countryName:true,capitalName:true,capitalHeading:true,flag:true,selectedLabel:true};
export const MODE_COPY={
 pl:{flags:{title:'Flagi',question:'Który kraj ma taką flagę?'},countries:{title:'Państwa',question:'Który kraj jest zaznaczony?'},capitals:{title:'Stolice',question:'Jaką stolicę ma ten kraj?'},auto:'Za chwilę następne zadanie…',chooseCapital:'Wybierz stolicę',chooseCountry:'Wybierz państwo'},
 en:{flags:{title:'Flags',question:'Which country has this flag?'},countries:{title:'Countries',question:'Which country is highlighted?'},capitals:{title:'Capitals',question:'What is this country’s capital?'},auto:'The next question is coming…',chooseCapital:'Choose the capital',chooseCountry:'Choose the country'}
};
