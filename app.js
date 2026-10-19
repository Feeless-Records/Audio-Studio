"use strict";
const app = document.querySelector("#app");
const title = document.createElement("h1");
title.textContent = "Hello World!";
const subtitle = document.createElement("p");
subtitle.textContent = "Welcome to Feeless Records Audio Studio.";
app.append(title, subtitle);

const canvas = document.querySelector("#flying");
const status = document.querySelector("#status");
const TEXT = "Saatana! Perkele!";
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

async function loadLayout() {
  const response = await fetch("./text-layout.wasm");
  if (!response.ok) throw new Error("Could not load WebAssembly: " + response.status);
  const {instance} = await WebAssembly.instantiate(await response.arrayBuffer());
  return instance.exports;
}
function makeRectangles(wasm, message) {
  const ascii = new TextEncoder().encode(message.toUpperCase());
  new Uint8Array(wasm.memory.buffer).set(ascii, 1024);
  const count = wasm.layout_text(1024, ascii.length, 4096, 100);
  const positions = new Int32Array(wasm.memory.buffer, 4096, count * 3);
  const vertices = [];
  for (let i = 0; i < count; i++) {
    const glyph = GLYPHS[String.fromCharCode(positions[i * 3])] || GLYPHS["?"];
    const gx = positions[i * 3 + 1], gy = positions[i * 3 + 2];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
      if (glyph[row][col] !== "1") continue;
      const x = gx + col, y = gy + row, r = 0.88;
      vertices.push(x,y, x+r,y, x,y+r, x+r,y, x+r,y+r, x,y+r);
    }
  }
  return {vertices:new Float32Array(vertices),width:Math.max(6,count*6)};
}
function svgFallback(data) {
  canvas.style.display = "none";
  const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox", "0 0 " + data.width + " 7");
  svg.setAttribute("aria-label", TEXT);
  svg.style.cssText = canvas.style.cssText + ";position:absolute;left:0;top:0;width:min(540px,75vw);height:100px;animation:fly 5s ease-in-out infinite alternate";
  const path = document.createElementNS("http://www.w3.org/2000/svg","path");
  let commands = "";
  for(let i=0;i<data.vertices.length;i+=12) {
    const x=data.vertices[i], y=data.vertices[i+1];
    commands += `M${x} ${y}h0.88v0.88h-0.88z`;
  }
  path.setAttribute("d",commands);path.setAttribute("fill","#ffb542");
  svg.append(path);canvas.after(svg);
}
async function renderGpu(data) {
  if (!navigator.gpu) throw new Error("WebGPU unsupported");
  const adapter=await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("WebGPU adapter unavailable");
  const device=await adapter.requestDevice();
  const context=canvas.getContext("webgpu");
  if (!context) throw new Error("WebGPU canvas unavailable");
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(canvas.clientWidth*dpr);
  canvas.height=Math.round(canvas.clientHeight*dpr);
  const format=navigator.gpu.getPreferredCanvasFormat();
  context.configure({device,format,alphaMode:"opaque"});
  const code=`
struct Uniforms { dimensions: vec2f, textWidth: f32, padding: f32 }
@group(0) @binding(0) var<uniform> u: Uniforms;
@vertex fn vertex(@location(0) p: vec2f) -> @builtin(position) vec4f {
 let scale=min((u.dimensions.x-16.0)/u.textWidth,(u.dimensions.y-16.0)/7.0);
 let origin=vec2f((u.dimensions.x-u.textWidth*scale)*0.5,(u.dimensions.y-7.0*scale)*0.5);
 let pixel=origin+p*scale;
 return vec4f(pixel.x/u.dimensions.x*2.0-1.0,1.0-pixel.y/u.dimensions.y*2.0,0.0,1.0);
}
@fragment fn fragment() -> @location(0) vec4f {return vec4f(1.0,0.71,0.26,1.0);}
`;
  const shader=device.createShaderModule({code});
  const pipeline=device.createRenderPipeline({layout:"auto",
    vertex:{module:shader,entryPoint:"vertex",buffers:[{arrayStride:8,attributes:[{shaderLocation:0,offset:0,format:"float32x2"}]}]},
    fragment:{module:shader,entryPoint:"fragment",targets:[{format}]},
    primitive:{topology:"triangle-list"}
  });
  const vertex=device.createBuffer({size:Math.max(data.vertices.byteLength,4),usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
  device.queue.writeBuffer(vertex,0,data.vertices);
  const uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  device.queue.writeBuffer(uniform,0,new Float32Array([canvas.width,canvas.height,data.width,0]));
  const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}}]});
  const encoder=device.createCommandEncoder();
  const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),
    clearValue:{r:0.063,g:0.071,b:0.102,a:1},loadOp:"clear",storeOp:"store"}]});
  pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.setVertexBuffer(0,vertex);
  pass.draw(data.vertices.length/2);pass.end();
  device.queue.submit([encoder.finish()]);
  // Rebuild on resize to preserve crisp vector edges.
  return device;
}
(async () => {
  try {
    const wasm=await loadLayout();
    const geometry=makeRectangles(wasm,TEXT);
    try {
      await renderGpu(geometry);
      status.textContent="WebAssembly ✓  WebGPU ✓  Vector geometry ✓  CSS animation ✓";
    } catch (error) {
      svgFallback(geometry);
      status.textContent="WebAssembly ✓  SVG vector fallback ✓  WebGPU unavailable";
      console.warn(error);
    }
  } catch(error) {
    status.textContent="WebAssembly error: " + error.message;
    console.error(error);
  }
})();
