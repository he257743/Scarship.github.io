const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const outputDir=path.resolve(__dirname,'../test-results');
fs.mkdirSync(outputDir,{recursive:true});
const screenshot=name=>path.join(outputDir,`scarship-${name}.png`);
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.testGame={get:()=>({world,player,mode,screen,health,hunger,hotbar,bag,gfx}),setPlayer:p=>{player=p;vy=0;cameraPose();},look:(y,p)=>{yaw=y;pitch=p;cameraPose();},addItem,save,show,use,changeBlock,respawn};'});});
 await page.goto(process.env.SCARSHIP_BASE_URL||'http://127.0.0.1:8080');await page.waitForFunction(()=>document.getElementById('load-status').textContent.includes('已就绪'));
 await page.screenshot({path:screenshot('menu')});
 await page.click('#new-game');await page.waitForFunction(()=>window.testGame.get().screen==='game');
 await page.waitForTimeout(700);await page.screenshot({path:screenshot('game')});
 const before=await page.evaluate(()=>window.testGame.get().player.z);await page.keyboard.down('KeyW');await page.waitForTimeout(400);await page.keyboard.up('KeyW');assert.notEqual(await page.evaluate(()=>window.testGame.get().player.z),before);
 await page.keyboard.press('KeyE');await page.waitForSelector('#inventory:not([hidden])');assert.ok(await page.locator('.catalog-item').count()>20);await page.getByRole('button',{name:'玻璃',exact:true}).click();assert.equal(await page.evaluate(()=>window.testGame.get().hotbar[0]),10);
 await page.click('#close-inventory');await page.waitForFunction(()=>window.testGame.get().screen==='game');
 await page.evaluate(()=>{const t=window.testGame;for(let x=47;x<=49;x++)for(let z=45;z<=49;z++){t.changeBlock(x,30,z,3);for(let y=31;y<38;y++)t.changeBlock(x,y,z,0);}t.setPlayer({x:48.5,y:31.01,z:48.5});t.changeBlock(48,32,46,4);t.changeBlock(48,32,45,4);t.look(0,0);});
 await page.mouse.down({button:'left'});await page.waitForFunction(()=>window.testGame.get().world.get(48,32,46)===0);await page.mouse.up({button:'left'});
 await page.mouse.down({button:'right'});await page.waitForFunction(()=>window.testGame.get().world.get(48,32,46)===10);await page.mouse.up({button:'right'});
 await page.evaluate(()=>{const t=window.testGame;t.changeBlock(48,30,48,11);t.save(true);});
 await page.reload();await page.waitForFunction(()=>document.getElementById('load-status').textContent.includes('已就绪'));await page.click('#continue');await page.waitForFunction(()=>window.testGame.get().screen==='game');assert.equal(await page.evaluate(()=>window.testGame.get().world.get(48,30,48)),11);
 await page.evaluate(()=>window.testGame.show('menu'));await page.check('input[value=survival]');await page.click('#new-game');await page.waitForFunction(()=>window.testGame.get().screen==='game');assert.equal(await page.evaluate(()=>window.testGame.get().mode),'survival');
 await page.evaluate(()=>window.testGame.addItem(4,2));await page.keyboard.press('KeyE');await page.waitForSelector('#inventory:not([hidden])');await page.getByRole('button',{name:/^橡木木板/}).click();assert.equal(await page.evaluate(()=>window.testGame.get().bag[9]),4);
 await page.getByRole('button',{name:/^木棍/}).click();assert.equal(await page.evaluate(()=>window.testGame.get().bag[22]),4);assert.ok(await page.getByRole('button',{name:/^木镐/}).isDisabled());
 await page.evaluate(()=>{const t=window.testGame,p=t.get().player;t.changeBlock(Math.floor(p.x)+1,Math.floor(p.y),Math.floor(p.z),18);});await page.evaluate(()=>window.testGame.show('inventory'));assert.ok(!(await page.getByRole('button',{name:/^木镐/}).isEnabled()));
 await page.evaluate(()=>window.testGame.addItem(9,4));await page.evaluate(()=>window.testGame.show('inventory'));await page.getByRole('button',{name:/^木镐/}).click();assert.equal(await page.evaluate(()=>window.testGame.get().bag[23]),1);
 await page.screenshot({path:screenshot('inventory')});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.testGame.show('menu'));await page.screenshot({path:screenshot('mobile')});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS browser: startup, movement, inventory selection, mouse mining/placement, edit/save/reload, survival crafting, workbench requirement and tool crafting, mobile bounds, no JS errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
