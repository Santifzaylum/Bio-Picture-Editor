import {z} from 'zod';
import {PointSchema,ratioSamples,sampleRatio} from './ratio';
import type {Point} from './ratio';
import type {Annotation,Project} from './model';

export const MeasurementSchema=z.object({
 start:PointSchema,end:PointSchema,method:z.enum(['straight','projection']),
 referenceId:z.string().uuid().optional(),axisId:z.string().uuid().optional(),
 group:z.string().max(80),originId:z.string().uuid().optional(),
 labelMode:z.enum(['none','name','length','ratio','percent','both']),precision:z.number().int().min(0).max(6),
 showLine:z.boolean(),showNumber:z.boolean(),ratioName:z.string().max(30),
 metadata:z.object({molecularWeight:z.number().positive().finite().optional()}).optional()
}).strict();
export type Measurement=z.infer<typeof MeasurementSchema>;
export const measurements=(p:Project)=>p.annotations.filter(a=>a.measurement);
export const methodNames={straight:'两点直线长度',projection:'沿指定方向的距离'};
export function geometryLength(a:Annotation){const m=a.measurement!;return Math.hypot(m.end.x-m.start.x,m.end.y-m.start.y);}
export function measuredPixels(p:Project,a:Annotation):number|undefined{
 const m=a.measurement!;if(m.method==='straight')return geometryLength(a);
 const axis=p.annotations.find(v=>v.id===m.axisId&&v.measurement)?.measurement;
 if(!axis)return;
 const dx=axis.end.x-axis.start.x,dy=axis.end.y-axis.start.y,n=Math.hypot(dx,dy);
 if(n<1e-9)return;
 return ((m.end.x-m.start.x)*dx+(m.end.y-m.start.y)*dy)/n;
}
export function calibrationState(p:Project){
 const c=p.calibration;if(!c)return {factor:1,unit:'px',status:'未标定'};
 const a=c.referenceId?p.annotations.find(v=>v.id===c.referenceId&&v.measurement):undefined;
 const pixels=c.referenceId?(a?geometryLength(a):undefined):c.pixels;
 if(pixels===undefined||pixels<1e-9)return {factor:1,unit:'px',status:'标定参考已缺失或长度为零'};
 return {factor:c.realLength/pixels,unit:c.unit,status:'已标定'};
}
export function measurementResult(p:Project,a:Annotation){
 const m=a.measurement!,pixels=measuredPixels(p,a),calibration=calibrationState(p);
 const reference=m.referenceId?p.annotations.find(v=>v.id===m.referenceId&&v.measurement):undefined;
 const denominator=reference?measuredPixels(p,reference):undefined;
 let status=pixels===undefined?'方向参考已缺失或无效':'';
 if(m.referenceId&&!reference)status='比例参考已缺失';
 else if(m.referenceId&&(denominator===undefined||Math.abs(denominator)<1e-9))status='比例参考无效或长度为零';
 const ratio=pixels!==undefined&&denominator!==undefined&&Math.abs(denominator)>=1e-9?pixels/denominator:undefined;
 return {pixels,length:pixels===undefined?undefined:pixels*calibration.factor,unit:calibration.unit,ratio,reference,status,calibration};
}
const rounded=(v:number,n:number)=>Math.abs(v)<.5*10**(-n)?(0).toFixed(n):v.toFixed(n);
export function measurementText(p:Project,a:Annotation){
 const m=a.measurement!,r=measurementResult(p,a),name=a.label||'未命名测量';
 const length=r.length===undefined?'方向参考无效':rounded(r.length,m.precision)+' '+r.unit;
 const ratio=r.ratio===undefined?(r.status||'未指定比例参考'):(m.ratioName?m.ratioName+' = ':'')+rounded(r.ratio,m.precision);
 if(m.labelMode==='none')return '';
 if(m.labelMode==='name')return name;
 if(m.labelMode==='length')return length;
 if(m.labelMode==='ratio')return ratio;
 if(m.labelMode==='percent')return r.ratio===undefined?(r.status||'未指定比例参考'):rounded(r.ratio*100,m.precision)+'%';
 return length+' · '+ratio;
}
export function makeMeasurement(a:Annotation,start:Point,end:Point,options:Partial<Measurement>={}){
 a.type='ratio';delete a.ratio;
 a.measurement={start:{...start},end:{...end},method:'straight',group:'',labelMode:'length',precision:3,showLine:true,showNumber:true,ratioName:'',...options};
 a.geometry.x=end.x+16;a.geometry.y=end.y+16;return a;
}
export function editMeasurementPoint(p:Project,a:Annotation,key:'start'|'end',point:Point,shared=false){
 const m=a.measurement!;
 if(key==='start'&&shared&&m.originId){const linked=measurements(p).filter(v=>v.measurement!.originId===m.originId);if(linked.some(v=>v.locked))throw Error('共同起点中有锁定的测量，请先解锁');for(const v of linked)v.measurement!.start={...point};}
 else {m[key]={...point};if(key==='start')delete m.originId;}
}
export function setReference(p:Project,ids:string[],referenceId:string|undefined){
 if(referenceId&&!measurements(p).some(a=>a.id===referenceId))throw Error('比例参考不存在');
 for(const a of measurements(p))if(ids.includes(a.id)&&!a.locked){if(a.id===referenceId)delete a.measurement!.referenceId;else a.measurement!.referenceId=referenceId;}
}
export function validateMeasurement(p:Project,a:Annotation){
 const m=a.measurement!;
 if(p.version!==4||a.type!=='ratio'||a.ratio||a.detail)throw Error('长度测量需要 v4 项目');
 for(const point of [m.start,m.end])if(point.x<0||point.y<0||point.x>p.image.width||point.y>p.image.height)throw Error('测量端点须在原图范围内');
 if(m.referenceId===a.id||m.axisId===a.id)throw Error('测量不能引用自身');
 if(m.method==='projection'&&!m.axisId)throw Error('投影测量需要指定方向参考');
}
export function measurementRows(p:Project){
 const rows=measurements(p).map((a,index)=>{const m=a.measurement!,r=measurementResult(p,a);return {id:a.id,name:a.label,number:index+1,group:m.group,method:methodNames[m.method],start:m.start,end:m.end,pixels:r.pixels,length:r.length,unit:r.unit,referenceId:m.referenceId||'',reference:r.reference?.label||'',axisId:m.axisId||'',ratio:r.ratio,percent:r.ratio===undefined?undefined:r.ratio*100,status:r.status,calibration:r.calibration.status};});
 // Older objects retain their original projection formula and full precision.
 for(const a of p.annotations.filter(a=>a.ratio))for(const sample of ratioSamples(a.ratio!)){const r=a.ratio!,value=sampleRatio(r,sample);rows.push({id:a.id+(sample.id==='single'?'':':'+sample.id),name:sample.name,number:rows.length+1,group:'旧版比例测量',method:r.mode==='shared'?'旧版沿轴距离':'旧版直线长度',start:r.start,end:sample.point,pixels:undefined,length:undefined,unit:'px',referenceId:'',reference:'旧版内置参考',axisId:'',ratio:value,percent:value*100,status:'旧版对象：可选中编辑或转换',calibration:''});}
 return rows;
}
const csvCell=(v:unknown)=>{let s=v===undefined?'':String(v);if(typeof v==='string'&&/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
export function measurementData(p:Project,ids?:string[],tsv=false){
 const rows=measurementRows(p).filter(r=>!ids||ids.includes(r.id)||ids.includes(r.id.split(':')[0]));
 const header=['编号','测量ID','名称','分组','测量方式','起点X_px','起点Y_px','终点X_px','终点Y_px','像素长度','长度','单位','比例参考ID','比例参考','方向参考ID','比值','百分比','状态','标定状态'];
 const values=rows.map(r=>[r.number,r.id,r.name,r.group,r.method,r.start.x,r.start.y,r.end.x,r.end.y,r.pixels,r.length,r.unit,r.referenceId,r.reference,r.axisId,r.ratio,r.percent,r.status,r.calibration]);
 return (tsv?'':'\uFEFF')+[header,...values].map(row=>row.map(v=>tsv?csvCell(v).slice(1,-1).replaceAll('""','"').replace(/[\t\r\n]/g,' '):csvCell(v)).join(tsv?'\t':',')).join(tsv?'\n':'\r\n');
}
export function convertLegacyMeasurements(p:Project,id?:string){
 const old=p.annotations.filter(a=>a.ratio&&(!id||a.id===id));if(old.some(a=>a.locked))throw Error('请先解锁要转换的旧版对象');
 for(const a of old){
  const r=a.ratio!,group='旧版 '+a.id.slice(0,8),originId=r.mode==='shared'?crypto.randomUUID():undefined;
  const ref=structuredClone(a);ref.id=crypto.randomUUID();ref.label=group+' 参考';makeMeasurement(ref,r.mode==='shared'?r.start:r.referenceStart,r.referenceEnd,{group,labelMode:'name'});
  const items=ratioSamples(r).map((sample,i)=>{const item=structuredClone(a);if(i)item.id=crypto.randomUUID();item.label=r.series?sample.name:(a.label||'旧版测量');makeMeasurement(item,r.start,sample.point,{group,originId,method:r.mode==='shared'?'projection':'straight',axisId:r.mode==='shared'?ref.id:undefined,referenceId:ref.id,labelMode:r.showLabel===false?'none':r.display==='percent'?'percent':'ratio',precision:r.precision,ratioName:a.label,metadata:sample.molecularWeight?{molecularWeight:sample.molecularWeight}:undefined});return item;});
  const index=p.annotations.findIndex(v=>v.id===a.id);p.annotations.splice(index,1,ref,...items);
 }
 if(old.length)p.version=4;p.annotations.forEach((a,i)=>a.zIndex=i);
}
