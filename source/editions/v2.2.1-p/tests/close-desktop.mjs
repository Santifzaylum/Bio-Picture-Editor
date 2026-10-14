import {chromium} from 'playwright';
const browser=await chromium.connectOverCDP('http://127.0.0.1:'+(process.argv[2]||'9472'));const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('http://127.0.0.1:'));await page.evaluate(()=>window.chrome.webview.postMessage({type:'diagnostic-close'})).catch(()=>{});await browser.close().catch(()=>{});
