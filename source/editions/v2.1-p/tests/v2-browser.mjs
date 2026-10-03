import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const evidence=path.resolve('../../../validation/v2.1-p');
await fs.mkdir(evidence,{recursive:true});
const address='http://127.0.0.1:4331',results=[],errors=[];
const server=spawn(process.execPath,['.build/desktop/server.mjs'],{cwd:process.cwd(),env:{...process.env,BIO_PORT:'4331',BIO_DATA_DIR:'tests/v2-server-data/'+crypto.randomUUID()},windowsHide:true,stdio:'pipe'});
let output='',browser,token,page;
server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function api(route,body,binary=false){const r=await fetch(address+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{'x-bio-token':token,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return binary?Buffer.from(await r.arrayBuffer()):r.json();}
async function state(){await page.waitForTimeout(650);return page.evaluate(async()=>{
 const db=await new Promise((r,j)=>{const q=indexedDB.open('bio-picture-editor-v2.1-p',1);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});
 return new Promise((r,j)=>{const q=db.transaction('draft').objectStore('draft').get('workspace');q.onsuccess=()=>{db.close();r(q.result?.documents.find(d=>d.project.id===q.result.activeId));};q.onerror=()=>j(q.error);});
});}
async function drag(a,b){await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(...b,{steps:10});await page.mouse.up();}
async function screen(doc,x,y){const b=await page.locator('.canvas').boundingBox();return [b.x+doc.view.x+(x+doc.project.layout.left)*doc.view.scale,b.y+doc.view.y+(y+doc.project.layout.top)*doc.view.scale];}
async function check(name,fn){await fn();results.push({name,passed:true});console.log('PASS '+name);}
const detail=doc=>doc.project.annotations.find(a=>a.type==='magnifier');
try{
 for(let n=0;n<100;n++){try{token=(await(await fetch(address+'/api/session')).json()).token;break;}catch{if(server.exitCode!==null)throw Error(output);await delay(100);}}
 assert.ok(token,output);
 browser=await chromium.launch({channel:'msedge',headless:true});
 page=await browser.newPage({viewport:{width:1560,height:1040}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(address);await page.waitForFunction(()=>!document.querySelector('input[type=file]').disabled);
 await check('名称、主题 SVG、网页图标和八个工具 SVG 正确显示',async()=>{
  assert.equal(await page.title(),'生物图片编辑器 · v2.1-p');assert.equal(await page.locator('.brand b').innerText(),'生物图片编辑器');
  assert.equal(await page.locator('.tools .tool svg').count(),8);
  assert.equal(await page.locator('.brand img').evaluate(img=>img.complete&&img.naturalWidth>0),true);
  assert.equal(await page.locator('link[rel=icon]').getAttribute('href'),'/app-icon.svg');
 });
 const seed=JSON.parse(await fs.readFile('examples/example-inline.json','utf8'));seed.id=crypto.randomUUID();seed.annotations=[];seed.revision=0;seed.title='圆形局部放大示例（人工测试图）';seed.layout={left:0,right:0,top:0,bottom:0,background:'#ffffff'};
 const pack=await api('package',{project:seed},true);
 await page.locator('input[type=file]').setInputFiles({name:'legacy-v1.biozip',mimeType:'application/zip',buffer:pack});await page.getByRole('tab').waitFor();
 await check('旧 v1 便携包可打开，原图尺寸与内容保持',async()=>{const d=await state();assert.equal(d.project.version,1);assert.equal(d.project.image.width,1200);assert.equal(d.project.image.sha256,seed.image.sha256);});
 await check('四种颜色行的文字与同高空白不再触发颜色输入，只有色块触发',async()=>{
  await page.getByText('形状填充',{exact:true}).click();
  await page.evaluate(()=>{window.colorClicks=0;document.querySelectorAll('input[type=color]').forEach(e=>e.addEventListener('click',()=>window.colorClicks++));});
  const rows=page.locator('.colorRow');assert.equal(await rows.count(),4);
  for(let i=0;i<4;i++){
   await rows.nth(i).locator('span').click();
   const b=await rows.nth(i).boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
  }
  assert.equal(await page.evaluate(()=>window.colorClicks),0);
  await page.getByLabel('标注颜色',{exact:true}).click();assert.equal(await page.evaluate(()=>window.colorClicks),1);
  await page.keyboard.press('Escape');await rows.nth(0).locator('span').click();assert.equal(await page.evaluate(()=>window.colorClicks),1);
  await page.getByText('形状填充',{exact:true}).click();
 });
 await check('从原图中心拖到边缘创建圆形放大，邻近取样区域且原图不变',async()=>{
  const before=await state();await page.getByRole('button',{name:'局部放大',exact:true}).click();
  await drag(await screen(before,460,405),await screen(before,520,405));
  const after=await state(),a=detail(after);
  assert.equal(after.project.version,2);assert.ok(Math.abs(a.detail.sourceX-460)<=2);assert.ok(Math.abs(a.detail.sourceY-405)<=2);assert.ok(Math.abs(a.detail.sourceRadius-60)<=2);assert.equal(a.detail.magnification,2);
  assert.equal(after.project.layout.right,0);assert.ok(Math.abs(a.geometry.x+a.geometry.width/2-a.detail.sourceX)<=a.detail.sourceRadius+a.geometry.width/2+33);assert.deepEqual(after.project.image,before.project.image);
 });
 await check('拖动放大图只改变展示位置，取样中心、半径及视口保持',async()=>{
  const before=await state(),a=detail(before),cx=a.geometry.x+a.geometry.width/2,cy=a.geometry.y+a.geometry.height/2;
  const start=await screen(before,cx,cy);await drag(start,[start[0]+20,start[1]+25]);
  const after=await state();assert.deepEqual(detail(after).detail,a.detail);assert.deepEqual(after.view,before.view);assert.notEqual(detail(after).geometry.x,a.geometry.x);
 });
 await check('取样圆非中心位置可直接拖动，放大圆位置保持',async()=>{
  const before=await state(),a=detail(before),start=await screen(before,a.detail.sourceX-20,a.detail.sourceY+20);
  await drag(start,[start[0]+12,start[1]+8]);const after=await state(),b=detail(after);
  assert.ok(b.detail.sourceX>a.detail.sourceX);assert.ok(b.detail.sourceY>a.detail.sourceY);assert.deepEqual(b.geometry,a.geometry);
  assert.equal(await page.getByRole('button',{name:'取样圆',exact:true}).getAttribute('aria-pressed'),'true');
 });
 await check('拖连接线移动整组，两个圆同向等距移动',async()=>{
  const before=await state(),a=detail(before),d=a.detail,g=a.geometry,cx=g.x+g.width/2,cy=g.y+g.height/2;
  const dx=cx-d.sourceX,dy=cy-d.sourceY,len=Math.hypot(dx,dy),t=(d.sourceRadius+(len-d.sourceRadius-g.width/2)/2)/len;
  const start=await screen(before,d.sourceX+dx*t,d.sourceY+dy*t);await drag(start,[start[0]+10,start[1]+6]);
  const b=detail(await state());assert.ok(b.geometry.x>a.geometry.x);assert.equal(b.geometry.x-a.geometry.x,b.detail.sourceX-d.sourceX);assert.equal(b.geometry.y-a.geometry.y,b.detail.sourceY-d.sourceY);
  assert.equal(await page.getByRole('button',{name:'连接线',exact:true}).getAttribute('aria-pressed'),'true');
 });
 await check('放大圆向四周移动均扩展留白，原图在屏幕上的位置不跳动',async()=>{
  const original=detail(await state()).geometry;
  for(const side of ['left','right','top','bottom']){
   await page.getByRole('button',{name:'适应窗口',exact:true}).click();const before=await state(),a=detail(before),g=a.geometry,w=before.project.image.width,h=before.project.image.height;
   const x=side==='left'?-8:side==='right'?w-g.width+8:500,y=side==='top'?-8:side==='bottom'?h-g.height+8:300;
   const anchor=await screen(before,300,300),start=await screen(before,g.x+g.width/2,g.y+g.height/2),end=await screen(before,x+g.width/2,y+g.height/2);
   await drag(start,end);const after=await state(),b=detail(after);assert.ok(after.project.layout[side]>0);assert.ok(Math.abs(b.geometry.x-x)<=2);assert.ok(Math.abs(b.geometry.y-y)<=2);
   const anchorAfter=await screen(after,300,300);assert.ok(Math.hypot(anchorAfter[0]-anchor[0],anchorAfter[1]-anchor[1])<0.01);
   assert.ok(b.geometry.x+after.project.layout.left>=0&&b.geometry.y+after.project.layout.top>=0);
   assert.ok(b.geometry.x+b.geometry.width<=w+after.project.layout.right&&b.geometry.y+b.geometry.height<=h+after.project.layout.bottom);
  }
  for(let n=0;n<4;n++)await page.getByRole('button',{name:'撤销',exact:true}).click();assert.deepEqual(detail(await state()).geometry,original);
  await page.getByRole('button',{name:'适应窗口',exact:true}).click();
 });
 await check('查看原图有显著只读提示，点击、拖动、快捷键与粘贴不会产生隐形编辑',async()=>{
  const before=await state();await page.locator('.objectName[title="'+detail(before).id+'"]').click();await page.getByRole('button',{name:'复制',exact:true}).click();await page.getByRole('button',{name:'撤销',exact:true}).click();
  const baseline=await state();await page.getByRole('button',{name:'局部放大',exact:true}).click();await page.getByRole('button',{name:'查看原图',exact:true}).click();
  assert.equal(await page.locator('.originalBanner').isVisible(),true);assert.equal(await page.locator('.originalBanner b').innerText(),'查看原图 · 只读');
  for(const name of ['局部放大','箭头','选择','撤销','重做','复制','删除'])assert.equal(await page.getByRole('button',{name,exact:true}).isDisabled(),true);
  await page.locator('.canvas').click({position:{x:400,y:300}});await page.keyboard.press('m');await page.keyboard.press('Delete');await page.keyboard.press('Control+d');await page.keyboard.press('Control+v');await page.keyboard.press('Control+z');await page.keyboard.press('ArrowRight');
  const box=await page.locator('.canvas').boundingBox();await drag([box.x+400,box.y+300],[box.x+440,box.y+330]);assert.deepEqual((await state()).project,baseline.project);
  await page.screenshot({path:path.join(evidence,'v2.1-p-original-mode.png')});
  await page.locator('.originalBanner').getByRole('button',{name:'返回标注编辑',exact:true}).click();assert.deepEqual((await state()).project.annotations,baseline.project.annotations);
  assert.equal(await page.getByRole('button',{name:'局部放大',exact:true}).isDisabled(),false);await page.getByRole('button',{name:'适应窗口',exact:true}).click();
  await page.locator('.objectName[title="'+detail(baseline).id+'"]').click();
 });
 await check('原图圆心、半径控制点与放大圆尺寸控制点可以编辑',async()=>{
  let before=await state(),a=detail(before),start=await screen(before,a.detail.sourceX,a.detail.sourceY);
  await drag(start,[start[0]+10,start[1]+5]);let after=await state();assert.ok(detail(after).detail.sourceX>a.detail.sourceX);
  before=after;a=detail(before);start=await screen(before,a.detail.sourceX+a.detail.sourceRadius,a.detail.sourceY);
  await drag(start,[start[0]+8,start[1]]);after=await state();assert.ok(detail(after).detail.sourceRadius>a.detail.sourceRadius);
  before=after;a=detail(before);start=await screen(before,a.geometry.x+a.geometry.width,a.geometry.y+a.geometry.height/2);
  await drag(start,[start[0]+12,start[1]]);after=await state();assert.ok(detail(after).detail.magnification>a.detail.magnification);
 });
 await check('倍率与半径属性可编辑，撤销重做恢复完整放大对象',async()=>{
  await page.getByLabel('局部放大倍率',{exact:true}).fill('3');await page.getByLabel('取样半径',{exact:true}).fill('70');
  const before=await state();assert.equal(detail(before).detail.magnification,3);assert.equal(detail(before).geometry.width,420);
  await page.getByRole('button',{name:'撤销',exact:true}).click();const undone=await state();assert.notEqual(detail(undone).detail.sourceRadius,70);
  await page.getByRole('button',{name:'重做',exact:true}).click();assert.deepEqual(detail(await state()),detail(before));
 });
 await check('三处线条各自设置颜色、线宽、虚线及对比描边，互不覆盖',async()=>{
  const current=await state();await page.locator('.objectName[title="'+detail(current).id+'"]').click();
  const settings=[['取样圆','source','#ff8800','3',false],['连接线','connector','#2563eb','5',true],['放大圆','inset','#ef4444','8',false]];
  for(const [name,key,color,width,dash] of settings){
   await page.getByRole('button',{name,exact:true}).click();await page.getByLabel(name+'颜色',{exact:true}).fill(color);await page.getByLabel(name+'线宽',{exact:true}).fill(width);await page.getByLabel(name+'虚线',{exact:true}).setChecked(dash);await page.getByLabel(name+'对比描边',{exact:true}).uncheck();
   const styles=detail(await state()).detail.styles;assert.equal(styles[key].color,color);assert.equal(styles[key].strokeWidth,Number(width));assert.equal(styles[key].dash,dash);assert.equal(styles[key].contrast,false);
  }
  const d=detail(await state());assert.equal(d.detail.styles.source.color,'#ff8800');assert.equal(d.detail.styles.connector.color,'#2563eb');assert.equal(d.detail.styles.inset.color,'#ef4444');
  const row=page.locator('.detailStylePanel .colorRow');await page.evaluate(()=>{window.colorClicks=0;document.querySelector('.detailStylePanel input[type=color]').addEventListener('click',()=>window.colorClicks++);});await row.locator('span').click();const b=await row.boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);assert.equal(await page.evaluate(()=>window.colorClicks),0);
 });
 await check('隐藏与锁定生效，锁定对象不响应移动或属性修改',async()=>{
  let before=await state(),a=detail(before);
  await page.locator('.objectName[title="'+a.id+'"]').click();
  await page.getByRole('button',{name:'隐藏 '+a.id,exact:true}).click();assert.equal(detail(await state()).visible,false);
  await page.getByRole('button',{name:'显示 '+a.id,exact:true}).click();await page.locator('.objectRow').filter({has:page.locator('.objectName[title="'+a.id+'"]')}).getByTitle('锁定',{exact:true}).click();
  before=await state();a=detail(before);assert.equal(await page.getByLabel('局部放大倍率').isDisabled(),true);
  const start=await screen(before,a.geometry.x+a.geometry.width/2,a.geometry.y+a.geometry.height/2);await drag(start,[start[0]+10,start[1]+10]);assert.deepEqual(detail(await state()),a);
  await page.locator('.objectRow').filter({has:page.locator('.objectName[title="'+a.id+'"]')}).getByTitle('解锁',{exact:true}).click();
 });
 await check('复制副本保留取样区域，删除与撤销可以恢复',async()=>{
  await page.getByRole('button',{name:'复制',exact:true}).click();let d=await state();assert.equal(d.project.annotations.length,2);assert.deepEqual(d.project.annotations[0].detail,d.project.annotations[1].detail);
  await page.locator('.objectName[title="'+d.project.annotations[0].id+'"]').click({modifiers:['Control']});
  await page.getByLabel('标注颜色',{exact:true}).fill('#111111');d=await state();for(const a of d.project.annotations)for(const part of ['source','connector','inset'])assert.equal(a.detail.styles[part].color,'#111111');
  await page.getByRole('button',{name:'撤销',exact:true}).click();d=await state();await page.locator('.objectName[title="'+d.project.annotations[1].id+'"]').click();
  await page.getByRole('button',{name:'删除',exact:true}).click();assert.equal((await state()).project.annotations.length,1);
  await page.getByRole('button',{name:'撤销',exact:true}).click();assert.equal((await state()).project.annotations.length,2);
  await page.getByRole('button',{name:'重做',exact:true}).click();assert.equal((await state()).project.annotations.length,1);
  d=await state();await page.locator('.objectName[title="'+detail(d).id+'"]').click();
 });
 await check('显式保存、刷新草稿和关闭后重开项目保留放大标注',async()=>{
  await page.getByRole('button',{name:'保存项目',exact:true}).click();const before=await state();assert.equal(before.dirty,false);assert.equal(before.project.revision,1);
  await page.reload();await page.getByRole('tab').waitFor();assert.deepEqual(detail(await state()),detail(before));
  await page.getByRole('button',{name:'关闭 '+seed.title,exact:true}).click();await page.getByRole('button',{name:'已存项目',exact:true}).click();await page.locator('.dialog').getByRole('button',{name:seed.title}).click();
  assert.deepEqual(detail(await state()),detail(before));
 });
 await check('实际按钮导出 PNG 与便携包，尺寸正确且便携包可重开',async()=>{
  const d=await state(),pngPromise=page.waitForEvent('download');await page.getByRole('button',{name:'导出 PNG',exact:true}).click();const download=await pngPromise,outputFile=path.join(evidence,'v2.1-p-export.png');await download.saveAs(outputFile);
  const meta=await sharp(outputFile).metadata();assert.equal(meta.width,d.project.image.width+d.project.layout.left+d.project.layout.right);assert.equal(meta.height,d.project.image.height+d.project.layout.top+d.project.layout.bottom);
  const zipPromise=page.waitForEvent('download');await page.getByRole('button',{name:'便携包',exact:true}).click();const zip=await zipPromise,file=path.join(evidence,'v2.1-p-example.biozip');await zip.saveAs(file);
  const r=await fetch(address+'/api/unpack',{method:'POST',headers:{'x-bio-token':token,'content-type':'application/octet-stream'},body:await fs.readFile(file)});assert.equal(r.status,200);assert.deepEqual((await r.json()).annotations,d.project.annotations);
 });
 await check('边缘取样完整保留在原图内，Esc 取消绘制且不创建错误对象',async()=>{
  const before=await state();await page.getByRole('button',{name:'适应窗口',exact:true}).click();let d=await state();await page.getByRole('button',{name:'局部放大',exact:true}).click();
  await drag(await screen(d,10,10),await screen(d,70,10));d=await state();const edge=d.project.annotations.at(-1);assert.ok(Math.abs(edge.detail.sourceRadius-10)<=2);assert.ok(Math.abs(edge.detail.sourceX-10)<=2);
  await page.getByRole('button',{name:'撤销',exact:true}).click();d=await state();
  await page.getByRole('button',{name:'局部放大',exact:true}).click();const a=await screen(d,300,300),b=await screen(d,340,300);await page.mouse.move(...a);await page.mouse.down();await page.mouse.move(...b);await page.keyboard.press('Escape');await page.mouse.up();
  assert.deepEqual((await state()).project.annotations,before.project.annotations);
 });
 // Keep both circles separated so the short connector and all three styles are visible.
 let d=await state();await page.locator('.objectName[title="'+detail(d).id+'"]').click();await page.getByLabel('局部放大倍率').fill('2.5');d=await state();
 const review=detail(d),radius=review.geometry.width/2;await drag(await screen(d,review.geometry.x+radius,review.geometry.y+radius),await screen(d,review.detail.sourceX+review.detail.sourceRadius+32+radius,review.detail.sourceY));
 await page.getByRole('button',{name:'取样圆',exact:true}).click();await page.getByRole('button',{name:'适应窗口',exact:true}).click();
 await page.getByRole('button',{name:'保存项目',exact:true}).click();d=await state();
 await fs.writeFile(path.join(evidence,'v2.1-p-preview.png'),await api('export',{project:d.project,scale:1},true));
 await fs.writeFile(path.join(evidence,'v2.1-p-example.biozip'),await api('package',{project:d.project},true));
 await page.locator('.properties').evaluate(el=>{el.scrollTop=0;});await page.screenshot({path:path.join(evidence,'v2.1-p-interface.png')});
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(evidence,'browser-results.json'),JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),results,errors},null,2));
}catch(e){await page?.screenshot({path:path.join(evidence,'browser-failure.png')}).catch(()=>{});await fs.writeFile(path.join(evidence,'browser-results.json'),JSON.stringify({results,errors,error:String(e),serverOutput:output},null,2));console.error(e);process.exitCode=1;
}finally{await browser?.close();if(token)await api('stop',{}).catch(()=>server.kill());else server.kill();}
