import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';

const profile=path.resolve(process.argv[2]||'../../../validation/v2.1-p/profiles/桌面 最终验收');
const evidence=path.resolve('../../../validation/v2.1-p');
await fs.mkdir(evidence,{recursive:true});
const endpoint=process.argv[3]||'http://127.0.0.1:9462';
const checks=[],errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.connectOverCDP(endpoint,{timeout:10000});
const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('http://127.0.0.1:'));
assert.ok(page);page.on('pageerror',e=>errors.push(e.message));
await page.getByRole('button',{name:'打开图片 / 项目',exact:true}).waitFor();
await page.waitForFunction(()=>!document.querySelector('input[type=file]').disabled);
const address=new URL(page.url()).origin,session=await(await fetch(address+'/api/session')).json();
async function api(route,body,binary=false){let r=await fetch(address+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-bio-token':session.token},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return binary?Buffer.from(await r.arrayBuffer()):r.json();}
async function check(name,fn){await fn();checks.push({name,passed:true});console.log('PASS '+name);}
await check('EXE 原界面加载、名称与图标',async()=>{
  assert.equal(await page.title(),'生物图片编辑器 · v2.1-p');assert.equal(await page.locator('.brand b').textContent(),'生物图片编辑器');
  assert.ok(await page.locator('.brand').isVisible(),'desktop width retains original brand');
  assert.equal(await page.locator('.brandMark').getAttribute('src'),'/app-icon.svg');
  assert.ok(!(await page.locator('body').innerText()).includes('图注工坊'));
});
await check('桌面 WebView2 多图导入与后台接口',async()=>{
  const seed=JSON.parse(await fs.readFile('examples/example-inline.json','utf8')),files=[];
  for(let n=1;n<=2;n++){const p=structuredClone(seed);p.id=crypto.randomUUID();p.revision=0;p.title='桌面验收 '+n;
    files.push({name:'桌面验收'+n+'.biozip',mimeType:'application/zip',buffer:await api('package',{project:p},true)});}
  await page.locator('input[type=file]').setInputFiles(files);await page.waitForFunction(()=>document.querySelectorAll('[role=tab]').length===2);
});
await check('关闭桥接检查非活动标签页的未保存状态',async()=>{
  await page.evaluate(()=>{window.testCloseMessages=[];const original=window.chrome.webview.postMessage.bind(window.chrome.webview);window.chrome.webview.postMessage=value=>{if(value.type==='close-state')window.testCloseMessages.push(value);original(value);};window.dispatchEvent(new Event('bio-desktop-close'));});
  await page.waitForFunction(()=>window.testCloseMessages.length>0);
  assert.equal(await page.evaluate(()=>window.testCloseMessages.at(-1).dirty),true);
});
await check('v2.1 局部放大及独立样式在真实 EXE 中可编辑',async()=>{
  const b=await page.locator('.canvas').boundingBox();await page.getByRole('button',{name:'局部放大',exact:true}).click();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+35,b.y+b.height/2,{steps:8});await page.mouse.up();
  await page.getByRole('button',{name:'取样圆',exact:true}).click();await page.getByLabel('取样圆线宽',{exact:true}).fill('4');
  await page.getByRole('button',{name:'连接线',exact:true}).click();await page.getByLabel('连接线线宽',{exact:true}).fill('3');
  await page.getByRole('button',{name:'放大圆',exact:true}).click();await page.getByLabel('放大圆线宽',{exact:true}).fill('6');
  await page.getByRole('button',{name:'查看原图',exact:true}).click();await page.getByText('查看原图 · 只读',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'局部放大',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'返回标注编辑',exact:true}).first().click();
});
await check('原生窗口内 Ctrl+S 与两张独立项目保存',async()=>{
  for(const name of ['桌面验收 1','桌面验收 2']){await page.getByRole('tab').filter({hasText:name}).click();await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.querySelector('footer').textContent.includes('项目保存成功'));await page.waitForFunction(()=>!document.querySelector('footer .unsaved'));}
  assert.equal((await api('projects')).length,2);
});
await check('PNG 导出和项目便携包保持可用',async()=>{
  for(const p of await api('projects')){const project=await api('projects/'+p.id);if(project.annotations.some(a=>a.type==='magnifier')){const a=project.annotations.find(a=>a.type==='magnifier');assert.equal(a.detail.styles.source.strokeWidth,4);assert.equal(a.detail.styles.connector.strokeWidth,3);assert.equal(a.detail.styles.inset.strokeWidth,6);}
    const png=await api('export',{project,scale:1},true);const meta=await sharp(png).metadata();assert.equal(meta.width,project.image.width+project.layout.left+project.layout.right);assert.equal(meta.height,project.image.height+project.layout.top+project.layout.bottom);await fs.writeFile(path.join(profile,'导出验收-'+p.id+'.png'),png);const zip=await api('package',{project},true);
    const r=await fetch(address+'/api/unpack',{method:'POST',headers:{'x-bio-token':session.token,'content-type':'application/octet-stream'},body:zip});assert.equal(r.status,200);assert.equal((await r.json()).id,p.id);
  }
});
await check('桌面界面预览与关闭前草稿写入',async()=>{
  await page.evaluate(()=>window.chrome.webview.postMessage({type:'diagnostic-capture'}));
  for(let n=0;n<40;n++){if(await fs.stat(path.join(profile,'editor-preview.png')).then(s=>s.size>0).catch(()=>false))break;await delay(150);}
  await fs.copyFile(path.join(profile,'editor-preview.png'),path.join(evidence,'desktop-final.png'));
  await page.evaluate(()=>window.dispatchEvent(new Event('bio-desktop-close')));await page.waitForFunction(()=>window.testCloseMessages.length>1);assert.equal(await page.evaluate(()=>window.testCloseMessages.at(-1).dirty),false);
});
assert.deepEqual(errors,[]);
await check('正常关闭窗口后停止自己的本地服务',async()=>{
  await page.evaluate(()=>window.chrome.webview.postMessage({type:'diagnostic-close'})).catch(()=>{});
  let stopped=false;for(let n=0;n<40;n++){try{await fetch(address+'/api/session',{signal:AbortSignal.timeout(500)});}catch{stopped=true;break;}await delay(150);}
  assert.ok(stopped);assert.equal(await fs.stat(path.join(profile,'data/server.lock')).then(()=>true).catch(()=>false),false);
});
await fs.writeFile(path.join(evidence,'desktop-results.json'),JSON.stringify({version:'v2.1-p',profile,address,checks,errors},null,2));
await browser.close().catch(()=>{});
