import {z} from 'zod';
import type {Annotation,Project} from './model';

const coordinate=z.number().finite().min(-100000).max(100000);
export const PointSchema=z.object({x:coordinate,y:coordinate}).strict();
export type Point=z.infer<typeof PointSchema>;
export const RatioSampleSchema=z.object({id:z.string().uuid(),name:z.string().max(80),point:PointSchema,molecularWeight:z.number().finite().positive().max(1000000).optional()}).strict();
export type RatioSample=z.infer<typeof RatioSampleSchema>;
export const RatioSchema=z.object({
 mode:z.enum(['shared','independent']),
 start:PointSchema,sample:PointSchema,referenceStart:PointSchema,referenceEnd:PointSchema,
 display:z.enum(['ratio','percent']),precision:z.number().int().min(0).max(6),showLabel:z.boolean().optional(),series:z.array(RatioSampleSchema).min(1).max(200).optional()
}).strict();
export type Ratio=z.infer<typeof RatioSchema>;
export const ratioModeNames={shared:'同起点',independent:'不同起点'};
export const ratioSteps={shared:['共同起点','待测位置','参考位置'],independent:['待测起点','待测终点','参考起点','参考终点']};
// Older v2.2 projects did not have this property and keep their visible labels.
export function ratioLabelVisible(a:Annotation){return a.ratio?.showLabel!==false;}
export function ratioSamples(r:Ratio):RatioSample[]{return r.series||[{id:'single',name:'样品 1',point:r.sample}];}
export function sampleRatio(r:Ratio,sample:RatioSample){return ratioValue({...r,sample:sample.point});}
export function enableRatioSeries(a:Annotation,id:string){
 const r=a.ratio!;if(r.mode!=='shared')throw Error('连续测量需要同起点模式');
 if(!r.series){r.series=[{id,name:'样品 1',point:{...r.sample}}];a.geometry.x=r.sample.x+24;a.geometry.y=r.sample.y+16;}
}
export function addRatioSample(a:Annotation,id:string,point:Point){
 const r=a.ratio!;if(!r.series||r.mode!=='shared')throw Error('请先开始同起点连续测量');
 if(r.series.length>=200)throw Error('同组最多测量 200 个样品');
 r.series.push({id,name:'样品 '+(r.series.length+1),point:{...point}});
}
export function editRatioSample(a:Annotation,id:string,point:Point){
 const r=a.ratio!,sample=r.series?.find(s=>s.id===id);if(!sample)throw Error('测量点不存在');sample.point={...point};r.sample={...r.series![0].point};
}
export function removeRatioSample(a:Annotation,id:string){
 const r=a.ratio!;if(!r.series||r.series.length<=1)throw Error('请至少保留一个样品；整组可用删除按钮移除');
 const old={...r.sample};r.series=r.series.filter(s=>s.id!==id);r.sample={...r.series[0].point};
 a.geometry.x+=r.sample.x-old.x;a.geometry.y+=r.sample.y-old.y;
}

// A shared baseline measures displacement along the reference migration axis.
// Lateral band positions must not increase the migration ratio.
export function ratioValue(r:Ratio){
 const origin=r.mode==='shared'?r.start:r.referenceStart;
 const dx=r.referenceEnd.x-origin.x,dy=r.referenceEnd.y-origin.y,lengthSquared=dx*dx+dy*dy;
 if(lengthSquared<1)throw Error('参考线段至少需要 1 个原图像素，请重新设置参考位置');
 return r.mode==='shared'?((r.sample.x-r.start.x)*dx+(r.sample.y-r.start.y)*dy)/lengthSquared:
  Math.hypot(r.sample.x-r.start.x,r.sample.y-r.start.y)/Math.sqrt(lengthSquared);
}
export function ratioText(a:Annotation){
 const r=a.ratio!;let value=ratioValue(r)*(r.display==='percent'?100:1);
 if(Math.abs(value)<0.5*10**(-r.precision))value=0;
 return `${a.label.trim()?a.label.trim()+' = ':''}${value.toFixed(r.precision)}${r.display==='percent'?'%':''}`;
}
export function ratioProjection(r:Ratio):Point{
 const value=ratioValue(r);
 return {x:r.start.x+(r.referenceEnd.x-r.start.x)*value,y:r.start.y+(r.referenceEnd.y-r.start.y)*value};
}
export function ratioSegments(r:Ratio){
 if(r.mode==='shared')return [{start:r.start,end:r.referenceEnd},{start:r.start,end:ratioProjection(r)}];
 return [{start:r.referenceStart,end:r.referenceEnd},{start:r.start,end:r.sample}];
}
export function makeRatio(a:Annotation,mode:Ratio['mode'],points:Point[],display:Ratio['display']='ratio'){
 const [start,sample]=points,referenceStart=mode==='shared'?start:points[2],referenceEnd=mode==='shared'?points[2]:points[3];
 a.type='ratio';a.label='R';
 a.ratio={mode,start:{...start},sample:{...sample},referenceStart:{...referenceStart},referenceEnd:{...referenceEnd},display,precision:3,showLabel:true};
 ratioValue(a.ratio);
 a.geometry={...a.geometry,x:referenceEnd.x+24,y:referenceEnd.y+16,width:Math.max(120,a.style.fontSize*8),height:Math.ceil(a.style.fontSize*1.4+16)};
 return a;
}
export function validateRatio(p:Project,a:Annotation){
 const r=a.ratio!;ratioValue(r);
 if(r.mode==='shared'&&(r.referenceStart.x!==r.start.x||r.referenceStart.y!==r.start.y))throw Error('同起点测量的两条路径必须共用起点');
 if(r.series){if(r.mode!=='shared')throw Error('连续测量只适用于同起点模式');if(new Set(r.series.map(s=>s.id)).size!==r.series.length)throw Error('样品 ID 重复');if(r.series[0].point.x!==r.sample.x||r.series[0].point.y!==r.sample.y)throw Error('首个样品位置与测量点不一致');}
 for(const point of [r.start,r.sample,r.referenceStart,r.referenceEnd,...(r.series||[]).map(s=>s.point)])
  if(point.x<0||point.y<0||point.x>p.image.width||point.y>p.image.height)throw Error('比例测量的位置须在原图范围内');
}
export function editRatioPoint(a:Annotation,key:'start'|'sample'|'referenceStart'|'referenceEnd',point:Point){
 const r=a.ratio!;r[key]={...point};if(key==='sample'&&r.series)r.series[0].point={...point};if(r.mode==='shared')r.referenceStart={...r.start};
}
export function setRatioMode(a:Annotation,mode:Ratio['mode']){
 const r=a.ratio!;
 if(mode===r.mode)return;
 if(r.series&&mode==='independent')throw Error('连续测量组共用参考轴，请新建不同起点测量');
 if(mode==='independent')r.sample=ratioProjection(r);
 r.mode=mode;r.referenceStart={...r.start};
}
