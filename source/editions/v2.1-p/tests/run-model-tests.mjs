import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {spawn} from 'node:child_process';
await fs.mkdir('.build/tests',{recursive:true});
const files=['core','interaction','detail','detail-v21'];
for(const name of files)await build({entryPoints:['tests/'+name+'.test.ts'],outfile:'.build/tests/'+name+'.test.mjs',bundle:true,platform:'node',format:'esm',packages:'external',target:'node22'});
const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--test',...files.map(name=>'.build/tests/'+name+'.test.mjs')],{stdio:'inherit',windowsHide:true});child.once('error',reject);child.once('exit',resolve);});
process.exitCode=code;
