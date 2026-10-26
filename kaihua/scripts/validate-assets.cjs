const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function files(dir){let list=[];for(const d of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())list.push(...await files(p));else list.push(p)}return list}
(async()=>{
 const m=JSON.parse(await fs.readFile(path.join(root,'data/murals.json'),'utf8'));assert.equal(m.schemaVersion,2);assert.deepEqual(m.walls.map(w=>w.id),['left','back','right']);
 let total=0,tiles=0;
 for(const wall of m.walls){
  assert.equal(wall.sourceInfo.length,3);assert.ok(wall.sourceInfo.every(s=>[4,3,2].includes(s.level)));
  for(const item of [wall.preview,wall.fullPreview,wall.dzi,...wall.regions.flatMap(r=>[r.texture,...(r.textureFallback?[r.textureFallback]:[])])])assert.ok((await fs.stat(path.join(root,'assets/murals',item))).size>0,item);
  const dzi=await fs.readFile(path.join(root,'assets/murals',wall.dzi),'utf8');assert.ok(dzi.includes(`Width="${wall.width}"`)&&dzi.includes(`Height="${wall.height}"`));assert.ok(dzi.includes('Format="webp"'));
  const tileRoot=path.join(root,'assets/murals',wall.dzi.replace(/\.dzi$/,'_files')),all=await files(tileRoot);
  assert.ok(all.length>100);for(const file of all){if(file.endsWith('vips-properties.xml'))continue;assert.ok(file.endsWith('.webp'));total+=(await fs.stat(file)).size;tiles++}
  for(const region of wall.regions){
   assert.ok(Math.abs(region.width/region.height-region.pixelSize[0]/region.pixelSize[1])<1e-8,'No aspect distortion');
   assert.ok(region.pixelSize[0]<=4096&&region.pixelSize[1]<=4096,'Level 4 GPU budget');
   if(region.kind==='mural')assert.ok(region.hitMask?.bits,'Visible-area hit mask');
   assert.ok(region.position[2]<5,'No front-wall image');
  }
  assert.ok((wall.hotspots||[]).every(h=>h.x>=0&&h.x<=1&&h.y>=0&&h.y<=1),'Normalized hotspot coordinates');
 }
 const deployment=await files(path.join(root,'assets/murals'));assert.ok(!deployment.some(file=>/_level[0123]\.png$/i.test(file)),'Raw high-resolution PNGs must not be deployed');
 assert.ok(total<500*1024*1024,'Leave static hosting headroom');
 await fs.access(path.join(root,'assets/vendor/openseadragon.min.js'));await fs.access(path.join(root,'assets/vendor/OPENSEADRAGON-LICENSE.txt'));
 console.log(`Build validated: ${m.walls.length} walls, ${tiles} on-demand tiles, ${(total/1048576).toFixed(1)} MiB of tiles. No bundler required.`);
})().catch(error=>{console.error(error);process.exitCode=1});
