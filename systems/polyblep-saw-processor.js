// Runs on the real-time audio render thread. No DOM or allocations per sample.
class PolyBLEPSawProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.voices=new Map();
    this.port.onmessage=event=>this.handle(event.data);
  }
  handle(message){
    const {type,key}=message;
    if(type==="on"){
      this.voices.set(key,{phase:0,frequency:message.frequency,target:message.frequency,gain:0,gate:true});
    }else if(type==="off"){
      const voice=this.voices.get(key);if(voice)voice.gate=false;
    }else if(type==="frequency"){
      const voice=this.voices.get(key);if(voice)voice.target=message.frequency;
    }else if(type==="allOff"){
      for(const voice of this.voices.values())voice.gate=false;
    }
  }
  polyblep(t,dt){
    if(t<dt){const x=t/dt;return x+x-x*x-1;}
    if(t>1-dt){const x=(t-1)/dt;return x*x+x+x+1;}
    return 0;
  }
  renderVoice(voice){
    voice.frequency+=(voice.target-voice.frequency)*0.005;
    const dt=Math.max(0.000001,Math.min(0.49,voice.frequency/sampleRate));
    const sample=2*voice.phase-1-this.polyblep(voice.phase,dt);
    voice.phase+=dt;if(voice.phase>=1)voice.phase-=1;
    const target=voice.gate?1:0;
    voice.gain+=(target-voice.gain)*(voice.gate?.012:.025);
    return sample*voice.gain;
  }
  process(inputs,outputs){
    const output=outputs[0];if(!output?.length)return true;
    const left=output[0],right=output[1];
    for(let i=0;i<left.length;i++){
      let sum=0;
      for(const voice of this.voices.values())sum+=this.renderVoice(voice);
      left[i]=sum;
      if(right)right[i]=sum;
    }
    for(const [key,voice] of this.voices)if(!voice.gate&&voice.gain<0.0001)this.voices.delete(key);
    return true;
  }
}
registerProcessor("polyblep-saw",PolyBLEPSawProcessor);
