const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.KAIHUA_TEST_URL||'http://127.0.0.1:8080/kaihua/';
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const injected=html.replace(/init\(\);\r?\n\} catch\(error\)/,`window.appTest={state,camera,scene,renderer,WALLS,clickable,muralMeshes,setMode,setDrawer,clearDrawer,jumpToView,hitWall,inspectWall,move,allowed,setOrientation,syncOrientationFromCamera,guideCurve,updateGuided,lookInput,hallZoom,getDetail:()=>detailViewer,getWallId:()=>detailWallId,getCatalog:()=>muralCatalog};init();\n} catch(error)`);
let browser;
async function loadReady(page){await page.waitForFunction(()=>window.appTest?.clickable.length===4);await page.waitForSelector('#loading',{state:'detached'});}
async function viewerReady(page){await page.waitForFunction(()=>appTest.getDetail()?.getViewer()?.world.getItemCount()===1);await page.waitForFunction(()=>appTest.getDetail().getViewer().world.getItemAt(0).getFullyLoaded(),null,{timeout:60000});}
(async()=>{
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),requests=[],responses=[],errors=[];
 page.on('request',request=>requests.push(request.url()));
 page.on('response',response=>{responses.push({url:response.url(),status:response.status(),worker:response.fromServiceWorker()});if(response.status()>=400&&!response.url().endsWith('favicon.ico'))errors.push(response.status()+' '+response.url())});
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 await page.addInitScript(()=>performance.setResourceTimingBufferSize(10000));
 await page.route(base,route=>route.fulfill({contentType:'text/html',body:injected}));await page.goto(base);await loadReady(page);
 assert.equal(requests.filter(url=>/zoom_files|zoom\.dzi|full-preview|openseadragon|sw-murals/.test(url)).length,0,'No detail viewer or HD resource on the initial hall load');
 assert.equal(requests.filter(url=>/case\.mgdatatech|_level[0123]\.png/.test(url)).length,0,'No upstream service or source PNG requests');
 const scene=await page.evaluate(async()=>{
  const THREE=await import('three'),t=appTest,shapes=t.WALLS.map(w=>({key:w.key,id:w.muralId,ratio:w.width/w.height,pixels:w.pixelSize,position:w.position,ry:w.ry}));
  const front=Object.values(t.muralMeshes).filter(m=>m.position.z>5).length;
  const normals=Object.fromEntries(t.WALLS.map(w=>{const m=t.muralMeshes[w.key];return[w.key,new THREE.Vector3(0,0,1).applyQuaternion(m.quaternion).toArray()]}));
  return {shapes,front,normals,calls:t.renderer.info.render.calls,original4Only:Object.values(t.muralMeshes).every(m=>m.material.map.image.width<=4096&&m.material.map.image.height<=4096),interiorPosts:t.scene.children.filter(m=>m.name==='interior-post').length};
 });
 assert.equal(scene.front,0);assert.equal(scene.original4Only,true);assert.equal(scene.interiorPosts,4);assert.ok(scene.calls<60,'Static batching reduces draw calls without downsampling wall textures');
 assert.ok(scene.normals.west[0]>.99&&scene.normals.east[0]<-.99&&scene.normals.northWest[2]>.99);
 for(const s of scene.shapes)assert.ok(Math.abs(s.ratio-s.pixels[0]/s.pixels[1])<1e-8,'No stretched texture');
 await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 const movement=await page.evaluate(()=>{
  const t=appTest;t.setMode('explore');const speeds=[];
  for(const fps of [15,30,60,120]){t.camera.position.set(-4.2,1.7,2);t.state.yaw=0;t.state.pitch=0;t.state.keys.clear();t.state.keys.add('KeyW');for(let n=0;n<fps;n++)t.move(1/fps);speeds.push(2-t.camera.position.z)}
  const dot=[];for(const yaw of [0,1.2,-1.2,2.8]){t.camera.position.set(0,1.7,4.72);t.state.yaw=yaw;t.state.pitch=.4;t.setOrientation();const before=t.camera.position.clone(),facing=t.camera.getWorldDirection(before.clone());facing.y=0;facing.normalize();t.move(.02);dot.push(t.camera.position.clone().sub(before).dot(facing))}
  t.state.keys.clear();return {speeds,dot};
 });
 movement.speeds.forEach(distance=>assert.ok(Math.abs(distance-2.65)<1e-8,'Frame-rate-independent walking'));assert.ok(movement.dot.every(d=>d>0),'W advances in horizontal view direction');
 assert.equal(await page.evaluate(()=>appTest.guideCurve.getPoints(1000).filter(p=>!appTest.allowed(p.x,p.z)).length),0,'Guided route clears all obstacles');
 assert.equal(await page.evaluate(()=>appTest.allowed(0,0)),false);assert.equal(await page.evaluate(()=>appTest.allowed(-5.2,4.8)),true);
 // Open each wall through the actual click/raycast path, not a direct viewer shortcut.
 for(const [view,id] of [[1,'left'],[2,'back'],[3,'right']]){
  await page.evaluate(view=>{const t=appTest;t.jumpToView(view);const c=t.renderer.domElement;c.dispatchEvent(new MouseEvent('click',{clientX:innerWidth/2,clientY:innerHeight/2,bubbles:true}))},view);
  await viewerReady(page);assert.equal(await page.evaluate(()=>appTest.getWallId()),id);assert.equal(await page.locator('.mural-tabs button').count(),3);
  assert.equal(await page.locator('.mural-info').getAttribute('open'),'');
  assert.ok((await page.locator('.mural-info summary').textContent()).length>4);
  assert.ok(await page.locator('.mural-info a').count()>0,'Wall introduction includes verifiable sources');
  assert.equal(await page.locator('#deepzoom-stage img').count(),0,'No separate fixed preview image');
  if(process.env.KAIHUA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.KAIHUA_SCREENSHOTS,`kaihua-${id}-with-intro.png`)});
  const fit=await page.evaluate(()=>{const v=appTest.getDetail().getViewer(),b=v.viewport.getBounds(),i=v.world.getItemAt(0).getBounds();return b.x<=i.x+.001&&b.y<=i.y+.001&&b.x+b.width>=i.x+i.width-.001&&b.y+b.height>=i.y+i.height-.001});assert.equal(fit,true,'Whole mural fits without clipping');
  assert.equal(await page.locator('.mural-hotspot').count(),id==='right'?7:0,'Only reviewed story locations are displayed');
  if(id==='right'){
    await page.locator('[data-hotspot="shanyou-weaving"]').click();await page.waitForFunction(()=>appTest.getDetail().getViewer().viewport.getZoom()>2);
    await page.waitForFunction(()=>{const stage=document.querySelector('#deepzoom-stage').getBoundingClientRect(),marker=document.querySelector('.mural-hotspot.is-active').getBoundingClientRect(),panel=document.querySelector('.mural-hotspot-note').getBoundingClientRect();return Math.abs(marker.x+marker.width/2-stage.x-stage.width/4)<2&&Math.abs(marker.y+marker.height/2-stage.y-stage.height/2)<2&&Math.abs(panel.x-stage.x-stage.width/2)<2});
    assert.ok((await page.locator('.mural-hotspot-note h3').textContent()).includes('观织'));
    assert.equal(await page.locator('.mural-hotspot-note a').first().getAttribute('href'),'https://www.amsm.pku.edu.cn/info/1038/1193.htm');
    await page.locator('.story-navigation button').last().click();assert.equal(await page.locator('.mural-hotspot-note').count(),1);assert.ok((await page.locator('.mural-hotspot-note h3').textContent()).includes('观屠'));
    await page.keyboard.press('Escape');assert.equal(await page.locator('.mural-hotspot-note').count(),0);assert.equal(await page.locator('#overlay').isVisible(),true,'First Esc closes story, leaving the mural open');
    await page.waitForFunction(()=>{const stage=document.querySelector('#deepzoom-stage'),canvas=stage.querySelector('.deepzoom-canvas');return !stage.classList.contains('story-reading')&&Math.abs(canvas.clientWidth-stage.clientWidth)<2});
    await page.locator('#mural-stories').click();assert.equal(await page.locator('.mural-hotspot:visible').count(),0);await page.locator('#mural-stories').click();assert.equal(await page.locator('.mural-hotspot').count(),7);
    await page.locator('#mural-fit').click();await page.waitForFunction(()=>!appTest.getDetail().getViewer().isAnimating());
    if(process.env.KAIHUA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.KAIHUA_SCREENSHOTS,'kaihua-story-map.png')});
  }
  const before=await page.evaluate(()=>{window.oldDetail=appTest.getDetail();return {position:appTest.camera.position.toArray(),rotation:appTest.camera.quaternion.toArray(),fov:appTest.camera.fov}});
  await page.keyboard.press('Escape');assert.equal(await page.locator('#overlay').isVisible(),false);
  const after=await page.evaluate(()=>({position:appTest.camera.position.toArray(),rotation:appTest.camera.quaternion.toArray(),fov:appTest.camera.fov}));assert.deepEqual(after,before,'Closing preserves camera pose and optical zoom');assert.equal(await page.evaluate(()=>oldDetail.getViewer()),null,'Viewer is destroyed on close');
 }
 // Transparent scan margins are not interactive wall-wide rectangles.
 const margin=await page.evaluate(async()=>{
  const THREE=await import('three'),t=appTest,m=t.muralMeshes.west,mask=m.userData.hitMask;let index=-1;
  for(let i=mask.width+2;i<mask.width*(mask.height-1)-2;i++)if(!(mask.bytes[i>>3]&(1<<(i&7)))){index=i;break}
  if(index<0)return false;
  const u=(index%mask.width+.5)/mask.width,v=1-(Math.floor(index/mask.width)+.5)/mask.height;
  const target=new THREE.Vector3((u-.5)*m.geometry.parameters.width,(v-.5)*m.geometry.parameters.height,0).applyMatrix4(m.matrixWorld);
  const normal=new THREE.Vector3(0,0,1).applyQuaternion(m.quaternion);t.camera.position.copy(target.clone().add(normal));t.camera.lookAt(target);t.syncOrientationFromCamera();return !t.inspectWall();
 });assert.equal(margin,true,'Transparent source margin does not open the archive');
 // Native pyramid chooses screen-sized initial detail; wheel loads source level 2.
 const detailRequestsStart=requests.length;
 await page.evaluate(()=>{appTest.jumpToView(1);appTest.setDrawer('atlas',0)});await viewerReady(page);
 const tileLevels=()=>requests.slice(detailRequestsStart).filter(url=>url.includes('zoom_files/')).map(url=>Number(url.split('zoom_files/')[1].split('/')[0]));
 const initialMax=Math.max(...tileLevels());assert.ok(initialMax<=13&&initialMax>=11,'Initial tiles match viewport, not forced half-resolution whole-wall downloads');
 const stage=page.locator('#deepzoom-stage'),box=await stage.boundingBox();await page.mouse.move(box.x+box.width*.45,box.y+box.height*.55);
 // OSD normalizes each wheel event to a zoom step, regardless of its raw delta.
 for(let n=0;n<14;n++){await page.mouse.wheel(0,-120);await page.waitForTimeout(120)}
 await page.waitForFunction(()=>appTest.getDetail().getViewer().viewport.getZoom()>2);await viewerReady(page);
 await page.waitForFunction(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('/zoom_files/14/')));
 assert.equal(Math.max(...tileLevels()),14,'Higher-resolution tiles really load after zoom');
 const leftTop=await page.evaluate(()=>appTest.getDetail().getViewer().viewport.getCenter().toString());
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.5+140,box.y+box.height*.5+40,{steps:8});await page.mouse.up();
 await page.waitForFunction(before=>appTest.getDetail().getViewer().viewport.getCenter().toString()!==before,leftTop);
 if(process.env.KAIHUA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.KAIHUA_SCREENSHOTS,'kaihua-hd-detail.png')});
 await page.locator('#mural-fit').click();await page.waitForFunction(()=>Math.abs(appTest.getDetail().getViewer().viewport.getZoom()-appTest.getDetail().getViewer().viewport.getHomeZoom())<.01);
 // Cache one loaded versioned tile and verify its reuse through our own service worker.
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 const lastTile=requests.findLast(url=>url.includes('/zoom_files/14/'));
 await page.waitForFunction(async url=>{const c=await caches.open('kaihua-mural-tiles-v1');return !!await c.match(url)},lastTile);
 const cachedBefore=responses.filter(r=>r.url===lastTile&&r.worker).length;await page.evaluate(url=>fetch(url).then(r=>r.arrayBuffer()).then(b=>b.byteLength),lastTile);
 assert.ok(responses.filter(r=>r.url===lastTile&&r.worker).length>cachedBefore,'Loaded tile is reused from Cache Storage');
 const cacheKeys=await page.evaluate(async()=>{const c=await caches.open('kaihua-mural-tiles-v1');return(await c.keys()).length});assert.ok(cacheKeys<=256,'Persistent cache remains bounded');
 // Test normalized-coordinate hotspot behavior using a QA-only fixture, never deployed research content.
 await page.evaluate(()=>appTest.clearDrawer());
 await page.evaluate(()=>{const wall=appTest.getCatalog().walls[0];wall.hotspots=[{id:'qa-only',x:.5,y:.5,title:'QA marker',text:'Test fixture'}];appTest.setDrawer('atlas',0)});await viewerReady(page);
 const hotspot=page.locator('[data-hotspot="qa-only"]');await hotspot.waitFor();
 const alignment=await page.evaluate(()=>{const v=appTest.getDetail().getViewer(),p=v.world.getItemAt(0).imageToViewportCoordinates(appTest.getCatalog().walls[0].width*.5,appTest.getCatalog().walls[0].height*.5),at=v.viewport.pixelFromPoint(p,true),button=document.querySelector('[data-hotspot="qa-only"]').getBoundingClientRect(),canvas=v.container.getBoundingClientRect();return Math.hypot(button.x+button.width/2-canvas.x-at.x,button.y+button.height/2-canvas.y-at.y)});assert.ok(alignment<2,'Hotspot is registered to image coordinates');
 await hotspot.click();assert.equal(await page.locator('.mural-hotspot-note').isVisible(),true);await page.evaluate(()=>{appTest.getCatalog().walls[0].hotspots=[];appTest.clearDrawer()});
 // Reproduce the reported race: zoom/drag a transparent back wall while tiles are slow.
 const slowContext=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'}),slow=await slowContext.newPage();
 slow.on('pageerror',error=>errors.push(error.message));
 await slow.route(base,route=>route.fulfill({contentType:'text/html',body:injected}));
 await slow.route('**/zoom_files/**',async route=>{await new Promise(resolve=>setTimeout(resolve,800));await route.continue()});
 await slow.goto(base);await loadReady(slow);await slow.evaluate(()=>{appTest.setMode('explore');appTest.setDrawer('atlas',2)});
 await slow.waitForFunction(()=>appTest.getDetail()?.getViewer()?.world.getItemCount()===1);
 const single=await slow.evaluate(()=>({images:document.querySelectorAll('#deepzoom-stage img').length,world:appTest.getDetail().getViewer().world.getItemCount(),alpha:appTest.getDetail().getViewer().world.getItemAt(0).source.hasTransparency()}));
 assert.deepEqual(single,{images:0,world:1,alpha:true});
 await slow.locator('#mural-zoom-in').click({clickCount:3,delay:100});
 const slowBox=await slow.locator('#deepzoom-stage').boundingBox();await slow.mouse.move(slowBox.x+slowBox.width*.5,slowBox.y+slowBox.height*.5);await slow.mouse.down();await slow.mouse.move(slowBox.x+slowBox.width*.5+80,slowBox.y+slowBox.height*.5+35,{steps:6});await slow.mouse.up();
 await slow.waitForFunction(()=>!appTest.getDetail().getViewer().isAnimating());
 const pendingZoom=await slow.evaluate(()=>appTest.getDetail().getViewer().viewport.getZoom()),pendingCenter=await slow.evaluate(()=>appTest.getDetail().getViewer().viewport.getCenter().toString());await viewerReady(slow);
 assert.ok(Math.abs(await slow.evaluate(()=>appTest.getDetail().getViewer().viewport.getZoom())-pendingZoom)<.001,'Tile completion never resets the chosen view');
 assert.equal(await slow.evaluate(()=>appTest.getDetail().getViewer().viewport.getCenter().toString()),pendingCenter,'Tile completion preserves the panned image position');
 await slow.locator('.mural-info summary').click();
 assert.equal(await slow.locator('.mural-info').getAttribute('open'),null);
 await slow.locator('#mural-fit').click();await slow.waitForFunction(()=>Math.abs(appTest.getDetail().getViewer().viewport.getZoom()-appTest.getDetail().getViewer().viewport.getHomeZoom())<.01);await viewerReady(slow);
 if(process.env.KAIHUA_SCREENSHOTS)await slow.screenshot({path:path.join(process.env.KAIHUA_SCREENSHOTS,'kaihua-back-no-overlap.png')});
 await slowContext.close();
 // Keep the previous camera-jump and model regressions covered.
 const rotation=await page.evaluate(()=>{const t=appTest,c=t.renderer.domElement;t.setMode('explore');const y=t.state.yaw;c.dispatchEvent(new PointerEvent('pointerdown',{pointerId:91,pointerType:'mouse',button:0,clientX:100,clientY:200}));window.dispatchEvent(new Event('blur'));c.dispatchEvent(new PointerEvent('pointermove',{pointerId:91,pointerType:'mouse',clientX:900,clientY:200}));t.move(.016);const blur=t.state.yaw-y;window.dispatchEvent(new Event('focus'));t.state.keys.add('ArrowLeft');const before=t.state.yaw;t.move(3);const long=t.state.yaw-before;t.state.keys.clear();return {blur,long}});assert.equal(rotation.blur,0);assert.ok(Math.abs(rotation.long-.062)<1e-8);
 const floor=await page.evaluate(async()=>{const THREE=await import('three'),s=appTest.scene;s.updateMatrixWorld(true);const f=s.getObjectByName('hall-floor'),p=s.getObjectByName('hall-plinth'),hits=new THREE.Raycaster(new THREE.Vector3(-4.2,1,0),new THREE.Vector3(0,-1,0)).intersectObjects([f,p],false);return hits[0].object===f&&hits[0].point.y-hits[1].point.y>.08});assert.equal(floor,true);
 // Standalone archive remains available even if WebGL initialization fails.
 const fallback=await context.newPage();await fallback.route(base,route=>route.fulfill({contentType:'text/html',body:html.replace('const renderer = new THREE.WebGLRenderer',"throw new Error('Simulated WebGL failure');\nconst renderer = new THREE.WebGLRenderer")}));await fallback.goto(base);await fallback.locator('#fallback').waitFor();await fallback.locator('#fallback-atlas').click();await fallback.waitForSelector('.openseadragon-container');assert.equal(await fallback.locator('[data-wall]').count(),3);
 assert.deepEqual(errors,[]);assert.equal(requests.filter(url=>/case\.mgdatatech|_level[0123]\.png|full-preview\.webp/.test(url)).length,0,'No whole-image preview download behind the viewer');
 console.log(JSON.stringify({passed:true,drawCalls:scene.calls,initialTileLevel:initialMax,zoomedTileLevel:14,persistentCacheEntries:cacheKeys,checks:'3 wall click paths, alpha hit regions, proportions/orientation, no front mural, W direction at 15/30/60/120fps, pose restore, actual high-detail tile requests, pan/fit, bounded cache, normalized hotspots, input/floor regressions, WebGL fallback'},null,2));
 await browser.close();
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1});
