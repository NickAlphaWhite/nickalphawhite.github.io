import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {RoomEnvironment} from './vendor/environments/RoomEnvironment.js';

export async function loadBuddha({scene,renderer,occluders}){
 const gltf=await new GLTFLoader().loadAsync(new URL('./models/golden-buddha.glb',import.meta.url).href);
 const model=gltf.scene;model.name='golden-buddha';
 const initial=new THREE.Box3().setFromObject(model),size=initial.getSize(new THREE.Vector3());
 if(!(size.y>0))throw Error('Buddha model has no height');
 // The source includes its own lotus base. Keep its proportions and seat it on the altar.
 model.scale.setScalar(3.08/size.y);model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3());
 model.position.set(-center.x,.985-bounds.min.y,-.62-center.z);
 const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(environment,.04);
 environment.dispose();pmrem.dispose();
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.castShadow=true;mesh.receiveShadow=true;occluders.push(mesh);
  for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){
   material.envMap=target.texture;material.envMapIntensity=.55;
   material.side=THREE.FrontSide;
   for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(material[key])material[key].anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  }
 });
 scene.add(model);model.updateMatrixWorld(true);renderer.shadowMap.needsUpdate=true;
 return model;
}
