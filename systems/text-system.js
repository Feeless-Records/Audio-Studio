import {loadLayout,makeRectangles} from "./text-processor.js";
import {renderVectorText} from "./text-renderer.js";
export async function renderText(canvas,text){
 const wasm=await loadLayout();
 const geometry=makeRectangles(wasm,text);
 const backend=await renderVectorText(canvas,geometry,text);
 return {backend,glyphCount:text.length,vertexCount:geometry.vertices.length/2};
}
