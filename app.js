"use strict";

// Audio Studio vector text experiment:
// Text input -> stroke glyphs -> triangle geometry -> WebGPU.
// A small real WebAssembly module, compiled from C to wasm32, controls motion.
const WASM_BASE64 = "AGFzbQEAAAABCAFgA319fQF9AwIBAAQFAXABAQEFAwYIAX8BQYCIBAsHFQIGbWVtb3J5AgAIcG9zaXRpb24AAApiAWACAX0Bf0MAAAAAIQMCQCABQwAAAABfDQACQAJAIAAgApQgAZUiA4tDAAAAT11FDQAgA6ghBAwBC0GAgICAeCEEC0MAAIA/IAMgBLKTIgOTIAMgBEEBcRsgAZQhAwsgAws=";

const app = document.getElementById("app");
const h1 = document.createElement("h1");
h1.textContent = "Hello World!";
const subtitle = document.createElement("p");
subtitle.className = "subtitle";
subtitle.textContent = "Welcome to Feeless Records Audio Studio.";
app.append(h1, subtitle);

const canvas = document.getElementById("stage");
const input = document.getElementById("terminal");
const status = document.getElementById("status");

// Single-stroke vector alphabet: each path is a list of points in a 6x8 grid.
// Every line is tessellated into 2 triangles, not converted to a bitmap texture.
const glyphs = {
  A: "0,8 3,0 6,8|1,5 5,5",
  B: "0,0 0,8 4,8 6,6 4,4 0,4|4,4 6,2 4,0 0,0",
  C: "6,1 4,0 1,0 0,2 0,6 1,8 4,8 6,7",
  D: "0,0 0,8 3,8 6,6 6,2 3,0 0,0",
  E: "6,0 0,0 0,8 6,8|0,4 5,4",
  F: "0,8 0,0 6,0|0,4 5,4",
  G: "6,1 4,0 1,0 0,2 0,6 1,8 5,8 6,6 6,4 3,4",
  H: "0,0 0,8|6,0 6,8|0,4 6,4",
  I: "0,0 6,0|3,0 3,8|0,8 6,8",
  J: "0,0 6,0|5,0 5,6 4,8 1,8 0,6",
  K: "0,0 0,8|6,0 0,4 6,8",
  L: "0,0 0,8 6,8",
  M: "0,8 0,0 3,4 6,0 6,8",
  N: "0,8 0,0 6,8 6,0",
  O: "1,0 5,0 6,2 6,6 5,8 1,8 0,6 0,2 1,0",
  P: "0,8 0,0 5,0 6,2 5,4 0,4",
  Q: "1,0 5,0 6,2 6,6 5,8 1,8 0,6 0,2 1,0|3,5 7,9",
  R: "0,8 0,0 5,0 6,2 5,4 0,4|3,4 6,8",
  S: "6,1 4,0 1,0 0,2 1,4 5,4 6,6 5,8 2,8 0,7",
  T: "0,0 6,0|3,0 3,8",
  U: "0,0 0,6 1,8 5,8 6,6 6,0",
  V: "0,0 3,8 6,0",
  W: "0,0 1,8 3,4 5,8 6,0",
  X: "0,0 6,8|6,0 0,8",
  Y: "0,0 3,4 6,0|3,4 3,8",
  Z: "0,0 6,0 0,8 6,8",
  "0": "1,0 5,0 6,2 6,6 5,8 1,8 0,6 0,2 1,0|0,8 6,0",
  "1": "1,2 3,0 3,8|1,8 5,8",
  "2": "0,2 1,0 5,0 6,2 6,3 0,8 6,8",
  "3": "0,0 6,0 3,4 6,4 6,7 4,8 0,8",
  "4": "5,8 5,0 0,5 6,5",
  "5": "6,0 0,0 0,4 5,4 6,6 5,8 0,8",
  "6": "6,0 2,0 0,3 0,6 2,8 5,8 6,6 5,4 0,4",
  "7": "0,0 6,0 2,8",
  "8": "1,0 5,0 6,2 5,4 1,4 0,2 1,0|1,4 0,6 1,8 5,8 6,6 5,4",
  "9": "6,4 1,4 0,2 1,0 5,0 6,2 6,6 4,8 0,8",
  "!": "3,0 3,5|3,7 3,8",
  "?": "0,2 1,0 5,0 6,2 3,5|3,7 3,8",
  ".": "3,7 3,8",
  ",": "3,7 2,9",
  ":": "3,2 3,3|3,6 3,7",
  "-": "1,4 5,4",
  "/": "0,8 6,0",
  "'": "3,0 2,2",
  " ": ""
};

function makeSegments(str) {
  const lines = [];
  let pen = 0;
  for (const char of str.toUpperCase()) {
    const paths = (glyphs[char] ?? glyphs["?"]).split("|");
    for (const path of paths) {
      if (!path) continue;
      const points = path.split(" ").map(pair => pair.split(",").map(Number));
      for (let i = 1; i < points.length; i++) {
        lines.push([pen + points[i - 1][0], points[i - 1][1],
                    pen + points[i][0], points[i][1]]);
      }
    }
    pen += 9;
  }
  return { lines, width: Math.max(0, pen - 3) };
}
function makeTriangles(lines, scale, originY) {
  const out = [];
  for (const [x1, y1, x2, y2] of lines) {
    const ax = x1 * scale, ay = originY + y1 * scale;
    const bx = x2 * scale, by = originY + y2 * scale;
    const dx = bx - ax, dy = by - ay;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length * scale * 0.42;
    const ny = dx / length * scale * 0.42;
    out.push(ax + nx, ay + ny, ax - nx, ay - ny, bx + nx, by + ny,
             bx + nx, by + ny, ax - nx, ay - ny, bx - nx, by - ny);
  }
  return new Float32Array(out);
}
const shader = `
struct Uniforms { viewport: vec2f, offset: vec2f }
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
struct VertexInput { @location(0) position: vec2f }
struct VertexOutput { @builtin(position) position: vec4f }
@vertex fn vs(input: VertexInput) -> VertexOutput {
  let pixel = input.position + uniforms.offset;
  let clip = vec2f(pixel.x / uniforms.viewport.x * 2.0 - 1.0,
                   1.0 - pixel.y / uniforms.viewport.y * 2.0);
  var output: VertexOutput;
  output.position = vec4f(clip, 0.0, 1.0);
  return output;
}
@fragment fn fs() -> @location(0) vec4f {
  return vec4f(1.0, 0.76, 0.21, 1.0);
}`;

async function start() {
  const wasmBytes = Uint8Array.from(atob(WASM_BASE64), char => char.charCodeAt(0));
  let position;
  let wasmActive = false;
  try {
    const wasm = await WebAssembly.instantiate(wasmBytes);
    position = wasm.instance.exports.position;
    wasmActive = true;
  } catch (error) {
    console.warn("WebAssembly unavailable, using JS motion:", error);
    position = (t, length, speed) => {
      if (length <= 0) return 0;
      const segment = Math.floor(t * speed / length);
      const part = t * speed / length - segment;
      return length * (segment % 2 ? 1 - part : part);
    };
  }

  let context, device, pipeline, bindGroup, vertexBuffer, uniformBuffer;
  let webgpu = false;
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw new Error("No GPU adapter");
      device = await adapter.requestDevice();
      context = canvas.getContext("webgpu");
      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "premultiplied" });
      const module = device.createShaderModule({ code: shader });
      pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module, entryPoint: "vs", buffers: [{
          arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }]
        }] },
        fragment: { module, entryPoint: "fs", targets: [{ format }] },
        primitive: { topology: "triangle-list" }
      });
      uniformBuffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{
        binding: 0, resource: { buffer: uniformBuffer }
      }] });
      webgpu = true;
    } catch (error) { console.warn("WebGPU unavailable, using vector Canvas fallback:", error); }
  }
  const context2d = webgpu ? null : canvas.getContext("2d");
  let data, triangles, scale, textWidth, y, dirty = true;
  const speed = 260;
  function rebuild() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewportWidth * ratio);
    canvas.height = Math.round(viewportHeight * ratio);
    if (context2d) context2d.setTransform(ratio, 0, 0, ratio, 0, 0);
    data = makeSegments(input.value.slice(0, 80));
    scale = Math.min(4, Math.max(0.5, (viewportWidth - 20) / Math.max(1, data.width)));
    textWidth = data.width * scale;
    y = Math.max(25, viewportHeight * 0.22);
    triangles = makeTriangles(data.lines, scale, y);
    if (webgpu) {
      if (vertexBuffer) vertexBuffer.destroy();
      vertexBuffer = device.createBuffer({
        size: Math.max(4, triangles.byteLength),
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      if (triangles.length) device.queue.writeBuffer(vertexBuffer, 0, triangles);
    }
    dirty = false;
  }
  input.addEventListener("input", () => { dirty = true; });
  window.addEventListener("resize", () => { dirty = true; });
  status.textContent = (webgpu ? "WebGPU vector triangles" : "Canvas 2D vector fallback") +
    " · " + (wasmActive ? "WebAssembly animation" : "JavaScript animation") +
    " · editable text";
  const startTime = performance.now();
  function frame(time) {
    if (dirty) rebuild();
    const travel = Math.max(0, window.innerWidth - textWidth);
    const x = position((time - startTime) / 1000, travel, speed);
    if (webgpu) {
      device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([window.innerWidth, window.innerHeight, x, 0]));
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          loadOp: "clear", storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 0 }
        }]
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, vertexBuffer);
      pass.draw(triangles.length / 2);
      pass.end();
      device.queue.submit([encoder.finish()]);
    } else {
      context2d.clearRect(0, 0, canvas.width, canvas.height);
      context2d.save();
      context2d.translate(x, y);
      context2d.strokeStyle = "#ffca54";
      context2d.lineWidth = scale * 0.84;
      context2d.lineCap = "round";
      context2d.lineJoin = "round";
      context2d.beginPath();
      for (const [x1, y1, x2, y2] of data.lines) {
        context2d.moveTo(x1 * scale, y1 * scale);
        context2d.lineTo(x2 * scale, y2 * scale);
      }
      context2d.stroke();
      context2d.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
start().catch(error => {
  console.error(error);
  status.textContent = "Renderer error: " + error.message;
});
