/** Generic browser/device family module. No business dependencies. */
import {createAppProfile} from "./tablet-app.js";
export const tabletProfile=createAppProfile();
export function matchesTablet({width,coarse}){
 return width>=600&&(width<1024||coarse);
}
