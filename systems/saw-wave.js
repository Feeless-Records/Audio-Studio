export class SawWaveSystem {
  constructor(){
    this.context=null;this.oscillator=null;this.gain=null;
    this.outputGain=Math.pow(10,-3/20);this.frequency=440;this.held=false;this.generation=0;this.analyser=null;
  }
  setFrequency(value){
    this.frequency=Math.max(20,Math.min(20000,Number(value)||440));
    if(this.oscillator && this.context){
      this.oscillator.frequency.setTargetAtTime(
        Math.min(this.frequency,this.context.sampleRate/2-1),this.context.currentTime,.008);
    }
  }
  async press(){
    if(this.held)return;
    this.held=true;
    const generation=++this.generation;
    try{
      if(!this.context)this.context=new (window.AudioContext||window.webkitAudioContext)();
      await this.context.resume();
      if(!this.held||generation!==this.generation)return;
      const now=this.context.currentTime;
      const oscillator=this.context.createOscillator();
      const gain=this.context.createGain();
      oscillator.type="sawtooth";
      oscillator.frequency.setValueAtTime(Math.min(this.frequency,this.context.sampleRate/2-1),now);
      gain.gain.setValueAtTime(0,now);
      gain.gain.linearRampToValueAtTime(this.outputGain,now+.012);
      oscillator.connect(gain);
      if(!this.analyser){this.analyser=this.context.createAnalyser();this.analyser.fftSize=4096;this.analyser.minDecibels=-60;this.analyser.maxDecibels=0;this.analyser.smoothingTimeConstant=.65;this.analyser.connect(this.context.destination);}
      gain.connect(this.analyser);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      this.oscillator=oscillator;this.gain=gain;oscillator.start(now);
    }catch(error){this.release();throw error;}
  }
  release(){
    this.held=false;++this.generation;
    if(!this.oscillator||!this.context)return;
    const now=this.context.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value,now);
    this.gain.gain.linearRampToValueAtTime(0,now+.018);
    this.oscillator.stop(now+.02);
    this.oscillator=null;this.gain=null;
  }
}
