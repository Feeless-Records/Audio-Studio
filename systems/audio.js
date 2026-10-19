export class AudioSystem {
  constructor(url="./Perkele!.wav"){this.url=url;this.playing=false;this.audio=new Audio();this.audio.preload="auto";this.audio.src=url;}
  async play(){
    if(this.playing)return;
    this.playing=true;
    try{
      this.audio.currentTime=0;
      await new Promise((resolve,reject)=>{
        const cleanup=()=>{this.audio.removeEventListener("ended",end);this.audio.removeEventListener("error",fail);};
        const end=()=>{cleanup();resolve();};
        const fail=()=>{cleanup();reject(new Error("Audio file unavailable or unsupported"));};
        this.audio.addEventListener("ended",end,{once:true});
        this.audio.addEventListener("error",fail,{once:true});
        this.audio.play().catch(fail);
      });
    }finally{this.playing=false;}
  }
  stop(){this.audio.pause();this.audio.currentTime=0;this.playing=false;}
}
