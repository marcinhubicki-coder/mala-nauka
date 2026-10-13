// Own all temporary work. Pause preserves elapsed time; restart settles every
// pending promise, rather than leaving cancelled rAF promises hanging forever.
export class ScenicTimeline {
  paused=false; cancelled=false; jobs=new Set(); animations=new Set();
  setPaused(paused) {
    if(this.paused===paused || this.cancelled)return;
    this.paused=paused;
    for(const job of this.jobs)paused?job.pause():job.resume();
    for(const animation of this.animations)paused?animation.pause():animation.play();
  }
  wait(ms) {
    if(this.cancelled)return Promise.reject(new DOMException('Cancelled','AbortError'));
    return new Promise((resolve,reject)=>{
      let remaining=ms,started=0,timer;
      const job={
        pause:()=>{clearTimeout(timer);remaining=Math.max(0,remaining-(performance.now()-started));},
        resume:()=>{started=performance.now();timer=setTimeout(()=>{this.jobs.delete(job);resolve();},remaining);},
        cancel:()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));}
      };
      this.jobs.add(job);if(!this.paused)job.resume();
    });
  }
  tween(ms,paint) {
    if(this.cancelled)return Promise.reject(new DOMException('Cancelled','AbortError'));
    return new Promise((resolve,reject)=>{
      let elapsed=0,last=0,frame;
      const tick=now=>{
        if(last)elapsed+=now-last;last=now;
        const progress=Math.min(1,elapsed/ms);paint(progress);
        if(progress<1)frame=requestAnimationFrame(tick);
        else{this.jobs.delete(job);resolve();}
      };
      const job={
        pause:()=>{cancelAnimationFrame(frame);last=0;},
        resume:()=>{last=0;frame=requestAnimationFrame(tick);},
        cancel:()=>{cancelAnimationFrame(frame);reject(new DOMException('Cancelled','AbortError'));}
      };
      this.jobs.add(job);if(!this.paused)job.resume();
    });
  }
  async animate(element,frames,options) {
    if(this.cancelled)throw new DOMException('Cancelled','AbortError');
    const animation=element.animate(frames,options);
    this.animations.add(animation);if(this.paused)animation.pause();
    try{await animation.finished;}finally{this.animations.delete(animation);animation.cancel();}
  }
  cancel() {
    this.cancelled=true;
    for(const job of this.jobs)job.cancel();this.jobs.clear();
    for(const animation of this.animations)animation.cancel();this.animations.clear();
  }
}
