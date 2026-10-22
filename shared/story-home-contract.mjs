// One vocabulary for the Studio inspector and both home renderers.
export const HOME_STYLE_ROWS=[
 {id:'home-play-style',recipe:'control-jelly',kind:'toggle',parent:'layout-root',level:'group'},
 ...['story','free'].map(style=>({id:'home-style-'+style,recipe:'jelly-option',kind:'text',parent:'home-play-style',level:'atom'}))
];
const part=(id,name,kind,parent,level='atom',action)=>({id,recipe:id,name,kind,parent,level,...(action?{action}:{})});
export const STORY_HOME_ROWS=[
 part('story-home-stage','Pejzaż, postać i przygoda','container','layout-root','family'),
 part('story-home-landscape','Kadr świata','container','story-home-stage','group'),
 part('story-home-photo','Pejzaż aktualnego świata','image','story-home-landscape'),
 part('story-home-portrait-window','Odsłonięta postać','container','story-home-stage','group'),
 part('story-home-portrait','Ostatnio odkryty NPC','image','story-home-portrait-window'),
 part('story-home-greeting','Powitanie','container','story-home-stage','group'),
 part('story-home-hello','Powitanie gracza','text','story-home-greeting'),
 part('story-home-title','Twoja przygoda trwa','text','story-home-greeting'),
 part('story-home-world','Nazwa świata','text','story-home-mission'),
 part('story-home-panel','Matowe szkło · menu kampanii','container','story-home-stage','group'),
 part('story-home-wallet','Twoje iskry i moc','container','story-home-panel','group'),
 part('story-home-tools','Skarby i opowieść','container','story-home-panel','group'),
 part('story-home-sparks','Posiadane iskry','text','story-home-wallet'),
 part('story-home-forge','Zdobądź moc','button','story-home-wallet','atom','home-forge'),
 ...[['awards','Puchary i medale'],['book','Księga'],['artifact','Przedmiot świata']].map(([id,label])=>part('story-home-'+id,label,'button','story-home-tools','atom','home-'+id)),
 part('story-home-mission','Kafel kolejnego kroku','container','story-home-panel','group'),
 part('story-home-continue','Kontynuuj kampanię','button','story-home-mission','atom','campaign')
];
export const STORY_HOME_PARTS=STORY_HOME_ROWS.map(row=>({id:row.recipe,name:row.name,kind:row.kind,level:row.level,selector:'[data-ds-recipe="'+row.recipe+'"]',children:STORY_HOME_ROWS.filter(r=>r.parent===row.id).map(r=>r.recipe)}));
