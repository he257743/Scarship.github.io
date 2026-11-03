import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {World,SIZE,HEIGHT,BLOCKS,collides,castRay,intersectsPlayer} from '../world.js';

test('seeded terrain is reproducible, deep, and has a safe spawn',()=>{
 const a=new World('Scarship').generate(),b=new World('Scarship').generate();assert.deepEqual(a.data,b.data);assert.notDeepEqual(a.data,new World('other').generate().data);
 assert.equal(a.data.length,SIZE*SIZE*HEIGHT);assert.equal(a.get(0,0,0),8);assert.equal(collides(a,a.spawn()),false);
 for(const id of [1,2,3,4,5,6,7,8,12,13,14])assert.ok(a.data.includes(id),`missing block ${BLOCKS[id].name}`);
});
test('saved edits include air, reject out-of-bounds, and survive regeneration',()=>{
 const a=new World('save').generate();a.set(10,8,10,0);a.set(11,24,10,9);assert.equal(a.set(-1,3,0,1),false);assert.equal(a.set(1,1,1,23),false);const b=new World('save').generate();b.applyEdits([...a.edits]);assert.deepEqual(a.data,b.data);
});
test('player volume detects floor, walls, head collisions and excludes water/plants',()=>{
 const w=new World('test');w.set(4,1,4,3);assert.ok(collides(w,{x:4.5,y:1,z:4.5}));assert.ok(!collides(w,{x:4.5,y:2,z:4.5}));w.set(4,3,4,3);assert.ok(collides(w,{x:4.5,y:2,z:4.5}));w.set(4,3,4,7);assert.ok(!collides(w,{x:4.5,y:2,z:4.5}));assert.ok(intersectsPlayer(4,2,4,{x:4.5,y:2,z:4.5}));
});
test('voxel picking returns exact block and placement normal within reach',()=>{
 const w=new World('ray');w.set(5,2,5,3);const h=castRay(w,{x:5.5,y:2.5,z:9},{x:0,y:0,z:-1});assert.equal(h.z,5);assert.deepEqual(h.normal,{x:0,y:0,z:1});assert.equal(h.distance,3);assert.equal(castRay(w,{x:5.5,y:2.5,z:13},{x:0,y:0,z:-1},6),null);w.set(5,2,7,7);assert.equal(castRay(w,{x:5.5,y:2.5,z:9},{x:0,y:0,z:-1}).id,3);
});
test('expanded world contains mountains, lakes, connected waterfall and accessible villages',()=>{
 const w=new World('Scarship').generate();assert.equal(SIZE,512);assert.equal(HEIGHT,96);assert.equal(w.villages.length,7);
 assert.ok(w.data.includes(30));assert.ok(w.tops[87*SIZE+300]>63);
 assert.equal(w.get(380,54,310),7);for(let y=22;y<=54;y++)assert.equal(w.get(381,y,332),7);
 for(const v of w.villages){assert.equal(v.homes.length,4);assert.equal(w.get(v.x,v.y,v.z+10),31);assert.equal(w.get(v.x+10,v.y+1,v.z+14),33);for(const home of v.homes)assert.equal(collides(w,home),false);}
 w.set(500,80,500,11);assert.equal(w.get(500,80,500),11);
});
test('version 2 terrain stays byte-identical in the original 96 by 96 footprint',()=>{
 const w=new World('Scarship',2).generate(),oldData=new Uint8Array(96*96*48);
 for(let y=0;y<48;y++)for(let z=0;z<96;z++)for(let x=0;x<96;x++)oldData[(y*96+z)*96+x]=w.get(x,y,z);
 assert.equal(createHash('sha256').update(oldData).digest('hex'),'6142596a27a6494dc1358b72061f3b045083d445a904593e32ab8dac40e74680');assert.equal(w.villages.length,6);
 w.set(46,28,48,11);assert.equal(w.get(46,28,48),11);assert.ok(w.get(450,0,450));
});
