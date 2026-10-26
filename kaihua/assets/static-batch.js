import * as THREE from 'three';
// Rendering-only batching: retain original meshes for collision/inspection metadata.
// Their geometry, UVs and world transforms are copied unchanged into opaque batches.
export function batchStaticMeshes(scene){
  scene.updateMatrixWorld(true);const groups=new Map(),batches=[];
  scene.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material)||mesh.material.transparent||mesh.name==='wall-frieze-placeholder'||mesh.name==='hall-floor'||mesh.name.startsWith('mural-'))return;
    const key=[mesh.material.uuid,mesh.castShadow,mesh.receiveShadow].join('/');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
  });
  for(const meshes of groups.values()){
    if(meshes.length<3)continue;
    const geometryList=meshes.map(mesh=>{
      const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);return geometry;
    });
    const count=geometryList.reduce((sum,g)=>sum+g.attributes.position.count,0);
    const positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2);let offset=0;
    for(const geometry of geometryList){
      const n=geometry.attributes.position.count;positions.set(geometry.attributes.position.array,offset*3);
      if(geometry.attributes.normal)normals.set(geometry.attributes.normal.array,offset*3);
      if(geometry.attributes.uv)uvs.set(geometry.attributes.uv.array,offset*2);
      offset+=n;geometry.dispose();
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.computeBoundingSphere();
    const batch=new THREE.Mesh(geometry,meshes[0].material);batch.castShadow=meshes[0].castShadow;batch.receiveShadow=meshes[0].receiveShadow;batch.name='static-render-batch';batch.matrixAutoUpdate=false;
    scene.add(batch);meshes.forEach(mesh=>mesh.visible=false);batches.push(batch);
  }
  return {batches,count:batches.length};
}
