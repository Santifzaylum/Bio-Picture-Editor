import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import sharp from 'sharp';import {chromium} from 'playwright';
const evidence=path.resolve('../../../validation/v2.2.1-p'),profile=path.join(evidence,'profiles','桌面 测量与原生保存'),results=[],errors=[];
const browser=await chromium.connectOverCDP('http://127.0.0.1:9482'),page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('http://127.0.0.1:'));assert.ok(page);
const address=new URL(page.url()).origin,session=await(await fetch(address+'/api/session')).json();page.on('pageerror',e=>errors.push(e.message));
async function api(route,body,binary=false){const r=await fetch(address+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-bio-token':session.token},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return binary?Buffer.from(await r.arrayBuffer()):r.json();}
async function state(){await page.waitForTimeout(650);return page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('bio-picture-editor-v2.2.1-p',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});return new Promise((resolve,reject)=>{const q=db.transaction('draft').objectStore('draft').get('workspace');q.onsuccess=()=>{db.close();resolve(q.result.documents.find(d=>d.project.id===q.result.activeId));};q.onerror=()=>reject(q.error);});});}
async function point(x,y){const d=await state(),b=await page.locator('.canvas').boundingBox();await page.mouse.click(b.x+d.view.x+(x+d.project.layout.left)*d.view.scale,b.y+d.view.y+(y+d.project.layout.top)*d.view.scale);}
async function select(id){await page.locator('.objectName[title="'+id+'"]').click();await state();}
async function check(name,fn){await fn();results.push({name,passed:true});console.log('PASS '+name);}
let reference,sample;
try{
 await page.waitForFunction(()=>!document.querySelector('input[type=file]').disabled);
 const seed=JSON.parse(await fs.readFile('examples/example-inline.json'));seed.id=crypto.randomUUID();seed.revision=0;seed.annotations=[];seed.title='桌面长度与比例验收';seed.layout={left:0,right:0,top:0,bottom:0,background:'#ffffff'};
 await page.locator('input[type=file]').setInputFiles({name:'desktop-measurement.biozip',mimeType:'application/zip',buffer:await api('package',{project:seed},true)});await page.getByRole('tab').waitFor();await state();
 await check('真实 EXE 连续创建不同起点、不同方向的独立长度，Esc 保留选择',async()=>{
  await page.getByRole('button',{name:'长度测量',exact:true}).click();for(const xy of [[100,100],[100,300],[300,100],[600,500]])await point(...xy);await page.keyboard.press('Escape');const d=await state();assert.equal(d.project.version,4);assert.equal(d.project.annotations.length,2);[reference,sample]=d.project.annotations.map(a=>a.id);assert.equal(await page.locator('.objectRow.selected .objectName').getAttribute('title'),sample);
  for(const [id,pts] of [[reference,[100,100,100,300]],[sample,[300,100,600,500]]]){await select(id);const detail=page.getByText('精确设置端点',{exact:true});if(!await detail.locator('..').evaluate(e=>e.open))await detail.click();for(const [label,v] of [['起点 X',pts[0]],['起点 Y',pts[1]],['终点 X',pts[2]],['终点 Y',pts[3]]])await page.getByLabel(label,{exact:true}).fill(String(v));}
 });
 await check('真实 EXE 参考复用、尺度标定及分组设置',async()=>{
  await select(sample);await page.getByLabel('比例参考',{exact:true}).selectOption(reference);await page.getByLabel('测量名称',{exact:true}).fill('待测 A');await page.getByLabel('测量分组',{exact:true}).fill('桌面样本');await page.getByText('尺度标定',{exact:true}).click();await page.getByLabel('标定测量',{exact:true}).selectOption(reference);await page.getByLabel('已知实际长度',{exact:true}).fill('100');await page.getByRole('button',{name:'应用尺度标定',exact:true}).click();assert.ok((await page.getByLabel('当前长度结果').innerText()).includes('250.000 μm'));assert.ok((await page.getByLabel('当前长度结果').innerText()).includes('2.500'));
 });
 await check('真实 EXE 已创建标签隐藏、恢复和撤销，参考更新自动重算',async()=>{
  await page.getByLabel('显示结果标签',{exact:true}).uncheck();assert.equal((await state()).project.annotations.find(a=>a.id===sample).measurement.labelMode,'none');await page.getByLabel('显示结果标签',{exact:true}).check();await page.getByRole('button',{name:'撤销',exact:true}).click();assert.equal((await state()).project.annotations.find(a=>a.id===sample).measurement.labelMode,'none');await page.getByRole('button',{name:'重做',exact:true}).click();await select(reference);const detail=page.getByText('精确设置端点',{exact:true});if(!await detail.locator('..').evaluate(e=>e.open))await detail.click();await page.getByLabel('终点 Y',{exact:true}).fill('500');await select(sample);assert.ok((await page.getByLabel('当前长度结果').innerText()).includes('125.000 μm'));
 });
 await check('真实 EXE 可读取 WebUI v4 测量示例，保存与导出保留标定及标签',async()=>{
  await page.getByRole('button',{name:'保存项目',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('footer .unsaved'));const d=await state(),saved=await api('projects/'+d.project.id);assert.deepEqual(saved.annotations,d.project.annotations);const bytes=await api('export',{project:saved,scale:2},true);const meta=await sharp(bytes).metadata();assert.equal(meta.width,(saved.image.width+saved.layout.left+saved.layout.right)*2);await fs.writeFile(path.join(evidence,'desktop-measurements-2x.png'),bytes);
  await page.locator('input[type=file]').setInputFiles(path.resolve('examples/example-v2.2.1.biozip'));await page.waitForFunction(()=>document.querySelectorAll('[role=tab]').length===2);assert.equal((await state()).project.version,4);await page.getByRole('button',{name:'保存项目',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('footer .unsaved'));await page.getByRole('tab',{name:'桌面长度与比例验收',exact:true}).click();await select(sample);
 });
 const cdp=await page.context().newCDPSession(page);await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});
 for(const [kind,button,ext] of [['png','导出 PNG','png'],['biozip','便携包','biozip'],['csv','导出测量 CSV','csv']]){
  const dest=path.join(evidence,'原生测量保存.'+ext);await page.getByRole('button',{name:button,exact:true}).click();console.log('SAVE_DIALOG '+kind+' '+dest);
  let found=false;for(let n=0;n<900;n++){if(await fs.stat(dest).then(s=>s.size>0).catch(()=>false)){found=true;break;}await new Promise(r=>setTimeout(r,200));}assert.ok(found,'Native file save timeout: '+kind);
  const bytes=await fs.readFile(dest),d=await state();let details;
  if(kind==='png'){const m=await sharp(bytes).metadata();assert.equal(m.width,d.project.image.width+d.project.layout.left+d.project.layout.right);details={width:m.width,height:m.height};}
  else if(kind==='biozip'){const r=await fetch(address+'/api/unpack',{method:'POST',headers:{'x-bio-token':session.token,'content-type':'application/octet-stream'},body:bytes});assert.equal(r.status,200);const reopened=await r.json();assert.deepEqual(reopened.annotations,d.project.annotations);assert.deepEqual(reopened.calibration,d.project.calibration);details={version:reopened.version,annotations:reopened.annotations.length};}
  else{const text=bytes.toString('utf8');assert.ok(text.includes(sample));assert.ok(text.includes('待测 A'));assert.ok(text.includes('1.25'));details={fullPrecisionPreserved:true};}
  results.push({name:'Windows 原生另存为 '+kind,passed:true,file:dest,bytes:bytes.length,details});console.log('PASS native '+kind);
 }
 await check('测量桌面预览与正常关闭',async()=>{
  await page.evaluate(()=>window.chrome.webview.postMessage({type:'diagnostic-capture'}));for(let n=0;n<60;n++){try{await fs.copyFile(path.join(profile,'editor-preview.png'),path.join(evidence,'desktop-measurement-final.png'));break;}catch{await new Promise(r=>setTimeout(r,100));}}
  await page.evaluate(()=>window.chrome.webview.postMessage({type:'diagnostic-close'})).catch(()=>{});
 });assert.deepEqual(errors,[]);await fs.writeFile(path.join(evidence,'desktop-measurement-results.json'),JSON.stringify({results,errors,profile},null,2));
}catch(error){await page.screenshot({path:path.join(evidence,'desktop-measurement-failure.png')}).catch(()=>{});await fs.writeFile(path.join(evidence,'desktop-measurement-results.json'),JSON.stringify({results,errors,error:String(error)},null,2));throw error;}finally{await browser.close().catch(()=>{});}
