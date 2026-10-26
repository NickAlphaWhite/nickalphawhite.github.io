// Coordinates are fractions of the ORIGINAL full source width and height.
// The default catalog contains no research claims or invented hotspots.
export function mountMuralHotspots(viewer,wall,OSD){
  const cleanup=[],image=viewer.world.getItemAt(0);if(!image)return()=>{};
  for(const item of wall.hotspots||[]){
    if(!Number.isFinite(item.x)||!Number.isFinite(item.y)||item.x<0||item.x>1||item.y<0||item.y>1||typeof item.title!=='string')continue;
    const button=document.createElement('button');button.type='button';button.className='mural-hotspot';button.textContent='+';button.setAttribute('aria-label',item.title);button.dataset.hotspot=item.id;
    const location=image.imageToViewportCoordinates(item.x*wall.width,item.y*wall.height);
    viewer.addOverlay({element:button,location,placement:OSD.Placement.CENTER,checkResize:false});
    let popup;
    function show(){
      popup?.remove();popup=document.createElement('section');popup.className='mural-hotspot-note';popup.setAttribute('role','dialog');
      const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close');close.onclick=()=>{popup.remove();button.focus()};
      const title=document.createElement('h3');title.textContent=item.title;
      const text=document.createElement('p');text.textContent=typeof item.text==='string'?item.text:'';
      popup.append(close,title,text);viewer.container.append(popup);close.focus();
    }
    const tracker=new OSD.MouseTracker({element:button,clickHandler:event=>{event.preventDefaultAction=true;show()}}).setTracking(true);
    button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();show()}});
    cleanup.push(()=>{tracker.destroy();popup?.remove();viewer.removeOverlay(button);button.remove()});
  }
  return()=>cleanup.forEach(remove=>remove());
}
