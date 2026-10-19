export class AudioSystem {
  constructor(){this.context=null;this.playing=false;}
  async playSine(frequency=600,duration=1){
    if(this.playing)return;
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)throw new Error("Web Audio API is unavailable");
    if(!this.context)this.context=new Context();
    await this.context.resume();
    const now=this.context.currentTime;
    const oscillator=this.context.createOscillator();
    const envelope=this.context.createGain();
    oscillator.type="sine";
    oscillator.frequency.setValueAtTime(frequency,now);
    envelope.gain.setValueAtTime(0,now);
    envelope.gain.linearRampToValueAtTime(0.18,now+0.01);
    envelope.gain.setValueAtTime(0.18,now+duration-0.02);
    envelope.gain.linearRampToValueAtTime(0,now+duration);
    oscillator.connect(envelope);
    envelope.connect(this.context.destination);
    this.playing=true;
    return new Promise((resolve)=>{
      oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();this.playing=false;resolve();};
      oscillator.start(now);
      oscillator.stop(now+duration);
    });
  }
}
