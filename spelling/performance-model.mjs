// Product budgets, not hardware utilisation or power measurements.
export const PERFORMANCE_HELP={
 frames:'Cel podglądu to 60 FPS: ok. 16,7 ms na klatkę. Zielony: co najmniej 55 FPS i 95% klatek do 20 ms. Żółty: co najmniej 30 FPS i 95% klatek do 50 ms. Czerwony: poniżej tych progów. To budżety tego narzędzia; iPhone Pro może odświeżać ekran szybciej.',
 script:'Czas przygotowania jednego efektu: zielony do 8 ms, żółty do 16,7 ms, czerwony powyżej. To czas wykonania JavaScriptu podczas tworzenia efektu, nie procent obciążenia procesora ani całej animacji.',
 memory:'Pamięć obejmuje stertę JavaScriptu tej karty. Jeśli przeglądarka udostępnia limit, zielony oznacza poniżej 50%, żółty do 75%, czerwony więcej. To orientacyjny budżet względem limitu przeglądarki, nie pomiar całej pamięci telefonu.',
 economical:'15 Hz ogranicza przeliczanie geometrii bańki. Drobinki nadal animuje przeglądarka płynnie. Porównaj wygląd z 24 Hz; mniejsza liczba aktualizacji może zmniejszyć pracę JS, ale nie gwarantuje tej samej percepcji ani określonej oszczędności baterii.'
};
export const STATUS_NAMES={green:'W budżecie',yellow:'Sprawdź',red:'Przekracza budżet',neutral:'Zbierz próbkę'};
export function performanceStatus(metrics){
 const cards=[];
 if(metrics.ready&&Number.isFinite(metrics.fps)&&Number.isFinite(metrics.p95))cards.push({id:'frames',label:'Płynność',value:`${metrics.fps} FPS`,detail:`95% klatek ≤ ${metrics.p95} ms · ${metrics.samples} klatek`,status:metrics.fps>=55&&metrics.p95<=20?'green':metrics.fps>=30&&metrics.p95<=50?'yellow':'red'});
 if(Number.isFinite(metrics.setupMs))cards.push({id:'script',label:'Przygotowanie efektu · JS',value:`${metrics.setupMs} ms`,detail:'Czas jednej operacji, nie procent CPU',status:metrics.setupMs<=8?'green':metrics.setupMs<=1000/60?'yellow':'red'});
 if(Number.isFinite(metrics.memory?.heapMB)){
  const m=metrics.memory,ratio=m.heapLimitMB>0?m.heapMB/m.heapLimitMB:null;
  cards.push({id:'memory',label:'Pamięć JS · cała karta',value:`${m.heapMB} MB`,detail:ratio!==null?`${(ratio*100).toFixed(1)}% z limitu ${m.heapLimitMB} MB`:'Sterta JavaScriptu tej karty',status:ratio===null?'neutral':ratio<.5?'green':ratio<=.75?'yellow':'red'});
 }
 const statuses=cards.map(c=>c.status),overall=statuses.includes('red')?'red':statuses.includes('yellow')?'yellow':statuses.includes('green')&&metrics.ready?'green':'neutral';
 return {cards,overall};
}
