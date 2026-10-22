import {CAMPAIGN_CAST_ART} from './campaign-cast-assets.mjs';import {CAMPAIGN_PORTAL_KEY_ART} from './campaign-portal-assets.mjs';
export const CAMPAIGN_ARTIFACTS={
 city:{id:'compass-key',name:'Klucz zielonego szlaku',parts:['Pierścień kompasu','Serce Światła','Trzonek z liściem'],art:CAMPAIGN_PORTAL_KEY_ART},
 jungle:{id:'crystal-lantern',name:'Latarnia kryształów',parts:['Złota oprawa','Kryształ światła','Uchwyt latarni']},
 caves:{id:'moonflower',name:'Kwiat księżyca',parts:['Srebrna łodyżka','Księżycowe płatki','Kropla rosy']},
 fairies:{id:'star-astrolabe',name:'Gwiezdne astrolabium',parts:['Pierścień orbit','Gwiezdny rdzeń','Ogon komety']},
 space:{id:'cloud-lyre',name:'Lira wiatrów',parts:['Chmurowa oprawa','Złote struny','Pióro wiatru']},
 heavens:{id:'tide-shell',name:'Muszla przypływów',parts:['Koralowa muszla','Perła przypływów','Morski trzonek']},
 underwater:{id:'seven-lights',name:'Serce siedmiu światów',parts:['Krąg wspomnień','Siedem barw','Światło księgi'],final:true}
};for(const artifact of Object.values(CAMPAIGN_ARTIFACTS))artifact.art??=CAMPAIGN_CAST_ART[artifact.id];
export const campaignArtifact=realm=>CAMPAIGN_ARTIFACTS[realm?.art||realm?.id||realm]||CAMPAIGN_ARTIFACTS.city;
export const CAMPAIGN_EPILOGUE={title:'Światło, które zostaje',paragraphs:['Serce siedmiu światów unosi się nad ostatnim kamieniem. W jego barwach widać port, zielone liście, kryształy, świetliki, gwiazdy, obłoki i spokojną rafę. Każde miejsce ma już swoją stronę w księdze.','„Dotarliśmy do końca tej opowieści — mówi Iskierka — ale odkrywanie nie musi się kończyć. Wiedza nie zamyka się w portalu. Podróżuje z Tobą”.','Światła łączą się w mały kompas. Nie wskazuje nowej krainy. Wskazuje Ciebie: osobę, która umie pytać, próbować jeszcze raz i wracać po kolejny ślad. Księga zostaje otwarta.']};
