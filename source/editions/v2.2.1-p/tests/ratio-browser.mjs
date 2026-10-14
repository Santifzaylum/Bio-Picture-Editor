import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createCanvas} from '@napi-rs/canvas';
const evidence=path.resolve('../../../validation/v2.2.1-p');await fs.mkdir(evidence,{recursive:true});
const address='http://127.0.0.1:4342',results=[],errors=[];
const server=spawn(process.execPath,['--import','tsx','server/index.ts'],{cwd:process.cwd(),env:{...process.env,BIO_PORT:'4342',BIO_DATA_DIR:'tests/ratio-browser-data/'+crypto.randomUUID()},windowsHide:true,stdio:'pipe'});
let output='',browser,page,token;server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function api(route,body,binary=false){const response=await fetch(address+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{'x-bio-token':token,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return binary?Buffer.from(await response.arrayBuffer()):response.json();}
async function state(){await page.waitForTimeout(700);return page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('bio-picture-editor-v2.2.1-p',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});return new Promise(resolve=>{const q=db.transaction('draft').objectStore('draft').get('workspace');q.onsuccess=()=>{db.close();resolve(q.result.documents.find(d=>d.project.id===q.result.activeId));};});});}
async function screen(d,x,y){const b=await page.locator('.canvas').boundingBox();return [b.x+d.view.x+(x+d.project.layout.left)*d.view.scale,b.y+d.view.y+(y+d.project.layout.top)*d.view.scale];}
async function clickPoint(x,y){const d=await state();await page.mouse.click(...await screen(d,x,y));}
async function dragPoint(x,y,dx,dy){const d=await state(),start=await screen(d,x,y),end=await screen(d,x+dx,y+dy);await page.mouse.move(...start);await page.mouse.down();await page.mouse.move(...end,{steps:8});await page.mouse.up();}
async function choose(a){await page.locator('.objectName[title="'+a.id+'"]').click();}
async function check(name,fn){await fn();results.push({name,passed:true});console.log('PASS '+name);}
const ratios=d=>d.project.annotations.filter(a=>a.type==='ratio');
const value=a=>{const r=a.ratio,origin=r.mode==='shared'?r.start:r.referenceStart,dx=r.referenceEnd.x-origin.x,dy=r.referenceEnd.y-origin.y;return r.mode==='shared'?((r.sample.x-r.start.x)*dx+(r.sample.y-r.start.y)*dy)/(dx*dx+dy*dy):Math.hypot(r.sample.x-r.start.x,r.sample.y-r.start.y)/Math.hypot(dx,dy);};
try{
 for(let i=0;i<100;i++){try{token=(await(await fetch(address+'/api/session')).json()).token;break;}catch{if(server.exitCode!==null)throw Error(output);await delay(100);}}assert.ok(token,output);
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1560,height:1040}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(address);await page.getByRole('button',{name:'打开图片 / 项目',exact:true}).waitFor();
 const gel=createCanvas(1200,800),ctx=gel.getContext('2d');ctx.fillStyle='#eff0f2';ctx.fillRect(0,0,1200,800);
 for(let lane=0;lane<8;lane++){ctx.fillStyle='#d7d9de';ctx.fillRect(100+lane*130,90,80,550);ctx.fillStyle='#777d8b';for(const y of [150,260+lane*12,350,450,550])ctx.fillRect(104+lane*130,y,72,9);}
 ctx.fillStyle='#556070';ctx.font='24px sans-serif';ctx.fillText('Synthetic electrophoresis image - test only',80,735);
 await fs.writeFile(path.join(evidence,'synthetic-gel.png'),await gel.encode('png'));
 // Use the real image upload control, not injected application state.
 await page.locator('input[type=file]').setInputFiles(path.join(evidence,'synthetic-gel.png'));await page.getByRole('tab').waitFor();await state();
 await check('同起点三次点击建立测量，横向条带偏移不计入比例',async()=>{
  await page.getByRole('button',{name:'比例测距',exact:true}).click();await page.getByLabel('新建测量方式').selectOption('shared');await clickPoint(150,150);await clickPoint(180,350);await clickPoint(150,550);
  const d=await state(),a=ratios(d)[0];assert.equal(d.project.version,3);assert.equal(a.ratio.mode,'shared');assert.ok(Math.abs(value(a)-0.5)<0.004);assert.equal(await page.getByLabel('当前比例').innerText(),'R = '+value(a).toFixed(3));
 });
 await check('不同起点四次点击建立独立线段比，显示百分比',async()=>{
  await page.getByRole('button',{name:'比例测距',exact:true}).click();await page.getByLabel('新建测量方式').selectOption('independent');await page.getByLabel('新建比例显示形式').selectOption('percent');
  for(const point of [[500,150],[500,300],[700,150],[700,450]])await clickPoint(...point);
  const a=ratios(await state())[1];assert.equal(a.ratio.mode,'independent');assert.ok(Math.abs(value(a)-0.5)<0.004);assert.equal(await page.getByLabel('当前比例').innerText(),'R = '+(value(a)*100).toFixed(3)+'%');
 });
 await check('拖测量控制点实时更新结果，撤销重做保留完整测量',async()=>{
  const before=ratios(await state())[0];await choose(before);await dragPoint(before.ratio.sample.x,before.ratio.sample.y,0,40);const after=ratios(await state())[0];assert.ok(Math.abs(value(after)-0.6)<0.004);
  await page.getByRole('button',{name:'撤销',exact:true}).click();assert.deepEqual(ratios(await state())[0],before);await page.getByRole('button',{name:'重做',exact:true}).click();assert.deepEqual(ratios(await state())[0],after);
 });
 await check('标签独立拖动，拖参考线整组平移且比例不变',async()=>{
  let a=ratios(await state())[1];await choose(a);const points=structuredClone(a.ratio);await dragPoint(a.geometry.x+30,a.geometry.y+20,35,-15);let b=ratios(await state())[1];assert.deepEqual(b.ratio,points);assert.notEqual(b.geometry.x,a.geometry.x);
  a=b;await dragPoint(a.ratio.referenceStart.x,(a.ratio.referenceStart.y+a.ratio.referenceEnd.y)/2,20,10);b=ratios(await state())[1];assert.ok(b.ratio.start.x>a.ratio.start.x);assert.ok(Math.abs(value(a)-value(b))<1e-10);assert.equal(b.ratio.start.x-a.ratio.start.x,b.ratio.referenceEnd.x-a.ratio.referenceEnd.x);
 });
 await check('自定义 Rf 标签、精度、显示形式、精确坐标与零分母保护',async()=>{
  const a=ratios(await state())[0];await choose(a);await page.getByLabel('比例结果标签').fill('Rf');await page.getByLabel('比例小数位数').fill('2');await page.getByLabel('比例显示形式').selectOption('percent');assert.equal(await page.getByLabel('当前比例').innerText(),'Rf = '+(value(ratios(await state())[0])*100).toFixed(2)+'%');
  await page.getByText('精确设置测量位置',{exact:true}).click();await page.getByLabel('共同起点 X',{exact:true}).fill('150');await page.getByLabel('共同起点 Y',{exact:true}).fill('150');await page.getByLabel('参考位置 X',{exact:true}).fill('150');await page.getByLabel('参考位置 Y',{exact:true}).fill('550');await page.getByLabel('待测位置 Y',{exact:true}).fill('350');assert.match(await page.getByLabel('当前比例').innerText(),/50.00%/);
  const before=ratios(await state())[0];await page.getByLabel('参考位置 Y',{exact:true}).fill(String(before.ratio.start.y));assert.deepEqual(ratios(await state())[0],before);assert.match(await page.locator('footer').innerText(),/参考线段至少/);
 });
 await check('复制、删除、隐藏和锁定遵循既有对象操作',async()=>{
  let a=ratios(await state())[0];await choose(a);await page.getByRole('button',{name:'复制',exact:true}).click();let all=ratios(await state());assert.equal(all.length,3);assert.ok(Math.abs(value(all[0])-value(all[2]))<1e-10);
  await page.getByRole('button',{name:'删除',exact:true}).click();assert.equal(ratios(await state()).length,2);await choose(a);
  await page.getByRole('button',{name:'隐藏 '+a.id,exact:true}).click();assert.equal(ratios(await state())[0].visible,false);await page.getByRole('button',{name:'显示 '+a.id,exact:true}).click();
  const row=page.locator('.objectRow').filter({has:page.locator('.objectName[title="'+a.id+'"]')});await row.getByTitle('锁定',{exact:true}).click();a=ratios(await state())[0];assert.equal(await page.getByLabel('比例小数位数').isDisabled(),true);await dragPoint(a.ratio.sample.x,a.ratio.sample.y,10,10);assert.deepEqual(ratios(await state())[0],a);await row.getByTitle('解锁',{exact:true}).click();
 });
 await check('原图边界处复制测量不会移出图片或丢失比例',async()=>{
  const before=ratios(await state())[1];await choose(before);if(!await page.getByLabel('参考终点 X',{exact:true}).isVisible())await page.getByText('精确设置测量位置',{exact:true}).click();const d=await state();await page.getByLabel('参考终点 X',{exact:true}).fill(String(d.project.image.width));await page.getByLabel('参考终点 Y',{exact:true}).fill(String(d.project.image.height));const edge=ratios(await state())[1];
  await page.getByRole('button',{name:'复制',exact:true}).click();const copied=ratios(await state());assert.equal(copied.length,3);assert.equal(value(copied[2]),value(edge));for(const point of [copied[2].ratio.start,copied[2].ratio.sample,copied[2].ratio.referenceStart,copied[2].ratio.referenceEnd])assert.ok(point.x<=d.project.image.width&&point.y<=d.project.image.height);
  await page.getByRole('button',{name:'删除',exact:true}).click();await choose(edge);if(!await page.getByLabel('参考终点 X',{exact:true}).isVisible())await page.getByText('精确设置测量位置',{exact:true}).click();await page.getByLabel('参考终点 X',{exact:true}).fill(String(before.ratio.referenceEnd.x));await page.getByLabel('参考终点 Y',{exact:true}).fill(String(before.ratio.referenceEnd.y));assert.deepEqual(ratios(await state())[1],before);
 });
 await check('两种测量均可隐藏和恢复结果标签，撤销重做不改变测量点',async()=>{
  for(const a of ratios(await state())){await choose(a);const before=ratios(await state()).find(item=>item.id===a.id);await page.getByLabel('显示结果标签',{exact:true}).uncheck();const hidden=ratios(await state()).find(item=>item.id===a.id);assert.equal(hidden.ratio.showLabel,false);assert.deepEqual({...hidden.ratio,showLabel:true},before.ratio);assert.equal(value(hidden),value(before));assert.ok(await page.getByLabel('当前比例').isVisible());await page.getByLabel('显示结果标签',{exact:true}).check();assert.deepEqual(ratios(await state()).find(item=>item.id===a.id),before);}
  const first=ratios(await state())[0];await choose(first);await page.getByLabel('显示结果标签',{exact:true}).uncheck();await page.getByRole('button',{name:'撤销',exact:true}).click();assert.equal(ratios(await state())[0].ratio.showLabel,true);await page.getByRole('button',{name:'重做',exact:true}).click();assert.equal(ratios(await state())[0].ratio.showLabel,false);await choose(first);assert.equal(await page.getByLabel('显示结果标签',{exact:true}).isChecked(),false);await page.screenshot({path:path.join(evidence,'v2.2.1-p-hidden-label.png')});
 });
 await check('原图查看暂停比例编辑，Esc 取消部分测量',async()=>{
  const baseline=(await state()).project;await page.getByRole('button',{name:'查看原图',exact:true}).click();assert.equal(await page.getByRole('button',{name:'比例测距',exact:true}).isDisabled(),true);await page.keyboard.press('q');await clickPoint(300,300);assert.deepEqual((await state()).project,baseline);await page.locator('.originalBanner').getByRole('button',{name:'返回标注编辑',exact:true}).click();
  await page.getByRole('button',{name:'比例测距',exact:true}).click();await clickPoint(400,400);await page.keyboard.press('Escape');assert.deepEqual((await state()).project.annotations,baseline.annotations);
 });
 await check('保存、刷新草稿和便携包重开完整保留两种测量',async()=>{
  await page.getByRole('button',{name:'保存项目',exact:true}).click();const before=await state();await page.reload();await page.getByRole('tab').waitFor();assert.deepEqual((await state()).project.annotations,before.project.annotations);await choose(ratios(await state())[0]);assert.equal(await page.getByLabel('显示结果标签',{exact:true}).isChecked(),false);
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'便携包',exact:true}).click();const file=path.join(evidence,'v2.2.1-p-example.biozip');await(await downloadPromise).saveAs(file);
  const response=await fetch(address+'/api/unpack',{method:'POST',headers:{'x-bio-token':token,'content-type':'application/octet-stream'},body:await fs.readFile(file)});assert.equal(response.status,200);assert.deepEqual((await response.json()).annotations,before.project.annotations);
  await page.getByRole('button',{name:'关闭 '+before.project.title,exact:true}).click();await page.locator('input[type=file]').setInputFiles(file);await page.getByRole('tab').waitFor();assert.deepEqual((await state()).project.annotations,before.project.annotations);
 });
 await check('实际 PNG 按钮导出含比例的图像，1× 与 2× 尺寸正确',async()=>{
  const d=await state();for(const scale of [1,2]){await page.getByLabel('导出倍率').selectOption(String(scale));const wait=page.waitForEvent('download');await page.getByRole('button',{name:'导出 PNG',exact:true}).click();const file=path.join(evidence,'v2.2.1-p-export-'+scale+'x.png');await(await wait).saveAs(file);const meta=await sharp(file).metadata();assert.equal(meta.width,(d.project.image.width+d.project.layout.left+d.project.layout.right)*scale);assert.equal(meta.height,(d.project.image.height+d.project.layout.top+d.project.layout.bottom)*scale);}
 });
 await page.getByLabel('导出倍率').selectOption('1');const d=await state();await choose(ratios(d)[0]);await page.getByRole('button',{name:'适应窗口',exact:true}).click();await page.locator('.properties').evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.join(evidence,'v2.2.1-p-interface.png')});
 await fs.writeFile(path.join(evidence,'v2.2.1-p-example.biozip'),await api('package',{project:(await state()).project},true));
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(evidence,'ratio-browser-results.json'),JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),results,errors},null,2));
}catch(e){await page?.screenshot({path:path.join(evidence,'ratio-browser-failure.png')}).catch(()=>{});await fs.writeFile(path.join(evidence,'ratio-browser-results.json'),JSON.stringify({results,errors,error:String(e),serverOutput:output},null,2));console.error(e);process.exitCode=1;}
finally{await browser?.close();if(token)await api('stop',{}).catch(()=>server.kill());else server.kill();}
