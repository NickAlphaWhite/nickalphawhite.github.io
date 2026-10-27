const localize=(value,lang)=>typeof value==='string'?value:value?.[lang]||value?.zh||value?.en||'';
// One card per viewer. Markers use the full source image's normalized coordinates.
export function mountMuralHotspots(viewer,wall,OSD,{lang='en',toggle}={}){
  const image=viewer.world.getItemAt(0);if(!image)return()=>{};
  const host=viewer.container.closest('.mural-stage')||viewer.container.parentElement;
  const items=(wall.hotspots||[]).filter(item=>Number.isFinite(item.x)&&Number.isFinite(item.y)&&item.x>=0&&item.x<=1&&item.y>=0&&item.y<=1&&localize(item.title,lang));
  const markers=[],trackers=[];let popup,selected=-1,visible=true,pendingLayout=null;
  const originalVisibility=viewer.viewport.visibilityRatio;
  function updateLayout(){
    if(!pendingLayout||Math.abs(viewer.viewport.getContainerSize().x-viewer.container.clientWidth)>1)return;
    const target=pendingLayout;pendingLayout=null;
    if(target==='home'){viewer.viewport.visibilityRatio=originalVisibility;viewer.viewport.goHome(true);return;}
    const item=items[selected];if(!item||!popup)return;
    // Allow edge stories to be centered without forcing their marker away from the center.
    viewer.viewport.visibilityRatio=.5;
    if(item.region){const r=item.region,area=image.imageToViewportRectangle(r.x*wall.width,r.y*wall.height,r.width*wall.width,r.height*wall.height);viewer.viewport.fitBounds(new OSD.Rect(area.x-area.width*.2,area.y-area.height*.2,area.width*1.4,area.height*1.4),true)}
    // The selected number is the exact center of the image half, even for asymmetric regions.
    viewer.viewport.panTo(image.imageToViewportCoordinates(item.x*wall.width,item.y*wall.height),true);viewer.viewport.applyConstraints(true);
  }
  function resizeTo(target){pendingLayout=target;viewer.forceResize()}
  viewer.addHandler('viewport-change',updateLayout);
  const resizeObserver=new ResizeObserver(()=>{if(popup)resizeTo('story')});resizeObserver.observe(viewer.container);
  function closeCard(focus=true,restore=true){const wasOpen=Boolean(popup);popup?.remove();popup=null;for(const button of markers){button.classList.remove('is-active');button.setAttribute('aria-expanded','false')}if(restore&&wasOpen){host.classList.remove('story-reading');resizeTo('home')}if(focus&&selected>=0)markers[selected]?.focus({preventScroll:true})}
  function show(index){
    closeCard(false,false);selected=index;const item=items[index],title=localize(item.title,lang),button=markers[index];
    button.classList.add('is-active');button.setAttribute('aria-expanded','true');
    popup=document.createElement('section');popup.className='mural-hotspot-note';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',title);
    const copy=document.createElement('div');copy.className='story-copy';
    const close=document.createElement('button');close.type='button';close.className='story-close';close.textContent='×';close.setAttribute('aria-label',lang==='zh'?'关闭故事':'Close story');close.onclick=()=>closeCard();
    const heading=document.createElement('h3');heading.textContent=title;
    const text=document.createElement('p');text.textContent=localize(item.text,lang);copy.append(heading,text);
    if(item.lookFor){const guide=document.createElement('p'),label=document.createElement('strong');label.textContent=lang==='zh'?'看画线索：':'Look for: ';guide.append(label,document.createTextNode(localize(item.lookFor,lang)));copy.append(guide)}
    if(item.source?.url&&/^https:\/\//.test(item.source.url)){const source=document.createElement('a');source.className='story-source';source.href=item.source.url;source.textContent=localize(item.source.label,lang)|| (lang==='zh'?'讲解来源':'Source');source.target='_blank';source.rel='noopener noreferrer';copy.append(source)}
    if(items.length>1){
      const navigation=document.createElement('nav');navigation.className='story-navigation';navigation.setAttribute('aria-label',lang==='zh'?'切换故事':'Story navigation');
      const previous=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');
      previous.type=next.type='button';previous.textContent=lang==='zh'?'← 上一个':'← Previous';next.textContent=lang==='zh'?'下一个 →':'Next →';previous.disabled=index===0;next.disabled=index===items.length-1;
      previous.onclick=()=>show(index-1);next.onclick=()=>show(index+1);count.textContent=`${index+1} / ${items.length}`;navigation.append(previous,count,next);copy.append(navigation);
    }
    // Sibling of the OSD interaction area: reading/clicking the card cannot pan the art.
    popup.append(close,copy);host.classList.add('story-reading');host.append(popup);resizeTo('story');close.focus({preventScroll:true});
  }
  for(const [index,item] of items.entries()){
    const button=document.createElement('button');button.type='button';button.className='mural-hotspot';button.textContent=String(item.order||index+1);button.title=localize(item.title,lang);button.setAttribute('aria-label',localize(item.title,lang));button.setAttribute('aria-expanded','false');button.dataset.hotspot=item.id;markers.push(button);
    viewer.addOverlay({element:button,location:image.imageToViewportCoordinates(item.x*wall.width,item.y*wall.height),placement:OSD.Placement.CENTER,checkResize:false});
    trackers.push(new OSD.MouseTracker({element:button,clickHandler:event=>{event.preventDefaultAction=true;if(event.quick!==false)show(index)}}).setTracking(true));
    button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();show(index)}});
  }
  function escape(event){if(event.key==='Escape'&&popup){event.preventDefault();event.stopPropagation();closeCard()}}
  function toggleMarkers(){visible=!visible;host.classList.toggle('story-markers-hidden',!visible);toggle.setAttribute('aria-pressed',String(visible));if(!visible)closeCard(false)}
  host.addEventListener('keydown',escape,true);
  if(toggle){toggle.hidden=!items.length;toggle.textContent=(lang==='zh'?'故事点':'Stories')+` · ${items.length}`;toggle.setAttribute('aria-pressed','true');toggle.addEventListener('click',toggleMarkers)}
  return()=>{resizeObserver.disconnect();viewer.removeHandler('viewport-change',updateLayout);pendingLayout=null;closeCard(false,false);viewer.viewport.visibilityRatio=originalVisibility;host.removeEventListener('keydown',escape,true);host.classList.remove('story-markers-hidden','story-reading');toggle?.removeEventListener('click',toggleMarkers);if(toggle)toggle.hidden=true;trackers.forEach(tracker=>tracker.destroy());markers.forEach(button=>{viewer.removeOverlay(button);button.remove()})};
}
