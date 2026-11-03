import {BLOCKS,SIZE,HEIGHT,CHUNK,SEA,hash} from './world.js';
const T=window.THREE;
export const faces=[
 {n:[1,0,0],v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],shade:.78},
 {n:[-1,0,0],v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],shade:.7},
 {n:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],shade:1},
 {n:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],shade:.5},
 {n:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],shade:.85},
 {n:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],shade:.75}
];
export function makeAtlas(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
 for(let tile=1;tile<40;tile++){
   const ox=tile%8*16,oy=Math.floor(tile/8)*16;
   const base=tile===31?'#76aa43':tile===32?'#886044':tile===33?'#ba965f':tile===34?'#e5d9ad':tile===35?'#a7804c':BLOCKS[tile]?.color||'#8b684a';
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){c.fillStyle=base;c.fillRect(ox+x,oy+y,1,1);const r=hash(x,y,tile,1234);c.fillStyle=r>.5?`rgba(255,255,240,${r*.18})`:`rgba(12,16,8,${r*.4})`;c.fillRect(ox+x,oy+y,1,1);}
   if(tile===32){for(let x=0;x<16;x++){c.fillStyle='#64963b';c.fillRect(ox+x,oy,1,3+Math.floor(hash(x,0,0,99)*4));}}
   if(tile===4||tile===15){for(let x=1;x<16;x+=4){c.fillStyle=tile===15?'#353832':'#483622';c.fillRect(ox+x,oy+Math.floor(hash(x,0,0,1)*5),1,8);}}
   if(tile===33||tile===34){c.strokeStyle='#755934';for(let s=2;s<=12;s+=3)c.strokeRect(ox+s+.5,oy+s+.5,15-s*2,15-s*2);}
   if(tile===9||tile===18||tile===35){c.fillStyle='#694d30';for(let y=3;y<16;y+=4)c.fillRect(ox,oy+y,16,1);if(tile===35){c.fillRect(ox+3,oy,1,16);c.fillRect(ox+11,oy,1,16);}}
   if(tile===17){c.strokeStyle='#4b504f';for(let y=1;y<16;y+=5){c.beginPath();c.moveTo(ox,oy+y);c.lineTo(ox+16,oy+y+2);c.stroke();for(let x=y%3;x<16;x+=6)c.fillRect(ox+x,oy+y,1,4);}}
   if(tile===11){c.fillStyle='#d3bb9e';for(let y=3;y<16;y+=5){c.fillRect(ox,oy+y,16,1);for(let x=(y%2)*4;x<16;x+=8)c.fillRect(ox+x,oy+y-4,1,4);}}
   if([12,13,14].includes(tile)){c.fillStyle='#818482';c.fillRect(ox,oy,16,16);for(let i=0;i<9;i++){const x=Math.floor(hash(i,tile,0,7)*14),y=Math.floor(hash(i,0,tile,3)*14);c.fillStyle=BLOCKS[tile].color;c.fillRect(ox+x,oy+y,2,2);}}
   if(tile===10){c.clearRect(ox+1,oy+1,14,14);c.fillStyle='#d7f6f5';c.fillRect(ox+3,oy+3,1,4);c.fillRect(ox+4,oy+2,3,1);c.fillRect(ox+10,oy+10,3,1);}
   if(tile===5){for(let i=0;i<35;i++){const x=i*7%16,y=Math.floor(i*2.3)%16;c.clearRect(ox+x,oy+y,1,1);}}
   if(tile===20||tile===21){c.clearRect(ox,oy,16,16);c.fillStyle='#4c8b39';c.fillRect(ox+7,oy+5,2,11);if(tile===20){c.fillStyle='#d74639';c.fillRect(ox+4,oy+2,8,5);c.fillStyle='#f5c756';c.fillRect(ox+7,oy+3,2,2);}else{for(let i=0;i<4;i++)c.fillRect(ox+2+i*3,oy+6+i%2*3,2,10);}}
 }
 const texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;
 const icons=new Map();for(let i=1;i<BLOCKS.length;i++){const icon=document.createElement('canvas');icon.width=icon.height=16;icon.getContext('2d').drawImage(canvas,(i===1?31:i)%8*16,Math.floor((i===1?31:i)/8)*16,16,16,0,0,16,16);icons.set(i,icon.toDataURL());}
 return {texture,icons};
}
function tileFor(id,face){return id===1?(face===2?31:face===3?2:32):id===4&&face<4&&face>1?33:id===15&&face<4&&face>1?34:id===18&&face===2?35:id;}
export class Graphics{
 constructor(world,canvas){
  this.world=world;this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputEncoding=T.sRGBEncoding;
  this.scene=new T.Scene();this.scene.fog=new T.Fog(0x95c5e4,28,80);this.scene.background=new T.Color(0x95c5e4);
  this.camera=new T.PerspectiveCamera(75,innerWidth/innerHeight,.06,150);this.camera.rotation.order='YXZ';
  this.hemi=new T.HemisphereLight(0xcce8ff,0x746748,.9);this.scene.add(this.hemi);this.sunlight=new T.DirectionalLight(0xfff0ce,.8);this.scene.add(this.sunlight);
  const atlas=makeAtlas();this.icons=atlas.icons;this.atlas=atlas.texture;
  this.opaque=new T.MeshLambertMaterial({map:this.atlas,vertexColors:true,alphaTest:.4});
  this.transparent=new T.MeshLambertMaterial({map:this.atlas,vertexColors:true,transparent:true,opacity:.64,depthWrite:false,side:T.DoubleSide});
  this.meshes=new Map();this.dirty=new Set();this.particles=[];this.animals=[];
  this.outline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.008,1.008,1.008)),new T.LineBasicMaterial({color:0x111919}));this.scene.add(this.outline);this.outline.visible=false;
  this.sun=new T.Mesh(new T.PlaneGeometry(6,6),new T.MeshBasicMaterial({color:0xfff3bd,fog:false}));this.moon=new T.Mesh(new T.PlaneGeometry(4,4),new T.MeshBasicMaterial({color:0xd6e5ed,fog:false}));this.scene.add(this.sun,this.moon);
  const starPositions=[];for(let i=0;i<200;i++){const a=hash(i,0,0,1)*Math.PI*2,b=hash(i,0,0,2)*1.3;starPositions.push(Math.cos(a)*Math.cos(b)*90,Math.sin(b)*90,Math.sin(a)*Math.cos(b)*90);}const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));this.stars=new T.Points(starGeo,new T.PointsMaterial({color:0xffffff,size:.25,transparent:true,fog:false}));this.scene.add(this.stars);
  this.clouds=new T.Group();const cloudMat=new T.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.86});for(let i=0;i<30;i++){const cloud=new T.Mesh(new T.BoxGeometry(6+hash(i,0,0,5)*12,1,4+hash(i,0,0,6)*6),cloudMat);cloud.position.set(hash(i,0,0,3)*130-15,36+hash(i,0,0,7)*4,hash(i,0,0,4)*130-15);this.clouds.add(cloud);}this.scene.add(this.clouds);
  this.hand=new T.Group();const sleeve=new T.Mesh(new T.BoxGeometry(.16,.24,.18),new T.MeshLambertMaterial({color:0x477d8b}));const skin=new T.Mesh(new T.BoxGeometry(.16,.3,.18),new T.MeshLambertMaterial({color:0xc99a74}));sleeve.position.y=-.1;skin.position.y=.17;this.hand.add(sleeve,skin);this.hand.position.set(.36,-.37,-.58);this.hand.rotation.set(-.4,-.2,-.15);this.camera.add(this.hand);this.scene.add(this.camera);
  this.hand.scale.setScalar(.65);this.hand.position.set(.33,-.32,-.7);
  this.held=new T.Mesh(new T.BoxGeometry(.2,.2,.2),new T.MeshLambertMaterial({map:this.atlas,alphaTest:.4}));this.held.position.set(.3,-.23,-.65);this.held.rotation.set(.2,.5,.05);this.camera.add(this.held);this.held.visible=false;
  const crackCanvas=document.createElement('canvas');crackCanvas.width=crackCanvas.height=64;this.crackCanvas=crackCanvas;
  const crackTex=new T.CanvasTexture(crackCanvas);crackTex.magFilter=T.NearestFilter;this.cracks=new T.Mesh(new T.BoxGeometry(1.012,1.012,1.012),new T.MeshBasicMaterial({map:crackTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));this.scene.add(this.cracks);this.cracks.visible=false;
  this.resize();
 }
 heldItem(id){this.held.visible=!!id&&!BLOCKS[id].item;if(!this.held.visible)return;const uv=this.held.geometry.attributes.uv;for(let f=0;f<6;f++){const tile=tileFor(id,f),tx=tile%8,ty=Math.floor(tile/8);const coords=[[0,1],[1,1],[0,0],[1,0]];for(let j=0;j<4;j++)uv.setXY(f*4+j,(tx+.015+coords[j][0]*.97)/8,1-(ty+.985-coords[j][1]*.97)/8);}uv.needsUpdate=true;}
 crack(hit,progress){this.cracks.visible=!!hit&&progress>0;if(!this.cracks.visible)return;this.cracks.position.set(hit.x+.5,hit.y+.5,hit.z+.5);const stage=Math.min(9,Math.floor(progress*10));if(stage===this.crackStage)return;this.crackStage=stage;const c=this.crackCanvas.getContext('2d');c.clearRect(0,0,64,64);c.strokeStyle='#1a201dc9';c.lineWidth=2;for(let i=0;i<stage+2;i++){c.beginPath();c.moveTo(32,32);let x=32,y=32;for(let j=0;j<4;j++){x+=(hash(i,j,0,5)-.5)*30;y+=(hash(j,i,0,7)-.5)*30;c.lineTo(x,y);}c.stroke();}this.cracks.material.map.needsUpdate=true;}
 dispose(){const geos=new Set(),mats=new Set();this.scene.traverse(obj=>{if(obj.geometry)geos.add(obj.geometry);for(const m of Array.isArray(obj.material)?obj.material:[obj.material])if(m)mats.add(m);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());this.atlas.dispose();this.cracks.material.map.dispose();this.renderer.dispose();}
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
 rebuildAll(){for(let z=0;z<SIZE/CHUNK;z++)for(let x=0;x<SIZE/CHUNK;x++)this.rebuild(x,z);}
 mark(x,z){for(const [a,b]of [[x,z],[x-1,z],[x+1,z],[x,z-1],[x,z+1]])if(a>=0&&b>=0&&a<SIZE&&b<SIZE)this.dirty.add(`${Math.floor(a/CHUNK)},${Math.floor(b/CHUNK)}`);}
 rebuild(cx,cz){
  const key=`${cx},${cz}`;for(const mesh of this.meshes.get(key)||[]){this.scene.remove(mesh);mesh.geometry.dispose();}
  const buffers=[{p:[],n:[],uv:[],c:[],i:[]},{p:[],n:[],uv:[],c:[],i:[]}];
  const emit=(vertices,normal,tile,shade,buf)=>{const first=buf.p.length/3,tx=tile%8,ty=Math.floor(tile/8);for(let i=0;i<4;i++){buf.p.push(...vertices[i]);buf.n.push(...normal);const uv=[[0,0],[1,0],[1,1],[0,1]][i];buf.uv.push((tx+.015+uv[0]*.97)/8,1-(ty+.985-uv[1]*.97)/8);buf.c.push(shade,shade,shade);}buf.i.push(first,first+1,first+2,first,first+2,first+3);};
  for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++)for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let y=0;y<HEIGHT;y++){
   const id=this.world.get(x,y,z);if(!id)continue;const def=BLOCKS[id],buf=buffers[def.transparent?1:0];
   if(def.plant){for(const corners of [[[0,0,0],[1,0,1],[1,1,1],[0,1,0]],[[1,0,0],[0,0,1],[0,1,1],[1,1,0]]]){const vs=corners.map(v=>[x+v[0],y+v[1]*.85,z+v[2]]);emit(vs,[0,1,0],id,1,buf);emit([...vs].reverse(),[0,1,0],id,1,buf);}continue;}
   faces.forEach((face,f)=>{const other=this.world.get(x+face.n[0],y+face.n[1],z+face.n[2]);if(other&&(other===id||(!BLOCKS[other].transparent&&!BLOCKS[other].plant)))return;const vertices=face.v.map(v=>[x+v[0],y+v[1]*(id===7?.88:1),z+v[2]]);emit(vertices,face.n,tileFor(id,f),face.shade,buf);});
  }
  const meshes=[];buffers.forEach((buf,i)=>{if(!buf.p.length)return;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(buf.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(buf.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(buf.uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(buf.c,3));geo.setIndex(buf.i);geo.computeBoundingSphere();const mesh=new T.Mesh(geo,i?this.transparent:this.opaque);this.scene.add(mesh);meshes.push(mesh);});this.meshes.set(key,meshes);
 }
 debris(hit){const mat=new T.MeshLambertMaterial({color:BLOCKS[hit.id].color});for(let i=0;i<9;i++){const p=new T.Mesh(new T.BoxGeometry(.09,.09,.09),mat);p.position.set(hit.x+.5,hit.y+.5,hit.z+.5);this.scene.add(p);this.particles.push({mesh:p,velocity:new T.Vector3((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3),life:.65});}}
 addAnimal(x,y,z,kind){const group=new T.Group(),color=kind==='pig'?0xe8a3a4:kind==='cow'?0x675544:0xe5e2d4;const material=new T.MeshLambertMaterial({color});const box=(w,h,d,px,py,pz,mat=material)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(px,py,pz);group.add(mesh);return mesh;};box(.8,.65,1.1,0,.8,0);box(.5,.5,.5,0,1,-.7);const dark=new T.MeshLambertMaterial({color:0x252a24});box(.08,.08,.02,-.14,1.1,-.96,dark);box(.08,.08,.02,.14,1.1,-.96,dark);if(kind==='pig')box(.3,.2,.12,0,.94,-1,new T.MeshLambertMaterial({color:0xc67d85}));if(kind==='cow'){box(.81,.28,.32,0,.85,.1,dark);box(.09,.2,.1,-.23,1.3,-.65);box(.09,.2,.1,.23,1.3,-.65);}const legs=[];for(const a of [-1,1])for(const b of [-1,1])legs.push(box(.15,.45,.16,a*.25,.3,b*.34));group.position.set(x,y,z);this.scene.add(group);this.animals.push({group,legs,kind,angle:Math.random()*6,turn:0,phase:0});}
 tick(dt,time,player,moving,swing){
  let built=0;for(const key of this.dirty){this.dirty.delete(key);this.rebuild(...key.split(',').map(Number));if(++built===2)break;}
  const a=time*Math.PI*2,day=Math.max(0,Math.sin(a)),sky=new T.Color().setRGB(.035+day*.48,.055+day*.68,.11+day*.77);this.scene.background.copy(sky);this.scene.fog.color.copy(sky);this.hemi.intensity=.18+day*.75;this.sunlight.intensity=day*.8;this.sunlight.position.set(player.x+Math.cos(a)*50,Math.sin(a)*70,player.z+30);this.sun.position.set(player.x+Math.cos(a)*65,Math.sin(a)*65,player.z-25);this.moon.position.set(player.x-Math.cos(a)*65,-Math.sin(a)*65,player.z+25);this.sun.lookAt(this.camera.position);this.moon.lookAt(this.camera.position);this.stars.position.set(player.x,0,player.z);this.stars.material.opacity=1-day;this.clouds.children.forEach(c=>{c.position.x+=dt*.35;if(c.position.x>115)c.position.x=-15;});
  this.hand.position.y=-.32+(moving?Math.sin(performance.now()*.012)*.015:0)+Math.sin(swing*Math.PI)*.05;this.hand.rotation.x=-.4-Math.sin(swing*Math.PI)*.75;this.held.position.y=-.23+(moving?Math.sin(performance.now()*.012)*.015:0)+Math.sin(swing*Math.PI)*.07;this.held.rotation.x=.2-Math.sin(swing*Math.PI)*.7;
  for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.velocity.y-=dt*7;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*4;if(p.life<=0){this.scene.remove(p.mesh);p.mesh.geometry.dispose();if(!this.particles.some(q=>q!==p&&q.mesh.material===p.mesh.material))p.mesh.material.dispose();this.particles.splice(i,1);}}
  for(const animal of this.animals){animal.turn-=dt;if(animal.turn<0){animal.angle+=(Math.random()-.5)*2;animal.turn=2+Math.random()*4;}const p=animal.group.position,nx=p.x+Math.sin(animal.angle)*dt*.6,nz=p.z+Math.cos(animal.angle)*dt*.6;const ground=this.world.surface(Math.floor(nx),Math.floor(nz));if(nx>3&&nx<SIZE-3&&nz>3&&nz<SIZE-3&&ground>SEA&&Math.abs(ground+1-p.y)<1.1){p.set(nx,ground+1,nz);animal.phase+=dt*6;}else animal.angle+=Math.PI*.5;animal.group.rotation.y=animal.angle+Math.PI;animal.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(animal.phase+i%2*Math.PI)*.3);}
 }
 render(){this.renderer.render(this.scene,this.camera);}
}
