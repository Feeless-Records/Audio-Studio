"use strict";
const canvas = document.getElementById("stage");
const input = document.getElementById("message");
const status = document.getElementById("status");
const encoder = new TextEncoder();
// Public-domain-style 5×7 bitmap patterns converted into geometric rectangles, not a texture.
// Each "on" cell becomes two GPU triangles: real vector geometry.
const GLYPHS = {
" ":["00000","00000","00000","00000","00000","00000","00000"],
"!":["00100","00100","00100","00100","00100","00000","00100"],
"?":["01110","10001","00001","00010","00100","00000","00100"],
".":["00000","00000","00000","00000","00000","00000","00100"],
"-":["00000","00000","00000","11111","00000","00000","00000"],
"A":["01110","10001","10001","11111","10001","10001","10001"],
"B":["11110","10001","10001","11110","10001","10001","11110"],
"C":["01111","10000","10000","10000","10000","10000","01111"],
"D":["11110","10001","10001","10001","10001","10001","11110"],
"E":["11111","10000","10000","11110","10000","10000","11111"],
"F":["11111","10000","10000","11110","10000","10000","10000"],
"G":["01111","10000","10000","10111","10001","10001","01111"],
"H":["10001","10001","10001","11111","10001","10001","10001"],
"I":["11111","00100","00100","00100","00100","00100","11111"],
"J":["00111","00010","00010","00010","10010","10010","01100"],
"K":["10001","10010","10100","11000","10100","10010","10001"],
"L":["10000","10000","10000","10000","10000","10000","11111"],
"M":["10001","11011","10101","10101","10001","10001","10001"],
"N":["10001","11001","10101","10011","10001","10001","10001"],
"O":["01110","10001","10001","10001","10001","10001","01110"],
"P":["11110","10001","10001","11110","10000","10000","10000"],
"Q":["01110","10001","10001","10001","10101","10010","01101"],
"R":["11110","10001","10001","11110","10100","10010","10001"],
"S":["01111","10000","10000","01110","00001","00001","11110"],
"T":["11111","00100","00100","00100","00100","00100","00100"],
"U":["10001","10001","10001","10001","10001","10001","01110"],
"V":["10001","10001","10001","10001","10001","01010","00100"],
"W":["10001","10001","10001","10101","10101","10101","01010"],
"X":["10001","10001","01010","00100","01010","10001","10001"],
"Y":["10001","10001","01010","00100","00100","00100","00100"],
"Z":["11111","00001","00010","00100","01000","10000","11111"],
"0":["01110","10011","10101","10101","11001","10001","01110"],
"1":["00100","01100","00100","00100","00100","00100","01110"],
"2":["01110","10001","00001","00010","00100","01000","11111"],
"3":["11110","00001","00001","01110","00001","00001","11110"],
"4":["00010","00110","01010","10010","11111","00010","00010"],
"5":["11111","10000","10000","11110","00001","00001","11110"],
"6":["01110","10000","10000","11110","10001","10001","01110"],
"7":["11111","00001","00010","00100","01000","01000","01000"],
"8":["01110","10001","10001","01110","10001","10001","01110"],
"9":["01110","10001","10001","01111","00001","00001","01110"]
};
let wasm, device, context, pipeline, vertexBuffer, count=0, fallbackSvg=null;
let extentX=0, extentY=7, offset=0, direction=1, last=0;
const SPEED=160;
async function initWasm() {
  const response=await fetch("./text-layout.wasm");
  if(!response.ok) throw new Error("WASM download failed: "+response.status);
  const bytes=await response.arrayBuffer();
  wasm=(await WebAssembly.instantiate(bytes)).instance.exports;
}
function layout(text) {
  const bytes=encoder.encode(text.replace(/[^\x20-\x7e]/g,"?")).slice(0,100);
  const view=new Uint8Array(wasm.memory.buffer);
  view.set(bytes,1024);
  const n=wasm.layout_text(1024,bytes.length,4096,100);
  const out=new Int32Array(wasm.memory.buffer,4096,n*3);
  return Array.from({length:n},(_,i)=>({char:String.fromCharCode(out[i*3]),x:out[i*3+1],y:out[i*3+2]}));
}
function shapes(text){
  const glyphs=layout(text), rectangles=[];
  for(const g of glyphs){
    const rows=GLYPHS[g.char]||GLYPHS["?"];
    for(let y=0;y<7;y++)for(let x=0;x<5;x++)if(rows[y][x]==="1") rectangles.push([g.x+x,g.y+y,0.88,0.88]);
  }
  extentX=Math.max(6,glyphs.length*6); extentY=7;
  return rectangles;
}
function geometry(rects) {
  const result=new Float32Array(rects.length*12);
  let o=0;
  for(const [x,y,w,h] of rects){
    for(const v of [x,y,x+w,y,x,y+h,x+w,y,x+w,y+h,x,y+h])result[o++]=v;
  }
  return result;
}
async function initGpu() {
  if(!navigator.gpu) throw new Error("WebGPU not available");
  const adapter=await navigator.gpu.requestAdapter();
  if(!adapter) throw new Error("No WebGPU adapter");
  device=await adapter.requestDevice();
  context=canvas.getContext("webgpu");
  if(!context) throw new Error("WebGPU canvas unavailable");
  const format=navigator.gpu.getPreferredCanvasFormat();
  context.configure({device,format,alphaMode:"opaque"});
  const shader=device.createShaderModule({code:`
struct Params { values: vec4f }
@group(0) @binding(0) var<uniform> params: Params;
struct VertexOut { @builtin(position) position: vec4f }
@vertex fn vs(@location(0) point: vec2f) -> VertexOut {
 let size=params.values.xy;
 let advance=params.values.z;
 let shift=params.values.w;
 let scale=min((size.x-24.0)/max(advance,1.0),(size.y-24.0)/7.0);
 let pix=vec2f(12.0+shift+point.x*scale,(size.y-7.0*scale)/2.0+point.y*scale);
 var out: VertexOut;
 out.position=vec4f(pix.x/size.x*2.0-1.0,1.0-pix.y/size.y*2.0,0.0,1.0);
 return out;
}
@fragment fn fs() -> @location(0) vec4f { return vec4f(1.0,0.71,0.26,1.0); }
`});
  pipeline=device.createRenderPipeline({
    layout:"auto",vertex:{module:shader,entryPoint:"vs",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},
    fragment:{module:shader,entryPoint:"fs",targets:[{format}]},primitive:{topology:"triangle-list"}
  });
  const uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}}]});
  return {uniform,bind};
}
function svgFallback(rects){
  canvas.style.display="none";
  fallbackSvg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  fallbackSvg.setAttribute("viewBox",`0 0 ${extentX} 7`);
  fallbackSvg.setAttribute("preserveAspectRatio","xMidYMid meet");
  fallbackSvg.style.cssText="width:100%;height:70vh;min-height:320px;overflow:visible;display:block";
  const group=document.createElementNS("http://www.w3.org/2000/svg","g");
  group.setAttribute("fill","#ffb542");
  for(const [x,y,w,h] of rects){
    const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
    for(const [k,v] of Object.entries({x,y,width:w,height:h}))r.setAttribute(k,v);
    group.append(r);
  }
  fallbackSvg.append(group); canvas.after(fallbackSvg);
  return group;
}
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.max(1,Math.floor(canvas.clientWidth*dpr));
  canvas.height=Math.max(1,Math.floor(canvas.clientHeight*dpr));
}
async function main(){
  await initWasm();
  let rects=shapes(input.value), gpu=null, svgGroup=null;
  try{gpu=await initGpu();status.textContent="WebAssembly + WebGPU vector triangles";}
  catch(err){status.textContent="WebAssembly + SVG fallback ("+err.message+")";svgGroup=svgFallback(rects);}
  function update(){
    rects=shapes(input.value);
    offset=0;direction=1;
    if(svgGroup){
      svgGroup.replaceChildren();
      for(const [x,y,w,h] of rects){
        const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
        for(const [k,v] of Object.entries({x,y,width:w,height:h}))r.setAttribute(k,v);
        svgGroup.append(r);
      }
    }else{
      const vertices=geometry(rects);count=vertices.length/2;
      vertexBuffer?.destroy();
      vertexBuffer=device.createBuffer({size:Math.max(4,vertices.byteLength),usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
      if(vertices.byteLength)device.queue.writeBuffer(vertexBuffer,0,vertices);
    }
  }
  input.addEventListener("input",update);
  update();
  function render(time){
    const dt=last?Math.min((time-last)/1000,.05):0;last=time;
    if(gpu){
      resize();
      const scale=Math.min((canvas.width-24)/Math.max(extentX,1),(canvas.height-24)/7);
      const maxOffset=Math.max(0,canvas.width-24-extentX*scale);
      if(!matchMedia("(prefers-reduced-motion: reduce)").matches){
        offset+=direction*SPEED*(window.devicePixelRatio||1)*dt;
        if(offset>maxOffset){offset=maxOffset;direction=-1;}
        if(offset<0){offset=0;direction=1;}
      }
      device.queue.writeBuffer(gpu.uniform,0,new Float32Array([canvas.width,canvas.height,extentX,offset]));
      const pass=device.createCommandEncoder();
      const rp=pass.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:.063,g:.071,b:.102,a:1}}]});
      rp.setPipeline(pipeline);rp.setBindGroup(0,gpu.bind);rp.setVertexBuffer(0,vertexBuffer);rp.draw(count);rp.end();
      device.queue.submit([pass.finish()]);
    }else if(svgGroup && !matchMedia("(prefers-reduced-motion: reduce)").matches){
      // SVG uses the same vector rectangles when WebGPU is unavailable.
      const maxOffset=2;
      offset+=direction*dt*.35;
      if(offset>maxOffset){offset=maxOffset;direction=-1;}
      if(offset<0){offset=0;direction=1;}
      svgGroup.setAttribute("transform",`translate(${offset},0)`);
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
main().catch(err=>{status.textContent="Startup error: "+err.message;console.error(err);});
