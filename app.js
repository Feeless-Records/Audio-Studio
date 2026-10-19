import {animateFlying} from "./systems/animation.js";
import {createWelcome} from "./systems/layout.js";
import {applyTheme} from "./systems/theme.js";
import {renderText} from "./systems/text-system.js";
applyTheme("dark");
createWelcome(document.querySelector("#app"),"Hello World!","Welcome to Feeless Records Audio Studio.");
const text="Saatana! Perkele!";
const label=document.querySelector("#flying-label");
label.textContent=text;
animateFlying(label);
const status=document.querySelector("#status");
renderText(document.querySelector("#flying"),text).then(({backend,vertexCount})=>{
 status.textContent=`WebAssembly ✓  ${backend} vector renderer ✓  ${vertexCount} vertices  CSS animation ✓`;
}).catch(error=>{
 status.textContent="JS/CSS animation active; vector renderer unavailable: "+error.message;
 console.error(error);
});
