const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {createReadStream}=require('node:fs');
const sharp=require('sharp');
const {edgeConnectedMask}=require('./background-mask.cjs');
const root=path.resolve(__dirname,'..'),config=require('../data/mural-sources.json');
const flag=name=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null};
const source=flag('--source');
if(!source){console.error('Usage: npm run prepare:assets -- --source <folder containing the nine level 4/3/2 files>');process.exit(1)}
const inputRoot=path.resolve(source),outputRoot=path.resolve(flag('--output')||path.join(root,'assets/murals'));
const scratch=path.resolve(flag('--work')||path.join(root,'.cache/murals'));
sharp.cache({memory:32,files:16,items:32});sharp.concurrency(1);
async function hashFile(file){const hash=crypto.createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex')}
function rect(crop,width,height){
 const left=Math.round(crop[0]*width),top=Math.round(crop[1]*height);
 return {left,top,width:Math.min(width-left,Math.round(crop[2]*width)),height:Math.min(height-top,Math.round(crop[3]*height))};
}
async function outsideMask(file){
 const {data,info}=await sharp(file).removeAlpha().raw().toBuffer({resolveWithObject:true});
 return edgeConnectedMask(data,info.width,info.height,info.channels,config.background);
}
async function hitMask(maskFile,crop){
 const {data,info}=await sharp(maskFile).extract(crop).resize({width:256,fit:'inside',withoutEnlargement:true,kernel:'nearest'}).raw().toBuffer({resolveWithObject:true});
 const bits=Buffer.alloc(Math.ceil(info.width*info.height/8));
 for(let i=0;i<info.width*info.height;i++)if(data[i*info.channels]>127)bits[i>>3]|=1<<(i&7);
 return {width:info.width,height:info.height,bits:bits.toString('base64')};
}
async function treeStats(dir){let bytes=0,count=0;for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory()){const s=await treeStats(p);bytes+=s.bytes;count+=s.count}else{bytes+=(await fs.stat(p)).size;count++}}return {bytes,count}}
(async()=>{
 await fs.mkdir(scratch,{recursive:true});await fs.mkdir(outputRoot,{recursive:true});
 // Check every input before starting any output. Never replace a missing source with another image.
 const inspected=[];
 for(const wall of config.walls)for(const level of [4,3,2]){
  const file=path.join(inputRoot,`${wall.filePrefix}_level${level}.${level===4?'webp':'png'}`);
  const stat=await fs.stat(file),meta=await sharp(file,{limitInputPixels:120000000,sequentialRead:true}).metadata();
  if(!meta.width||!meta.height)throw new Error(`Invalid image: ${file}`);
  inspected.push({wall:wall.id,level,file:path.basename(file),width:meta.width,height:meta.height,bytes:stat.size,sha256:await hashFile(file)});
 }
 console.log(JSON.stringify({inputs:inspected},null,2));
 const manifest={schemaVersion:2,assetBaseUrl:'./assets/murals/',inputLevels:[4,3,2],walls:[]};
 for(const wall of config.walls){
  const sourceInfo=inspected.filter(i=>i.wall===wall.id),l4=sourceInfo.find(i=>i.level===4),l3=sourceInfo.find(i=>i.level===3),l2=sourceInfo.find(i=>i.level===2);
  const revision=crypto.createHash('sha256').update(JSON.stringify({wall,background:config.background,sourceInfo,processor:2})).digest('hex').slice(0,12);
  const relative=`${wall.id}/${revision}`,out=path.join(outputRoot,relative),temp=path.join(scratch,wall.id);
  await fs.mkdir(out,{recursive:true});await fs.mkdir(temp,{recursive:true});
  const mask=await outsideMask(path.join(inputRoot,l4.file)),mask4=path.join(temp,'alpha-level4.png');
  await sharp(Buffer.from(mask.alpha),{raw:{width:mask.width,height:mask.height,channels:1}}).toColourspace('b-w').png().toFile(mask4);
  const original4=path.join(inputRoot,l4.file);
  await sharp(original4).joinChannel(mask4).webp({quality:92,alphaQuality:100,effort:5}).toFile(path.join(out,'preview.webp'));
  const regions=[];
  for(const region of [...wall.sceneRegions,{key:'frieze',kind:'frieze',...wall.frieze}]){
   const crop=rect(region.crop,l4.width,l4.height),name=region.key+'.webp';
   // Crop in a second pipeline: joinChannel must see matching full-canvas dimensions.
   const regionMask=path.join(temp,region.key+'-alpha.png');
   await sharp(mask4).extract(crop).toColourspace('b-w').png().toFile(regionMask);
   await sharp(original4).extract(crop).joinChannel(regionMask).webp({quality:92,alphaQuality:100,effort:5}).toFile(path.join(out,name));
   const smallName=region.key+'-2048.webp';
   if(crop.width>2048)await sharp(path.join(out,name)).resize({width:2048,withoutEnlargement:true}).webp({quality:92,alphaQuality:100,effort:5}).toFile(path.join(out,smallName));
   const ratio=crop.width/crop.height,width=Math.min(region.fit[0],region.fit[1]*ratio),height=width/ratio;
   regions.push({...region,width,height,pixelSize:[crop.width,crop.height],cropPixels:crop,texture:`${relative}/${name}`,textureFallback:crop.width>2048?`${relative}/${smallName}`:null,hitMask:region.kind==='mural'?await hitMask(mask4,crop):null});
  }
  const mask3=path.join(temp,'alpha-level3.png');
  await sharp(mask4).resize(l3.width,l3.height,{kernel:'nearest'}).toColourspace('b-w').png().toFile(mask3);
  await sharp(path.join(inputRoot,l3.file),{limitInputPixels:120000000,sequentialRead:true}).joinChannel(mask3).webp({quality:91,alphaQuality:100,effort:5}).toFile(path.join(out,'full-preview.webp'));
  let pyramidReady=false;try{await fs.access(path.join(out,'zoom.dzi'));pyramidReady=true}catch{}
  if(!pyramidReady){
   const mask2=path.join(temp,'alpha-level2.png');
   await sharp(mask4).resize(l2.width,l2.height,{kernel:'nearest'}).toColourspace('b-w').png().toFile(mask2);
   // libvips performs the pyramid generation offline; no full-resolution browser canvas or PNG download.
   await sharp(path.join(inputRoot,l2.file),{limitInputPixels:120000000,sequentialRead:true}).joinChannel(mask2)
    .webp({quality:91,alphaQuality:100,effort:4}).tile({size:256,overlap:1,layout:'dz',depth:'onepixel'}).toFile(path.join(out,'zoom.dz'));
  }
  const descriptor=path.join(out,'zoom.dzi');
  await fs.writeFile(descriptor,(await fs.readFile(descriptor,'utf8')).replace(/[\t ]+$/gm,''));
  const stats=await treeStats(out);
  const item={id:wall.id,label:wall.label,assetId:wall.assetId,revision,sourceInfo,preview:`${relative}/preview.webp`,fullPreview:`${relative}/full-preview.webp`,dzi:`${relative}/zoom.dzi`,width:l2.width,height:l2.height,previewSize:[l3.width,l3.height],regions,hotspots:wall.hotspots,background:{removedPixels:mask.transparentPixels,totalPixels:l4.width*l4.height},deployment:stats};
  manifest.walls.push(item);console.log(`${wall.id}: ${stats.count} files, ${(stats.bytes/1048576).toFixed(1)} MiB`);
 }
 await fs.mkdir(path.join(root,'data'),{recursive:true});
 await fs.writeFile(path.join(root,'data/murals.json'),JSON.stringify(manifest,null,2)+'\n');
 await fs.writeFile(path.join(root,'data/mural-inspection.json'),JSON.stringify({inputs:inspected,outputLevels:[4,3,2],originalsModified:false},null,2)+'\n');
 const osdRoot=path.dirname(require.resolve('openseadragon/package.json'));
 await fs.copyFile(path.join(osdRoot,'build/openseadragon/openseadragon.min.js'),path.join(root,'assets/vendor/openseadragon.min.js'));
 const licenseNames=await fs.readdir(osdRoot);const license=licenseNames.find(name=>/^LICENSE/i.test(name));
 if(license)await fs.copyFile(path.join(osdRoot,license),path.join(root,'assets/vendor/OPENSEADRAGON-LICENSE.txt'));
 console.log('Prepared local assets. Original files have not been changed.');
})().catch(error=>{console.error(error);process.exitCode=1});
