import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const root=process.cwd(),profile=path.resolve('../../../validation/v2.1-p/profiles/桌面 最终验收');
const source=path.resolve('../../../releases/windows/v2.1-p/Bio-Picture-Editor-v2.1-p/生物图片编辑器.exe'),exe=path.resolve('.build/standalone/生物图片编辑器.exe');
const evidence=path.resolve('../../../validation/v2.1-p');
await fs.mkdir(path.dirname(exe),{recursive:true});await fs.mkdir(evidence,{recursive:true});
await fs.copyFile(source,exe);
const delay=ms=>new Promise(r=>setTimeout(r,ms)),checks=[];
function launch(args){return spawn(exe,['--profile',profile,...args],{windowsHide:true,stdio:'ignore'});}
function exit(process,timeout=20000){return new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('Process timeout '+process.pid)),timeout);process.once('error',e=>{clearTimeout(timer);reject(e);});process.once('exit',code=>{clearTimeout(timer);resolve(code);});});}
let desktop=launch(['--diagnostic-port','9449']),address,config;
try {
  for(let n=0;n<100;n++){try{config=JSON.parse(await fs.readFile(path.join(profile,'active-install.json'),'utf8'));const runtime=JSON.parse(await fs.readFile(path.join(profile,'data/runtime.json'),'utf8'));address='http://127.0.0.1:'+runtime.port;const session=await(await fetch(address+'/api/session',{signal:AbortSignal.timeout(500)})).json();if(session.token===runtime.token)break;}catch{}await delay(150);}
  assert.ok(config&&address);assert.equal((await(await fetch(address+'/api/session')).json()).dataDirectory,path.join(profile,'data'));
  checks.push({name:'仅 EXE 无附属 config 的启动',passed:true});
  for(let n=0;n<100;n++){try{const r=await fetch('http://127.0.0.1:9449/json/version');if(r.ok)break;}catch{}await delay(150);}
  const browser=await chromium.connectOverCDP('http://127.0.0.1:9449');
  let page;
  for(let n=0;n<100;n++){page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith(address));if(page)break;await delay(150);}
  assert.ok(page,'desktop page navigated');
  await page.getByRole('tab').first().waitFor();assert.equal(await page.getByRole('tab').count(),2);
  await page.getByRole('tab').filter({hasText:'桌面验收 2'}).click();
  const persisted=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('bio-picture-editor-v2.1-p',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});return new Promise(resolve=>{const q=db.transaction('draft').objectStore('draft').get('workspace');q.onsuccess=()=>{db.close();resolve(q.result);};});});
  const detail=persisted.documents.flatMap(d=>d.project.annotations).find(a=>a.type==='magnifier');assert.equal(detail.detail.styles.inset.strokeWidth,6);
  checks.push({name:'重新启动恢复两张草稿及 v2.1 独立线条样式',passed:true});await browser.close();
  const second=launch([]);assert.equal(await exit(second),0);process.kill(desktop.pid,0);checks.push({name:'同一数据目录单实例',passed:true});
  let result=await new Promise((resolve,reject)=>{let child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.resolve('../../platforms/windows/v2.1-p/desktop-cli.ps1'),'-ProfileFolder',profile,'list'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b.toString('utf8'));child.stderr.on('data',b=>stderr+=b.toString('utf8'));child.once('error',reject);child.once('exit',code=>resolve({code,stdout,stderr}));});
  assert.equal(result.code,0,result.stderr);assert.equal(JSON.parse(result.stdout).length,2);checks.push({name:'随包 CLI 使用独立环境读取两张项目',passed:true});
  // Only terminate this isolated test process; the job must clean up its child.
  process.kill(desktop.pid);let stopped=false;for(let n=0;n<40;n++){try{await fetch(address+'/api/session',{signal:AbortSignal.timeout(300)});}catch{stopped=true;break;}await delay(100);}assert.ok(stopped);checks.push({name:'桌面意外退出的子进程清理',passed:true});
  await fs.writeFile(config.nodePath,'simulated corrupted runtime');
  let repair=launch(['--self-test']);assert.equal(await exit(repair,30000),0);
  const marker=JSON.parse(await fs.readFile(path.join(profile,'runtime/node-integrity.json'),'utf8'));
  assert.equal(crypto.createHash('sha256').update(await fs.readFile(config.nodePath)).digest('hex'),marker.sha256);
  assert.equal((await fs.readdir(path.join(profile,'data/projects'))).length,2);checks.push({name:'损坏 Node.js 自动修复，项目数据保留',passed:true});
  await fs.writeFile(path.join(config.appPath,'dist/app-icon.svg'),'simulated damaged app resource');
  repair=launch(['--self-test']);assert.equal(await exit(repair,30000),0);
  const manifest=JSON.parse(await fs.readFile(path.join(config.appPath,'install-manifest.json'),'utf8'));
  assert.equal(crypto.createHash('sha256').update(await fs.readFile(path.join(config.appPath,'dist/app-icon.svg'))).digest('hex'),manifest['dist/app-icon.svg']);
  assert.equal((await fs.readdir(path.join(profile,'data/projects'))).length,2);checks.push({name:'损坏应用资源自动重新安装，项目数据保留',passed:true});
  await fs.writeFile(path.join(evidence,'desktop-runtime-results.json'),JSON.stringify({version:'v2.1-p',checks},null,2));checks.forEach(c=>console.log('PASS '+c.name));
}finally{try{process.kill(desktop.pid,0);process.kill(desktop.pid);}catch{}}
