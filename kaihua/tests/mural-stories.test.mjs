import {test} from 'node:test';
import assert from 'node:assert/strict';
import {muralStories} from '../data/mural-stories.js';
test('published stories map to the matching right-wall asset, with reviewed normalized regions',()=>{
 assert.equal(muralStories.left.length,4);assert.equal(muralStories.back.length,3);assert.equal(muralStories.right.length,7);
 assert.equal(new Set(muralStories.right.map(item=>item.id)).size,7);
 for(const [index,item] of muralStories.right.entries()){
  const r=item.region;assert.equal(item.order,index+1);
  assert.ok(r.x>=0&&r.y>.29&&r.width>0&&r.height>0&&r.x+r.width<=1&&r.y+r.height<=1);
  assert.ok(item.x>=r.x&&item.x<=r.x+r.width&&item.y>=r.y&&item.y<=r.y+r.height);
  assert.equal(item.source.url,'https://www.amsm.pku.edu.cn/info/1038/1193.htm');assert.ok(item.verification.inliers>=15);
  assert.deepEqual(item.verification.referenceSize,[6374,2313]);
  for(const lang of ['zh','en'])assert.ok(item.title[lang]&&item.text[lang]&&item.lookFor[lang]);
 }
});
test('all fourteen stories have bounded regions, distinct identifiers and sourced bilingual text',()=>{
 const all=Object.values(muralStories).flat();assert.equal(all.length,14);assert.equal(new Set(all.map(s=>s.id)).size,14);
 for(const stories of Object.values(muralStories))for(const [i,item]of stories.entries()){
  const r=item.region;assert.equal(item.order,i+1);assert.ok(r.x>=0&&r.y>=0&&r.width>0&&r.height>0&&r.x+r.width<=1&&r.y+r.height<=1);
  assert.ok(item.x>=r.x&&item.x<=r.x+r.width&&item.y>=r.y&&item.y<=r.y+r.height);
  assert.ok(item.source.url.startsWith('https://')&&item.textSource.url.startsWith('https://'));
  for(const lang of ['zh','en'])assert.ok(item.title[lang]&&item.text[lang].split('\n\n').length===3&&item.lookFor[lang]);
 }
 assert.ok(muralStories.back.every(item=>item.region.x>.70),'Rear doorway gap is not used as a story location');
 assert.ok(muralStories.left.every(item=>item.verification.method==='published-tracing-and-visual-review'));
});
