export function wheelPixels(event,pageHeight=800){
  const delta=Number.isFinite(event.deltaY)?event.deltaY:0;
  return Math.max(-600,Math.min(600,delta*(event.deltaMode===1?16:event.deltaMode===2?pageHeight:1)));
}
export function fieldOfView(base,zoom){return 2*Math.atan(Math.tan(base*Math.PI/360)/zoom)*180/Math.PI}

export function createHallZoom({element,camera,isEnabled,onInteraction=()=>{},onChange=()=>{}}){
  const base=camera.fov;let zoom=1;
  function setZoom(value,interactive=false){
    if(!Number.isFinite(value))return;
    const next=Math.max(1,Math.min(3,value));if(next===zoom)return;
    if(interactive){if(!isEnabled())return;onInteraction()}
    zoom=next;camera.fov=fieldOfView(base,zoom);camera.updateProjectionMatrix();onChange(zoom);
  }
  function wheel(event){
    if(event.ctrlKey||event.metaKey||!isEnabled())return;
    event.preventDefault();setZoom(zoom*Math.exp(-wheelPixels(event,element.clientHeight)*.0015),true);
  }
  element.addEventListener('wheel',wheel,{passive:false});onChange(zoom);
  return {getZoom:()=>zoom,setZoom,reset:()=>setZoom(1),dispose:()=>element.removeEventListener('wheel',wheel)};
}
