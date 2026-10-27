import {test} from 'node:test';
import assert from 'node:assert/strict';
import {muralStories} from '../data/mural-stories.js';
test('published stories map to the matching right-wall asset, with reviewed normalized regions',()=>{
 assert.equal(muralStories.left,undefined);assert.equal(muralStories.back,undefined);assert.equal(muralStories.right.length,7);
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
