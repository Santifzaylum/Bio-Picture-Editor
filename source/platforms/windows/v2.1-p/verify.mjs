import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {unzipSync} from '../../../editions/v2.1-p/node_modules/fflate/esm/index.mjs';
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..'),name='Bio-Picture-Editor-v2.1-p';
const folder=path.join(workspace,'releases/windows/v2.1-p',name),archive=folder+'.zip',evidence=path.join(workspace,'validation/v2.1-p');
const bytes=await fs.readFile(archive),files=unzipSync(bytes),prefix=name+'/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(new TextDecoder().decode(files[prefix+'BUILD-MANIFEST.json']));assert.equal(manifest.version,'v2.1-p');
assert.equal(hash(files[prefix+'生物图片编辑器.exe']),manifest.exeSha256);assert.equal((await fs.readFile(archive+'.sha256','utf8')).trim().split(/\s+/)[0],hash(bytes));
for(const [file,data] of Object.entries(files)){assert.equal(hash(data),hash(await fs.readFile(path.join(folder,file.slice(prefix.length)))));assert.ok(!/(node_modules|data\/projects|profiles|Setup\.cmd|Start\.vbs)/.test(file));}
for(const file of ['USAGE.md','先看这里-操作指南.html','FONT-LICENSE.txt','WEBVIEW2-LICENSE.txt','NODE-LICENSE.txt','V2.1-P-REPORT.md','示例项目.biozip'])assert.ok(files[prefix+file]);
assert.equal(hash(files[prefix+'app-icon.svg']),hash(await fs.readFile(path.join(workspace,'source/editions/v2.1-webui/public/app-icon.svg'))));
await fs.mkdir(evidence,{recursive:true});const result={version:'v2.1-p',zipBytes:bytes.length,zipSha256:hash(bytes),exeSha256:manifest.exeSha256,archiveExeMatches:true,allFilesMatch:true,iconMatchesWebui:true,noUserData:true,fileCount:Object.keys(files).length};
await fs.writeFile(path.join(evidence,'package-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
