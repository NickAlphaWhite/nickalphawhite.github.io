import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import processing from '../scripts/background-mask.cjs';
import {decodeHitMask,visiblePixel} from '../assets/mural-data.js';
const require=createRequire(import.meta.url),sharp=require('sharp'),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'data/murals.json'),'utf8'));
test('background removal preserves enclosed white painting repairs',()=>{
 const width=7,height=7,data=new Uint8Array(width*height*3).fill(255);
 for(let y=1;y<=5;y++)for(let x=1;x<=5;x++)if(x===1||x===5||y===1||y===5){const at=(y*width+x)*3;data[at]=100;data[at+1]=90;data[at+2]=70}
 const mask=processing.edgeConnectedMask(data,width,height,3);
 assert.equal(mask.alpha[0],0);assert.equal(mask.alpha[3*width+3],255);assert.equal(mask.transparentPixels,24);
});
test('alpha hit masks use top-left source coordinates without mirroring',()=>{
 const mask=decodeHitMask({width:2,height:2,bits:Buffer.from([9]).toString('base64')});
 assert.equal(visiblePixel(mask,{x:.25,y:.75}),true);assert.equal(visiblePixel(mask,{x:.75,y:.75}),false);assert.equal(visiblePixel(mask,{x:.75,y:.25}),true);
});
test('prepared assets retain source levels, transparent exteriors and proportions',async()=>{
 assert.deepEqual(manifest.walls.map(w=>w.id),['left','back','right']);
 for(const wall of manifest.walls){
  assert.deepEqual(wall.sourceInfo.map(s=>s.level),[4,3,2]);assert.equal(wall.hotspots.length,0,'No fabricated research hotspots');
  const preview=await sharp(path.join(root,'assets/murals',wall.preview)).metadata();assert.equal(preview.hasAlpha,true);
  const full=await sharp(path.join(root,'assets/murals',wall.fullPreview)).metadata();assert.equal(full.hasAlpha,true);assert.deepEqual([full.width,full.height],wall.previewSize);
  for(const region of wall.regions){
   assert.ok(Math.abs(region.width/region.height-region.pixelSize[0]/region.pixelSize[1])<1e-8);
   const image=await sharp(path.join(root,'assets/murals',region.texture)).metadata();assert.equal(image.hasAlpha,true);assert.deepEqual([image.width,image.height],region.pixelSize);
  }
 }
 const back=manifest.walls.find(w=>w.id==='back');assert.equal(back.regions.filter(r=>r.kind==='mural').length,2);
 const file=path.join(root,'assets/murals',back.preview),meta=await sharp(file).metadata();
 const {data}=await sharp(file).extract({left:Math.floor(meta.width/2),top:Math.floor(meta.height*.75),width:1,height:1}).raw().toBuffer({resolveWithObject:true});
 assert.equal(data[3],0,'The rear door gap is transparent');
});
