import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {unzipSync} from '../../../editions/v2.2.1-p/node_modules/fflate/esm/index.mjs';
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..'),name='Bio-Picture-Editor-v2.2.1-p',folder=path.join(workspace,'releases/windows/v2.2.1-p',name),archive=folder+'.zip',evidence=path.join(workspace,'validation/v2.2.1-p');
const bytes=await fs.readFile(archive),files=unzipSync(bytes),prefix=name+'/',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const build=JSON.parse(new TextDecoder().decode(files[prefix+'文档/BUILD-MANIFEST.json'])),manifest=JSON.parse(new TextDecoder().decode(files[prefix+'文档/PACKAGE-MANIFEST.json']));assert.equal(build.version,'v2.2.1-p');
assert.equal(hash(files[prefix+'生物图片编辑器.exe']),build.exeSha256);assert.equal((await fs.readFile(archive+'.sha256','utf8')).trim().split(/\s+/)[0],hash(bytes));
const rootFiles=Object.keys(files).map(f=>f.slice(prefix.length)).filter(f=>!f.includes('/')).sort();assert.deepEqual(rootFiles,['README.txt','使用指南.html','生物图片编辑器.exe'].sort());
for(const [file,data] of Object.entries(files)){assert.equal(hash(data),hash(await fs.readFile(path.join(folder,file.slice(prefix.length)))));assert.ok(!/(node_modules|data\/projects|profiles|Setup\.cmd|Start\.vbs)/.test(file));}
for(const f of manifest.files)assert.equal(hash(files[prefix+f.path]),f.sha256,f.path);
assert.deepEqual((await fs.readdir(folder)).sort(),['README.txt','使用指南.html','文档','生物图片编辑器.exe'].sort());
assert.equal(hash(files[prefix+'文档/app-icon.svg']),hash(await fs.readFile(path.join(workspace,'source/editions/v2.2.1-webui/public/app-icon.svg'))));
const result={version:'v2.2.1-p',zipBytes:bytes.length,zipSha256:hash(bytes),exeSha256:build.exeSha256,archiveExeMatches:true,allFilesMatch:true,iconMatchesWebui:true,noUserData:true,rootFiles,fileCount:Object.keys(files).length};await fs.writeFile(path.join(evidence,'package-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
