/** Generic browser/device family module. No business dependencies. */
import {createAppProfile} from "./desktop-app.js";
export const desktopProfile=createAppProfile();
export function matchesDesktop({width,coarse}){
 return width>=1024&&!coarse;
}
