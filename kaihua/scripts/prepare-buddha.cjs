const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
// Preserve the user's source GLB; rewrite only its embedded textures for the web.
(async()=>{
 const input=process.argv[2];if(!input)throw Error('Usage: node scripts/prepare-buddha.cjs <source.glb>');
 const source=await fs.readFile(input);if(source.readUInt32LE(0)!==0x46546c67||source.readUInt32LE(4)!==2)throw Error('Expected GLB 2.0');
 const jsonLength=source.readUInt32LE(12),doc=JSON.parse(source.subarray(20,20+jsonLength).toString('utf8'));
 const bin=source.subarray(28+jsonLength),chunks=[],views=[],report=[];let offset=0;
 const imageViews=new Map(doc.images.map((im,i)=>[im.bufferView,i]));
 for(const [index,view]of doc.bufferViews.entries()){
  let bytes=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
  if(imageViews.has(index)){
   const i=imageViews.get(index),before=await sharp(bytes).metadata();
   // Colour gets 2K; normal and packed metallic/roughness get 1K.
   bytes=await sharp(bytes).resize({width:i===0?2048:1024,height:i===0?2048:1024,fit:'inside',withoutEnlargement:true}).webp({quality:i===0?90:96,lossless:i===1}).toBuffer();
   doc.images[i].mimeType='image/webp';report.push({image:i,sourceSize:[before.width,before.height],bytes:bytes.length});
  }
  const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}
  views.push({...view,byteOffset:offset,byteLength:bytes.length});chunks.push(bytes);offset+=bytes.length;
 }
 doc.bufferViews=views;doc.buffers=[{byteLength:offset}];
 for(const texture of doc.textures){texture.extensions={...texture.extensions,EXT_texture_webp:{source:texture.source}};delete texture.source;}
 doc.extensionsUsed=[...new Set([...(doc.extensionsUsed||[]),'EXT_texture_webp'])];doc.extensionsRequired=[...new Set([...(doc.extensionsRequired||[]),'EXT_texture_webp'])];
 const json=Buffer.from(JSON.stringify(doc)),jsonPad=Buffer.alloc((4-json.length%4)%4,0x20),binary=Buffer.concat(chunks),binPad=Buffer.alloc((4-binary.length%4)%4);
 const head=Buffer.alloc(20),binHead=Buffer.alloc(8);head.writeUInt32LE(0x46546c67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(20+json.length+jsonPad.length+8+binary.length+binPad.length,8);head.writeUInt32LE(json.length+jsonPad.length,12);head.writeUInt32LE(0x4e4f534a,16);binHead.writeUInt32LE(binary.length+binPad.length,0);binHead.writeUInt32LE(0x004e4942,4);
 const output=Buffer.concat([head,json,jsonPad,binHead,binary,binPad]),folder=path.resolve(__dirname,'../assets/models');await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'golden-buddha.glb'),output);
 const metadata={sourceName:path.basename(input),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),sourceBytes:source.length,webBytes:output.length,triangles:doc.accessors[doc.meshes[0].primitives[0].indices].count/3,textures:report};await fs.writeFile(path.join(folder,'golden-buddha.json'),JSON.stringify(metadata,null,2)+'\n');console.log(metadata);
})().catch(error=>{console.error(error);process.exitCode=1});
