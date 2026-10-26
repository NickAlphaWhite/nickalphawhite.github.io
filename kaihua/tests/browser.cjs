const {chromium}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict');
const url=process.env.KAIHUA_TEST_URL||'http://127.0.0.1:8080/kaihua/';
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const inject=html.replace(/init\(\);\r?\n\} catch\(error\)/,`window.testAPI={state,camera,setMode,setDrawer,clearDrawer,jumpToView,allowed,hitWall,inspectWall,guideCurve,safeUrl,renderDrawer,muralMeshes,WALLS,occluders,obstacles,renderer};init();\n} catch(error)`);
(async()=>{
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage(),errors=[],failed=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))failed.push(r.url())});
await page.route(url,r=>r.fulfill({contentType:'text/html',body:inject}));
await page.goto(url);
await page.waitForFunction(()=>window.testAPI&&Object.values(testAPI.state.available).length===4&&Object.values(testAPI.state.available).every(a=>a.original));
await page.waitForSelector('#loading',{state:'detached'});
await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
await page.locator('#hero-archive').click();
for(let i=0;i<4;i++){
 await page.locator(`[data-wall="${i}"]`).click();
 await page.waitForFunction(()=>document.querySelector('#compare-view img')?.naturalWidth>0);
 assert.equal(await page.locator('#compare-range').count(),0);
 assert.equal(await page.locator('#compare-view .missing').count(),0);
}

await page.evaluate(()=>{testAPI.state.available.west.original=false;testAPI.setDrawer('atlas',0)});
assert.equal(await page.locator('#compare-view .missing').count(),1);
await page.evaluate(()=>{testAPI.state.available.west.original=true;testAPI.renderDrawer()});
assert.equal(await page.locator('#compare-view img').count(),1);
await page.evaluate(()=>{const t=testAPI;t.state.assets.west.restored=t.state.assets.west.original;t.state.available.west.restored=true;t.renderDrawer()});
await page.locator('#compare-range').fill('75');
assert.equal(await page.locator('#compare-restored').evaluate(e=>e.style.clipPath),'inset(0px 25% 0px 0px)');
await page.locator('#close-overlay').click();
await page.evaluate(()=>{const t=testAPI;t.setMode('explore');t.jumpToView(1)});
assert.equal(await page.evaluate(()=>testAPI.hitWall()?.index),0);
await page.evaluate(()=>document.activeElement.blur());await page.keyboard.press('e');assert.equal(await page.locator('#overlay').isVisible(),true);
await page.keyboard.press('Escape');assert.equal(await page.locator('#overlay').isVisible(),false);
const yaw=await page.evaluate(()=>testAPI.state.yaw);
await page.locator('#language').focus();await page.keyboard.press('ArrowLeft');
assert.equal(await page.evaluate(()=>testAPI.state.keys.size),0);
await page.locator('canvas').dispatchEvent('pointerdown',{pointerType:'mouse',pointerId:1,button:0,clientX:600,clientY:450});
await page.locator('canvas').dispatchEvent('pointermove',{pointerType:'mouse',pointerId:1,clientX:660,clientY:450});
await page.locator('canvas').dispatchEvent('pointerup',{pointerType:'mouse',pointerId:1});
await page.locator('canvas').dispatchEvent('click',{pointerType:'mouse',clientX:660,clientY:450});
assert.notEqual(await page.evaluate(()=>testAPI.state.yaw),yaw);
assert.equal(await page.locator('#overlay').isVisible(),false);
await page.evaluate(()=>testAPI.jumpToView(3));

const collision=await page.evaluate(()=>{const t=testAPI;return t.guideCurve.getPoints(1000).filter(p=>!t.allowed(p.x,p.z)).length});assert.equal(collision,0,'guided route stays in walkable space');
for(const value of ['./assets/murals/../x.jpg','./assets/murals/a/../../x.png','https://x.test/a.jpg'])assert.equal(await page.evaluate(s=>testAPI.safeUrl(s),value),'');
assert.equal(await page.evaluate(()=>testAPI.allowed(-2.10,2.45)),false,'square column podium includes visitor clearance');
assert.equal(await page.evaluate(()=>testAPI.allowed(0,0)),false,'altar blocks walking');
assert.equal(await page.evaluate(()=>testAPI.allowed(-3.9,.25)),true,'side aisle remains walkable');
assert.equal(await page.evaluate(async()=>{
 const THREE=await import('three');
 const ray=new THREE.Raycaster(new THREE.Vector3(0,3.49,3),new THREE.Vector3(0,0,-1));
 const hit=ray.intersectObjects(testAPI.occluders,false)[0];
 return Boolean(hit&&hit.distance<4);
}),true,'seated sculpture blocks a sightline before the rear wall');
assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
// Simulate complete WebGL initialization failure before bind() is reached.
const fail=await context.newPage();await fail.route(url,r=>r.fulfill({contentType:'text/html',body:html.replace("const renderer = new THREE.WebGLRenderer", "throw new Error('Simulated unavailable WebGL');\nconst renderer = new THREE.WebGLRenderer")}));
await fail.goto(url);await fail.locator('#fallback').waitFor({state:'visible'});await fail.locator('#fallback-atlas').click();assert.ok(fail.url().endsWith('/assets/murals/index.html'));assert.equal(await fail.locator('img').count(),4);
// Mobile: reference page and full-screen archive fit narrow screens.
const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mp=await mobile.newPage();await mp.goto(url);await mp.waitForSelector('#loading',{state:'detached'});await mp.locator('#hero-archive').click();
await mp.waitForFunction(()=>document.querySelector('#compare-view img')?.naturalWidth>0);assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
console.log('PASS: 4 original-only photos, late image updates, missing-photo fallback, paired comparison, language after loading, raycast/E/Escape, drag suppression, keyboard focus, guided-route collisions, safe paths, WebGL failure/static archive, mobile layout. No runtime errors or failed asset requests.');
await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
