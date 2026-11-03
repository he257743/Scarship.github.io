import {SIZE,BLOCKS} from './world.js?v=3.0.0';
const $=id=>document.getElementById(id);
export function setupExploration(api){
 let selected=null,baseMap=null,mapWorld=null;
 function drawMap(){
  const {world,player}=api.state(),canvas=$('world-map'),c=canvas.getContext('2d');
  if(mapWorld!==world){
   mapWorld=world;baseMap=document.createElement('canvas');baseMap.width=baseMap.height=256;const ctx=baseMap.getContext('2d'),image=ctx.createImageData(256,256);
   for(let z=0;z<256;z++)for(let x=0;x<256;x++){const wx=x*2,wz=z*2,h=world.tops[wz*SIZE+wx],id=world.get(wx,h,wz),water=world.get(wx,h+1,wz)===7;let color=water?[65,128,155]:h>63?[220,231,231]:h>46?[135,143,132]:id===6?[198,177,120]:[83+h*1.1,123+h*.5,69];if(id===31)color=[169,144,90];const i=(z*256+x)*4;image.data.set([...color,255],i);}
   ctx.putImageData(image,0,0);
  }
  c.imageSmoothingEnabled=false;c.drawImage(baseMap,0,0,512,512);c.strokeStyle='#f3e3a044';c.lineWidth=1;for(let n=64;n<512;n+=64){c.beginPath();c.moveTo(n,0);c.lineTo(n,512);c.moveTo(0,n);c.lineTo(512,n);c.stroke();}
  c.font='bold 13px sans-serif';c.textAlign='center';for(const v of world.villages){c.fillStyle='#f5d78c';c.fillRect(v.x-4,v.z-4,8,8);c.strokeStyle='#24342a';c.lineWidth=3;c.strokeText(v.name,v.x,v.z-10);c.fillStyle='#fff0c7';c.fillText(v.name,v.x,v.z-10);}
  for(const p of world.landmarks){c.fillStyle='#f0eee1';c.beginPath();c.arc(p.x,p.z,3,0,Math.PI*2);c.fill();}
  if(selected){c.strokeStyle='#ffcf6d';c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();c.moveTo(player.x,player.z);c.lineTo(selected.x,selected.z);c.stroke();c.setLineDash([]);c.strokeRect(selected.x-8,selected.z-8,16,16);}
  c.save();c.translate(player.x,player.z);c.rotate(-api.state().yaw);c.fillStyle='#fff';c.strokeStyle='#192922';c.lineWidth=2;c.beginPath();c.moveTo(0,-8);c.lineTo(5,6);c.lineTo(0,3);c.lineTo(-5,6);c.closePath();c.fill();c.stroke();c.restore();
  $('map-position').textContent=`位置 ${Math.floor(player.x)}, ${Math.floor(player.z)} · 512 × 512 · 北 ↑`;
 }
 function openMap(){const {world}=api.state();api.show('map');$('destinations').replaceChildren(...[...world.villages,...world.landmarks].map(p=>{const b=document.createElement('button');b.textContent=p.name+' · '+Math.round(Math.hypot(p.x-api.state().player.x,p.z-api.state().player.z))+' 格';b.onclick=()=>{selected=p;$('destination-name').textContent=p.name;$('travel').hidden=api.state().mode!=='creative';drawMap();};return b;}));drawMap();$('travel').hidden=!selected||api.state().mode!=='creative';}
 function navigation(){if(!selected){$('waypoint').textContent='';return;}const {player}=api.state(),distance=Math.hypot(selected.x-player.x,selected.z-player.z);$('waypoint').textContent=`◇ ${selected.name} · ${Math.round(distance)} 格${distance<12?' · 已到达':''}`;}
 $('map-button').onclick=openMap;$('close-map').onclick=api.play;$('mark-destination').onclick=()=>{if(selected){api.toast('已标记 '+selected.name);api.play();}else api.toast('请先选择村庄或地标');};
 $('travel').onclick=()=>{if(selected&&api.state().mode==='creative'){api.travel(selected);api.play();}};$('clear-destination').onclick=()=>{selected=null;$('destination-name').textContent='选择村庄或自然地标';$('travel').hidden=true;navigation();drawMap();};
 let resident=null;
 function openTrade(npc){resident=npc;api.show('trade');$('resident-name').textContent=npc.name+' · '+npc.profession;$('resident-village').textContent=npc.village.name+' · 旅途辛苦了！用资源换些食物吧。';renderTrade();}
 function renderTrade(){const {mode,bag}=api.state();$('trade-offers').replaceChildren(...[
  {cost:4,n:6,out:36,count:2}, {cost:33,n:8,out:36,count:3}, {cost:17,n:12,out:37,count:1}, {cost:37,n:1,out:36,count:8}
 ].map(offer=>{const b=document.createElement('button');b.textContent=`${BLOCKS[offer.cost].name} ×${offer.n} → ${BLOCKS[offer.out].name} ×${offer.count}`;b.disabled=mode!=='creative'&&(bag[offer.cost]||0)<offer.n;b.onclick=()=>{const current=api.state();if(current.mode!=='creative'){if((current.bag[offer.cost]||0)<offer.n)return;current.bag[offer.cost]-=offer.n;}api.addItem(offer.out,offer.count);api.toast(`${resident.name}：谢谢，祝你旅途愉快！`);renderTrade();};return b;}));}
 $('close-trade').onclick=api.play;
 return {openMap,openTrade,navigation,reset(){selected=null;baseMap=null;mapWorld=null;navigation();}};
}
