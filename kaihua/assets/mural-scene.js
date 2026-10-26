import * as THREE from 'three';
import {decodeHitMask} from './mural-data.js';
export async function createMuralSurfaces(catalog,scene,renderer){
  const order=['west','east','northWest','northEast'];
  const walls=catalog.walls.flatMap(wall=>wall.regions.filter(region=>region.kind==='mural').map(region=>({...region,muralId:wall.id,label:wall.label}))).sort((a,b)=>order.indexOf(a.key)-order.indexOf(b.key));
  const clickable=[],muralMeshes={},friezes=[],failed=[];
  const regions=catalog.walls.flatMap(wall=>wall.regions.map(region=>({...region,muralId:wall.id})));
  const loader=new THREE.TextureLoader();
  await Promise.all(regions.map(async region=>{
    try{
      const limit=renderer.capabilities.maxTextureSize;
      const lowMemory=Math.max(...region.pixelSize)>limit;
      const path=lowMemory&&region.textureFallback?catalog.resolve(region.textureFallback):region.textureUrl;
      if(lowMemory&&!region.textureFallback)throw new Error('Texture exceeds GPU limit');
      const map=await loader.loadAsync(path);map.colorSpace=THREE.SRGBColorSpace;
      map.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());
      const material=new THREE.MeshStandardMaterial({map,side:THREE.FrontSide,alphaTest:.1,roughness:1,transparent:false});
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(region.width,region.height),material);
      mesh.position.set(...region.position);mesh.rotation.y=region.rotationY;mesh.receiveShadow=true;mesh.name=`mural-${region.muralId}-${region.key}`;
      mesh.updateMatrix();mesh.matrixAutoUpdate=false;scene.add(mesh);
      if(region.kind==='mural'){
        const index=walls.findIndex(w=>w.key===region.key);mesh.userData.wall=index;mesh.userData.hitMask=decodeHitMask(region.hitMask);
        clickable.push(mesh);muralMeshes[region.key]=mesh;
      }else friezes.push(mesh);
    }catch(error){failed.push(region.key);console.warn('Mural surface unavailable:',region.key,error)}
  }));
  // Replace generic painted strips only after the corresponding photographic bands exist.
  if(friezes.length===3)scene.traverse(node=>{if(node.name==='wall-frieze-placeholder')node.visible=false});
  return {walls,clickable,muralMeshes,friezes,failed};
}
