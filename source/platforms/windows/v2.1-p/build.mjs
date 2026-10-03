import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {build} from 'esbuild';
import sharp from 'sharp';
import {zipSync,unzipSync} from 'fflate';

const root=process.cwd(),workspace=path.resolve(root,'../../..'),platform=path.join(workspace,'source/platforms/windows/v2.1-p'),out=path.join(workspace,'releases/windows/v2.1-p/Bio-Picture-Editor-v2.1-p'),work=path.join(root,'.build','desktop');
if(!root.replaceAll('\\','/').endsWith('/source/editions/v2.1-p'))throw Error('Run from source/editions/v2.1-p');
const sdkVersion='1.0.3537.50',nodeVersion='v22.23.3';
const nodeZipHash='2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(work,{recursive:true});await fs.mkdir(out,{recursive:true});
async function command(file,args,cwd=root){await new Promise((resolve,reject)=>{let p=spawn(file,args,{cwd,stdio:'inherit',windowsHide:true});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(file+' exited '+code)));});}
await command(process.execPath,['node_modules/typescript/bin/tsc','--noEmit']);
await command(process.execPath,['node_modules/vite/bin/vite.js','build']);

// Keep the logo as an editable SVG; encode real PNG-backed Windows ICO sizes.
const svg=await fs.readFile('assets/app-icon.svg');await fs.writeFile('public/app-icon.svg',svg);await fs.writeFile('dist/app-icon.svg',svg);
const sizes=[16,24,32,48,64,128,256],pngs=[];
for(const size of sizes)pngs.push(await sharp(svg).resize(size,size).png().toBuffer());
let offset=6+16*pngs.length;let icon=Buffer.alloc(offset+pngs.reduce((n,b)=>n+b.length,0));icon.writeUInt16LE(1,2);icon.writeUInt16LE(pngs.length,4);
pngs.forEach((bytes,n)=>{let at=6+n*16;icon[at]=sizes[n]===256?0:sizes[n];icon[at+1]=icon[at];icon.writeUInt16LE(1,at+4);icon.writeUInt16LE(32,at+6);icon.writeUInt32LE(bytes.length,at+8);icon.writeUInt32LE(offset,at+12);bytes.copy(icon,offset);offset+=bytes.length;});
await fs.writeFile('assets/app.ico',icon);await fs.writeFile('assets/app-icon.png',pngs.at(-1));

// Bundle local TypeScript at build time. End users never run npm or Vite.
for(const name of ['index','cli'])await build({entryPoints:['server/'+name+'.ts'],outfile:path.join(work,name==='index'?'server.mjs':'cli.mjs'),bundle:true,platform:'node',format:'esm',target:'node22',packages:'external'});
const files={};
async function collect(dir,prefix=dir){for(const item of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const full=path.join(dir,item.name),key=prefix+'/'+item.name;if(item.isDirectory())await collect(full,key);else if(item.isFile())files[key.replaceAll('\\','/')]=new Uint8Array(await fs.readFile(full));}}
await collect('dist');
for(const name of ['example.biozip','IMAGE-LICENSE.md'])files['examples/'+name]=new Uint8Array(await fs.readFile('examples/'+name));
files['server.mjs']=new Uint8Array(await fs.readFile(path.join(work,'server.mjs')));files['cli.mjs']=new Uint8Array(await fs.readFile(path.join(work,'cli.mjs')));
files['dependency-check.mjs']=new TextEncoder().encode(`import sharp from 'sharp';import{createCanvas,GlobalFonts}from'@napi-rs/canvas';import fs from'node:fs';
GlobalFonts.registerFromPath('dist/fonts/NotoSansCJKsc-Regular.otf','BioSans');if(!GlobalFonts.has('BioSans'))throw Error('内置中文字体未能加载');
const c=createCanvas(12,12);c.getContext('2d').fillText('图',0,10);const b=await c.encode('png');const m=await sharp(b).metadata();if(m.width!==12||!fs.existsSync('dist/index.html'))throw Error('编辑组件未完整安装');console.log('BIO_DEPENDENCIES_OK');`);
files['package.json']=new TextEncoder().encode(JSON.stringify({name:'bio-picture-editor-desktop-runtime',version:'2.1.0-p',type:'module',private:true}));
files['THIRD-PARTY-NOTICES.txt']=new Uint8Array(await fs.readFile(path.join(workspace,'docs/windows/v2.1-p/THIRD-PARTY-NOTICES.txt')));
for(const name of ['NODE-LICENSE.txt','WEBVIEW2-LICENSE.txt','WEBVIEW2-NOTICE.txt'])files['licenses/'+name]=new Uint8Array(await fs.readFile(path.join(platform,name)));
const lock=JSON.parse(await fs.readFile('package-lock.json','utf8')),selected=new Set();
async function dependency(name,parent=''){
  let directory=parent;
  let found;
  while(true){const candidate=(directory?directory+'/':'')+'node_modules/'+name;if(lock.packages[candidate]&&await fs.stat(candidate).then(s=>s.isDirectory()).catch(()=>false)){found=candidate;break;}if(!directory)break;directory=path.posix.dirname(directory);if(directory==='.')directory='';}
  if(!found){if(lock.packages['node_modules/'+name]?.os?.every(os=>os!=='win32'))return;throw Error('Required dependency missing: '+name);}
  if(selected.has(found))return;selected.add(found);
  const meta=lock.packages[found];
  for(const child of Object.keys(meta.dependencies||{}))await dependency(child,found);
  for(const child of Object.keys(meta.optionalDependencies||{}))try{await dependency(child,found);}catch{}
}
for(const name of ['express','sharp','@napi-rs/canvas','fflate','zod'])await dependency(name);
for(const dir of [...selected].sort())await collect(dir);
console.log('Runtime dependency packages:',selected.size);
const manifest=JSON.stringify(Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)).map(([file,bytes])=>[file,hash(bytes)])));
files['install-manifest.json']=new TextEncoder().encode(manifest);
const payload=Buffer.from(zipSync(files,{level:6}));await fs.writeFile(path.join(work,'app-payload.zip'),payload);

const sdkPackage=path.join(work,'webview2-'+sdkVersion+'.nupkg');
if(!await fs.stat(sdkPackage).catch(()=>false)){
  const response=await fetch('https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/'+sdkVersion+'/microsoft.web.webview2.'+sdkVersion+'.nupkg');if(!response.ok)throw Error('WebView2 SDK download failed: '+response.status);
  await fs.writeFile(sdkPackage,Buffer.from(await response.arrayBuffer()));
}
const sdkFiles=unzipSync(new Uint8Array(await fs.readFile(sdkPackage)));
for(const [source,target] of [['lib/net462/Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.Core.dll'],['lib/net462/Microsoft.Web.WebView2.WinForms.dll','Microsoft.Web.WebView2.WinForms.dll'],['runtimes/win-x64/native/WebView2Loader.dll','WebView2Loader.dll']]){if(!sdkFiles[source])throw Error('SDK missing '+source);await fs.writeFile(path.join(work,target),sdkFiles[source]);}
const sumsResponse=await fetch('https://nodejs.org/dist/'+nodeVersion+'/SHASUMS256.txt');if(!sumsResponse.ok)throw Error('Cannot verify official Node hashes');
const sums=await sumsResponse.text(),nodeExeHash=sums.split('\n').find(l=>l.trim().endsWith(' win-x64/node.exe'))?.split(/\s+/)[0];
if(!sums.includes(nodeZipHash+'  node-'+nodeVersion+'-win-x64.zip')||!nodeExeHash)throw Error('Official Node SHA-256 manifest changed');
await fs.writeFile(path.join(work,'node-shasums.txt'),sums);
await fs.writeFile(path.join(work,'BuildInfo.cs'),`namespace BioPictureEditor {internal static class BuildInfo {internal const string SdkVersion="${sdkVersion}";internal const string PayloadHash="${hash(payload)}";internal const string ManifestHash="${hash(Buffer.from(manifest))}";internal const string NodeVersion="${nodeVersion}";internal const string NodeZipHash="${nodeZipHash}";internal const string NodeExeHash="${nodeExeHash}";}}`);
const framework=path.join(process.env.WINDIR||'C:\\Windows','Microsoft.NET','Framework64','v4.0.30319');
const compiledExe=path.join(work,'生物图片编辑器.exe'),exe=path.join(out,'生物图片编辑器.exe');
const args=['/nologo','/target:winexe','/platform:x64','/optimize+','/utf8output','/out:'+compiledExe,'/win32icon:'+path.join(root,'assets/app.ico'),'/win32manifest:'+path.join(platform,'app.manifest')];
for(const assembly of ['System.dll','System.Core.dll','System.Drawing.dll','System.Windows.Forms.dll','System.Net.Http.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll','System.Web.Extensions.dll'])args.push('/reference:'+path.join(framework,assembly));
for(const assembly of ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll'])args.push('/reference:'+path.join(work,assembly));
for(const file of ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll','app-payload.zip'])args.push('/resource:'+path.join(work,file)+','+file);
args.push('/resource:'+path.join(root,'assets/app.ico')+',app.ico');
args.push('/resource:'+path.join(root,'assets/app-icon.png')+',app-icon.png');
args.push(path.join(platform,'Bootstrap.cs'),path.join(platform,'Installer.cs'),path.join(platform,'MainForm.cs'),path.join(work,'BuildInfo.cs'));
await command(path.join(framework,'csc.exe'),args);
await fs.copyFile(compiledExe,exe);
await fs.writeFile(path.join(out,'生物图片编辑器.exe.config'),`<?xml version="1.0"?><configuration><startup><supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.6.2"/></startup></configuration>`);
const report={version:'v2.1-p',platform:'Windows x64',nodeVersion,nodeZipHash,nodeExeHash,sdkVersion,payloadSha256:hash(payload),exeSha256:hash(await fs.readFile(exe)),payloadBytes:payload.length,exeBytes:(await fs.stat(exe)).size,dependencies:[...selected].map(p=>({path:p,version:lock.packages[p].version})),builtAt:new Date().toISOString()};
await fs.writeFile(path.join(out,'BUILD-MANIFEST.json'),JSON.stringify(report,null,2));
console.log('Built',exe,Math.round(report.exeBytes/1048576)+' MiB');
