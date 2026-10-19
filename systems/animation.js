export class AnimationSystem {
  constructor(track,{speed=180,amplitude=24}={}){
    this.track=track;this.speed=speed;this.amplitude=amplitude;
    this.x=0;this.direction=1;this.previous=0;this.frame=null;this.paused=false;
    this.tick=this.tick.bind(this);
  }
  start(){if(this.frame===null)this.frame=requestAnimationFrame(this.tick);return this;}
  tick(timestamp){
    this.advance(timestamp);
    this.applyPosition();
    this.frame=requestAnimationFrame(this.tick);
  }
  advance(timestamp){
    const dt=this.previous?Math.min((timestamp-this.previous)/1000,.05):0;
    this.previous=timestamp;
    if(this.paused)return;
    const max=this.maxTravel();
    this.x+=this.direction*this.speed*dt;
    if(this.x>=max){this.x=max;this.direction=-1;}
    if(this.x<=0){this.x=0;this.direction=1;}
  }
  maxTravel(){return Math.max(0,this.track.clientWidth-Math.min(540,this.track.clientWidth*.75));}
  applyPosition(){
    const max=this.maxTravel();
    const y=max>0?Math.sin(Math.PI*this.x/max)*this.amplitude:0;
    this.track.style.setProperty("--fly-x",this.x+"px");
    this.track.style.setProperty("--fly-y",y+"px");
  }
  pause(){this.paused=true;}
  play(){this.paused=false;this.previous=0;this.start();}
  stop(){
    if(this.frame!==null)cancelAnimationFrame(this.frame);
    this.frame=null;this.previous=0;
  }
}
