import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!root.replaceAll('\\','/').endsWith('/source/editions/v2.3-webui'))throw Error('请在开发工作区 source/editions/v2.3-webui 中打包');
const workspace=path.resolve(root,'../../..'),output=path.join(workspace,'releases/windows/v2.3-webui');
const name='Bio-Picture-Editor-v2.3-webui',folder=path.join(output,name),zipFile=path.join(output,name+'.zip');
const files=['.gitignore','package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','config.json','Setup.cmd','Rebuild.cmd','Start.cmd','Stop.cmd','Start.vbs','Stop.vbs','Codex-CLI.cmd','data/README.txt','tests/core.test.ts','tests/interaction.test.ts','tests/prepare-ui-fixture.ts','tests/detail.test.ts','tests/detail-v21.test.ts','tests/v1.1-browser.mjs','tests/v2-browser.mjs','tests/ratio.test.ts','tests/series.test.ts','tests/measurement.test.ts','tests/measurement-browser.mjs','tests/measurement-label-browser.mjs'];
async function walk(dir){for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const item=dir+'/'+entry.name;if(entry.isSymbolicLink())throw Error('源码资源不允许符号链接');if(entry.isDirectory())await walk(item);else files.push(item);}}
for(const dir of ['src','server','public','examples','scripts'])await walk(dir);
await fs.mkdir(folder,{recursive:true});
const entries={},manifest={name:'生物图片编辑器',version:'2.3-webui',release:'v2.3-webui',date:'2026-10-22',basedOn:'v2.2.1-webui',target:'Windows x64 WebUI',entry:'启动.vbs',setup:'首次初始化.cmd',guide:'使用指南.html',programDirectory:'程序',documentationDirectory:'文档',port:4324,bundledNode:false,bundledDependencies:false,containsPersonalProjects:false,files:[]};
async function add(relative,bytes){if(path.isAbsolute(relative)||relative.split('/').includes('..'))throw Error('发布路径非法');const dest=path.join(folder,relative);await fs.mkdir(path.dirname(dest),{recursive:true});let previous;try{previous=await fs.readFile(dest);}catch(e){if(e.code!=='ENOENT')throw e;}if(!previous||!previous.equals(bytes))await fs.writeFile(dest,bytes);entries[name+'/'+relative]=new Uint8Array(bytes);manifest.files.push({path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
for(const file of [...new Set(files)].sort()){
 if(/(^|\/)(node_modules|dist|runtime|projects|\.build)(\/|$)/.test(file))throw Error('非法发布资源 '+file);
 await add('程序/'+file,await fs.readFile(path.join(root,file)));
}
const documents={'USAGE.md':'使用指南.md','RELEASE-v2.3-webui.md':'版本说明.md','VERIFICATION.md':'验证记录.md','GUIDE.md':'开发指南.md','CODEX_GUIDE.md':'Codex-CLI指南.md','PACKAGE-REPORT.md':'发布包说明.md','THIRD-PARTY-NOTICES.txt':'第三方许可.txt'};
for(const [source,destination] of Object.entries(documents))await add('文档/'+destination,await fs.readFile(path.join(root,source)));
const launcher=script=>Buffer.concat([Buffer.from([0xff,0xfe]),Buffer.from(`Option Explicit\r\nDim fso, shell, base, options, arg\r\nSet fso = CreateObject("Scripting.FileSystemObject")\r\nSet shell = CreateObject("WScript.Shell")\r\nbase = fso.GetParentFolderName(WScript.ScriptFullName)\r\noptions = ""\r\nFor Each arg In WScript.Arguments\r\n  If arg = "--quiet" Then options = options & " -Quiet"\r\n  If arg = "--no-browser" And "${script}" = "start" Then options = options & " -NoBrowser"\r\nNext\r\nshell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File " & Chr(34) & base & "\\程序\\scripts\\${script}.ps1" & Chr(34) & options, 0, False\r\n`,'utf16le')]);
await add('启动.vbs',launcher('start'));await add('停止.vbs',launcher('stop'));
await add('首次初始化.cmd',Buffer.from('@echo off\r\nchcp 65001 >nul\r\ncall "%~dp0程序\\Setup.cmd"\r\nexit /b %errorlevel%\r\n','utf8'));
await add('使用指南.html',await fs.readFile(path.join(root,'使用指南.html')));
await add('README.txt',Buffer.from('生物图片编辑器 v2.3-webui\r\n\r\n先完整解压整个文件夹。\r\n第一次：安装 Node.js 22.12+（含 npm），双击“首次初始化.cmd”，需要联网。\r\n以后：双击“启动.vbs”；逐张保存后双击“停止.vbs”。\r\n完整基础操作、新长度测量和升级说明：双击“使用指南.html”。\r\n\r\n程序：源码、字体、示例、配置及本版本用户数据。\r\n文档：版本说明、开发资料、验证记录和命令行备用入口。\r\n用户项目在 程序/data/；备份请导出 .biozip。\r\n请保持所有文件夹的相对位置，移动前先保存并停止服务。\r\n默认端口 4324，旧版程序与数据不被覆盖。\r\n','utf8'));
for(const [namePart,internal] of [['命令行启动','Start'],['命令行停止','Stop']])await add('文档/'+namePart+'.cmd',Buffer.from(`@echo off\r\nchcp 65001 >nul\r\ncall "%~dp0..\\程序\\${internal}.cmd"\r\nexit /b %errorlevel%\r\n`,'utf8'));
const manifestText=JSON.stringify(manifest,null,2)+'\n';entries[name+'/文档/PACKAGE-MANIFEST.json']=strToU8(manifestText);
await fs.writeFile(path.join(folder,'文档/PACKAGE-MANIFEST.json'),manifestText);
const zip=zipSync(entries,{level:6});await fs.writeFile(zipFile,zip);
const unpacked=unzipSync(await fs.readFile(zipFile)),opened=JSON.parse(strFromU8(unpacked[name+'/文档/PACKAGE-MANIFEST.json']));
for(const file of opened.files){const bytes=unpacked[name+'/'+file.path];if(!bytes||bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('发布包校验失败 '+file.path);}
const sha256=createHash('sha256').update(zip).digest('hex');await fs.writeFile(zipFile+'.sha256',sha256+'  '+name+'.zip\n');
const result={zip:zipFile,bytes:zip.length,sha256,verifiedFiles:opened.files.length,rootFiles:['启动.vbs','停止.vbs','首次初始化.cmd','使用指南.html','README.txt'],folders:['程序','文档']};
await fs.mkdir(path.join(workspace,'validation/v2.3-webui'),{recursive:true});await fs.writeFile(path.join(workspace,'validation/v2.3-webui/package-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));

