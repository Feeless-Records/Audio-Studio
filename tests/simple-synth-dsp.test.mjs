import assert from "node:assert/strict";
import {test} from "node:test";
import fs from "node:fs";
import vm from "node:vm";
test("PolyBLEP worklet generates finite output and releases voices",()=>{
  let Processor;
  const context={
    AudioWorkletProcessor:class {constructor(){this.port={onmessage:null};}},
    registerProcessor:(name,klass)=>{assert.equal(name,"polyblep-saw");Processor=klass;},
    sampleRate:48000,Map,Math
  };
  vm.runInNewContext(fs.readFileSync(new URL("../systems/polyblep-saw-processor.js",import.meta.url),"utf8"),context);
  const dsp=new Processor();
  dsp.port.onmessage({data:{type:"on",key:"q",frequency:440}});
  const left=new Float32Array(128),right=new Float32Array(128);
  for(let n=0;n<50;n++)dsp.process([] ,[[left,right]]);
  assert.ok(left.some(v=>v!==0));
  assert.ok(left.every(Number.isFinite));
  assert.deepEqual([...left],[...right]);
  dsp.port.onmessage({data:{type:"off",key:"q"}});
  for(let n=0;n<40;n++)dsp.process([],[[left,right]]);
  assert.equal(dsp.voices.size,0);
});
