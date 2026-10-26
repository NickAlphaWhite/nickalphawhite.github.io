let catalogPromise;
export function loadMuralCatalog(){
  if(!catalogPromise)catalogPromise=fetch(new URL('../data/murals.json',import.meta.url)).then(async response=>{
    if(!response.ok)throw new Error(`Mural metadata HTTP ${response.status}`);
    const data=await response.json();
    if(data.schemaVersion!==2||data.walls?.length!==3)throw new Error('Expected three prepared mural walls');
    const base=new URL(globalThis.KAIHUA_MURAL_BASE_URL||data.assetBaseUrl,new URL('../',import.meta.url));
    const resolve=relative=>{
      if(typeof relative!=='string'||relative.split('/').some(part=>part==='..')||!/^[a-zA-Z0-9_./-]+$/.test(relative))throw new Error('Invalid mural asset path');
      return new URL(relative,base).href;
    };
    for(const wall of data.walls){
      if(!['left','back','right'].includes(wall.id)||!wall.width||!wall.height)throw new Error('Invalid mural wall');
      wall.previewUrl=resolve(wall.preview);wall.fullPreviewUrl=resolve(wall.fullPreview);wall.dziUrl=resolve(wall.dzi);
      wall.regions=wall.regions.map(region=>({...region,textureUrl:resolve(region.texture)}));
    }
    return {...data,resolve};
  });
  return catalogPromise;
}
export function decodeHitMask(mask){
  if(!mask)return null;
  return {...mask,bytes:Uint8Array.from(atob(mask.bits),char=>char.charCodeAt(0))};
}
export function visiblePixel(mask,uv){
  if(!mask||!uv)return false;
  const x=Math.max(0,Math.min(mask.width-1,Math.floor(uv.x*mask.width)));
  const y=Math.max(0,Math.min(mask.height-1,Math.floor((1-uv.y)*mask.height))),index=y*mask.width+x;
  return Boolean(mask.bytes[index>>3]&(1<<(index&7)));
}
