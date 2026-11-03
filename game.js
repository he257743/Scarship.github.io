import {World,BLOCKS,RECIPES,SIZE,HEIGHT,SEA,hash,collides,intersectsPlayer,castRay} from './world.js?v=3.0.0';
import {Graphics} from './graphics.js?v=3.0.0';
import {setupExploration} from './exploration.js?v=3.0.0';
const $=id=>document.getElementById(id),T=window.THREE,SAVE_KEY='scarship.world.v2';
let world,gfx,player,mode='creative',screen='menu',started=false,selected=0,time=.21,health=20,hunger=20,oxygen=10;
let bag={},durability={},hotbar=[1,2,3,4,9,6,10,11,18],flying=false,grounded=false,vy=0,yaw=.8,pitch=-.1;
let hit=null,mining=null,mineTime=0,left=false,right=false,actionTimer=0,swing=0,hurt=0,footstep=0,survivalTime=0,lastSpace=0,clock=0,fps=0,targetNpc=null;
const villagerRay=new T.Raycaster();
const keys=new Set(),moveTouch={x:0,z:0},direction=new T.Vector3(),touch=matchMedia('(pointer:coarse)').matches;
let audioContext,toastTimer;
let exploration;
function populate(){
 gfx.addVillagers();
 for(let i=0;i<65;i++){const x=8+Math.floor(hash(i,3,1,world.n)*(SIZE-16)),z=8+Math.floor(hash(i,5,1,world.n)*(SIZE-16)),y=world.surface(x,z);if(world.get(x,y,z)===1)gfx.addAnimal(x+.5,y+1,z+.5,['sheep','pig','cow'][i%3]);}
 for(const v of world.villages)for(let i=0;i<2;i++){const x=v.x-18+i*3,z=v.z+18;gfx.addAnimal(x+.5,v.y+1,z+.5,i?'cow':'sheep');}
}
function toast(message){$('toast').textContent=message;$('toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.opacity=0,2600);}
function sound(freq=150,length=.07,type='triangle',volume=.025){if(!$('sound').checked||!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*.45),audioContext.currentTime+length);g.gain.setValueAtTime(volume,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+length);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+length);}
function release(){left=right=false;keys.clear();moveTouch.x=moveTouch.z=0;mining=null;mineTime=0;$('mine-progress').hidden=true;}
function show(next){screen=next;release();if(gfx){gfx.hand.visible=next!=='menu';gfx.held.visible=next!=='menu'&&!!hotbar[selected]&&!BLOCKS[hotbar[selected]].item;gfx.crack(null,0);}for(const id of ['menu','pause','inventory','death','map','trade'])$(id).hidden=next!==id;document.body.classList.toggle('modal',next!=='game');if(next!=='game'&&document.pointerLockElement)document.exitPointerLock();if(next==='inventory')inventory();}
function play(){if(!started)return;show('game');if(!touch){const result=$('game').requestPointerLock?.();result?.catch(()=>{show('pause');toast('请点击“回到世界”以捕获鼠标。');});}try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();}catch{} }
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&screen==='game'&&!touch)show('pause');});
document.addEventListener('pointerlockerror',()=>{if(screen==='game'&&!touch){show('pause');toast('鼠标锁定不可用，请用独立浏览器窗口打开游戏。');}});
function icon(id){if(!id)return '';const def=BLOCKS[id];if(def.item)return `<span class="tool">${def.kind==='pick'?'⛏':def.kind==='axe'?'🪓':def.kind==='shovel'?'♠':id===27?'🍎':id===36?'🍞':id===22?'╱':'◆'}</span>`;return `<img src="${gfx.icons.get(id)}" alt="">`;}
function count(id){return bag[id]||0;}
function slot(id,i){const b=document.createElement('button');b.type='button';b.className='slot'+(i===selected?' active':'');b.title=(BLOCKS[id]?.name||'空格')+' ['+(i+1)+']';b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(i===selected));b.innerHTML=`<span class="num">${i+1}</span>${icon(id)}<span class="count">${mode==='creative'&&id?'∞':count(id)||''}</span>`;if(BLOCKS[id]?.durability){const bar=document.createElement('i');bar.className='durability';bar.style.width=38*(durability[id]??BLOCKS[id].durability)/BLOCKS[id].durability+'px';b.append(bar);}b.onclick=()=>{selected=i;renderHUD();if(screen==='inventory')inventory();};return b;}
function renderHUD(){if(!gfx)return;gfx.heldItem(hotbar[selected]);$('hotbar').replaceChildren(...hotbar.map(slot));$('item-name').textContent=BLOCKS[hotbar[selected]]?.name||'空手';$('status').hidden=mode==='creative';$('hearts').textContent='♥'.repeat(Math.ceil(health/2))+'♡'.repeat(10-Math.ceil(health/2));$('hunger').textContent='◆'.repeat(Math.ceil(hunger/2))+'◇'.repeat(10-Math.ceil(hunger/2));}
function addItem(id,n=1){bag[id]=Math.min(9999,count(id)+n);if(BLOCKS[id].durability&&durability[id]===undefined)durability[id]=BLOCKS[id].durability;if(!hotbar.includes(id)){const empty=hotbar.findIndex(v=>!v);if(empty>=0)hotbar[empty]=id;}renderHUD();}
function nearBench(){if(mode==='creative')return true;for(let z=-3;z<=3;z++)for(let y=-2;y<=2;y++)for(let x=-3;x<=3;x++)if(world.get(Math.floor(player.x)+x,Math.floor(player.y)+y,Math.floor(player.z)+z)===18)return true;return false;}
function inventory(){
 $('catalog-label').textContent=mode==='creative'?'方块与物品目录':'持有的资源';$('inventory-hint').textContent='点击下方物品，分配到高亮的快捷栏格子。';$('inventory-bar').replaceChildren(...hotbar.map(slot));
 const items=BLOCKS.map((b,id)=>({b,id})).filter(({id,b})=>id&&id!==8&&id!==7&&(mode==='creative'||count(id)>0));
 $('catalog').replaceChildren(...items.map(({b,id})=>{const el=document.createElement('button');el.className='catalog-item';el.title=b.name;el.setAttribute('aria-label',b.name);el.innerHTML=icon(id)+`<span>${mode==='creative'?'':count(id)}</span>`;el.onclick=()=>{hotbar[selected]=id;renderHUD();inventory();sound(450,.04);};return el;}));
 const bench=nearBench();$('bench-hint').textContent=bench?'工作台可用。选择配方即可合成。':'木镐等工具需要在放置的工作台 3 格内合成。';
 $('recipes').replaceChildren(...RECIPES.map(recipe=>{const el=document.createElement('button');el.className='recipe';el.innerHTML=`${recipe.name} <strong>×${recipe.count}</strong><small>${recipe.cost.map(([id,n])=>BLOCKS[id].name+' ×'+n).join(' + ')}${recipe.bench?' · 工作台':''}</small>`;el.disabled=mode!=='creative'&&((recipe.bench&&!bench)||recipe.cost.some(([id,n])=>count(id)<n));el.onclick=()=>{if(mode!=='creative'){if(recipe.cost.some(([id,n])=>count(id)<n)||(recipe.bench&&!nearBench()))return;for(const [id,n]of recipe.cost)bag[id]-=n;}addItem(recipe.out,recipe.count);toast(`已合成 ${recipe.name} ×${recipe.count}`);inventory();sound(550,.12);};return el;}));
}
function changeBlock(x,y,z,id){if(world.set(x,y,z,id))gfx.mark(x,z);}
function cameraPose(){const bob=!flying&&grounded&&(keys.has('KeyW')||keys.has('KeyS')||keys.has('KeyA')||keys.has('KeyD')||moveTouch.x||moveTouch.z)?Math.sin(clock*12)*.035:0;gfx.camera.position.set(player.x,player.y+(keys.has('ControlLeft')?1.38:1.62)+bob,player.z);gfx.camera.rotation.set(pitch,yaw,0);gfx.camera.updateMatrixWorld();}
function respawn(){player={...world.spawn()};health=hunger=20;oxygen=10;vy=0;flying=false;grounded=false;hurt=0;cameraPose();renderHUD();}
function saveData(){return {version:3,generation:world.generation,seed:world.seed,mode,edits:[...world.edits],player:{x:player.x,y:player.y,z:player.z},yaw,pitch,hotbar,selected,bag,durability,time,health,hunger};}
function save(quiet=false){if(!started)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(saveData()));$('save-status').textContent='已保存 · '+new Date().toLocaleTimeString('zh-CN');$('continue').hidden=false;if(!quiet)toast('世界已保存');}catch{toast('浏览器无法保存，请导出存档备份。');}}
function validate(data){if(!data||![2,3].includes(data.version)||data.version===3&&![2,3].includes(data.generation)||typeof data.seed!=='string'||data.seed.length>40||!['creative','survival'].includes(data.mode)||!Array.isArray(data.edits)||data.edits.length>SIZE*SIZE*HEIGHT)throw Error('存档格式不兼容');for(const entry of data.edits){if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||entry[0].length>30||!Number.isInteger(entry[1])||!BLOCKS[entry[1]]||BLOCKS[entry[1]].item)throw Error('存档方块无效');const c=entry[0].split(',').map(Number);if(c.length!==3||!c.every(Number.isInteger)||c[0]<0||c[0]>=SIZE||c[1]<0||c[1]>=HEIGHT||c[2]<0||c[2]>=SIZE)throw Error('存档坐标无效');}if(!Array.isArray(data.hotbar)||data.hotbar.length!==9||!data.hotbar.every(id=>Number.isInteger(id)&&!!BLOCKS[id]))throw Error('快捷栏无效');for(const field of ['bag','durability']){if(!data[field]||typeof data[field]!=='object'||Array.isArray(data[field]))throw Error('物品数据无效');for(const [id,n]of Object.entries(data[field]))if(!BLOCKS[id]||!Number.isInteger(n)||n<0||n>9999)throw Error('物品数量无效');}return data;}
async function build(seed,data=null){
 release();$('load-status').textContent='正在生成地形和区块…';$('new-game').disabled=true;$('continue').disabled=true;await new Promise(r=>setTimeout(r,40));
 try{
  mode=data?.mode||document.querySelector('input[name=mode]:checked').value;world=new World(seed,data?.version===2?2:data?.generation||3).generate();if(data)world.applyEdits(data.edits);
  if(gfx)gfx.dispose();
  gfx=new Graphics(world,$('game'));
  bag=data?{...data.bag}:{};durability=data?{...data.durability}:{};hotbar=data?[...data.hotbar]:mode==='creative'?[1,2,3,4,9,6,10,11,18]:[0,0,0,0,0,0,0,0,0];selected=Number.isInteger(data?.selected)?Math.max(0,Math.min(8,data.selected)):0;time=Number.isFinite(data?.time)?((data.time%1)+1)%1:.21;
  yaw=Number.isFinite(data?.yaw)?data.yaw:.8;pitch=Number.isFinite(data?.pitch)?Math.max(-1.5,Math.min(1.5,data.pitch)):-.1;respawn();
  if(data?.player&&['x','y','z'].every(a=>Number.isFinite(data.player[a]))){const p=data.player;if(p.x>.3&&p.x<SIZE-.3&&p.z>.3&&p.z<SIZE-.3&&p.y>0&&p.y<HEIGHT+20&&!collides(world,p))player={...p};health=Math.max(1,Math.min(20,Number(data.health)||20));hunger=Math.max(0,Math.min(20,Number(data.hunger)||0));}
  gfx.rebuildAll(player);populate();exploration.reset();targetNpc=null;
  started=true;cameraPose();renderHUD();$('load-status').textContent=`世界已就绪 · ${SIZE} × ${SIZE} · ${world.villages.length} 座聚落`;show('pause');save(true);play();toast('山川聚落已就绪 · M 打开地图，右键与村民交易');
 }catch(e){console.error(e);$('load-status').textContent='加载失败：'+e.message;show('menu');}finally{$('new-game').disabled=false;$('continue').disabled=false;}
}
function damage(amount){if(mode==='creative'||hurt>0||health<=0)return;health=Math.max(0,health-amount);hurt=.5;sound(75,.16,'sawtooth',.035);renderHUD();if(!health){show('death');save(true);}}
function moveAxis(axis,delta){const original=player[axis];player[axis]+=delta;if(collides(world,player)){player[axis]=original;return false;}return true;}
function physics(dt){
 const submerged=world.get(Math.floor(player.x),Math.floor(player.y+1.4),Math.floor(player.z))===7,swim=world.get(Math.floor(player.x),Math.floor(player.y+.3),Math.floor(player.z))===7;
 const crouch=keys.has('ControlLeft')||keys.has('ControlRight'),sprint=keys.has('ShiftLeft')&&!crouch&&hunger>3;
 let forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-moveTouch.z,strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+moveTouch.x;
 const length=Math.hypot(forward,strafe);if(length>1){forward/=length;strafe/=length;}const moving=length>.05;
 const speed=flying?18:sprint?6.3:crouch?1.5:swim?2.5:4.2;
 const dx=(Math.cos(yaw)*strafe-Math.sin(yaw)*forward)*speed*dt,dz=(-Math.sin(yaw)*strafe-Math.cos(yaw)*forward)*speed*dt;
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz),Math.abs(vy*dt))/.15));
 if(flying)vy=(keys.has('Space')?6:0)-(keys.has('ShiftLeft')||crouch?6:0);else{vy-= (swim?5:24)*dt;if(swim){vy=Math.max(vy,-2);if(keys.has('Space'))vy=3.5;}else if(keys.has('Space')&&grounded){vy=8;grounded=false;sound(130,.06);}}
 for(let i=0;i<steps;i++){
  for(const [axis,delta]of [['x',dx/steps],['z',dz/steps]]){const before=player[axis];moveAxis(axis,delta);if(crouch&&grounded&&!flying&&!swim){const p={...player,y:player.y-.12};if(!collides(world,p))player[axis]=before;}}
  const falling=vy,dy=vy*dt/steps;if(!moveAxis('y',dy)){if(dy<0){if(!grounded&&falling<-12)damage(Math.floor((Math.abs(falling)-11)/2));grounded=true;}vy=0;}else if(dy<0)grounded=false;
 }
 if(player.y< -6)respawn();if(player.y>HEIGHT+15){player.y=HEIGHT+15;vy=0;}
 if(moving&&grounded&&!flying){footstep+=dt;if(footstep>(sprint?.28:.43)){footstep=0;sound(world.get(Math.floor(player.x),Math.floor(player.y-.1),Math.floor(player.z))===3?190:95,.05,'triangle',.018);}}
 $('water-overlay').style.opacity=submerged?1:0;$('air').hidden=!submerged||mode==='creative';if(mode==='survival'){oxygen=Math.max(0,Math.min(10,oxygen+(submerged?-dt:dt*4)));$('air').textContent='● '.repeat(Math.ceil(oxygen));survivalTime+=dt;if(survivalTime>=4){survivalTime=0;if(moving)hunger=Math.max(0,hunger-(sprint?1:.25));if(hunger>=17&&health<20){health++;hunger-=.5;}if(!hunger)damage(1);if(!oxygen)damage(2);renderHUD();}}
 if(world.get(Math.floor(player.x+.31),Math.floor(player.y),Math.floor(player.z))===19)damage(1);
 return moving;
}
function mine(dt){
 if(!left||!hit||targetNpc){mining=null;mineTime=0;gfx.crack(null,0);$('mine-progress').hidden=true;return;}
 const key=`${hit.x},${hit.y},${hit.z}`;if(mining!==key){mining=key;mineTime=0;}const block=BLOCKS[hit.id],tool=BLOCKS[hotbar[selected]];
 if(hit.id===8){$('target-label').textContent='基岩 · 无法破坏';return;}
 const matching=block.tool==='pick'&&tool?.kind==='pick'||[4,9,15,18].includes(hit.id)&&tool?.kind==='axe'||[1,2,6].includes(hit.id)&&tool?.kind==='shovel';
 const needed=mode==='creative'?.16:block.hardness*(matching?1/(tool.power||1):block.tool?2.5:1);mineTime+=dt;swing=(swing+dt*4)%1;
 gfx.crack(hit,mineTime/needed);$('mine-progress').hidden=mode==='creative';$('mine-progress').firstElementChild.style.width=Math.min(100,mineTime/needed*100)+'%';
 if(mineTime>=needed){const old={...hit};changeBlock(hit.x,hit.y,hit.z,0);gfx.debris(old);if(mode==='survival'){if(!block.tool||matching){addItem(block.drop||hit.id);if(hit.id===5&&Math.random()<.18)addItem(27);}if(tool?.durability){durability[hotbar[selected]]=(durability[hotbar[selected]]??tool.durability)-1;if(durability[hotbar[selected]]<=0){bag[hotbar[selected]]=Math.max(0,count(hotbar[selected])-1);delete durability[hotbar[selected]];if(!count(hotbar[selected]))hotbar[selected]=0;toast('工具已经损坏');}renderHUD();}}sound(170,.1,'square',.018);mineTime=0;mining=null;}
}
function use(){if(targetNpc){exploration.openTrade(targetNpc);return;}if(hit?.id===18&&!keys.has('ControlLeft')){show('inventory');return;}const id=hotbar[selected],def=BLOCKS[id];if(!id||mode==='survival'&&!count(id))return;if(def.food){if(hunger>=20){toast('你现在不饿');return;}if(mode==='survival')bag[id]--;hunger=Math.min(20,hunger+def.food);renderHUD();sound(300,.1);return;}if(!hit)return;
 if(def.item)return;
 const x=hit.x+hit.normal.x,y=hit.y+hit.normal.y,z=hit.z+hit.normal.z;if(!world.inside(x,y,z)||world.get(x,y,z)&&world.get(x,y,z)!==7||intersectsPlayer(x,y,z,player))return;changeBlock(x,y,z,id);if(mode==='survival'){bag[id]--;renderHUD();}swing=.5;sound(220,.06,'triangle');}
function pick(){if(!hit)return;const i=hotbar.indexOf(hit.id);if(i>=0)selected=i;else if(mode==='creative'||count(hit.id))hotbar[selected]=hit.id;renderHUD();}
function aim(){
 gfx.camera.getWorldDirection(direction);hit=castRay(world,gfx.camera.position,direction,6);targetNpc=null;
 villagerRay.set(gfx.camera.position,direction);villagerRay.far=6;const npcs=gfx.villagers.filter(v=>v.group.visible).map(v=>v.group);const nearest=villagerRay.intersectObjects(npcs,true)[0];
 if(nearest&&(!hit||nearest.distance<hit.distance))targetNpc=nearest.object.userData.resident;
 gfx.outline.visible=!!hit&&!targetNpc;if(hit)gfx.outline.position.set(hit.x+.5,hit.y+.5,hit.z+.5);
 $('target-label').textContent=targetNpc?`${targetNpc.name} · ${targetNpc.profession} · 右键交谈`:hit?BLOCKS[hit.id].name:'';
}
function tick(now){
 requestAnimationFrame(tick);const dt=Math.min(.05,(now-(tick.last||now))/1000);tick.last=now;clock+=dt;fps=fps*.95+(dt?1/dt:60)*.05;if(!gfx)return;
 if(screen==='game'){
  time=(time+dt/720)%1;const moving=physics(dt);cameraPose();aim();mine(dt);actionTimer-=dt;
  if(right&&actionTimer<=0){use();actionTimer=.25;}if(!left)swing=Math.max(0,swing-dt*4);
  gfx.tick(dt,time,player,moving,swing);hurt=Math.max(0,hurt-dt);$('hurt-overlay').style.opacity=hurt*1.5;
  $('biome').textContent=world.biome(player.x,player.z)+(flying?' · 飞行':'');exploration.navigation();
 }else if(screen==='menu'&&!started){
  const v=world.villages[0];gfx.camera.position.set(v.x+29+Math.sin(clock*.05)*8,v.y+23,v.z+33);gfx.camera.lookAt(v.x,v.y+3,v.z);gfx.tick(dt,.22,player,false,0);
 }
 if(!$('debug').hidden)$('debug').textContent=`Scarship 3.0 · ${mode}\nXYZ ${player.x.toFixed(1)} / ${player.y.toFixed(1)} / ${player.z.toFixed(1)}\n${Math.round(fps)} FPS · ${gfx.renderer.info.render.calls} draw calls\n已加载区块 ${gfx.meshes.size} / 1024 · 村民 ${gfx.villagers.length}\n方块编辑 ${world.edits.size} · 种子 ${world.seed}\n时间 ${Math.floor(time*24).toString().padStart(2,'0')}:${Math.floor(time*1440%60).toString().padStart(2,'0')} · 区域 ${SIZE} × ${SIZE}`;
 gfx.render();
}
document.addEventListener('mousemove',e=>{if(screen==='game'&&document.pointerLockElement){yaw-=e.movementX*.002;pitch=Math.max(-1.55,Math.min(1.55,pitch-e.movementY*.002));}});
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(['Space','Tab','F3'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(['inventory','map','trade'].includes(screen))play();else if(screen==='game')show('pause');return;}if(e.code==='KeyM'&&started&&['game','map'].includes(screen)){if(!e.repeat)screen==='map'?play():exploration.openMap();return;}if(e.code==='KeyE'&&started&&['game','inventory'].includes(screen)){e.preventDefault();if(!e.repeat)screen==='game'?show('inventory'):play();return;}if(screen!=='game')return;keys.add(e.code);if(e.repeat)return;if(e.code==='F3')$('debug').hidden=!$('debug').hidden;if(e.code==='KeyF'&&mode==='creative'){flying=!flying;vy=0;toast(flying?'飞行开启 · 空格上升 / Shift 下降':'飞行关闭');}if(e.code==='KeyR'){respawn();gfx.focus(player,true);toast('已返回出生点');}if(e.code==='Space'){if(performance.now()-lastSpace<280&&mode==='creative'){flying=!flying;vy=0;}lastSpace=performance.now();}if(/^Digit[1-9]$/.test(e.code)){selected=Number(e.code.slice(-1))-1;renderHUD();}});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{if(screen==='game')show('pause');release();});document.addEventListener('visibilitychange',()=>{if(document.hidden){save(true);if(screen==='game')show('pause');}});
$('game').addEventListener('mousedown',e=>{if(screen!=='game')return;if(e.button===0)left=true;if(e.button===2){right=true;actionTimer=0;}if(e.button===1){e.preventDefault();pick();}});window.addEventListener('mouseup',e=>{if(e.button===0)left=false;if(e.button===2)right=false;});window.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('wheel',e=>{if(screen!=='game')return;e.preventDefault();selected=(selected+(e.deltaY>0?1:8))%9;renderHUD();},{passive:false});window.addEventListener('resize',()=>gfx?.resize());
$('new-game').onclick=()=>{if(started)save(true);build($('seed').value.trim()||'Scarship');};$('continue').onclick=()=>{try{const data=validate(JSON.parse(localStorage.getItem(SAVE_KEY)));build(data.seed,data);}catch(e){toast('无法读取存档：'+e.message);}};
$('resume').onclick=play;$('save').onclick=()=>save();$('return-title').onclick=()=>{save(true);show('menu');};$('close-inventory').onclick=play;$('respawn').onclick=()=>{respawn();play();};$('fov').oninput=e=>{gfx.camera.fov=Number(e.target.value);gfx.camera.updateProjectionMatrix();};
$('export').onclick=()=>{save(true);const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(saveData())],{type:'application/json'}));a.href=url;a.download='scarship-world.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>20000000)throw Error('文件大于 20MB');const data=validate(JSON.parse(await file.text()));await build(data.seed,data);}catch(error){toast('导入失败：'+error.message);}finally{e.target.value='';}};
let look=null;const canvas=$('game');canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'&&screen==='game'){look={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(look?.id===e.pointerId){yaw-=(e.clientX-look.x)*.004;pitch=Math.max(-1.55,Math.min(1.55,pitch-(e.clientY-look.y)*.004));look.x=e.clientX;look.y=e.clientY;}});for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>look=null);
const pad=$('move-pad');function movePad(e){const rect=pad.getBoundingClientRect();moveTouch.x=Math.max(-1,Math.min(1,(e.clientX-rect.left-rect.width/2)/40));moveTouch.z=Math.max(-1,Math.min(1,(e.clientY-rect.top-rect.height/2)/40));}pad.onpointerdown=e=>{pad.setPointerCapture(e.pointerId);movePad(e);};pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId))movePad(e);};pad.onpointerup=pad.onpointercancel=()=>{moveTouch.x=moveTouch.z=0;};
function touchHold(id,down,up){const b=$(id);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);down();};b.onpointerup=b.onpointercancel=up;}touchHold('touch-jump',()=>keys.add('Space'),()=>keys.delete('Space'));touchHold('touch-break',()=>left=true,()=>left=false);touchHold('touch-place',()=>{right=true;actionTimer=0;},()=>right=false);$('touch-bag').onclick=()=>show('inventory');$('touch-pause').onclick=()=>show('pause');
setInterval(()=>save(true),20000);window.addEventListener('pagehide',()=>save(true));
exploration=setupExploration({state:()=>({world,player,mode,bag,yaw}),show,play,toast,addItem,travel:destination=>{
 let p;if(destination.homes)p={x:destination.x+.5,y:destination.y+1.01,z:destination.z+11.5};else{const point=destination.view||destination;let top=HEIGHT-1;while(top>0&&!world.get(point.x,top,point.z))top--;p={x:point.x+.5,y:top+(point.lift||4),z:point.z+.5};}
 if(collides(world,p)){toast('目标地点被方块阻挡');return;}player=p;flying=true;vy=0;
 if(destination.look){const d=destination.look;const dx=d.x-player.x,dz=d.z-player.z;yaw=Math.atan2(-dx,-dz);pitch=Math.atan2(d.y-player.y-1.62,Math.hypot(dx,dz));}
 gfx.focus(player,true);cameraPose();toast('已前往 '+destination.name);
}});
async function init(){try{if(!T)throw Error('Three.js 未加载');world=new World('Scarship').generate();gfx=new Graphics(world,$('game'));player=world.spawn();gfx.rebuildAll(player);populate();renderHUD();show('menu');$('load-status').textContent=`世界已就绪 · ${SIZE} × ${SIZE} · ${world.villages.length} 座聚落`;try{$('continue').hidden=!localStorage.getItem(SAVE_KEY);}catch{}requestAnimationFrame(tick);}catch(e){$('load-status').textContent='初始化失败：'+e.message;console.error(e);}}
init();
