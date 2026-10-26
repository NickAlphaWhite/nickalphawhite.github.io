import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wheelPixels,fieldOfView,createHallZoom} from '../assets/zoom-controls.js';
test('wheel modes normalize consistently and discard non-finite movement',()=>{
  assert.equal(wheelPixels({deltaY:2,deltaMode:1}),32);
  assert.equal(wheelPixels({deltaY:1,deltaMode:2},400),400);
  assert.equal(wheelPixels({deltaY:Infinity}),0);
  assert.equal(wheelPixels({deltaY:-100000}),-600);
});
test('optical zoom preserves base FOV and narrows the view at higher magnification',()=>{
  assert.ok(Math.abs(fieldOfView(64,1)-64)<1e-9);
  assert.ok(fieldOfView(64,3)>20&&fieldOfView(64,3)<25);
});
test('hall zoom is bounded, ignores hidden views and browser zoom, and resets',()=>{
  const element=new EventTarget(),camera={fov:64,updates:0,updateProjectionMatrix(){this.updates++}};
  let enabled=true,manual=0;
  const controls=createHallZoom({element,camera,isEnabled:()=>enabled,onInteraction:()=>manual++});
  const wheel=(deltaY,ctrlKey=false)=>element.dispatchEvent(Object.assign(new Event('wheel',{cancelable:true}),{deltaY,deltaMode:0,ctrlKey}));
  wheel(-300);assert.ok(controls.getZoom()>1);assert.ok(camera.fov<64);assert.equal(manual,1);
  for(let i=0;i<20;i++)wheel(-600);assert.equal(controls.getZoom(),3);
  const updates=camera.updates;wheel(-300,true);assert.equal(camera.updates,updates);
  enabled=false;wheel(300);assert.equal(controls.getZoom(),3);
  controls.reset();assert.equal(controls.getZoom(),1);assert.ok(Math.abs(camera.fov-64)<1e-9);
  controls.setZoom(NaN);assert.equal(controls.getZoom(),1);controls.dispose();
});
