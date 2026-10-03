import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const profile=path.resolve('../../../validation/v2.1-p/profiles/桌面 最终验收'),file=path.join(profile,'editor-preview.png');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9470');
try{
 const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('http://127.0.0.1:'));
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'保存项目',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('footer').textContent.includes('项目保存成功'));
 await page.locator('.objectName').filter({hasText:'局部放大'}).click();
 await page.getByRole('button',{name:'取样圆',exact:true}).click();
 await page.locator('.properties').evaluate(el=>el.scrollTop=0);
 const previous=(await fs.stat(file)).mtimeMs;
 await page.evaluate(()=>window.chrome.webview.postMessage({type:'diagnostic-capture'}));
 for(let n=0;n<80;n++){if((await fs.stat(file)).mtimeMs>previous)break;await new Promise(r=>setTimeout(r,100));}
 for(let n=0;n<80;n++){try{await fs.copyFile(file,path.resolve('../../../validation/v2.1-p/desktop-final.png'));break;}catch(e){if(n===79)throw e;await new Promise(r=>setTimeout(r,100));}}
 await page.evaluate(()=>window.chrome.webview.postMessage({type:'diagnostic-close'}));
 console.log('Final EXE preview saved; test window closed');
}finally{await browser.close().catch(()=>{});}
