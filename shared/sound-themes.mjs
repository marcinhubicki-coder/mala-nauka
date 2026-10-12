// Original compositions; reference soundscapes inform the character, not the recordings.
export const SOUND_ZONES={home:'Start i gracze',spelling:'Ortografia',math:'Matematyka',english:'Angielski',flags:'Flagi',reading:'Czytanie',results:'Wyniki i kolekcja'};
export const SOUND_COLLECTIONS={
 playground:{label:'Mała Nauka',note:'Drewniane nutki, bąbelki i lekka natura.',layers:['Krople deszczu','Wesoły strumyk','Łagodny podmuch','Szelest liści','Ptaki ogrodu','Spokojne fale','Świerszcze','Miękka otulina','Melodia zabawy','Ciepłe akordy']},
 garden:{label:'Japoński ogród',note:'Woda, bambusowe stuknięcia, pojedyncze ptaki i delikatne dzwonki.',layers:['Kapnięcia','Woda i bambus','Powiew w ogrodzie','Szelest bambusa','Samotny ptak','Woda w stawie','Cykady w oddali','Daleki wodospad','Dzwonki wiatrowe','Delikatne rezonanse']},
 forest:{label:'Pradawny las',note:'Różne ptasie nawoływania, suche liście i odległy strumień.',layers:['Krople na liściach','Daleki strumień','Między drzewami','Liście i gałązki','Ptaki leśne','Skrzydła i podszyt','Odgłosy polany','Cichy las','Drewniana melodia','Miękkie tony lasu']}
};
export const ZONE_FIELDS={volume:[0,100],tempo:[60,120],energy:[0,100],variation:[0,100],loopSeconds:[24,180]};
export const DEFAULT_AMBIENCE={
 home:{soundscape:'playground',ambientPreset:'custom',mix:[0,5,2,3,9,0,0,0,42,21],volume:85,tempo:84,energy:54,variation:61,loopSeconds:72},
 spelling:{soundscape:'playground',ambientPreset:'custom',mix:[0,14,2,4,11,0,0,0,31,24],volume:80,tempo:88,energy:49,variation:67,loopSeconds:72},
 math:{soundscape:'playground',ambientPreset:'custom',mix:[0,0,1,0,0,0,0,0,40,28],volume:78,tempo:92,energy:48,variation:57,loopSeconds:72},
 english:{soundscape:'garden',ambientPreset:'custom',mix:[7,16,4,3,14,5,1,2,22,12],volume:80,tempo:76,energy:38,variation:73,loopSeconds:96},
 flags:{soundscape:'forest',ambientPreset:'custom',mix:[0,13,5,18,24,10,3,0,17,15],volume:80,tempo:78,energy:43,variation:81,loopSeconds:96},
 reading:{soundscape:'forest',ambientPreset:'custom',mix:[0,3,2,6,14,1,2,0,9,20],volume:70,tempo:68,energy:28,variation:69,loopSeconds:96},
 results:{soundscape:'playground',ambientPreset:'custom',mix:[0,5,0,0,7,0,0,0,42,34],volume:85,tempo:82,energy:62,variation:63,loopSeconds:72}
};
export function soundZone(scene={}){
 const view=scene.view||scene.screen||'';
 if(['progress','collection','trophies','categories','rules','sessions','results','history'].includes(view)||/-(results|rule)$/.test(view))return 'results';
 if(['home','settings','players','players-empty','player-create','player-pin','player-unlock'].includes(view))return 'home';
 const mode=view.split('-')[0];if(Object.hasOwn(SOUND_ZONES,mode)&&!['home','results'].includes(mode))return mode;
 if(['wizard','game','loading'].includes(view)&&Object.hasOwn(DEFAULT_AMBIENCE,scene.mode))return scene.mode;
 return 'home';
}
export const ZONE_MELODIES={
 home:[0,2,3,1,4,2,1,3,0,1,4,3,2,1,3,0],
 spelling:[0,1,3,2,0,4,3,1,2,3,4,2,1,3,1,0],
 math:[0,3,1,4,2,3,0,2,4,3,2,1,0,2,3,0],
 english:[3,4,2,1,3,2,0,1,2,4,3,1,0,3,2,0],
 flags:[0,4,3,1,2,0,3,4,2,1,3,0,1,2,4,0],
 reading:[0,2,1,0,3,1,2,0,1,3,2,1,0,2,1,0],
 results:[0,2,4,3,0,3,4,2,3,4,5,3,2,1,3,0]
};
