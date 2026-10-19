// A single time-based controller moves every visual layer together.
// CSS owns appearance; JavaScript owns the shared position.
export function animateFlying(track, {speed=180, amplitude=24}={}) {
  let paused=false, frame=0, previous=0, x=0, direction=1;
  const update=(time)=>{
    const dt=previous?Math.min((time-previous)/1000,0.05):0;
    previous=time;
    const width=Math.min(track.clientWidth*0.75,540);
    const maxX=Math.max(0,track.clientWidth-width);
    if (!paused) {
      x+=direction*speed*dt;
      if (x>=maxX) {x=maxX;direction=-1;}
      if (x<=0) {x=0;direction=1;}
    }
    const y=maxX>0?Math.sin((x/maxX)*Math.PI)*amplitude:0;
    track.style.setProperty("--fly-x",x+"px");
    track.style.setProperty("--fly-y",y+"px");
    frame=requestAnimationFrame(update);
  };
  frame=requestAnimationFrame(update);
  return {
    pause(){paused=true;},
    play(){paused=false;previous=0;},
    stop(){cancelAnimationFrame(frame);track.style.removeProperty("--fly-x");track.style.removeProperty("--fly-y");}
  };
}
