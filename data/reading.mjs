const wordTexts = [
 'kot','pies','las','dom','sok','ser','mak','lis','lew','rak',
 'oko','nos','ucho','but','bal','gra','mur','dach','ryba','żaba',
 'mama','tata','brat','siostra','babcia','dziadek','dziecko','kolega','koleżanka','rodzina',
 'rower','hulajnoga','piłka','lalka','klocki','puzzle','kredka','ołówek','zeszyt','książka',
 'plecak','piórnik','gumka','linijka','nożyczki','papier','farba','pędzel','szkoła','klasa',
 'stół','krzesło','łóżko','szafa','lampa','okno','drzwi','dywan','koc','poduszka',
 'kuchnia','łazienka','pokój','balkon','ogród','garaż','schody','zegar','lustro','półka',
 'jabłko','gruszka','banan','śliwka','malina','truskawka','marchew','pomidor','ogórek','papryka',
 'chleb','bułka','masło','mleko','woda','kakao','herbata','zupa','makaron','naleśnik',
 'koń','krowa','owca','koza','kura','kaczka','mysz','jeż','wilk','zebra',
 'żyrafa','małpa','tygrys','słoń','motyl','pszczoła','biedronka','mrówka','ślimak','pająk',
 'drzewo','kwiat','trawa','liść','kamień','rzeka','jezioro','morze','góra','chmura',
 'słońce','księżyc','gwiazda','deszcz','śnieg','wiatr','tęcza','burza','lato','zima',
 'wiosna','jesień','rano','wieczór','balon','jutro','paczka','minuta','godzina','tydzień',
 'samochód','autobus','pociąg','tramwaj','statek','samolot','rakieta','most','droga','tunel'
];

function wordDistractors(text,index){
 const first=text[0],last=text[text.length-1];
 return wordTexts
  .map((candidate,candidateIndex)=>({
   candidate,
   candidateIndex,
   score:
    Math.abs(candidate.length-text.length)*5+
    (candidate[0]===first?-4:0)+
    (candidate[candidate.length-1]===last?-2:0)+
    Math.min(Math.abs(candidateIndex-index),wordTexts.length-Math.abs(candidateIndex-index))*.01
  }))
  .filter(item=>item.candidate!==text)
  .sort((a,b)=>a.score-b.score||a.candidate.localeCompare(b.candidate,'pl'))
  .slice(0,3)
  .map(item=>item.candidate);
}

const phrases = [
 ['zielony plecak','zielony plecak','czerwony plecak','zielony parasol','żółty plecak'],
 ['mały biały kot','mały biały kot','duży biały kot','mały szary kot','mały biały pies'],
 ['rower pod drzewem','rower pod drzewem','rower za domem','piłka pod drzewem','rower obok drzewa'],
 ['trzy żółte kwiaty','trzy żółte kwiaty','dwa żółte kwiaty','trzy białe kwiaty','cztery żółte kwiaty'],
 ['ciepła herbata','ciepła herbata','zimna herbata','ciepła zupa','słodka kawa'],
 ['książka na stole','książka na stole','książka pod stołem','zeszyt na stole','książka na półce'],
 ['pies za płotem','pies za płotem','pies przed płotem','kot za płotem','pies za domem'],
 ['duży niebieski balon','duży niebieski balon','mały niebieski balon','duży zielony balon','duży niebieski plecak']
];

const sentences = [
 ['Ola schowała klucze do kieszeni kurtki.','Gdzie Ola schowała klucze?','Do kieszeni kurtki','Do plecaka','Pod poduszkę','Do szuflady'],
 ['Po obiedzie Tomek poszedł z psem do parku.','Kiedy Tomek poszedł do parku?','Po obiedzie','Przed obiadem','Przed śniadaniem','Po kolacji'],
 ['Zosia wzięła parasol, bo za oknem padał deszcz.','Dlaczego Zosia wzięła parasol?','Padał deszcz','Świeciło słońce','Padał śnieg','Było gorąco'],
 ['Na stole były trzy jabłka. Adam zjadł jedno.','Ile jabłek zostało?','Dwa','Jedno','Trzy','Cztery'],
 ['Kasia oddała książkę do biblioteki i wypożyczyła komiks.','Co Kasia zabrała z biblioteki?','Komiks','Atlas','Słownik','Zeszyt'],
 ['Maja nakarmiła kota, a potem podlała kwiaty.','Co Maja zrobiła najpierw?','Nakarmiła kota','Podlała kwiaty','Umyła okno','Nakarmiła psa'],
 ['Piłka wpadła pod ławkę. Kuba wyciągnął ją patykiem.','Czym Kuba wyciągnął piłkę?','Patykiem','Stopą','Łopatką','Ręką'],
 ['Ania jedzie do babci pociągiem, a wraca autobusem.','Czym Ania wraca od babci?','Autobusem','Pociągiem','Samochodem','Rowerem']
];

export const READING = [
 ...wordTexts.map((text,index)=>({
  level:1,
  text,
  answer:text,
  options:[text,...wordDistractors(text,index)],
  prompt:'Które słowo było pokazane?',
  exposureMs:2600
 })),
 ...phrases.map(([text,answer,...other])=>({level:2,text,answer,options:[answer,...other],prompt:'Która fraza była pokazana?',exposureMs:3500})),
 ...sentences.map(([text,prompt,answer,...other])=>({level:3,text,prompt,answer,options:[answer,...other],exposureMs:5500}))
];
