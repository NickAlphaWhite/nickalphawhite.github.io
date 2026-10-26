import {mountMuralHotspots} from './mural-hotspots.js';
let libraryPromise;
function loadLibrary(){
  if(globalThis.OpenSeadragon)return Promise.resolve(globalThis.OpenSeadragon);
  if(!libraryPromise)libraryPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=new URL('./vendor/openseadragon.min.js',import.meta.url).href;
    script.onload=()=>resolve(globalThis.OpenSeadragon);script.onerror=()=>{libraryPromise=null;script.remove();reject(new Error('Deep zoom library unavailable'))};document.head.append(script);
  });
  return libraryPromise;
}
function registerTileCache(){
  if('serviceWorker' in navigator)navigator.serviceWorker.register(new URL('../sw-murals.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname}).catch(()=>{});
}
export function createMuralViewer({host,wall,lang='en',zoomIn,zoomOut,fit,status}){
  let viewer,destroyed=false,previewCleanup,removeHotspots=()=>{};const listeners=[],preview=document.createElement('img');
  preview.className='deepzoom-preview';preview.alt=wall.label[lang]||wall.label.en;preview.src=wall.fullPreviewUrl;preview.draggable=false;host.append(preview);
  const canvas=document.createElement('div');canvas.className='deepzoom-canvas';host.append(canvas);
  const say=(en,zh)=>{if(status)status.textContent=lang==='zh'?zh:en};
  say('Loading high-resolution tiles…','正在载入高清图块…');registerTileCache();
  function bind(element,type,handler){element?.addEventListener(type,handler);listeners.push(()=>element?.removeEventListener(type,handler))}
  bind(zoomIn,'click',()=>{viewer?.viewport.zoomBy(1.4);viewer?.viewport.applyConstraints()});
  bind(zoomOut,'click',()=>{viewer?.viewport.zoomBy(1/1.4);viewer?.viewport.applyConstraints()});
  bind(fit,'click',()=>viewer?.viewport.goHome());
  const ready=loadLibrary().then(OSD=>{
    if(destroyed)return null;
    viewer=OSD({element:canvas,tileSources:wall.dziUrl,crossOriginPolicy:'Anonymous',showNavigationControl:false,showNavigator:false,
      drawer:'canvas',animationTime:.22,blendTime:.12,immediateRender:false,
      maxImageCacheCount:256,imageLoaderLimit:6,maxTilesPerFrame:4,
      maxZoomPixelRatio:1.1,minZoomImageRatio:1,homeFillsViewer:false,visibilityRatio:1,constrainDuringPan:true,
      minPixelRatio:.5,preload:false,timeout:20000,tileRetryMax:2,tileRetryDelay:600,
      gestureSettingsMouse:{scrollToZoom:true,clickToZoom:false,dblClickToZoom:true,dragToPan:true,flickEnabled:false,zoomToRefPoint:true},
      gestureSettingsTouch:{pinchToZoom:true,dragToPan:true,flickEnabled:false,doubleTapToZoom:true}});
    viewer.addHandler('open',()=>{
      if(destroyed)return;
      const image=viewer.world.getItemAt(0);
      // The first tiled view uses the half-resolution source level (matching level 3),
      // instead of replacing that preview with a lower-resolution overview pyramid.
      image.source.minLevel=Math.max(image.source.minLevel,image.source.maxLevel-1);
      viewer.viewport.goHome(true);removeHotspots=mountMuralHotspots(viewer,wall,OSD);
      function reveal(){if(!destroyed&&image.getFullyLoaded()){
        preview.classList.add('is-ready');say('Wheel to zoom · drag to pan','滚轮缩放 · 拖动平移');
        if(!previewCleanup)previewCleanup=setTimeout(()=>{preview.removeAttribute('src');preview.remove()},180);
      }}
      image.addHandler('fully-loaded-change',reveal);reveal();
    });
    viewer.addHandler('open-failed',()=>say('High-resolution tiles unavailable. The full preview remains visible.','高清图块暂不可用，仍可查看完整预览。'));
    viewer.addHandler('tile-load-failed',()=>say('Retrying a high-resolution tile…','正在重试高清图块…'));
    bind(host,'keydown',event=>{if(event.key==='0'||event.key==='Home'){event.preventDefault();viewer.viewport.goHome()}});
    return viewer;
  }).catch(error=>{if(!destroyed)say('Viewer unavailable. The full preview remains visible.','查看器暂不可用，仍可查看完整预览。');console.warn(error);return null});
  return {
    ready,getViewer:()=>viewer,
    destroy(){destroyed=true;clearTimeout(previewCleanup);listeners.forEach(remove=>remove());removeHotspots();viewer?.destroy();preview.removeAttribute('src');preview.remove();canvas.remove();viewer=null}
  };
}
