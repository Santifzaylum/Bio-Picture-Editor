import type {Annotation,Project} from './model';
import {measurements,measurementText} from './measurement';

export function measurementLabels(ctx:any,p:Project,a:Annotation){
 const m=a.measurement!,s=a.style;ctx.font=`${s.bold?'bold ':''}${s.fontSize}px "${s.font}"`;
 const labels:{x:number;y:number;text:string;width:number;height:number}[]=[];
 const add=(x:number,y:number,text:string,fontSize=s.fontSize)=>{ctx.font=`${s.bold?'bold ':''}${fontSize}px "${s.font}"`;labels.push({x,y,text,width:ctx.measureText(text).width+16,height:fontSize*1.4+16});};
 if(m.showNumber)add(m.end.x+8,m.end.y-24,String(measurements(p).findIndex(v=>v.id===a.id)+1),Math.min(18,s.fontSize));
 if(m.labelMode!=='none')add(a.geometry.x,a.geometry.y,measurementText(p,a));
 return labels;
}
export function measurementBounds(ctx:any,p:Project,a:Annotation){
 const m=a.measurement!,labels=measurementLabels(ctx,p,a),pad=a.style.strokeWidth/2+8;
 const xs=[m.start.x,m.end.x,...labels.flatMap(l=>[l.x,l.x+l.width])],ys=[m.start.y,m.end.y,...labels.flatMap(l=>[l.y,l.y+l.height])];
 const x=Math.min(...xs)-pad,y=Math.min(...ys)-pad;return {x,y,width:Math.max(1,Math.max(...xs)+pad-x),height:Math.max(1,Math.max(...ys)+pad-y)};
}
export function includeMeasurement(p:Project,a:Annotation,ctx:any){
 p.version=4;const b=measurementBounds(ctx,p,a);
 p.layout.left=Math.max(p.layout.left,Math.ceil(8-b.x));p.layout.top=Math.max(p.layout.top,Math.ceil(8-b.y));
 p.layout.right=Math.max(p.layout.right,Math.ceil(b.x+b.width+8-p.image.width));p.layout.bottom=Math.max(p.layout.bottom,Math.ceil(b.y+b.height+8-p.image.height));
}
export function drawMeasurement(ctx:any,p:Project,a:Annotation){
 const m=a.measurement!,s=a.style;ctx.save();ctx.lineCap='round';
 if(m.showLine){const dx=m.end.x-m.start.x,dy=m.end.y-m.start.y,n=Math.hypot(dx,dy)||1;
  ctx.beginPath();ctx.moveTo(m.start.x,m.start.y);ctx.lineTo(m.end.x,m.end.y);
  for(const q of [m.start,m.end]){ctx.moveTo(q.x-dy/n*7,q.y+dx/n*7);ctx.lineTo(q.x+dy/n*7,q.y-dx/n*7);}
  ctx.setLineDash(s.dash?[s.strokeWidth*3,s.strokeWidth*2]:[]);
  if(s.contrast){ctx.strokeStyle=s.color==='#ffffff'?'#111111':'#ffffff';ctx.lineWidth=s.strokeWidth+4;ctx.stroke();}
  ctx.strokeStyle=s.color;ctx.lineWidth=s.strokeWidth;ctx.stroke();
 }
 ctx.setLineDash([]);for(const [i,l] of measurementLabels(ctx,p,a).entries()){
  const fontSize=m.showNumber&&i===0?Math.min(18,s.fontSize):s.fontSize;
  ctx.globalAlpha=s.backgroundOpacity;ctx.fillStyle=s.background;ctx.fillRect(l.x,l.y,l.width,l.height);ctx.globalAlpha=1;
  ctx.font=`${s.bold?'bold ':''}${fontSize}px "${s.font}"`;ctx.textBaseline='top';ctx.textAlign=s.align;
  const x=s.align==='center'?l.x+l.width/2:s.align==='right'?l.x+l.width-8:l.x+8;
  if(s.textOutline){ctx.strokeStyle=s.color==='#ffffff'?'#111111':'#ffffff';ctx.lineWidth=3;ctx.strokeText(l.text,x,l.y+8);}
  ctx.fillStyle=s.color;ctx.fillText(l.text,x,l.y+8);
 }ctx.restore();
}
