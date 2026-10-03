import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const workspace=path.resolve('../../..'),web=path.resolve('../v2.1-webui'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const same=[];
for(const file of ['src/model.ts','src/render.ts','src/workspace.ts','src/ToolIcon.tsx','src/DetailProperties.tsx','src/style.css','server/storage.ts']){
 assert.equal(hash(await fs.readFile(file)),hash(await fs.readFile(path.join(web,file))));same.push(file);
}
const manifest=JSON.parse(await fs.readFile(path.join(workspace,'releases/windows/v2.1-webui/Bio-Picture-Editor-v2.1-webui/PACKAGE-MANIFEST.json'),'utf8'));
for(const file of manifest.files)assert.equal(hash(await fs.readFile(path.join(web,file.path))),file.sha256,file.path);
const releases=[];
for(const v of ['v1.1-p','v2.0-webui','v2.1-webui']){
 const file=path.join(workspace,'releases/windows',v,'Bio-Picture-Editor-'+v+'.zip'),sum=(await fs.readFile(file+'.sha256','utf8')).trim().split(/\s+/)[0];
 assert.equal(hash(await fs.readFile(file)),sum);releases.push({version:v,sha256:sum,verified:true});
}
const build=JSON.parse(await fs.readFile(path.join(workspace,'releases/windows/v2.1-p/Bio-Picture-Editor-v2.1-p/BUILD-MANIFEST.json'),'utf8'));
const installed=JSON.parse(await fs.readFile(path.join(workspace,'validation/v2.1-p/profiles/首次 官方下载/runtime/node-integrity.json'),'utf8'));
assert.equal(installed.source,'nodejs.org');assert.equal(installed.sha256,build.nodeExeHash);
const result={version:'v2.1-p',unchangedCoreFiles:same,webuiSourceManifestFiles:manifest.files.length,oldReleases:releases,nodeDownloadedAndVerified:true};
await fs.writeFile(path.join(workspace,'validation/v2.1-p/baseline-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
