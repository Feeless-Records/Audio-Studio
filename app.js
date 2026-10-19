import {AnimationSystem} from "./systems/animation.js";
import {LayoutSystem} from "./systems/layout.js";
import {ThemeSystem} from "./systems/theme.js";
import {TextSystem} from "./systems/text-system.js";
import {AudioSystem} from "./systems/audio.js";
import {SawWaveSystem} from "./systems/saw-wave.js";
import {FFTAnalyzer} from "./systems/fft-analyzer.js";
import {StudioCore} from "./systems/studio-core.js";
import {KeyboardSystem} from "./systems/keyboard.js";
class AudioStudioApp {
  constructor(){
    this.core=new StudioCore({bpm:120});
    this.theme=new ThemeSystem();
    this.audio=new AudioSystem();
    this.saw=new SawWaveSystem();
    this.keyboard=new KeyboardSystem(this.saw,{onError:error=>{this.status.textContent="Keyboard audio error: "+error.message;}});
    this.layout=new LayoutSystem(document.querySelector("#app"));
    this.animation=new AnimationSystem(document.querySelector(".fly-track"));
    this.text=new TextSystem(document.querySelector("#flying"));
    this.label=document.querySelector("#flying-label");
    this.status=document.querySelector("#status");
    this.message="Saatana! Perkele!";
  }
  async start(){
    this.theme.apply("dark");
    const controls=this.layout.renderWelcome("Hello World!","Welcome to Feeless Records Audio Studio.");
    this.startButton=controls.startButton;
    this.sawButton=controls.sawButton;
    this.frequencySlider=controls.frequencySlider;
    this.frequencyValue=controls.frequencyValue;
    this.fft=new FFTAnalyzer(controls.fftCanvas,[this.saw,this.audio]);
    this.fft.start();
    this.startButton.addEventListener("click",()=>this.playSound(this.startButton));
    this.configureSaw();
    this.keyboard.start();
    this.label.textContent=this.message;
    this.animation.start();
    try{
      await this.text.initialize();
      const result=await this.text.render(this.message);
      this.label.hidden=true;
      this.status.textContent="WASM + "+result.backend+" vector renderer + shared animation";
    }catch(error){
      this.status.textContent="HTML fallback + shared animation: "+error.message;
      console.error(error);
    }
    window.addEventListener("pagehide",()=>this.stop(),{once:true});
  }
  configureSaw(){
    const button=this.sawButton;
    const release=()=>this.releaseSaw();
    button.addEventListener("pointerdown",event=>{
      if(event.button!==0||this.saw.held)return;
      event.preventDefault();button.setPointerCapture(event.pointerId);
      this.pressSaw();
    });
    button.addEventListener("pointerup",release);
    button.addEventListener("pointercancel",release);
    button.addEventListener("lostpointercapture",release);
    button.addEventListener("keydown",event=>{
      if((event.code==="Space"||event.code==="Enter")&&!event.repeat){
        event.preventDefault();this.pressSaw();
      }
    });
    button.addEventListener("keyup",event=>{
      if(event.code==="Space"||event.code==="Enter"){event.preventDefault();release();}
    });
    window.addEventListener("blur",release);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)release();});
    this.frequencySlider.addEventListener("input",()=>this.updateFrequency());
    this.updateFrequency();
  }
  updateFrequency(){
    const position=Number(this.frequencySlider.value)/1000;
    const frequency=Math.round(20*Math.pow(1000,position));
    this.saw.setFrequency(frequency);
    this.frequencyValue.textContent=frequency.toLocaleString("ru-RU")+" Hz";
  }
  async pressSaw(){
    this.sawButton.classList.add("is-playing");
    this.sawButton.setAttribute("aria-pressed","true");
    try{await this.saw.press();}
    catch(error){this.status.textContent="Saw audio error: "+error.message;this.releaseSaw();}
  }
  releaseSaw(){
    this.saw.release();
    this.sawButton.classList.remove("is-playing");
    this.sawButton.setAttribute("aria-pressed","false");
  }
  async playSound(button){
    if(this.audio.playing)return;
    button.classList.add("is-playing");
    button.setAttribute("aria-pressed","true");
    button.disabled=true;
    try{await this.audio.play();}
    catch(error){console.error(error);this.status.textContent="Audio error: "+error.message;}
    finally{
      button.classList.remove("is-playing");
      button.setAttribute("aria-pressed","false");
      button.disabled=false;
    }
  }
  stop(){this.keyboard.stop();this.releaseSaw();this.animation.stop();this.fft?.stop();}
}
new AudioStudioApp().start();
