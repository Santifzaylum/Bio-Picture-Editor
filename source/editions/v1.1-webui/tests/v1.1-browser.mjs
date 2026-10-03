import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const address='http://127.0.0.1:4329',results=[],errors=[];
const server=spawn(process.execPath,['--import','tsx','server/index.ts'],{cwd:process.cwd(),env:{...process.env,BIO_PORT:'4329',BIO_DATA_DIR:'tests/v1.1-server-data'},windowsHide:true,stdio:'pipe'});
let output='';server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
let browser,token,page;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function api(route,body,binary=false){const r=await fetch(address+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{'x-bio-token':token,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200);return binary?Buffer.from(await r.arrayBuffer()):r.json();}
async function state(){await page.waitForTimeout(700);return page.evaluate(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('bio-annotator',1);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});return new Promise((r,j)=>{const q=db.transaction('draft').objectStore('draft').get('workspace');q.onsuccess=()=>{db.close();r(q.result.documents.find(d=>d.project.id===q.result.activeId));};q.onerror=()=>j(q.error);});});}
async function drag(a,b,button='left'){await page.mouse.move(...a);await page.mouse.down({button});await page.mouse.move(...b,{steps:8});await page.mouse.up({button});}
async function check(name,fn){await fn();results.push({name,passed:true});console.log('PASS '+name);}
const selected=()=>page.locator('.objectRow.selected').count();
try{
 for(let n=0;n<100;n++){try{token=(await(await fetch(address+'/api/session')).json()).token;break;}catch{if(server.exitCode!==null)throw Error(output);await delay(100);}}
 assert.ok(token,'isolated server started');
 browser=await chromium.launch({channel:'msedge',headless:true});
 page=await browser.newPage({viewport:{width:1500,height:950}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(address);await page.waitForFunction(()=>!document.querySelector('input[type=file]').disabled&&document.querySelector('.primary')?.textContent);
 const seed=JSON.parse(await fs.readFile('examples/example-inline.json','utf8'));seed.id=crypto.randomUUID();seed.annotations=[];seed.revision=0;seed.title='v1.1 交互验证';seed.layout={...seed.layout,left:0,right:0,top:0,bottom:0};
 const portable=await api('package',{project:seed},true);
 await page.locator('input[type=file]').setInputFiles({name:'v1.1-test.biozip',mimeType:'application/zip',buffer:portable});await page.getByRole('tab').waitFor();
 const box=await page.locator('.canvas').boundingBox();const point=(x,y)=>[box.x+x,box.y+y];
 await check('适应窗口时空白点击取消选择，左键不会平移',async()=>{const before=await state();await page.mouse.move(...point(box.width/2,box.height/2));assert.equal(await page.locator('.canvas').evaluate(e=>getComputedStyle(e).cursor),'default');await drag(point(150,160),point(190,200));assert.deepEqual((await state()).view,before.view);});
 await page.mouse.move(...point(box.width/2,box.height/2));await page.mouse.wheel(0,-900);await page.waitForTimeout(100);
 await check('放大后自动抓手及左键平移，原图和标注坐标不变',async()=>{const before=await state();await page.mouse.move(...point(80,90));assert.equal(await page.locator('.canvas').evaluate(e=>getComputedStyle(e).cursor),'grab');await page.mouse.down();await page.waitForTimeout(30);assert.equal(await page.locator('.canvas').evaluate(e=>getComputedStyle(e).cursor),'grabbing');await page.mouse.move(...point(120,120),{steps:8});await page.mouse.up();const after=await state();assert.equal(after.view.x,before.view.x+40);assert.equal(after.view.y,before.view.y+30);assert.deepEqual(after.project.annotations,before.project.annotations);assert.equal(after.dirty,before.dirty);});
 const created={};
 await check('放大时箭头、直线、矩形、椭圆、文字与关联引线仍可正常创建，Shift 约束保留',async()=>{
  for(const [name,type,a,b,shift] of [['矩形','rectangle',[180,180],[280,240],true],['椭圆','ellipse',[350,180],[430,245],true],['箭头','arrow',[180,340],[285,340],false],['直线','line',[350,340],[460,340],false],['文字','text',[540,180],null,false],['关联引线','callout',[540,370],[650,420],false]]){
   await page.locator('.tools').getByRole('button',{name,exact:true}).click();if(shift)await page.keyboard.down('Shift');if(b)await drag(point(...a),point(...b));else await page.mouse.click(...point(...a));if(shift)await page.keyboard.up('Shift');if(type==='text'||type==='callout'){await page.getByLabel('图中短标签').fill(name+'测试');await page.locator('.canvasTitle').click();}
   const saved=await state();const obj=saved.project.annotations.at(-1);assert.equal(obj.type,type);created[type]=obj.id;if(shift)assert.equal(obj.geometry.width,obj.geometry.height);
  }
  assert.equal((await state()).project.annotations.length,6);
 });
 await check('已有标注上自动恢复选择；画布 Ctrl 添加/取消多选，Shift 不再多选',async()=>{
  await page.mouse.click(...point(70,70));await page.mouse.move(...point(210,210));assert.equal(await page.locator('.canvas').evaluate(e=>getComputedStyle(e).cursor),'default');await page.mouse.click(...point(210,210));assert.equal(await selected(),1);
  await page.keyboard.down('Control');await page.mouse.click(...point(400,340));await page.keyboard.up('Control');assert.equal(await selected(),2);
  await page.keyboard.down('Control');await page.mouse.click(...point(400,340));await page.keyboard.up('Control');assert.equal(await selected(),1);
  await page.keyboard.down('Shift');await page.mouse.click(...point(385,210));await page.keyboard.up('Shift');assert.equal(await selected(),1);assert.equal(await page.locator(`.objectRow.selected .objectName[title="${created.ellipse}"]`).count(),1);
 });
 await check('右侧标注列表 Ctrl 多选及取消，保留视口',async()=>{await page.locator(`.objectName[title="${created.rectangle}"]`).click();const before=await state();await page.locator(`.objectName[title="${created.line}"]`).click({modifiers:['Control']});assert.equal(await selected(),2);assert.deepEqual((await state()).view,before.view);await page.locator(`.objectName[title="${created.line}"]`).click({modifiers:['Control']});assert.equal(await selected(),1);});
 await page.getByRole('button',{name:'适应窗口',exact:true}).click();await page.mouse.move(...point(box.width/2,box.height/2));await page.mouse.wheel(0,-900);
 // Recompute screen coordinates after list location and zoom.
 const screen=(doc,a)=>[box.x+doc.view.x+a.x*doc.view.scale,box.y+doc.view.y+a.y*doc.view.scale];
 await check('放大后拖动已选标注及控制点仅编辑对象，视口不变',async()=>{
  const before=await state(),obj=before.project.annotations.find(a=>a.id===created.rectangle),center=screen(before,{x:obj.geometry.x+obj.geometry.width/2,y:obj.geometry.y+obj.geometry.height/2});
  await drag(center,[center[0]+25,center[1]+20]);const moved=await state();assert.deepEqual(moved.view,before.view);const g=moved.project.annotations.find(a=>a.id===obj.id).geometry;assert.ok(g.x!==obj.geometry.x);
  const handle=screen(moved,{x:g.x+g.width,y:g.y+g.height});await drag(handle,[handle[0]+24,handle[1]+18]);const after=await state();assert.deepEqual(after.view,before.view);assert.ok(after.project.annotations.find(a=>a.id===obj.id).geometry.width>g.width);
 });
 await check('空白平移保留选择及文档内容，空格不再抢占标注拖动，中键仍可平移',async()=>{
  const before=await state(),count=await selected();await drag(point(60,65),point(85,85));const after=await state();assert.deepEqual(after.project,before.project);assert.equal(await selected(),count);
  const rect=after.project.annotations.find(a=>a.id===created.rectangle),center=screen(after,{x:rect.geometry.x+rect.geometry.width/2,y:rect.geometry.y+rect.geometry.height/2});await page.keyboard.down('Space');await drag(center,[center[0]+18,center[1]+12]);await page.keyboard.up('Space');const moved=await state();assert.deepEqual(moved.view,after.view);assert.notDeepEqual(moved.project.annotations,after.project.annotations);
  await drag(point(65,65),point(80,75),'middle');const end=await state();assert.equal(end.view.x,moved.view.x+15);assert.deepEqual(end.project,moved.project);
 });
 assert.deepEqual(errors,[]);await page.screenshot({path:'tests/v1.1-interaction.png'});
 await fs.writeFile('tests/v1.1-results.json',JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),results,errors},null,2));
}catch(e){await page?.screenshot({path:'tests/v1.1-failure.png'}).catch(()=>{});await fs.writeFile('tests/v1.1-results.json',JSON.stringify({results,errors,error:String(e),serverOutput:output},null,2));console.error(e);process.exitCode=1;
}finally{await browser?.close();if(token)await api('stop',{}).catch(()=>server.kill());else server.kill();}
