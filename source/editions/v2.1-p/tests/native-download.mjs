import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium} from 'playwright';
const kind=process.argv[2]||'png',dest=path.resolve('../../../validation/v2.1-p',kind==='png'?'原生保存验收.png':'原生保存验收.biozip');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9470');
try{
 const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('http://127.0.0.1:'));
 await page.getByRole('tab').filter({hasText:'桌面验收 2'}).click();
 const cdp=await page.context().newCDPSession(page);await cdp.send('Browser.setDownloadBehavior',{behavior:'default'});
 if(!process.argv.includes('--verify-only'))await page.getByRole('button',{name:kind==='png'?'导出 PNG':'便携包',exact:true}).click();
 console.log('Windows Save As dialog requested. Save to '+dest);
 for(let n=0;n<900;n++){if(await fs.stat(dest).then(s=>s.size>0).catch(()=>false))break;await new Promise(r=>setTimeout(r,200));}
 const bytes=await fs.readFile(dest);assert.ok(bytes.length>1000);
 let detail;
 if(kind==='png'){detail=await sharp(bytes).metadata();assert.equal(detail.width,1550);assert.equal(detail.height,800);}
 else{const s=await(await fetch(new URL('/api/session',page.url()))).json();const r=await fetch(new URL('/api/unpack',page.url()),{method:'POST',headers:{'x-bio-token':s.token,'content-type':'application/octet-stream'},body:bytes});assert.equal(r.status,200);const p=await r.json();assert.equal(p.annotations.find(a=>a.type==='magnifier').detail.styles.inset.strokeWidth,6);detail={project:p.title,annotations:p.annotations.length};}
 await fs.writeFile(path.resolve('../../../validation/v2.1-p','native-'+kind+'-result.json'),JSON.stringify({passed:true,file:dest,bytes:bytes.length,detail},null,2));
 console.log('PASS native Windows save dialog: '+kind);
}finally{await browser.close();}
