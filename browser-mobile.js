/** Generic browser/device family module. No business dependencies. */
import {createAppProfile} from "./mobile-app.js";
export const mobileProfile=createAppProfile();
export function matchesMobile({width,coarse}){
 return width<600;
}
