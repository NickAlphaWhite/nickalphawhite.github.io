import * as THREE from 'three';

// Photo-guided geometry, not a measured reconstruction. All lengths are model units.
export function buildHall(scene, renderer) {
  // Only the four posts around the altar stand in the interior; the side corners are open.
  const occluders=[], obstacles=[], columnCenters=[[-2.72,-2.60],[2.72,-2.60],[-2.72,2.45],[2.72,2.45]];
  const rng=(()=>{let s=713;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)})();
  function texture(draw,w=512,h=512){
    const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
  }
  const woodMap=texture((c,w,h)=>{
    c.fillStyle='#9b9487';c.fillRect(0,0,w,h);
    for(let i=0;i<1400;i++){const x=rng()*w;c.strokeStyle=`rgba(${rng()>.5?'55,49,40':'224,216,199'},${.01+rng()*.045})`;c.lineWidth=.4+rng()*2;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+12,rng()*h,x-9,rng()*h,x+5,h);c.stroke()}
    for(let i=0;i<120;i++){c.fillStyle='rgba(208,185,147,.12)';c.fillRect(rng()*w,rng()*h,2+rng()*5,5+rng()*38)}
  });
  const brickMap=texture((c,w,h)=>{
    c.fillStyle='#77766c';c.fillRect(0,0,w,h);
    for(let row=0;row<8;row++)for(let col=-1;col<5;col++){
      const shade=Math.floor(110+rng()*26);c.fillStyle=`rgb(${shade+10},${shade+7},${shade})`;
      c.fillRect(col*128+(row%2)*64+2,row*64+2,124,60);
      c.strokeStyle='rgba(220,211,184,.14)';c.strokeRect(col*128+(row%2)*64+4,row*64+4,120,56);
    }
    for(let i=0;i<12000;i++){c.fillStyle=rng()>.5?'#ffffff09':'#0000000c';c.fillRect(rng()*w,rng()*h,1,1)}
  });
  const floorMap=texture((c,w,h)=>{
    c.fillStyle='#66665d';c.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=64)for(let x=-128;x<w;x+=128){const q=119+Math.floor(rng()*24);c.fillStyle=`rgb(${q+9},${q+7},${q})`;c.fillRect(x+(y%128?64:0)+1,y+1,126,62)}
    for(let i=0;i<18000;i++){c.fillStyle=rng()>.5?'#efe8d115':'#24261c15';c.fillRect(rng()*w,rng()*h,1+rng()*3,1+rng()*2)}
  },1024,1024);floorMap.repeat.set(3,3);
  const paintMap=texture((c,w,h)=>{
    c.fillStyle='#62786c';c.fillRect(0,0,w,h);
    for(let x=-64;x<w;x+=90){
      c.strokeStyle='#bc9d72';c.lineWidth=4;c.beginPath();c.moveTo(x,h*.5);c.bezierCurveTo(x+70,-h*.25,x+90,h*1.25,x+160,h*.5);c.stroke();
      c.strokeStyle='#843f2e';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(x+55,h*.5,12+i*6,9+i*5,i*.6,0,Math.PI*2);c.stroke()}
    }
    c.strokeStyle='#b3a17d';c.lineWidth=4;c.strokeRect(1,2,w-2,h-4);
    for(let i=0;i<3500;i++){c.fillStyle=rng()>.5?'#b7a68b55':'#554d4144';c.fillRect(rng()*w,rng()*h,1+rng()*7,1+rng()*6)}
  },1024,100);
  const wood=new THREE.MeshStandardMaterial({map:woodMap,color:'#bdbbb2',roughness:.96});
  const darkWood=new THREE.MeshStandardMaterial({map:woodMap,color:'#817c70',roughness:1});
  const brick=new THREE.MeshStandardMaterial({map:brickMap,color:'#b5af9c',roughness:1});
  const stoneMap=texture((c,w,h)=>{
    c.fillStyle='#9b978d';c.fillRect(0,0,w,h);
    for(let i=0;i<18000;i++){const s=70+Math.floor(rng()*100);c.fillStyle=`rgba(${s},${s-2},${s-6},.07)`;c.fillRect(rng()*w,rng()*h,1+rng()*6,1+rng()*6)}
  });
  const stone=new THREE.MeshStandardMaterial({map:stoneMap,bumpMap:stoneMap,bumpScale:.015,color:'#bcb8ad',roughness:.97});
  const plasterMap=texture((c,w,h)=>{
    c.fillStyle='#ada699';c.fillRect(0,0,w,h);
    for(let i=0;i<160;i++){
      const x=rng()*w,width=8+rng()*50,g=c.createLinearGradient(x,0,x+width,0);
      g.addColorStop(0,'#675e5200');g.addColorStop(.5,`rgba(103,94,82,${rng()*.045})`);g.addColorStop(1,'#675e5200');c.fillStyle=g;c.fillRect(x,0,width,h);
    }
    for(let i=0;i<16000;i++){c.fillStyle=rng()>.5?'#ded6c417':'#675f5012';c.fillRect(rng()*w,rng()*h,1+rng()*3,1+rng()*4)}
  },512,1024);
  const plaster=new THREE.MeshStandardMaterial({map:plasterMap,bumpMap:plasterMap,bumpScale:.008,color:'#ddd8cb',roughness:1});
  const floorMat=new THREE.MeshStandardMaterial({map:floorMap,roughness:1});
  const painted=new THREE.MeshStandardMaterial({map:paintMap,color:'#c0b69c',roughness:1});
  const clothMap=texture((c,w,h)=>{
    c.fillStyle='#8c5147';c.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=3){c.strokeStyle='rgba(29,20,15,.09)';c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
    for(let x=0;x<w;x+=3){c.strokeStyle='rgba(206,157,127,.08)';c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()}
  });
  const vermilion=new THREE.MeshStandardMaterial({map:clothMap,color:'#9b766e',roughness:1});
  // Local CC0 scans provide real wear; saturation is reduced in the material shader,
  // without changing the source files or inventing site-specific historic textures.
  function muted(material,saturation){
    material.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\n diffuseColor.rgb=mix(vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))),diffuseColor.rgb,${saturation.toFixed(3)});`);
    };
    material.customProgramCacheKey=()=>`muted-${saturation}`;
  }
  muted(floorMat,.09);muted(brick,.12);muted(wood,.22);muted(darkWood,.18);
  const loader=new THREE.TextureLoader();
  async function scannedMaterial(material,asset,repeatX,repeatY,rotation=0,relief=.25){
    try{
      const maps=await Promise.all(['Diffuse','nor_gl','Rough'].map(async type=>{
        const map=await loader.loadAsync(new URL(`./materials/${asset}-${type}.jpg`,import.meta.url).href);
        map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(repeatX,repeatY);map.center.set(.5,.5);map.rotation=rotation;
        map.anisotropy=renderer.capabilities.getMaxAnisotropy();
        if(type==='Diffuse')map.colorSpace=THREE.SRGBColorSpace;
        return map;
      }));
      material.map=maps[0];material.normalMap=maps[1];material.normalScale.set(relief,relief);
      material.roughnessMap=maps[2];material.roughness=1;material.needsUpdate=true;
    }catch(error){console.warn('Scanned material unavailable:',asset,error)}
  }
  // Calibrate the dark scanned albedos to dusty indoor grey, rather than multiplying
  // them by another dark tint (which made the first PBR pass look almost black).
  floorMat.color.setRGB(2.05,2.02,1.94);brick.color.setRGB(1.45,1.43,1.37);
  wood.color.setRGB(1.8,1.72,1.58);darkWood.color.setRGB(1.20,1.16,1.07);
  const materialsReady=Promise.all([
    scannedMaterial(floorMat,'short_bricks_floor',5.85,5.675,0,.32),
    scannedMaterial(brick,'short_bricks_floor',1,1,Math.PI/2,.24),
    scannedMaterial(wood,'wood_table_worn',1,2,Math.PI/2,.18),
    scannedMaterial(darkWood,'wood_table_worn',1,2,Math.PI/2,.18)
  ]);
  const geometries=new Map();
  function box(x,y,z,w,h,d,mat=wood,solid=false){
    const key=[w,h,d,mat===brick?'masonry':'standard'].join('/');
    if(!geometries.has(key)){
      const geometry=new THREE.BoxGeometry(w,h,d);
      if(mat===brick){
        const uv=geometry.attributes.uv,position=geometry.attributes.position,normal=geometry.attributes.normal;
        for(let i=0;i<uv.count;i++){
          const nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i));
          uv.setXY(i,(nx>.5?position.getZ(i):position.getX(i))/2,(ny>.5?position.getZ(i):position.getY(i))/2);
        }
      }
      geometries.set(key,geometry);
    }
    const m=new THREE.Mesh(geometries.get(key),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);if(solid)occluders.push(m);return m;
  }

  function cylinder(x,y,z,r1,r2,h,mat=wood){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,20),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
  }
  function beam(a,b,width,depth,mat=wood){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),dir=end.clone().sub(start);
    const m=box(0,0,0,width,dir.length(),depth,mat);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;
  }

  // Raised masonry plinth and narrow stone paving, instead of outlined giant tiles.
  // The old plinth and paving BOTH ended at y=0, causing depth-buffer fighting.
  // Keep the plinth top at -.09 and use one upward-facing paving surface at 0.
  const plinth=box(0,-.245,0,12.15,.31,11.7,brick);plinth.name='hall-plinth';
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(11.7,11.35),floorMat);
  floor.name='hall-floor';floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:'#777665',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.43;ground.receiveShadow=true;scene.add(ground);
  // Continuous east and west mural walls, low dado and restrained masonry corners.
  for(const x of [-5.95,5.95]){
    box(x,2.4,0,.25,4.8,11.5,plaster,true);
    box(x>0?5.73:-5.73,.39,0,.18,.78,11.35,brick);
    box(x>0?5.70:-5.70,.79,0,.19,.10,11.35,stone);
    box(x>0?5.72:-5.72,3.99,0,.24,.25,11.35,darkWood);
    box(x>0?5.72:-5.72,4.25,0,.20,.28,11.35,painted).name='wall-frieze-placeholder';
  }
  // The rear central door remains open; mural planes sit against the rear wall.
  for(const x of [-3.43,3.43]){
    box(x,2.38,-5.7,5.14,4.76,.25,plaster,true);box(x,.4,-5.51,5.1,.8,.16,brick);
    box(x,4.24,-5.5,5.1,.28,.18,painted).name='wall-frieze-placeholder';
  }
  box(0,4.1,-5.7,1.73,1.35,.25,darkWood,true);
  for(const x of [-.88,.88])box(x,1.74,-5.5,.17,3.48,.20,darkWood,true);
  // South facade: central portal plus two actual barred window openings.
  box(0,4.3,5.7,12,.95,.28,brick,true);
  for(const x of [-5.7,-1.12,1.12,5.7])box(x,1.95,5.7,.36,3.9,.35,brick,true);
  for(const x of [-3.42,3.42]){
    box(x,.61,5.7,4.2,1.22,.3,brick,true);
    box(x,3.62,5.7,4.2,.45,.3,brick,true);
    for(const xx of [x-2.03,x+2.03])box(xx,2.34,5.55,.15,2.22,.20,darkWood,true);
    for(const yy of [1.3,3.4])box(x,yy,5.55,4.16,.14,.23,wood,true);
    for(let xx=x-1.9;xx<x+2;xx+=.20)box(xx,2.35,5.56,.047,2.08,.08,darkWood,true);
  }
  // Tall weathered posts stand on square brick podiums, as in the supplied photos.
  for(let i=0;i<columnCenters.length;i++){
    const [x,z]=columnCenters[i],side=.96;
    const podium=box(x,.22,z,side,.44,side,brick,true);podium.name='interior-post-podium';
    box(x,.455,z,side+.015,.03,side+.015,stone,true);
    box(x,.505,z,.46,.07,.46,stone,true);
    const post=cylinder(x,2.62,z,.205,.235,4.16,wood);post.name='interior-post';occluders.push(post);
    obstacles.push({x,z,halfX:(side+.05)/2,halfZ:(side+.05)/2});
    box(x,4.66,z,.52,.16,.52,wood);
  }
  // Bracket sets are intentionally simplified geometry, not a claim about historic joinery.
  function bracket(x,z,turn=0){
    const group=new THREE.Group();scene.add(group);
    const parts=[];
    for(let tier=0;tier<3;tier++){
      const y=4.54+tier*.16,span=.50+tier*.32;
      parts.push(box(x,y,z,span,.13,.23,wood));
      parts.push(box(x,y+.08,z,.22,.14,span*.8,wood));
      for(const direction of [-1,1])parts.push(box(x+direction*span*.36,y+.12,z,.20,.12,.28,wood));
    }
    if(turn){for(const part of parts){const local=part.position.clone().sub(new THREE.Vector3(x,0,z));local.applyAxisAngle(new THREE.Vector3(0,1,0),turn);part.position.copy(local.add(new THREE.Vector3(x,0,z)));part.rotation.y=turn;}}
  }
  for(const [x,z] of columnCenters)bracket(x,z);
  for(const z of [-4.8,-2.4,0,2.4,4.8])for(const x of [-5.62,5.62])bracket(x,z,Math.PI/2);
  const roofMembersStart=scene.children.length;
  // Heavy transverse tie beams and progressively rising purlins beneath a pitched roof.
  for(const z of [-5.3,-2.60,2.45,5.3]){
    box(0,4.97,z,11.45,.30,.30,wood);
    for(const x of [-3.4,3.4])beam([x,5.12,z],[x*.35,6.15,z],.16,.18,darkWood);
    box(0,5.98,z,4.9,.23,.25,wood);box(0,6.42,z,1.55,.20,.23,wood);
    for(const x of [-2.35,2.35])box(x,5.57,z,.18,.95,.22,wood);
  }
  for(const x of [-5.55,-3.7,-1.85,0,1.85,3.7,5.55]){
    const y=6.65-Math.abs(x)*.265;
    const purlin=cylinder(x,y,0,.13,.13,11.6,darkWood);purlin.rotation.x=Math.PI/2;
  }
  // Exposed closely spaced rafters. Shared geometry and material keep the scene lightweight.
  for(let z=-5.7;z<=5.7;z+=.25)for(const side of [-1,1])beam([0,6.79,z],[side*6.1,5.17,z],.075,.095,wood);
  for(const side of [-1,1]){
    const roof=box(side*3.05,6.02,0,6.38,.12,11.9,darkWood);roof.rotation.z=-side*Math.atan(.265);
  }
  // Grey tiled outer roof with lifted eaves; corner curvature is photo-guided.
  const roofY=(x,z)=>6.94-Math.abs(x)*.265-Math.max(0,Math.abs(z)-4.45)*.24
    +Math.max(0,Math.abs(x)-5.2)**2*.13+Math.max(0,Math.abs(z)-5.25)**2*.16;
  const roofVertices=[],roofIndices=[],nx=32,nz=48;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const x=-6.75+i*13.5/nx,z=-6.4+j*12.8/nz;roofVertices.push(x,roofY(x,z),z);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;roofIndices.push(a,c,b,b,c,d);
  }
  const roofGeometry=new THREE.BufferGeometry();roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roofVertices,3));roofGeometry.setIndex(roofIndices);roofGeometry.computeVertexNormals();
  const ceramic=new THREE.MeshStandardMaterial({color:'#65685e',roughness:.95,side:THREE.DoubleSide});
  const roofSkin=new THREE.Mesh(roofGeometry,ceramic);roofSkin.castShadow=true;roofSkin.receiveShadow=true;scene.add(roofSkin);
  const tileGeometry=new THREE.CylinderGeometry(.065,.065,.43,6,1,true,0,Math.PI);
  const tileRows=56,tileCols=16,tileCount=tileRows*tileCols*2;
  const roofTiles=new THREE.InstancedMesh(tileGeometry,ceramic,tileCount),tileDummy=new THREE.Object3D();
  let tileIndex=0;
  for(let row=0;row<tileRows;row++)for(const side of [-1,1])for(let col=0;col<tileCols;col++){
    const x=side*(.22+col*.415),z=-6.30+row*.23;
    tileDummy.position.set(x,roofY(x,z)+.065,z);
    const along=new THREE.Vector3(side,side*(roofY(x+.025,z)-roofY(x-.025,z))/.05,0).normalize();
    tileDummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),along);tileDummy.updateMatrix();roofTiles.setMatrixAt(tileIndex++,tileDummy.matrix);
  }
  roofTiles.instanceMatrix.needsUpdate=true;roofTiles.receiveShadow=true;scene.add(roofTiles);
  for(const x of [-6.75,6.75]){
    const points=[];for(let i=0;i<=24;i++){const z=-6.4+i*12.8/24;points.push(new THREE.Vector3(x,roofY(x,z)-.03,z))}
    const edge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.10,6,false),darkWood);scene.add(edge);
  }
  beam([0,6.99,-4.45],[0,6.99,4.45],.18,.18,ceramic);
  // The front reference has an east-west ridge, with eaves across the south facade.
  const roofGroup=new THREE.Group(),roofMembers=scene.children.slice(roofMembersStart);
  scene.add(roofGroup);for(const member of roofMembers)roofGroup.add(member);
  roofGroup.rotation.y=Math.PI/2;roofGroup.scale.set(1.06,1,.98);
  // Upper wooden lattice above the entry-side central bay.
  box(0,4.02,2.45,5.30,.18,.18,wood);
  for(let x=-2.55;x<=2.55;x+=.28)box(x,4.47,2.45,.045,.76,.065,wood);
  for(const y of [4.18,4.44,4.70])box(0,y,2.45,5.3,.045,.065,wood);
  // Red-topped masonry altar: a single coherent platform, not stacked empty tables.
  box(0,.43,-.10,4.54,.86,4.0,brick,true);box(0,.89,-.10,4.65,.12,4.10,stone,true);
  box(0,.967,-.10,4.49,.035,3.98,vermilion);
  obstacles.push({x:0,z:-.10,halfX:2.325,halfZ:2.05});
  // The separately loaded user-supplied GLB includes its own lotus pedestal.
  const z=-.62;
  // Carry the coffer from a closed timber frame bearing on the four altar posts.
  // This is a schematic connection, not a reconstruction of historic joinery.
  const supportStart=scene.children.length;
  for(const x of [-2.72,2.72])box(x,4.87,-.075,.25,.30,5.30,wood).name='canopy-bearing-side';
  for(const zz of [-2.60,2.45])box(0,4.87,zz,5.69,.30,.25,wood).name='canopy-bearing-end';
  for(const zz of [z-1.5,z+1.5]){
    box(0,4.82,zz,5.69,.20,.20,wood).name='canopy-joist';
    for(const x of [-1.75,1.75])box(x,4.53,zz,.14,.62,.14,wood).name='canopy-hanger';
  }
  const supports=new THREE.Group();supports.name='canopy-support';
  const supportMembers=scene.children.slice(supportStart);scene.add(supports);supportMembers.forEach(member=>supports.add(member));
  // Shelves and risers connect each tier; separate decorative rings looked suspended.
  for(let level=0;level<4;level++){
    const w=3.5-level*.38,d=3.0-level*.32,y=4.25+level*.18;
    for(const zz of [z-d/2,z+d/2])box(0,y,zz,w,.14,.16,level%2?painted:wood);
    for(const xx of [-w/2,w/2])box(xx,y,z,.16,.14,d,level%2?painted:wood);
    if(level<3){
      const nextW=w-.38,nextD=d-.32;
      for(const side of [-1,1]){
        box(0,y+.07,z+side*(d+nextD)/4,w,.06,.24,painted);
        box(side*(w+nextW)/4,y+.07,z,.27,.06,d,painted);
        box(0,y+.16,z+side*nextD/2,nextW,.18,.10,wood);
        box(side*nextW/2,y+.16,z,.10,.18,nextD,wood);
      }
    }
  }
  box(0,4.88,z,2.36,.08,2.04,painted).name='canopy-cap';
  // Front approach steps, sill and simple facade beamwork visible through the entrance.
  for(let i=0;i<3;i++)box(0,-.10-i*.12,6.0+i*.40,2.5,.18,.6,stone);
  for(const x of [-5.65,-1.1,1.1,5.65])bracket(x,5.7);
  for(const x of [-5.65,-1.1,1.1,5.65]){
    cylinder(x,2.28,5.92,.16,.19,4.15,wood);box(x,.13,5.92,.58,.26,.58,stone);
  }
  // Broad daylight from the front openings; warm neutral interior rather than green fog.
  const hemi=new THREE.HemisphereLight('#e3e7e6','#777268',2.1);scene.add(hemi);
  const daylight=new THREE.DirectionalLight('#fcfcf4',1.35);daylight.position.set(-3,6,10);daylight.target.position.set(0,1,-1);scene.add(daylight,daylight.target);
  const shadowSize=matchMedia('(pointer:coarse)').matches?1024:2048;
  daylight.castShadow=true;daylight.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(daylight.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:28});daylight.shadow.normalBias=.018;daylight.shadow.bias=-.00012;daylight.shadow.radius=3;
  for(const x of [-3.5,3.5]){const fill=new THREE.PointLight('#edf0e8',16,14,2);fill.position.set(x,2.6,5.3);scene.add(fill)}
  const statueFill=new THREE.PointLight('#f3dfad',4,7,2);statueFill.position.set(0,3.1,2.1);scene.add(statueFill);
  return {occluders,obstacles,columnCenters,materialsReady};
}
