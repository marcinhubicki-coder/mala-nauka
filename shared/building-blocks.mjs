// The library describes the same parts that the runtime annotates, not mock copies.
export const BLOCKS={
 jelly:{name:'Slidery jelly',level:'Grupa',recipe:'control-jelly',parts:['Tor / podkład','Aktywna bryła jelly','Etykieta tekstowa × liczba opcji','Stany: nieaktywny / aktywny / przeciągany'],groups:['jelly']},
 button:{name:'Guziki',level:'Grupa',recipe:'button-main',parts:['Podkład przycisku','Etykieta przycisku','Ikona (opcjonalna)'],groups:['button']},
 card:{name:'Kafle i podkłady',level:'Atom obiektu',recipe:'container-card',parts:['Powierzchnia','Obrys','Cień'],groups:['card']},
 answer:{name:'Odpowiedzi',level:'Grupa',recipe:'button-answer',parts:['Podkład odpowiedzi','Etykieta tekstowa','Ikona stanu (opcjonalna)'],groups:['answer']},
 slider:{name:'Slidery akcji',level:'Grupa',recipe:'container-result-continue-rail',parts:['Tor / podkład','Wypełnienie','Uchwyt','Ikona uchwytu','Etykieta początkowa','Etykieta ukończenia'],groups:['slider','sliderWrong','sliderResult']},
 progress:{name:'Postęp',level:'Grupa',recipe:'container-round-progress',parts:['Tor / podkład','Wypełnienie','Zakończenie paska','Drobinki zakończenia','Tekst wartości'],groups:['progress','resultText']},
 toggle:{name:'Przełączniki',level:'Grupa',recipe:'control-toggle',parts:['Tor / podkład','Bryła wyboru','Dwie etykiety'],groups:['toggle']}
};
export const BLUE_THEME={accent:'#187de0',light:'#48b6ff',middle:'#3199ef',bottom:'#116dca',border:'#8bc7ff',lip:'#145ead',shine:'#ffffff80',depth:'#145ead33',activeInk:'#ffffff',idleInk:'#426388'};
export const FAMILY_NAMES={default:'Domyślny · niebieski',spelling:'Ortografia',english:'Angielski',flags:'Flagi',reading:'Czytanie',math:'Matematyka'};
export function familyTokens(config,mode,group){return {...config.tokens?.[group],...config.familyTokens?.[mode]?.[group]};}
export function componentState(root){
 const pin=root?.querySelector('.pin-mode input:checked');if(pin)return pin.value==='none'?'no-pin':'pin';
 const scope=root?.querySelector('[name=spellingScope]:checked,[name=englishScope]:checked');if(scope)return scope.value;
 return 'default';
}
export function localStylePath(view,item){return item.state&&item.state!=='default'?`elementStates.${view}.${item.state}.${item.id}`:`elementOverrides.${view}.${item.id}`;}
export const VIEW_PARTS={
 login:['Logo','Karta gracza','Avatar + imię','Przyciski wyboru'],
 create:['Nagłówek + powrót','Kafel profilu','Avatar','Imię → atom tekstu','Przycisk Dalej'],
 pin:['Nagłówek','PIN / bez PIN → jelly','Kafel (wysokość auto)','PIN → klawiatura + cyfry','Bez PIN → informacja + Dalej'],
 profile:['Profil + avatar','Edycja profilu / PIN','Zmień gracza','Dźwięk i preferencje','Kopia danych'],
 home:['Tło','Powitanie','Wyniki','Kafle pięciu trybów','Ustawienia'],
 settings:['Nagłówek','Kafel misji + ilustracja','Kafel ustawień → 3 grupy','Numer + tekst → jelly','Grupa 3 → toggle + wybór czasu','Przycisk start'],
 game:['Tło','Nagłówek + zegar','Ilustracja / zadanie','Tekst zadania','Odpowiedzi','Podpowiedź / następne'],
 results:['Tło + ilustracja trybu','Bańka punktów','Kafel podsumowania','Postęp','Utrwalone / do powtórki','Slider nowej rundy','Moje wyniki','Powrót do ustawień'],
 progress:['Nagłówek z kontekstem powrotu','Wyniki','Puchary','Kolekcja','Historia rund']
};
