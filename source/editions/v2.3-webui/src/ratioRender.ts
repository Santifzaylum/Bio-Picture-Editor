import type {Annotation,Project} from './model';
import {type Point,ratioText,ratioProjection,ratioLabelVisible,sampleRatio} from './ratio';

export function ratioLabelBounds(ctx:any,a:Annotation){
 return ratioLabels(ctx,a)[0];
}
export function ratioLabels(ctx:any,a:Annotation){
 const s=a.style;ctx.font=`${s.bold?'bold ':''}${s.fontSize}px "${s.font}"`;
 const r=a.ratio!,items=r.series?r.series.map(sample=>({x:a.geometry.x+sample.point.x-r.sample.x,y:a.geometry.y+sample.point.y-r.sample.y,text:`${sample.name}: ${a.label.trim()?a.label.trim()+' = ':''}${(sampleRatio(r,sample)*(r.display==='percent'?100:1)).toFixed(r.precision)}${r.display==='percent'?'%':''}`})):[{x:a.geometry.x,y:a.geometry.y,text:ratioText(a)}];
 return items.map(item=>({...item,width:ctx.measureText(item.text).width+16,height:s.fontSize*1.4+16}));
}
// Both visible geometry and the hit region use these exact segments.
export function ratioPaths(a:Annotation){
 const r=a.ratio!,paths:{start:Point;end:Point;reference?:boolean}[]=[];
 const tick=(point:Point,dx:number,dy:number)=>paths.push({start:{x:point.x-dy*8,y:point.y+dx*8},end:{x:point.x+dy*8,y:point.y-dx*8}});
 const segment=(start:Point,end:Point,reference=false)=>{paths.push({start,end,reference});const length=Math.hypot(end.x-start.x,end.y-start.y)||1,dx=(end.x-start.x)/length,dy=(end.y-start.y)/length;tick(start,dx,dy);tick(end,dx,dy);};
 if(r.mode==='shared'){
  segment(r.start,r.referenceEnd,true);
  if(r.series){const len=Math.hypot(r.referenceEnd.x-r.start.x,r.referenceEnd.y-r.start.y),dx=(r.referenceEnd.x-r.start.x)/len,dy=(r.referenceEnd.y-r.start.y)/len;for(const sample of r.series)tick(sample.point,dx,dy);return paths;}
  const end=ratioProjection(r),len=Math.hypot(r.referenceEnd.x-r.start.x,r.referenceEnd.y-r.start.y),offset=Math.max(18,a.style.strokeWidth*3);
  const ox=-(r.referenceEnd.y-r.start.y)/len*offset,oy=(r.referenceEnd.x-r.start.x)/len*offset;
  segment({x:r.start.x+ox,y:r.start.y+oy},{x:end.x+ox,y:end.y+oy});
  paths.push({start:r.sample,end:{x:end.x+ox,y:end.y+oy},reference:true});
 }else{segment(r.referenceStart,r.referenceEnd,true);segment(r.start,r.sample);}
 return paths;
}
export function ratioBounds(ctx:any,a:Annotation){
 const points=ratioPaths(a).flatMap(p=>[p.start,p.end]);
 if(ratioLabelVisible(a))for(const label of ratioLabels(ctx,a))points.push({x:label.x,y:label.y},{x:label.x+label.width,y:label.y+label.height});
 const pad=a.style.strokeWidth/2+(a.style.contrast?2:0);
 const x=Math.min(...points.map(p=>p.x))-pad,y=Math.min(...points.map(p=>p.y))-pad;
 return {x,y,width:Math.max(...points.map(p=>p.x))+pad-x,height:Math.max(...points.map(p=>p.y))+pad-y};
}
export function includeRatio(p:Project,a:Annotation,ctx:any){
 p.version=Math.max(3,p.version) as Project['version'];const b=ratioBounds(ctx,a);
 p.layout.left=Math.max(p.layout.left,Math.ceil(8-b.x));p.layout.top=Math.max(p.layout.top,Math.ceil(8-b.y));
 p.layout.right=Math.max(p.layout.right,Math.ceil(b.x+b.width+8-p.image.width));p.layout.bottom=Math.max(p.layout.bottom,Math.ceil(b.y+b.height+8-p.image.height));
}
export function drawRatio(ctx:any,a:Annotation){
 const s=a.style;ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 for(const path of ratioPaths(a)){
  ctx.setLineDash(path.reference||s.dash?[s.strokeWidth*3,s.strokeWidth*2]:[]);
  ctx.beginPath();ctx.moveTo(path.start.x,path.start.y);ctx.lineTo(path.end.x,path.end.y);
  if(s.contrast){ctx.strokeStyle=s.color==='#ffffff'?'#111111':'#ffffff';ctx.lineWidth=s.strokeWidth+4;ctx.stroke();}
  ctx.strokeStyle=s.color;ctx.lineWidth=s.strokeWidth;ctx.stroke();
 }
 if(!ratioLabelVisible(a)){ctx.restore();return;}
 ctx.setLineDash([]);for(const b of ratioLabels(ctx,a)){
 ctx.globalAlpha=s.backgroundOpacity;ctx.fillStyle=s.background;ctx.fillRect(b.x,b.y,b.width,b.height);ctx.globalAlpha=1;
 ctx.textAlign=s.align;ctx.textBaseline='top';const x=s.align==='left'?b.x+8:s.align==='center'?b.x+b.width/2:b.x+b.width-8,y=b.y+8;
 if(s.textOutline){ctx.strokeStyle=s.color==='#ffffff'?'#111111':'#ffffff';ctx.lineWidth=3;ctx.strokeText(b.text,x,y);}
 ctx.fillStyle=s.color;ctx.fillText(b.text,x,y);}ctx.restore();
}
