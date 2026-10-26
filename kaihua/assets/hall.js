import * as THREE from 'three';

// Photo-guided geometry, not a measured reconstruction. All lengths are model units.
export function buildHall(scene, renderer) {
  const occluders=[], obstacles=[], columnCenters=[[-2.72,-2.60],[2.72,-2.60],[-2.72,2.45],[2.72,2.45],[-5.20,4.8],[5.20,4.8]];
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
  const stone=new THREE.MeshStandardMaterial({color:'#a59e88',roughness:1});
  const plaster=new THREE.MeshStandardMaterial({color:'#a69e87',roughness:1});
  const floorMat=new THREE.MeshStandardMaterial({map:floorMap,roughness:1});
  const painted=new THREE.MeshStandardMaterial({map:paintMap,color:'#c0b69c',roughness:1});
  const vermilion=new THREE.MeshStandardMaterial({color:'#74372c',roughness:1});
  const gold=new THREE.MeshStandardMaterial({color:'#a48d53',metalness:.42,roughness:.65});
  const goldDark=new THREE.MeshStandardMaterial({color:'#6a582f',metalness:.4,roughness:.79});
  const geometries=new Map();
  function box(x,y,z,w,h,d,mat=wood,solid=false){
    const key=[w,h,d].join('/');if(!geometries.has(key))geometries.set(key,new THREE.BoxGeometry(w,h,d));
    const m=new THREE.Mesh(geometries.get(key),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);if(solid)occluders.push(m);return m;
  }
  function ellipsoid(x,y,z,rx,ry,rz,mat=gold){
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat);m.position.set(x,y,z);m.scale.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;scene.add(m);occluders.push(m);return m;
  }
  function cylinder(x,y,z,r1,r2,h,mat=wood){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,20),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
  }
  function beam(a,b,width,depth,mat=wood){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),dir=end.clone().sub(start);
    const m=box(0,0,0,width,dir.length(),depth,mat);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;
  }
  function limb(a,b,radius,mat=gold){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),dir=end.clone().sub(start);
    const m=cylinder(0,0,0,radius*.85,radius,dir.length(),mat);
    m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());occluders.push(m);return m;
  }
  // Raised masonry plinth and narrow stone paving, instead of outlined giant tiles.
  box(0,-.20,0,12.15,.4,11.7,brick);
  box(0,-.035,0,11.7,.07,11.35,floorMat);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:'#777665',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.43;ground.receiveShadow=true;scene.add(ground);
  // Continuous east and west mural walls, low dado and restrained masonry corners.
  for(const x of [-5.95,5.95]){
    box(x,2.4,0,.25,4.8,11.5,plaster,true);
    box(x>0?5.73:-5.73,.39,0,.18,.78,11.35,brick);
    box(x>0?5.70:-5.70,.79,0,.19,.10,11.35,stone);
    box(x>0?5.72:-5.72,3.99,0,.24,.25,11.35,darkWood);
    box(x>0?5.72:-5.72,4.25,0,.20,.28,11.35,painted);
  }
  // The rear central door remains open; mural planes sit against the rear wall.
  for(const x of [-3.43,3.43]){
    box(x,2.38,-5.7,5.14,4.76,.25,plaster,true);box(x,.4,-5.51,5.1,.8,.16,brick);
    box(x,4.24,-5.5,5.1,.28,.18,painted);
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
    const [x,z]=columnCenters[i],side=i<4?.96:.7;
    box(x,.22,z,side,.44,side,brick,true);box(x,.46,z,side+.05,.09,side+.05,stone,true);
    box(x,.54,z,.49,.08,.49,stone,true);
    const post=cylinder(x,2.62,z,.205,.235,4.08,wood);occluders.push(post);
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
  // Lotus pedestal and seated figure. A schematic sculpture with no claim of scan fidelity.
  const z=-.62;
  box(0,1.10,z,1.9,.28,1.60,goldDark,true);box(0,1.29,z,2.04,.12,1.73,gold,true);
  for(const row of [0,1])for(let a=0;a<12;a++){
    const angle=a*Math.PI/6+(row?Math.PI/12:0);
    const petal=ellipsoid(Math.sin(angle)*.85,1.48+row*.24,z+Math.cos(angle)*.66,.20,.29,.115,row?gold:goldDark);petal.rotation.y=angle;
  }
  cylinder(0,1.77,z,.89,.95,.16,gold);
  ellipsoid(0,1.96,z,.89,.28,.59); // folded legs
  ellipsoid(-.43,2.04,z+.32,.54,.22,.36).rotation.z=.16;
  ellipsoid(.43,2.04,z+.32,.54,.22,.36).rotation.z=-.16;
  // Tapered draped torso, neck, head, ears and ushnisha.
  const torso=new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(.60,0),new THREE.Vector2(.52,.25),new THREE.Vector2(.39,.72),new THREE.Vector2(.43,.94),new THREE.Vector2(.28,1.03)],32),gold);
  torso.position.set(0,2.06,z);torso.scale.z=.67;torso.castShadow=true;torso.receiveShadow=true;scene.add(torso);occluders.push(torso);
  cylinder(0,3.14,z,.15,.17,.24,gold);ellipsoid(0,3.49,z,.285,.38,.255);
  ellipsoid(0,3.80,z-.025,.23,.20,.21,goldDark);ellipsoid(0,3.96,z-.035,.10,.11,.10);
  for(const x of [-.29,.29])ellipsoid(x,3.43,z,.067,.19,.075);
  // Facial relief faces the south entry (+Z).
  ellipsoid(0,3.47,z+.255,.045,.08,.035);
  for(const x of [-.11,.11]){const eye=ellipsoid(x,3.54,z+.232,.064,.012,.017,goldDark);eye.rotation.z=x>0?-.12:.12;}
  ellipsoid(0,3.34,z+.239,.078,.012,.013,goldDark);
  // Right raised hand, left hand resting in lap, and sloping sleeves.
  limb([-.39,2.96,z],[-.62,2.67,z+.19],.14);
  limb([-.62,2.67,z+.19],[-.61,3.09,z+.38],.085);
  ellipsoid(-.62,2.67,z+.19,.13,.13,.13);
  ellipsoid(-.61,3.18,z+.38,.12,.20,.055);
  for(let i=0;i<4;i++)ellipsoid(-.69+i*.048,3.35,z+.38,.023,.10,.027);
  limb([.38,2.97,z],[.62,2.48,z+.20],.15);
  limb([.62,2.48,z+.20],[.17,2.29,z+.46],.095);
  ellipsoid(.62,2.48,z+.20,.14,.14,.14);
  ellipsoid(.10,2.29,z+.48,.23,.065,.12);
  // Fine garment folds follow the torso and crossed legs, without a wireframe overlay.
  for(let i=0;i<7;i++){
    const y=2.15+i*.105,r=.53-i*.025;
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-r,y+.2,z+.22),new THREE.Vector3(-r*.35,y,z+.40),new THREE.Vector3(r*.70,y-.04,z+.29)]);
    const fold=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.009,4,false),goldDark);scene.add(fold);
  }
  // Layered coffer canopy hanging over the central statue, below the roof structure.
  for(let level=0;level<4;level++){
    const w=3.5-level*.38,d=3.0-level*.32,y=4.25+level*.18;
    for(const zz of [z-d/2,z+d/2])box(0,y,zz,w,.14,.16,level%2?painted:wood);
    for(const xx of [-w/2,w/2])box(xx,y,z,.16,.14,d,level%2?painted:wood);
  }
  box(0,4.90,z,2.02,.08,1.72,painted);
  // Front approach steps, sill and simple facade beamwork visible through the entrance.
  for(let i=0;i<3;i++)box(0,-.10-i*.12,6.0+i*.40,2.5,.18,.6,stone);
  for(const x of [-5.65,-1.1,1.1,5.65])bracket(x,5.7);
  for(const x of [-5.65,-1.1,1.1,5.65]){
    cylinder(x,2.28,5.92,.16,.19,4.15,wood);box(x,.13,5.92,.58,.26,.58,stone);
  }
  // Broad daylight from the front openings; warm neutral interior rather than green fog.
  const hemi=new THREE.HemisphereLight('#edece2','#8b8373',2.5);scene.add(hemi);
  const daylight=new THREE.DirectionalLight('#fff9e9',2.3);daylight.position.set(-3,6,10);daylight.target.position.set(0,1,-1);scene.add(daylight,daylight.target);
  const shadowSize=matchMedia('(pointer:coarse)').matches?1024:2048;
  daylight.castShadow=true;daylight.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(daylight.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:30});daylight.shadow.normalBias=.035;
  for(const x of [-3.5,3.5]){const fill=new THREE.PointLight('#e9e0c6',24,14,2);fill.position.set(x,2.6,5.9);scene.add(fill)}
  const statueFill=new THREE.PointLight('#f3dfad',4,7,2);statueFill.position.set(0,3.1,2.1);scene.add(statueFill);
  return {occluders,obstacles,columnCenters};
}
