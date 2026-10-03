import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!root.replaceAll('\\','/').endsWith('/source/editions/v2.1-webui'))throw Error('请在开发工作区 source/editions/v2.1-webui 中打包');
const workspace=path.resolve(root,'../../..'),output=path.join(workspace,'releases/windows/v2.1-webui');
const name='Bio-Picture-Editor-v2.1-webui',folder=path.join(output,name),zipFile=path.join(output,name+'.zip');
const files=['.gitignore','README.md','USAGE.md','操作指南.md','先看这里-操作指南.html','先看这里-操作指南.txt','GUIDE.md','CODEX_GUIDE.md','CHANGELOG.md','RELEASE-v2.1-webui.md','VERIFICATION.md','PACKAGE-REPORT.md','THIRD-PARTY-NOTICES.txt','V1.1-REPORT.md','package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','config.json','Setup.cmd','Rebuild.cmd','Start.cmd','Stop.cmd','Start.vbs','Stop.vbs','启动.vbs','停止.vbs','Codex-CLI.cmd','data/README.txt','tests/core.test.ts','tests/interaction.test.ts','tests/detail.test.ts','tests/detail-v21.test.ts','tests/v1.1-browser.mjs','tests/v2-browser.mjs','tests/v2-results.json','tests/v1.1-results.json'];
async function walk(dir){for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const item=dir+'/'+entry.name;if(entry.isSymbolicLink())throw Error('源码资源不允许符号链接');if(entry.isDirectory())await walk(item);else files.push(item);}}
for(const dir of ['src','server','public','examples','scripts'])await walk(dir);
await fs.mkdir(folder,{recursive:true});
const entries={},manifest={name:'生物图片编辑器',version:'2.1.0-webui',release:'v2.1-webui',date:'2026-10-03',basedOn:'v2.0-webui (2026-10-02)',target:'Windows x64 WebUI',entry:'启动.vbs',port:4321,bundledNode:false,bundledDependencies:false,containsPersonalProjects:false,files:[]};
for(const file of [...new Set(files)].sort()){
 const bytes=await fs.readFile(path.join(root,file));
 if(/(^|\/)(node_modules|dist|runtime|projects|\.build)(\/|$)/.test(file))throw Error('非法发布资源 '+file);
 const dest=path.join(folder,file);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,bytes);
 entries[name+'/'+file]=new Uint8Array(bytes);manifest.files.push({path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const manifestText=JSON.stringify(manifest,null,2)+'\n';entries[name+'/PACKAGE-MANIFEST.json']=strToU8(manifestText);
await fs.writeFile(path.join(folder,'PACKAGE-MANIFEST.json'),manifestText);
const zip=zipSync(entries,{level:6});await fs.writeFile(zipFile,zip);
const unpacked=unzipSync(await fs.readFile(zipFile)),opened=JSON.parse(strFromU8(unpacked[name+'/PACKAGE-MANIFEST.json']));
for(const file of opened.files){const bytes=unpacked[name+'/'+file.path];if(!bytes||bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('发布包校验失败 '+file.path);}
const sha256=createHash('sha256').update(zip).digest('hex');await fs.writeFile(zipFile+'.sha256',sha256+'  '+name+'.zip\n');
const result={zip:zipFile,bytes:zip.length,sha256,verifiedFiles:opened.files.length};
await fs.mkdir(path.join(workspace,'validation/v2.1-webui'),{recursive:true});
await fs.writeFile(path.join(workspace,'validation/v2.1-webui/package-result.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
