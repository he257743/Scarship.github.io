export const SIZE = 512, HEIGHT = 96, SEA = 22, CHUNK = 16;
export const BLOCKS = [
  {name:'空气',solid:false},
  {name:'草方块',color:'#74a842',hardness:.55,drop:2},
  {name:'泥土',color:'#896044',hardness:.5},
  {name:'石头',color:'#888a88',hardness:1.5,tool:'pick',drop:17},
  {name:'橡木原木',color:'#745337',hardness:1.2},
  {name:'橡树树叶',color:'#4a873b',hardness:.2},
  {name:'沙子',color:'#ddcd8d',hardness:.5},
  {name:'水',color:'#4a8fb7',solid:false,transparent:true},
  {name:'基岩',color:'#42434a',hardness:Infinity},
  {name:'橡木木板',color:'#b48b53',hardness:.8},
  {name:'玻璃',color:'#bad8db',hardness:.3,transparent:true},
  {name:'砖块',color:'#ae6350',hardness:1.4,tool:'pick'},
  {name:'煤矿石',color:'#555752',hardness:1.7,tool:'pick',drop:25},
  {name:'铁矿石',color:'#b89d87',hardness:2,tool:'pick',drop:26},
  {name:'钻石矿石',color:'#6ed4cf',hardness:3,tool:'pick'},
  {name:'桦木原木',color:'#e3dfc9',hardness:1.2},
  {name:'白色羊毛',color:'#e4e3d5',hardness:.6},
  {name:'圆石',color:'#787b79',hardness:1.5,tool:'pick'},
  {name:'工作台',color:'#977044',hardness:1},
  {name:'仙人掌',color:'#4d8c43',hardness:.4},
  {name:'红色花朵',color:'#d55743',hardness:.05,plant:true,solid:false},
  {name:'高草',color:'#6e9c42',hardness:.05,plant:true,solid:false},
  {name:'木棍',color:'#9c744a',item:true},
  {name:'木镐',color:'#b38d57',item:true,kind:'pick',power:2,durability:60},
  {name:'石镐',color:'#8d9290',item:true,kind:'pick',power:4,durability:132},
  {name:'煤炭',color:'#343434',item:true},
  {name:'铁矿原料',color:'#bc9b7c',item:true},
  {name:'苹果',color:'#dc5548',item:true,food:4},
  {name:'木斧',color:'#b38d57',item:true,kind:'axe',power:3,durability:60},
  {name:'木锹',color:'#b38d57',item:true,kind:'shovel',power:3,durability:60},
  {name:'雪块',color:'#e9eff0',hardness:.4},
  {name:'土径',color:'#a88d54',hardness:.5,drop:2},
  {name:'耕地',color:'#705036',hardness:.5,drop:2},
  {name:'成熟小麦',color:'#dfbc4f',hardness:.1,plant:true,solid:false},
  {name:'屋顶木瓦',color:'#895039',hardness:.8},
  {name:'灯笼方块',color:'#edbd67',hardness:.5},
  {name:'面包',color:'#bb853c',item:true,food:6},
  {name:'绿宝石',color:'#5dcc80',item:true},
  {name:'石砖',color:'#89948d',hardness:1.5,tool:'pick'}
];
export const RECIPES=[
  {name:'橡木木板',out:9,count:4,cost:[[4,1]]},
  {name:'桦木制木板',out:9,count:4,cost:[[15,1]]},
  {name:'木棍',out:22,count:4,cost:[[9,2]]},
  {name:'工作台',out:18,count:1,cost:[[9,4]]},
  {name:'木镐',out:23,count:1,cost:[[9,3],[22,2]],bench:true},
  {name:'石镐',out:24,count:1,cost:[[17,3],[22,2]],bench:true},
  {name:'木斧',out:28,count:1,cost:[[9,3],[22,2]],bench:true},
  {name:'木锹',out:29,count:1,cost:[[9,1],[22,2]],bench:true}
];
export function seedNumber(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function hash(x,y,z,seed){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177)^seed;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
const smooth=t=>t*t*(3-2*t);
export function noise(x,z,seed){const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);const p=hash(a,0,b,seed),q=hash(a+1,0,b,seed),r=hash(a,0,b+1,seed),s=hash(a+1,0,b+1,seed);return (p+(q-p)*u)*(1-v)+(r+(s-r)*u)*v;}
export class World{
  constructor(seed='Scarship',generation=3){
    this.seed=String(seed);this.n=seedNumber(seed);this.generation=generation;
    this.data=new Uint8Array(SIZE*SIZE*HEIGHT);this.edits=new Map();this.tops=new Int16Array(SIZE*SIZE);
    this.villages=[];this.landmarks=[];
  }
  inside(x,y,z){return x>=0&&z>=0&&x<SIZE&&z<SIZE&&y>=0&&y<HEIGHT;}
  index(x,y,z){return (y*SIZE+z)*SIZE+x;}
  get(x,y,z){return this.inside(x,y,z)?this.data[this.index(x,y,z)]:0;}
  solid(x,y,z){const id=this.get(x,y,z);return !!id&&BLOCKS[id].solid!==false;}
  set(x,y,z,id,record=true){if(!this.inside(x,y,z)||!BLOCKS[id]||BLOCKS[id].item)return false;this.data[this.index(x,y,z)]=id;if(record)this.edits.set(`${x},${y},${z}`,id);return true;}
  surface(x,z){if(x<0||z<0||x>=SIZE||z>=SIZE)return SEA;for(let y=HEIGHT-1;y>=0;y--){let id=this.get(x,y,z);if(id&&id!==7&&id!==5&&!BLOCKS[id].plant)return y;}return 0;}
  riverZ(x){return 166+Math.sin(x/61)*19+Math.sin(x/131+this.n%7)*15;}
  legacyWeight(x,z){return this.generation===2?1-smooth(Math.min(1,Math.max(0,x-95,z-95)/28)):0;}
  rawTerrain(x,z){
    const n=this.n, hill=noise(x/52,z/52,n),detail=noise(x/15,z/15,n+3);
    const peak=(cx,cz,r,h)=>Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r))*h;
    const mountains=peak(300,87,57,39)+peak(389,304,64,48)+peak(147,377,52,39);
    let h=24+hill*10+detail*4+mountains*(.7+noise(x/23,z/23,n+81)*.5);
    const river=Math.abs(z-this.riverZ(x)),riverWidth=5+noise(x/30,0,n+55)*3;
    if(river<riverWidth+9){const bed=SEA-4+Math.min(river/riverWidth,1)*2;h=bed+(h-bed)*smooth(Math.max(0,Math.min(1,(river-riverWidth)/9)));}
    for(const lake of [{x:279,z:397,rx:35,rz:23},{x:440,z:115,rx:26,rz:32}]){
      const d=Math.hypot((x-lake.x)/lake.rx,(z-lake.z)/lake.rz);if(d<1.3){const blend=smooth(Math.max(0,(d-1)/.3));h=(SEA-5+Math.min(d,1)*2)*(1-blend)+h*blend;}
    }
    let water=SEA;
    const alpine=Math.hypot((x-380)/17,(z-310)/22);
    if(alpine<1.25){const blend=smooth(Math.max(0,(alpine-1)/.25));h=(49+Math.min(alpine,1)*2)*(1-blend)+h*blend;water=54;}
    // A cut in the lake's southern rim exposes the waterfall against the cliff.
    if(x>=377&&x<=388&&z>=333&&z<=356)h=SEA-2;
    const legacy=this.legacyWeight(x,z);
    if(legacy){const old=8+noise(x/34,z/34,n)*13+noise(x/12,z/12,n+3)*5+noise(x/5,z/5,n+9)*2;h=Math.floor(old)*legacy+h*(1-legacy);water=Math.round(12*legacy+water*(1-legacy));}
    return {h:Math.floor(Math.min(HEIGHT-10,h)),water,desert:noise(x/38,z/38,n+97)>.68&&h<42};
  }
  planVillages(){
    const anchors=[[80,70,'溪谷村','plains'],[202,90,'松岭部落','highland'],[429,237,'沙丘聚落','desert'],[118,307,'白桦村','plains'],[278,296,'山麓村','highland'],[423,430,'远湾村','plains'],[223,455,'南原部落','plains']];
    this.villages=anchors.filter(([x,z])=>this.generation!==2||x>122||z>122).map(([x,z,name,theme],i)=>{
      x+=Math.floor(hash(i,0,0,this.n)*9)-4;z+=Math.floor(hash(i,1,0,this.n)*9)-4;
      const y=Math.max(SEA+3,Math.min(49,this.rawTerrain(x,z).h));return {id:i,x,z,y,name,theme,residents:5,homes:[]};
    });
    this.landmarks=[
      {name:'雪冠峰',x:300,z:87,view:{x:320,z:109,lift:5},look:{x:300,y:68,z:87}},
      {name:'高山湖',x:380,z:310,view:{x:397,z:323,lift:5},look:{x:380,y:54,z:310}},
      {name:'落云瀑布',x:381,z:335,view:{x:383,z:350,lift:7},look:{x:381,y:43,z:332}},
      {name:'南湾湖',x:279,z:397,view:{x:314,z:408,lift:4},look:{x:279,y:22,z:397}},
      {name:'东岸湖',x:440,z:115,view:{x:468,z:128,lift:4},look:{x:440,y:22,z:115}}
    ];
  }
  terrain(x,z){const base=this.rawTerrain(x,z);for(const v of this.villages){const d=Math.max(Math.abs(x-v.x),Math.abs(z-v.z));if(d<27){const t=smooth(Math.max(0,(d-21)/6));base.h=Math.round(v.y*(1-t)+base.h*t);base.water=SEA;base.desert=v.theme==='desert';break;}}return base;}
  generate(){
    this.planVillages();const n=this.n;
    const caveX=Array.from({length:SIZE},(_,x)=>Array.from({length:HEIGHT},(_,y)=>Math.sin(x*.21+y*.45)));
    const caveZ=Array.from({length:SIZE},(_,z)=>Array.from({length:HEIGHT},(_,y)=>Math.sin(z*.23-y*.33)));
    for(let z=0;z<SIZE;z++)for(let x=0;x<SIZE;x++){
      const t=this.terrain(x,z),h=t.h;this.tops[z*SIZE+x]=h;
      const legacy=this.generation===2&&x<96&&z<96;
      const desert=legacy?noise(x/38,z/38,n+97)>.63:t.desert;
      const diagonal=Math.sin((x+z)*.17);
      for(let y=0;y<=Math.max(h,t.water);y++){
        let id=y===0?8:y>h?7:y===h?(h<=t.water+1||desert?6:h>63?30:h>46?3:1):y>h-4?(desert?6:2):3;
        if(id===3&&y>2&&y<h-4){const cave=caveX[x][y]+caveZ[z][y]+diagonal;if(cave>2.3)id=0;else{const r=hash(x,y,z,n);if(r<.032)id=12;else if(r<.052&&y<20)id=13;else if(r<.059&&y<9)id=14;}}
        // Preserve the old generator inside its original bounds for version 2 saves.
        if(legacy&&id===13&&y>=14)id=3;if(legacy&&id===14&&y>=7)id=3;
        this.data[this.index(x,y,z)]=id;
      }
    }
    for(let z=3;z<SIZE-3;z++)for(let x=3;x<SIZE-3;x++){
      if(this.generation===2&&x<98&&z<98&&(x>92||z>92))continue;
      if(this.villages.some(v=>Math.max(Math.abs(x-v.x),Math.abs(z-v.z))<24))continue;
      const h=this.tops[z*SIZE+x],id=this.get(x,h,z),r=hash(x,1,z,n),legacy=this.generation===2&&x<96&&z<96;
      if(!legacy&&this.get(x,h+1,z)===7)continue;
      if(id===1&&r<(legacy?.016:.009)&&Math.abs(x-48)+Math.abs(z-48)>5){const birch=r<(legacy?.004:.003),th=4+Math.floor(hash(x,2,z,n)*3);for(let y=1;y<=th;y++)this.set(x,h+y,z,birch?15:4,false);for(let dy=th-2;dy<=th+1;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){if((Math.abs(dx)+Math.abs(dz)>3&&dy===th+1)||this.get(x+dx,h+dy,z+dz))continue;this.set(x+dx,h+dy,z+dz,5,false);}}
      else if(id===1&&r>(legacy?.92:.95))this.set(x,h+1,z,r>(legacy?.985:.99)?20:21,false);
      else if(id===6&&h>(legacy?12:SEA)+1&&r<(legacy?.012:.009))for(let y=1;y<=3;y++)this.set(x,h+y,z,19,false);
    }
    for(const v of this.villages)this.buildVillage(v);
    for(const x of [91,255,427])this.buildBridge(x);
    for(let x=380;x<=382;x++)for(let y=SEA;y<=54;y++)this.set(x,y,332,7,false);
    return this;
  }
  buildVillage(v){
    const put=(x,y,z,id)=>this.set(v.x+x,v.y+y,v.z+z,id,false);
    for(let x=-21;x<=21;x++)for(let z=-21;z<=21;z++)if(Math.abs(x)<=1||Math.abs(z)<=1)put(x,0,z,31);
    const plots=[[-15,-16], [7,-16],[-15,5],[7,5]];
    for(const [hx,hz]of plots){
      const width=8,depth=8,wall=v.theme==='desert'?6:9;
      for(let x=0;x<width;x++)for(let z=0;z<depth;z++){
        put(hx+x,0,hz+z,17);
        for(let y=1;y<=4;y++){const edge=x===0||x===7||z===0||z===7;let id=edge?wall:0;if(edge&&(x===0||x===7)&&(z===0||z===7))id=4;if(edge&&y===2&&((x===0||x===7)&&(z===3||z===4)||z===0&&(x===2||x===5)))id=10;if(z===7&&(x===3||x===4)&&y<=2)id=0;put(hx+x,y,hz+z,id);}
      }
      for(let layer=0;layer<4;layer++)for(let x=-1+layer;x<=8-layer;x++)for(let z=-1;z<=8;z++)put(hx+x,5+layer,hz+z,v.theme==='highland'&&layer===3?30:34);
      put(hx+1,1,hz+1,18);put(hx+6,1,hz+1,16);put(hx+6,1,hz+2,16);put(hx+6,2,hz+1,35);
      for(let z=hz+8;z<=hz+10&&z<=21;z++)for(let x=hx+3;x<=hx+4;x++)put(x,0,z,31);
      v.homes.push({x:v.x+hx+3.5,y:v.y+1,z:v.z+hz+7.5});
    }
    // Covered central well, with an open ring that can be walked around.
    for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++){
      if(Math.abs(x)<=1&&Math.abs(z)<=1){put(x,0,z,7);put(x,-1,z,17);}else put(x,0,z,38);
      if(Math.abs(x)===2&&Math.abs(z)===2)for(let y=1;y<=4;y++)put(x,y,z,4);
      if(Math.abs(x)<=3&&Math.abs(z)<=3)put(x,5,z,34);
    }
    for(let x=10;x<=19;x++)for(let z=14;z<=20;z++){put(x,0,z,z===17?7:32);if(z!==17)put(x,1,z,33);}
    for(const [x,z]of [[-3,14],[3,-18],[-19,-3],[19,3]]){for(let y=1;y<=3;y++)put(x,y,z,4);put(x,4,z,35);}
    if(v.theme!=='plains')for(const [x,z]of [[-20,17],[18,-20]]){for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)+Math.abs(dz)<=3)put(x+dx,0,z+dz,38);put(x,1,z,35);}
  }
  buildBridge(x){const center=Math.round(this.riverZ(x));for(let z=center-17;z<=center+17;z++){const y=Math.max(SEA+2,this.tops[z*SIZE+x]+1);for(let dx=-2;dx<=2;dx++){this.set(x+dx,y,z,9,false);this.set(x+dx,y+1,z,0,false);this.set(x+dx,y+2,z,0,false);}if(z%4===0)for(const dx of [-2,2]){for(let p=SEA-3;p<y+2;p++)this.set(x+dx,p,z,4,false);}}}
  biome(x,z){const v=this.villages.find(v=>Math.max(Math.abs(x-v.x),Math.abs(z-v.z))<25);if(v)return v.name;const t=this.rawTerrain(x,z);return t.h>63?'雪山':t.h>46?'山地':t.h<t.water?(t.water>SEA?'高山湖':Math.abs(z-this.riverZ(x))<12?'河流':'湖泊'):t.desert?'沙地':'林地草原';}
  spawn(){
    if(this.generation===3&&this.villages.length){const v=this.villages[0];for(let z=v.z+10;z<v.z+20;z++){const p={x:v.x+.5,y:v.y+1.01,z:z+.5};if(!collides(this,p))return p;}}
    let best=null;for(let z=30;z<66;z++)for(let x=30;x<66;x++){const y=this.surface(x,z)+1;if(this.get(x,y-1,z)===1&&!this.solid(x,y,z)&&!this.solid(x,y+1,z)){const d=Math.hypot(x-48,z-48);if(!best||d<best.d)best={x:x+.5,y:y+.01,z:z+.5,d};}}return best||{x:48.5,y:this.surface(48,48)+1.01,z:48.5};
  }
  applyEdits(entries){for(const [key,id]of entries){const a=key.split(',').map(Number);if(a.length===3&&a.every(Number.isInteger))this.set(...a,id);}}
}
export function intersectsPlayer(x,y,z,p){return x<p.x+.3&&x+1>p.x-.3&&z<p.z+.3&&z+1>p.z-.3&&y<p.y+1.8&&y+1>p.y;}
export function collides(world,p){if(p.x<.3||p.z<.3||p.x>SIZE-.3||p.z>SIZE-.3)return true;for(let x=Math.floor(p.x-.3);x<=Math.floor(p.x+.3);x++)for(let z=Math.floor(p.z-.3);z<=Math.floor(p.z+.3);z++)for(let y=Math.floor(p.y+.001);y<=Math.floor(p.y+1.799);y++)if(world.solid(x,y,z))return true;return false;}
export function castRay(world,origin,dir,reach=6){let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z);const axes=['x','y','z'],cell={x,y,z},step={},delta={},next={};for(const a of axes){step[a]=dir[a]>=0?1:-1;delta[a]=dir[a]===0?Infinity:Math.abs(1/dir[a]);next[a]=dir[a]===0?Infinity:((step[a]>0?cell[a]+1:cell[a])-origin[a])/dir[a];}let distance=0,normal={x:0,y:0,z:0};while(distance<=reach){const id=world.get(cell.x,cell.y,cell.z);if(id&&id!==7)return {...cell,id,normal,distance};const a=next.x<next.y?(next.x<next.z?'x':'z'):(next.y<next.z?'y':'z');distance=next[a];cell[a]+=step[a];next[a]+=delta[a];normal={x:0,y:0,z:0};normal[a]=-step[a];}return null;}
