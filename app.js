import {AnimationSystem} from "./systems/animation.js";
import {LayoutSystem} from "./systems/layout.js";
import {ThemeSystem} from "./systems/theme.js";
import {TextSystem} from "./systems/text-system.js";
import {AudioSystem} from "./systems/audio.js";
class AudioStudioApp {
  constructor(){
    this.theme=new ThemeSystem();
    this.audio=new AudioSystem();
    this.layout=new LayoutSystem(document.querySelector("#app"));
    this.animation=new AnimationSystem(document.querySelector(".fly-track"));
    this.text=new TextSystem(document.querySelector("#flying"));
    this.label=document.querySelector("#flying-label");
    this.status=document.querySelector("#status");
    this.message="Saatana! Perkele!";
  }
  async start(){
    this.theme.apply("dark");
    const button=this.layout.renderWelcome("Hello World!","Welcome to Feeless Records Audio Studio.");
    button.addEventListener("click",()=>this.playSound(button));
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
  stop(){this.animation.stop();}
}
new AudioStudioApp().start();
