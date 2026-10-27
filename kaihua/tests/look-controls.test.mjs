import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLookControls} from '../assets/look-controls.js';

function fixture(){
  const win=new EventTarget(),doc=new EventTarget(),element=new EventTarget(),capture=new Set();
  Object.assign(doc,{defaultView:win,hidden:false,pointerLockElement:null});
  Object.assign(element,{ownerDocument:doc,setPointerCapture:id=>capture.add(id),hasPointerCapture:id=>capture.has(id),releasePointerCapture:id=>capture.delete(id)});
  const state={yaw:0,pitch:0,enabled:true,guide:false,manual:0,inspect:0,lock:0};
  const controls=createLookControls({element,isEnabled:()=>state.enabled,isGuided:()=>state.guide,onManualLook:()=>{state.guide=false;state.manual++},onRotate:(y,p)=>{state.yaw+=y;state.pitch+=p},onInspect:()=>{state.inspect++;return false},onRequestLock:()=>state.lock++});
  const send=(target,type,properties={})=>target.dispatchEvent(Object.assign(new Event(type),properties));
  const pointer=(type,x=100,y=100,id=1)=>send(element,type,{pointerId:id,pointerType:'mouse',button:0,clientX:x,clientY:y});
  const lockedMove=(x,y=0)=>send(doc,'mousemove',{movementX:x,movementY:y});
  return {win,doc,element,state,controls,send,pointer,lockedMove};
}
test('normal drag is applied once per frame and a drag does not inspect',()=>{
  const f=fixture();f.pointer('pointerdown');f.pointer('pointermove',120);assert.equal(f.state.yaw,0);
  f.controls.update(.016);assert.ok(Math.abs(f.state.yaw+.09)<1e-9);
  f.controls.update(.016);assert.ok(Math.abs(f.state.yaw+.09)<1e-9);
  f.pointer('pointerup',120);f.send(f.element,'click');assert.equal(f.state.inspect,0);f.controls.dispose();
});

test('an unlocked click only captures; a locked click inspects the crosshair',()=>{
  const f=fixture();f.send(f.element,'click',{clientX:12,clientY:34,pointerType:'mouse'});
  assert.equal(f.state.lock,1);assert.equal(f.state.inspect,0);
  f.doc.pointerLockElement=f.element;f.send(f.doc,'pointerlockchange');
  f.send(f.element,'click',{clientX:12,clientY:34,pointerType:'mouse'});
  assert.equal(f.state.inspect,1);assert.equal(f.state.lock,1);
  f.doc.pointerLockElement=null;f.send(f.doc,'pointerlockchange');
  f.send(f.element,'click',{clientX:12,clientY:34,pointerType:'mouse'});
  assert.equal(f.state.inspect,1);assert.equal(f.state.lock,2);f.controls.dispose();
});

test('touch inspection retains tap coordinates without requesting pointer lock',()=>{
  const f=fixture();f.send(f.element,'click',{pointerType:'touch',clientX:12,clientY:34});
  assert.equal(f.state.inspect,1);assert.equal(f.state.lock,0);f.controls.dispose();
});
test('blur/focus invalidates old drag coordinates and queued input',()=>{
  const f=fixture();f.pointer('pointerdown');f.pointer('pointermove',120);f.send(f.win,'blur');f.pointer('pointermove',900);f.controls.update(.016);assert.equal(f.state.yaw,0);
  f.send(f.win,'focus');f.pointer('pointermove',910);f.controls.update(.016);assert.equal(f.state.yaw,0);
  f.pointer('pointerdown',910);f.pointer('pointermove',930);f.controls.update(.016);assert.ok(Math.abs(f.state.yaw+.09)<1e-9);f.controls.dispose();
});
test('first locked packet and screen-width outliers do not turn the camera',()=>{
  const f=fixture();f.doc.pointerLockElement=f.element;f.send(f.doc,'pointerlockchange');
  f.lockedMove(1800);f.controls.update(.016);assert.equal(f.state.yaw,0);
  f.lockedMove(1800);f.controls.update(.016);assert.equal(f.state.yaw,0);
  f.lockedMove(10);f.controls.update(.016);assert.ok(Math.abs(f.state.yaw+.022)<1e-9);f.controls.dispose();
});
test('a burst of many packets has one bounded turn and is not replayed',()=>{
  const f=fixture();f.doc.pointerLockElement=f.element;f.send(f.doc,'pointerlockchange');f.lockedMove(0);
  for(let i=0;i<100;i++)f.lockedMove(100);f.controls.update(.016);
  assert.ok(Math.abs(f.state.yaw+.16)<1e-9);f.controls.update(.016);assert.ok(Math.abs(f.state.yaw+.16)<1e-9);f.controls.dispose();
});
test('even a long rendering stall cannot apply a large queued half-turn',()=>{
  const f=fixture();f.doc.pointerLockElement=f.element;f.send(f.doc,'pointerlockchange');f.lockedMove(0);
  for(let i=0;i<100;i++)f.lockedMove(100);f.controls.update(3);assert.equal(f.state.yaw,-.25);
  f.controls.update(.016);assert.equal(f.state.yaw,-.25);f.controls.dispose();
});
test('visibility, resize, fullscreen and explicit reset drop active gestures',()=>{
  for(const transition of ['hidden','resize','fullscreen','reset']){
    const f=fixture();f.pointer('pointerdown');f.pointer('pointermove',120);
    if(transition==='hidden'){f.doc.hidden=true;f.send(f.doc,'visibilitychange');f.doc.hidden=false;f.send(f.doc,'visibilitychange')}
    if(transition==='resize')f.send(f.win,'resize');
    if(transition==='fullscreen')f.send(f.doc,'fullscreenchange');
    if(transition==='reset')f.controls.reset();
    f.pointer('pointermove',900);f.controls.update(.016);assert.equal(f.state.yaw,0,transition);f.controls.dispose();
  }
});
test('another finger, pointer cancellation and non-finite motion do not corrupt the gesture',()=>{
  const f=fixture();f.pointer('pointerdown');f.pointer('pointermove',900,100,2);f.controls.update(.016);assert.equal(f.state.yaw,0);
  f.pointer('pointercancel');f.pointer('pointermove',900);f.controls.update(.016);assert.equal(f.state.yaw,0);
  f.doc.pointerLockElement=f.element;f.send(f.doc,'pointerlockchange');f.lockedMove(0);f.lockedMove(NaN);f.lockedMove(Infinity);f.controls.update(.016);assert.equal(f.state.yaw,0);f.controls.dispose();
});
test('continuous ordinary movement can make a full turn without a sudden reversal',()=>{
  const f=fixture();f.doc.pointerLockElement=f.element;f.send(f.doc,'pointerlockchange');f.lockedMove(0);
  for(let i=0;i<300;i++){const before=f.state.yaw;f.lockedMove(10);f.controls.update(1/60);assert.ok(Math.abs(f.state.yaw-before+.022)<1e-9)}
  assert.ok(Math.abs(f.state.yaw+6.6)<1e-9);f.controls.dispose();
});
test('manual drag cancels the guide, but a stale locked packet does not',()=>{
  const f=fixture();f.state.guide=true;f.doc.pointerLockElement=f.element;f.send(f.doc,'pointerlockchange');f.lockedMove(100);assert.equal(f.state.guide,true);
  f.doc.pointerLockElement=null;f.send(f.doc,'pointerlockchange');f.pointer('pointerdown');f.pointer('pointermove',110);f.controls.update(.016);assert.equal(f.state.guide,false);assert.equal(f.state.manual,1);f.controls.dispose();
});
