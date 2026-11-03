export const SIZE = 96, HEIGHT = 48, SEA = 12, CHUNK = 16;
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
  {name:'木锹',color:'#b38d57',item:true,kind:'shovel',power:3,durability:60}
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
  constructor(seed='Scarship'){this.seed=String(seed);this.n=seedNumber(seed);this.data=new Uint8Array(SIZE*SIZE*HEIGHT);this.edits=new Map();this.tops=new Int16Array(SIZE*SIZE);}
  inside(x,y,z){return x>=0&&z>=0&&x<SIZE&&z<SIZE&&y>=0&&y<HEIGHT;}
  index(x,y,z){return (y*SIZE+z)*SIZE+x;}
  get(x,y,z){return this.inside(x,y,z)?this.data[this.index(x,y,z)]:0;}
  solid(x,y,z){const id=this.get(x,y,z);return !!id&&BLOCKS[id].solid!==false;}
  set(x,y,z,id,record=true){if(!this.inside(x,y,z)||!BLOCKS[id]||BLOCKS[id].item)return false;this.data[this.index(x,y,z)]=id;if(record)this.edits.set(`${x},${y},${z}`,id);return true;}
  surface(x,z){if(x<0||z<0||x>=SIZE||z>=SIZE)return SEA;for(let y=HEIGHT-1;y>=0;y--){let id=this.get(x,y,z);if(id&&id!==7&&id!==5&&!BLOCKS[id].plant)return y;}return 0;}
  generate(){
    const n=this.n;
    for(let z=0;z<SIZE;z++)for(let x=0;x<SIZE;x++){
      const h=Math.floor(8+noise(x/34,z/34,n)*13+noise(x/12,z/12,n+3)*5+noise(x/5,z/5,n+9)*2);
      const desert=noise(x/38,z/38,n+97)>.63;this.tops[z*SIZE+x]=h;
      for(let y=0;y<=Math.max(h,SEA);y++){
        let id=y===0?8:y>h?7:y===h?(h<=SEA+1||desert?6:1):y>h-4?(desert?6:2):3;
        if(id===3&&y>2&&y<h-4){const cave=Math.sin(x*.21+y*.45)+Math.sin(z*.23-y*.33)+Math.sin((x+z)*.17);if(cave>2.3)id=0;else{const r=hash(x,y,z,n);if(r<.032)id=12;else if(r<.052&&y<14)id=13;else if(r<.059&&y<7)id=14;}}
        this.set(x,y,z,id,false);
      }
    }
    for(let z=3;z<SIZE-3;z++)for(let x=3;x<SIZE-3;x++){
      const h=this.tops[z*SIZE+x],id=this.get(x,h,z),r=hash(x,1,z,n);
      if(id===1&&r<.016&&Math.abs(x-48)+Math.abs(z-48)>5){const birch=r<.004,th=4+Math.floor(hash(x,2,z,n)*3);for(let y=1;y<=th;y++)this.set(x,h+y,z,birch?15:4,false);for(let dy=th-2;dy<=th+1;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){if((Math.abs(dx)+Math.abs(dz)>3&&dy===th+1)||this.get(x+dx,h+dy,z+dz))continue;this.set(x+dx,h+dy,z+dz,5,false);}}
      else if(id===1&&r>.92)this.set(x,h+1,z,r>.985?20:21,false);
      else if(id===6&&h>SEA+1&&r<.012)for(let y=1;y<=3;y++)this.set(x,h+y,z,19,false);
    }
    return this;
  }
  spawn(){let best=null;for(let z=30;z<66;z++)for(let x=30;x<66;x++){const y=this.surface(x,z)+1;if(this.get(x,y-1,z)===1&&!this.solid(x,y,z)&&!this.solid(x,y+1,z)){const d=Math.hypot(x-48,z-48);if(!best||d<best.d)best={x:x+.5,y:y+.01,z:z+.5,d};}}return best||{x:48.5,y:this.surface(48,48)+1.01,z:48.5};}
  applyEdits(entries){for(const [key,id]of entries){const a=key.split(',').map(Number);if(a.length===3&&a.every(Number.isInteger))this.set(...a,id);}}
}
export function intersectsPlayer(x,y,z,p){return x<p.x+.3&&x+1>p.x-.3&&z<p.z+.3&&z+1>p.z-.3&&y<p.y+1.8&&y+1>p.y;}
export function collides(world,p){if(p.x<.3||p.z<.3||p.x>SIZE-.3||p.z>SIZE-.3)return true;for(let x=Math.floor(p.x-.3);x<=Math.floor(p.x+.3);x++)for(let z=Math.floor(p.z-.3);z<=Math.floor(p.z+.3);z++)for(let y=Math.floor(p.y+.001);y<=Math.floor(p.y+1.799);y++)if(world.solid(x,y,z))return true;return false;}
export function castRay(world,origin,dir,reach=6){let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z);const axes=['x','y','z'],cell={x,y,z},step={},delta={},next={};for(const a of axes){step[a]=dir[a]>=0?1:-1;delta[a]=dir[a]===0?Infinity:Math.abs(1/dir[a]);next[a]=dir[a]===0?Infinity:((step[a]>0?cell[a]+1:cell[a])-origin[a])/dir[a];}let distance=0,normal={x:0,y:0,z:0};while(distance<=reach){const id=world.get(cell.x,cell.y,cell.z);if(id&&id!==7)return {...cell,id,normal,distance};const a=next.x<next.y?(next.x<next.z?'x':'z'):(next.y<next.z?'y':'z');distance=next[a];cell[a]+=step[a];next[a]+=delta[a];normal={x:0,y:0,z:0};normal[a]=-step[a];}return null;}
