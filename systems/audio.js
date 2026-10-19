export class AudioSystem {
  constructor(url="./Perkele!.wav"){this.url=url;this.playing=false;this.audio=new Audio();this.audio.preload="auto";this.audio.src=url;this.context=null;this.analyser=null;this.source=null;this.outputGain=Math.pow(10,-6/20);this.volumeNode=null;}
  async play(){
    if(this.playing)return;
    this.playing=true;
    try{
      this.connectAnalyzer();
      await this.context.resume();
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
  connectAnalyzer(){
    if(this.analyser)return;
    const Context=window.AudioContext||window.webkitAudioContext;
    this.context=new Context();
    this.source=this.context.createMediaElementSource(this.audio);
    this.analyser=this.context.createAnalyser();
    this.analyser.fftSize=4096;this.analyser.minDecibels=-60;
    this.analyser.maxDecibels=0;this.analyser.smoothingTimeConstant=.65;
    this.volumeNode=this.context.createGain();
    this.volumeNode.gain.value=this.outputGain;
    this.source.connect(this.volumeNode);
    this.volumeNode.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }
  stop(){this.audio.pause();this.audio.currentTime=0;this.playing=false;}
}
