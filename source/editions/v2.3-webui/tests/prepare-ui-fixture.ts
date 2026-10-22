import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {defaultStyle,validate,type Annotation} from '../src/model';
const {saveProject}=await import('../server/storage');
const p=validate(JSON.parse(await fs.readFile('examples/example-v2.2.1-inline.json','utf8')));
p.id=randomUUID();p.revision=0;p.title='v2.3 界面验收（合成图，85 个标注）';
for(let i=p.annotations.length;i<85;i++){
 const a:Annotation={id:randomUUID(),imageId:p.image.id,type:i%4===0?'text':i%4===1?'rectangle':i%4===2?'arrow':'line',geometry:{x:70+(i%10)*90,y:70+Math.floor(i/10)*65,x2:115+(i%10)*90,y2:90+Math.floor(i/10)*65,width:80,height:35,unit:'image-pixel'},style:{...defaultStyle,strokeWidth:4,headSize:18,fontSize:18},label:'标注 '+String(i+1).padStart(2,'0'),description:'分页与筛选测试',visible:i%9!==0,locked:i%13===0,zIndex:i,status:'user'};
 p.annotations.push(a);
}
await saveProject(p,0);console.log(p.id);
