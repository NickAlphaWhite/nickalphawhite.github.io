const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const base=process.env.KAIHUA_TEST_URL||'http://127.0.0.1:8080/kaihua/';
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[],errors=[];
  page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url())});
  await page.route(base,async route=>{const response=await route.fetch(),html=await response.text();await route.fulfill({response,body:html.replace(/init\(\);\r?\n\} catch\(error\)/,'window.shellQA={scene,renderer,camera,state,getDetail:()=>detailViewer};init();\n} catch(error)')})});
  await page.goto(base);await page.waitForSelector('#loading',{state:'detached'});
  assert.equal(requests.some(u=>u.endsWith('golden-buddha.glb')),false,'Home does not load the GLB');
  await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.fonts.check('100px Marcellus')));
  async function checkHeader(id){
   assert.equal(await page.locator(id).getAttribute('aria-current'),'page');
   assert.equal(await page.locator(id).evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el}),true,'Global navigation stays interactive');
  }
  await checkHeader('#nav-home');await page.locator('#enter').click();await page.waitForFunction(()=>shellQA.scene.getObjectByName('golden-buddha'));
  await page.waitForFunction(()=>document.pointerLockElement===shellQA.renderer.domElement);
  for(const key of ['Tab','Shift+Tab','Tab'])await page.keyboard.press(key);
  assert.equal(await page.evaluate(()=>document.activeElement===shellQA.renderer.domElement&&document.pointerLockElement===shellQA.renderer.domElement),true,'Tab keeps captured walking focus');
  const before=await page.evaluate(()=>shellQA.camera.position.z);await page.keyboard.down('w');
  try{await page.waitForFunction(z=>shellQA.camera.position.z<z-.05,before,{timeout:10000});}finally{await page.keyboard.up('w');}
  await page.evaluate(()=>document.exitPointerLock());await page.waitForFunction(()=>!document.pointerLockElement);await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement!==shellQA.renderer.domElement),true,'Tab resumes ordinary keyboard navigation after unlocking');
  await checkHeader('#nav-explore');
  const bounds=await page.evaluate(async()=>{const THREE=await import('three'),box=new THREE.Box3().setFromObject(shellQA.scene.getObjectByName('golden-buddha'));return {min:box.min.toArray(),size:box.getSize(new THREE.Vector3()).toArray()}});
  assert.ok(Math.abs(bounds.min[1]-.985)<.001,'Model rests on altar');assert.ok(Math.abs(bounds.size[1]-3.08)<.001);assert.ok(bounds.size[0]<4.49&&bounds.size[2]<3.98);
  const headerHeight=await page.locator('.topbar').evaluate(el=>el.getBoundingClientRect().height);
  for(const id of ['#nav-atlas','#nav-method']){
   await page.locator(id).click();await checkHeader(id);assert.equal(await page.locator('.topbar').evaluate(el=>el.getBoundingClientRect().height),headerHeight);
   assert.ok((await page.locator('#overlay').boundingBox()).y>=headerHeight);
   if(id==='#nav-atlas')await page.waitForFunction(()=>shellQA.getDetail()?.getViewer()?.world.getItemAt(0)?.getFullyLoaded(),null,{timeout:60000});
  }
  assert.deepEqual(await page.locator('.about-timeline time').allTextContents(),['1030','1073','1092–1096']);assert.equal(await page.locator('.about-section').count(),5);assert.ok((await page.locator('.about-page').textContent()).includes('Yi Zhu'));assert.ok(!/snake/i.test(await page.locator('.about-page').textContent()));
  await page.locator('#nav-atlas').click();assert.deepEqual(await page.locator('.mural-tabs button').allTextContents(),['East wall','North wall','West wall']);
  await page.locator('#nav-home').click();await page.locator('#language').click();await page.evaluate(()=>document.fonts.ready);
  await page.locator('#nav-atlas').click();assert.deepEqual(await page.locator('.mural-tabs button').allTextContents(),['东壁','北壁','西壁']);await page.locator('#nav-method').click();assert.ok((await page.locator('.about-page').textContent()).includes('壁上千年'));assert.ok(!/snake/i.test(await page.locator('.about-page').textContent()));await page.locator('#nav-home').click();
  assert.ok(await page.evaluate(()=>document.fonts.check('100px "Kaihua WenKai"','开化寺')));
  await page.setViewportSize({width:390,height:844});await page.locator('#nav-atlas').click();await checkHeader('#nav-atlas');await page.locator('#nav-method').click();await checkHeader('#nav-method');
  assert.ok((await page.locator('#overlay').boundingBox()).y>=108);
  await page.locator('#nav-home').click();await page.locator('#nav-explore').click();await page.waitForFunction(()=>shellQA.scene.getObjectByName('golden-buddha'));await page.evaluate(()=>document.exitPointerLock());
  assert.equal(requests.filter(u=>u.endsWith('golden-buddha.glb')).length,1,'The same model survives navigation');assert.deepEqual(errors,[]);
  if(process.env.KAIHUA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.KAIHUA_SCREENSHOTS,'kaihua-shell-mobile.png')});
  console.log(JSON.stringify({passed:true,bounds,checks:'Tab/Shift+Tab preserves walking; W advances; unlocked Tab navigation; bilingual compass labels, About history and author credit; local fonts, GLB reuse, persistent desktop/mobile navigation',errors},null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
