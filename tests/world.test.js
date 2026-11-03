import test from 'node:test';
import assert from 'node:assert/strict';
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
