import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {zipSync} from '../../../editions/v2.2.1-p/node_modules/fflate/esm/index.mjs';
const platform=path.dirname(fileURLToPath(import.meta.url)),workspace=path.resolve(platform,'../../../..'),edition=path.join(workspace,'source/editions/v2.2.1-p');
const name='Bio-Picture-Editor-v2.2.1-p',dest=path.join(workspace,'releases/windows/v2.2.1-p',name),docs=path.join(workspace,'docs/windows/v2.2.1-p');
const entries={},manifest={version:'v2.2.1-p',basedOn:'v2.2.1-webui',entry:'生物图片编辑器.exe',files:[]},hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function add(file,bytes){const full=path.join(dest,file);await fs.mkdir(path.dirname(full),{recursive:true});await fs.writeFile(full,bytes);entries[name+'/'+file]=new Uint8Array(bytes);manifest.files.push({path:file,bytes:bytes.length,sha256:hash(bytes)});}
await add('生物图片编辑器.exe',await fs.readFile(path.join(dest,'生物图片编辑器.exe')));
await add('文档/BUILD-MANIFEST.json',await fs.readFile(path.join(dest,'文档/BUILD-MANIFEST.json')));
for(const [src,target] of Object.entries({'README.md':'版本说明.md','USAGE.md':'使用指南.md','CODEX_GUIDE.md':'Codex-CLI指南.md','CHANGELOG.md':'版本记录.md','THIRD-PARTY-NOTICES.txt':'第三方许可.txt'}))await add('文档/'+target,await fs.readFile(path.join(docs,src)));
await add('文档/桌面构建.md',await fs.readFile(path.join(platform,'README.md')));
await add('文档/验收报告.md',await fs.readFile(path.join(workspace,'validation/v2.2.1-p/V2.2.1-P-REPORT.md')));
for(const file of ['desktop-cli.ps1','Codex-CLI.cmd'])await add('文档/'+file,await fs.readFile(path.join(platform,file)));
for(const file of ['NODE-LICENSE.txt','WEBVIEW2-LICENSE.txt','WEBVIEW2-NOTICE.txt'])await add('文档/许可/'+file,await fs.readFile(path.join(platform,file)));
await add('文档/许可/FONT-LICENSE.txt',await fs.readFile(path.join(edition,'public/fonts/LICENSE.txt')));
await add('文档/许可/IMAGE-LICENSE.md',await fs.readFile(path.join(edition,'examples/IMAGE-LICENSE.md')));
await add('文档/示例/基础标注.biozip',await fs.readFile(path.join(edition,'examples/example.biozip')));
await add('文档/示例/长度与比例测量.biozip',await fs.readFile(path.join(edition,'examples/example-v2.2.1.biozip')));
await add('文档/app-icon.svg',await fs.readFile(path.join(edition,'assets/app-icon.svg')));
const guide=await fs.readFile(path.join(docs,'USAGE.md'),'utf8');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),inline=s=>escape(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
let body='',paragraph=[],lines=guide.split(/\r?\n/);function flush(){if(paragraph.length){body+='<p>'+inline(paragraph.join(' '))+'</p>';paragraph=[];}}
for(let n=0;n<lines.length;n++){
 const line=lines[n];if(!line.trim()){flush();continue;}
 const heading=line.match(/^(#{1,4}) (.*)$/);if(heading){flush();body+=`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;continue;}
 if(line.startsWith('|')){flush();const rows=[];while(n<lines.length&&lines[n].startsWith('|'))rows.push(lines[n++]);n--;body+='<table>';rows.filter(r=>!/^\|[\s|:-]+$/.test(r)).forEach((r,i)=>{body+='<tr>'+r.split('|').slice(1,-1).map(c=>`<${i?'td':'th'}>${inline(c.trim())}</${i?'td':'th'}>`).join('')+'</tr>';});body+='</table>';continue;}
 const list=line.match(/^(\d+\. |[-*] )(.*)$/);if(list){flush();const ordered=/^\d/.test(list[1]),tag=ordered?'ol':'ul';body+='<'+tag+'>';while(n<lines.length){const item=lines[n].match(ordered?/^\d+\. (.*)$/:/^[-*] (.*)$/);if(!item)break;body+='<li>'+inline(item[1])+'</li>';n++;}n--;body+='</'+tag+'>';continue;}
 paragraph.push(line);
}flush();
const html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>生物图片编辑器 v2.2.1-p 使用指南</title><style>body{max-width:1000px;margin:36px auto;padding:0 24px;background:#f6f8fc;color:#263446;font:15px/1.85 "Microsoft YaHei",sans-serif}main{background:white;padding:32px 40px;border-radius:16px}h1,h2{color:#235f9c}h2{margin-top:32px}code{background:#eef3f9;padding:2px 4px;border-radius:3px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #dce4ef;padding:8px 12px;text-align:left}th{background:#edf4fc}li{margin:7px 0}@media(max-width:700px){body{padding:8px;margin:0}main{padding:20px}table{display:block;overflow:auto}}</style></head><body><main>'+body+'</main></body></html>';
await fs.writeFile(path.join(docs,'使用指南.html'),html);await add('使用指南.html',Buffer.from(html));
await add('README.txt',Buffer.from('生物图片编辑器 v2.2.1-p\r\n\r\n先完整解压 ZIP，再双击“生物图片编辑器.exe”。\r\n首次自动准备 Node.js、WebView2 和图片组件；缺少环境时需要联网。\r\n完成后自动进入编辑窗口，后续可离线使用，无需手动安装依赖。\r\n基础操作及长度、比例、标定教程：双击“使用指南.html”。\r\n\r\n结束前逐张保存，再关闭窗口；便携包 .biozip 用于备份或版本迁移。\r\n数据：%LOCALAPPDATA%\\Bio-Picture-Editor\\v2.2.1-p\\\r\n示例、许可、CLI、构建及验证资料：文档文件夹。\r\n支持 Windows 10/11 x64。旧版本和个人数据继续保留。\r\n','utf8'));
await add('文档/PACKAGE-MANIFEST.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
const archive=Buffer.from(zipSync(entries,{level:6})),zipFile=dest+'.zip';await fs.writeFile(zipFile,archive);const sha256=hash(archive);await fs.writeFile(zipFile+'.sha256',sha256+'  '+name+'.zip\n');
const result={version:'v2.2.1-p',zipFile,bytes:archive.length,sha256,fileCount:Object.keys(entries).length,rootFiles:['生物图片编辑器.exe','使用指南.html','README.txt'],folders:['文档']};await fs.writeFile(path.join(workspace,'validation/v2.2.1-p/package-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
