// The browser scales one portrait canvas. Its internal viewport stays fixed,
// so resizing the window cannot stretch art or rearrange the current round.
const standalone=navigator.standalone===true||matchMedia('(display-mode:standalone)').matches||matchMedia('(display-mode:fullscreen)').matches;
const embedded=new URLSearchParams(location.search).get('view')==='game';
if(standalone){
  document.documentElement.classList.add('scenic-standalone');
  // Match orthography: the photograph outlives the game container and paints
  // the full native canvas, while only controls use the safe-area insets.
  document.body.prepend(document.querySelector('.scenic-scenery'));
}
if(standalone||embedded||window.top!==window){
  const script=document.createElement('script');script.type='module';script.src=new URL('./scenic-preview.mjs?v=35',import.meta.url).href;document.body.append(script);
}else{
  const width=390,height=844,maxWidth=480;
  const style=document.createElement('style');
  style.textContent=`html,body{height:100%;min-height:0;background:#253222;overflow:hidden}.scenic-browser-shell{position:fixed;inset:0;display:grid;place-items:center}.scenic-browser-frame{position:relative;flex:none}.scenic-browser-frame iframe{position:absolute;inset:0;width:${width}px;height:${height}px;border:0;transform-origin:0 0;display:block}`;
  document.head.append(style);
  const shell=document.createElement('div');shell.className='scenic-browser-shell';
  const frame=document.createElement('div');frame.className='scenic-browser-frame';
  const game=document.createElement('iframe');game.title='Mała Nauka — Flagi';game.name='scenic-game';
  const url=new URL(location.href);url.searchParams.set('view','game');game.src=url.href;
  frame.append(game);shell.append(frame);document.body.replaceChildren(shell);
  function fit(){
    const viewport=window.visualViewport;
    const scale=Math.min((viewport?.width||innerWidth)/width,(viewport?.height||innerHeight)/height,maxWidth/width);
    frame.style.width=width*scale+'px';frame.style.height=height*scale+'px';game.style.transform=`scale(${scale})`;
  }
  fit();addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
}
