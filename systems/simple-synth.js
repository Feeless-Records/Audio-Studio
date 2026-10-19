export class SimpleSynth {
  constructor(master=null,engine=null){
    this.engine=engine;this.engine?.register({stop:()=>{this.release();this.releaseAllNotes();}});
    this.master=master;this.context=null;this.analyser=null;this.worklet=null;this.loading=null;
    this.outputGain=Math.pow(10,-3/20);this.frequency=440;
    this.held=false;this.generation=0;this.voices=new Map();
  }
  setFrequency(value){
    this.frequency=Math.max(20,Math.min(20000,Number(value)||440));
    if(this.held)this.worklet?.port.postMessage({type:"frequency",key:"button",frequency:this.clampFrequency(this.frequency)});
  }
  clampFrequency(frequency){return Math.max(20,Math.min(frequency,this.context.sampleRate*.45));}
  async ensureContext(){
    if(!this.context)this.context=this.engine?this.engine.getContext():new (window.AudioContext||window.webkitAudioContext)();
    if(!this.loading)this.loading=this.initializeDSP();
    await this.loading;
    await this.context.resume();
  }
  async initializeDSP(){
    await this.context.audioWorklet.addModule("./systems/polyblep-saw-processor.js");
    this.analyser=this.context.createAnalyser();
    this.analyser.fftSize=4096;this.analyser.minDecibels=-60;
    this.analyser.maxDecibels=0;this.analyser.smoothingTimeConstant=.65;
    this.worklet=new AudioWorkletNode(this.context,"polyblep-saw",{outputChannelCount:[2]});
    const level=this.context.createGain();level.gain.value=this.outputGain;
    this.worklet.connect(level);level.connect(this.analyser);
    if(this.engine)this.analyser.connect(this.engine.input);
    else if(this.master)this.master.attach(this.context,this.analyser);
    else this.analyser.connect(this.context.destination);
  }
  async noteOn(key,frequency,note=null){
    if(this.voices.has(key))return;
    const voice={baseFrequency:frequency,note};
    this.voices.set(key,voice);
    try{
      await this.ensureContext();
      if(this.voices.get(key)!==voice)return;
      this.worklet.port.postMessage({type:"on",key,frequency:this.clampFrequency(voice.baseFrequency)});
    }catch(error){this.voices.delete(key);this.loading=null;throw error;}
  }
  noteOff(key){
    if(!this.voices.delete(key))return;
    this.worklet?.port.postMessage({type:"off",key});
  }
  releaseAllNotes(){
    for(const key of [...this.voices.keys()])this.noteOff(key);
  }
  retuneNotes(referenceHz){
    for(const [key,voice] of this.voices){
      if(voice.note===null)continue;
      voice.baseFrequency=referenceHz*Math.pow(2,(voice.note-69)/12);
      if(this.worklet)this.worklet.port.postMessage({type:"frequency",key,frequency:this.clampFrequency(voice.baseFrequency)});
    }
  }
  async press(){
    if(this.held)return;
    this.held=true;const generation=++this.generation;
    try{
      await this.ensureContext();
      if(!this.held||generation!==this.generation)return;
      this.worklet.port.postMessage({type:"on",key:"button",frequency:this.clampFrequency(this.frequency)});
    }catch(error){this.release();throw error;}
  }
  release(){
    this.held=false;++this.generation;
    this.worklet?.port.postMessage({type:"off",key:"button"});
  }
}
