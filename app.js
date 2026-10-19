import {animateFlying} from "./systems/animation.js";
import {createWelcome} from "./systems/layout.js";
import {applyTheme} from "./systems/theme.js";
import {renderText} from "./systems/text-system.js";
applyTheme("dark");
createWelcome(document.querySelector("#app"),"Hello World!","Welcome to Feeless Records Audio Studio.");
const text="Saatana! Perkele!";
const track=document.querySelector(".fly-track");
const label=document.querySelector("#flying-label");
label.textContent=text;
const animation=animateFlying(track);
const status=document.querySelector("#status");
renderText(document.querySelector("#flying"),text).then(({backend,vertexCount})=>{
  // Display exactly one visual layer, with the same controller regardless of backend.
  label.hidden=true;
  status.textContent=`WebAssembly ✓  ${backend} vector renderer ✓  ${vertexCount} vertices  shared animation ✓`;
}).catch(error=>{
  status.textContent="HTML text fallback active: "+error.message;
  console.error(error);
});
window.addEventListener("pagehide",()=>animation.stop(),{once:true});
