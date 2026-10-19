import {ProjectSystem} from "./project.js";
import {DocumentSystem} from "./document.js";
import {TimelineSystem} from "./timeline.js";
import {SequencingSystem} from "./sequencing.js";
import {ParametricSystem} from "./parametric.js";
import {FrequencySystem} from "./frequency.js";
import {VelocitySystem} from "./velocity.js";
import {SoundSystem} from "./sound.js";
import {SamplingSystem} from "./sampling.js";
export class StudioCore {
  constructor({bpm=120}={}){
    this.project=new ProjectSystem({bpm});
    this.document=this.project.addDocument(new DocumentSystem({id:"arrangement",name:"Arrangement"}));
    this.timeline=new TimelineSystem({bpm});
    this.sequencer=new SequencingSystem({timeline:this.timeline,events:this.project.events});
    this.parameters=new ParametricSystem().define("cutoff",{value:1000,min:20,max:20000});
    this.frequency=FrequencySystem;this.velocity=VelocitySystem;
    this.sound=null;this.sampling=null;
  }
  connectAudio(context){this.sound=new SoundSystem(context);this.sampling=new SamplingSystem(context);return this;}
  setTempo(bpm){this.project.setTempo(bpm);this.timeline.setTempo(bpm);}
  scheduleBars(startBeat,endBeat){if(!this.sound)throw new Error("Call connectAudio first");return this.sequencer.schedule(this.sound,{startBeat,endBeat});}
}
