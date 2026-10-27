// Manual look input owns its gesture lifecycle. Rendering consumes rotation once
// per frame, so pointer packets cannot cause an unbounded camera jump.
export function createLookControls({element,isEnabled,isGuided,onManualLook,onRotate,onInspect,onRequestLock}){
  const doc=element.ownerDocument,win=doc.defaultView,listeners=[];
  let active=null,lastX=0,lastY=0,travel=0,dragged=false,suppressClick=false;
  let focused=true,skipLockedPacket=true,pendingYaw=0,pendingPitch=0;
  const locked=()=>doc.pointerLockElement===element;
  const usable=()=>focused&&!doc.hidden&&isEnabled();
  function listen(target,type,handler){target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler))}
  function clearGesture(){
    const pointer=active;active=null;travel=0;dragged=false;
    if(pointer!==null&&element.hasPointerCapture?.(pointer))element.releasePointerCapture(pointer);
  }
  function reset(){
    suppressClick=suppressClick||dragged;clearGesture();pendingYaw=0;pendingPitch=0;skipLockedPacket=true;
  }
  function queue(dx,dy,sx,sy){
    // Screen recentering / DPI changes can emit an entire screen-width packet.
    // Discard that packet and retain the new absolute baseline for the next one.
    if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>512||Math.abs(dy)>512)return;
    if(dx===0&&dy===0)return;
    onManualLook();pendingYaw-=dx*sx;pendingPitch-=dy*sy;
  }
  listen(doc,'mousemove',event=>{
    if(!locked()||!usable()||isGuided())return;
    // Browsers may report the cursor warp in the first packet after capture.
    if(skipLockedPacket){skipLockedPacket=false;return;}
    queue(event.movementX,event.movementY,.0022,.0022);
  });
  listen(element,'pointerdown',event=>{
    if(!isEnabled()||doc.hidden||locked()||event.button!==0||active!==null)return;
    focused=true;active=event.pointerId;lastX=event.clientX;lastY=event.clientY;
    travel=0;dragged=false;suppressClick=false;
    try{element.setPointerCapture?.(event.pointerId)}catch{/* Synthetic events have no browser pointer. */}
  });
  listen(element,'pointermove',event=>{
    if(!usable()||locked()||event.pointerId!==active)return;
    const dx=event.clientX-lastX,dy=event.clientY-lastY;
    lastX=event.clientX;lastY=event.clientY;
    travel+=Math.hypot(dx,dy);if(travel>3)dragged=true;
    queue(dx,dy,.0045,.0038);
  });
  listen(element,'pointerup',event=>{
    if(event.pointerId!==active)return;
    suppressClick=dragged;clearGesture();
  });
  for(const type of ['pointercancel','lostpointercapture'])listen(element,type,event=>{
    if(event.pointerId===active){suppressClick=true;reset();}
  });
  listen(element,'click',event=>{
    if(suppressClick){suppressClick=false;return;}
    if(!usable())return;
    // A desktop click resumes capture first, even when it lands on a mural.
    // Inspection while captured always uses the crosshair, never cursor coordinates.
    if(event.pointerType==='touch'){onInspect(event.clientX,event.clientY);return;}
    if(!locked()){onManualLook();onRequestLock();return;}
    onInspect();
  });
  listen(doc,'pointerlockchange',()=>{
    reset();
    if(locked()&&!isEnabled())doc.exitPointerLock?.();
  });
  listen(win,'blur',()=>{focused=false;reset()});
  listen(win,'focus',()=>{focused=true;reset()});
  listen(doc,'visibilitychange',()=>{focused=!doc.hidden;reset()});
  listen(win,'resize',reset);
  listen(doc,'fullscreenchange',reset);
  return {
    reset,
    update(dt){
      if(!usable()){pendingYaw=0;pendingPitch=0;return;}
      // Limit total rotation per rendered frame, rather than per mouse event.
      // Extra accumulated movement is discarded, never replayed after a pause.
      const limit=Math.min(.25,Math.min(.05,Math.max(.008,Number.isFinite(dt)?dt:0))*10);
      const yaw=pendingYaw,pitch=pendingPitch;pendingYaw=0;pendingPitch=0;
      if(yaw||pitch)onRotate(Math.max(-limit,Math.min(limit,yaw)),Math.max(-limit,Math.min(limit,pitch)));
    },
    dispose(){reset();listeners.forEach(remove=>remove())}
  };
}
