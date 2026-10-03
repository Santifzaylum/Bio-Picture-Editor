import {type Annotation,type Project,outputSize} from './model';
import type {Context} from 'konva/lib/Context';
import type {Shape} from 'konva/lib/Shape';

// Konva's strokeShape replaces context.lineWidth: configure hitStrokeWidth on the
// Shape itself. Keep this tolerance constant in screen pixels at every zoom.
export function annotationHitWidth(a:Annotation,scale:number){return Math.max(a.style.strokeWidth+(a.style.contrast?4:0),16/scale);}
function arrowHead(ctx:any,x:number,y:number,x2:number,y2:number,size:number){
 const angle=Math.atan2(y2-y,x2-x);ctx.beginPath();ctx.moveTo(x2,y2);
 ctx.lineTo(x2-size*Math.cos(angle-0.45),y2-size*Math.sin(angle-0.45));
 ctx.lineTo(x2-size*Math.cos(angle+0.45),y2-size*Math.sin(angle+0.45));ctx.closePath();
}
export function drawAnnotationHit(ctx:Context,shape:Shape,a:Annotation){
 const g=a.geometry,b=bounds(ctx._context,a);
 ctx.beginPath();
 if(a.type==='arrow'||a.type==='line'){
  ctx.moveTo(g.x,g.y);ctx.lineTo(g.x2,g.y2);ctx.strokeShape(shape);
  if(a.type==='arrow'){arrowHead(ctx,g.x,g.y,g.x2,g.y2,a.style.headSize);ctx.fillShape(shape);}
 }else{
  ctx.rect(b.x,b.y,b.width,b.height);ctx.fillShape(shape);
  if(a.type==='callout'){
   ctx.beginPath();ctx.moveTo(b.x+b.width/2,b.y+b.height/2);ctx.lineTo(g.x2,g.y2);ctx.strokeShape(shape);
   arrowHead(ctx,b.x+b.width/2,b.y+b.height/2,g.x2,g.y2,a.style.headSize);ctx.fillShape(shape);
  }
 }
}
// Canvas 2D primitives are shared by Konva, browser PNG, and CLI/server PNG.
export function textLines(ctx:any,a:Annotation){const {style:s,geometry:g}=a;ctx.font=`${s.bold?'bold ':''}${s.fontSize}px "${s.font}"`;const lines:string[]=[];for(const paragraph of a.label.split('\n')){let line='';for(const char of Array.from(paragraph)){if(line&&ctx.measureText(line+char).width>g.width-16){lines.push(line);line=char;}else line+=char;}lines.push(line);}return lines;}
export function bounds(ctx:any,a:Annotation){const g=a.geometry;if(a.type==='text'||a.type==='callout')return {x:g.x,y:g.y,width:g.width,height:Math.max(a.style.fontSize*1.4, textLines(ctx,a).length*a.style.fontSize*1.4)+16};if(a.type==='line'||a.type==='arrow')return {x:Math.min(g.x,g.x2),y:Math.min(g.y,g.y2),width:Math.max(1,Math.abs(g.x2-g.x)),height:Math.max(1,Math.abs(g.y2-g.y))};return {x:g.x,y:g.y,width:g.width,height:g.height};}
function segment(ctx:any,x:number,y:number,x2:number,y2:number,a:Annotation,arrow:boolean){const s=a.style;const path=()=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);};ctx.setLineDash(s.dash?[s.strokeWidth*3,s.strokeWidth*2]:[]);if(s.contrast){path();ctx.lineWidth=s.strokeWidth+4;ctx.strokeStyle=s.color==='#ffffff'?'#111111':'#ffffff';ctx.stroke();}path();ctx.lineWidth=s.strokeWidth;ctx.strokeStyle=s.color;ctx.stroke();ctx.setLineDash([]);if(arrow){const angle=Math.atan2(y2-y,x2-x);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-s.headSize*Math.cos(angle-0.45),y2-s.headSize*Math.sin(angle-0.45));ctx.lineTo(x2-s.headSize*Math.cos(angle+0.45),y2-s.headSize*Math.sin(angle+0.45));ctx.closePath();ctx.fillStyle=s.color;ctx.fill();if(s.contrast){ctx.lineWidth=1.5;ctx.strokeStyle=s.color==='#ffffff'?'#111111':'#ffffff';ctx.stroke();}}}
export function drawAnnotation(ctx:any,a:Annotation){const g=a.geometry,s=a.style;ctx.save();ctx.lineJoin='round';ctx.lineCap='round';if(a.type==='arrow'||a.type==='line')segment(ctx,g.x,g.y,g.x2,g.y2,a,a.type==='arrow');else if(a.type==='text'||a.type==='callout'){const b=bounds(ctx,a);if(a.type==='callout'){const cx=b.x+b.width/2,cy=b.y+b.height/2;const dx=g.x2-cx,dy=g.y2-cy,t=1/Math.max(Math.abs(dx)/(b.width/2),Math.abs(dy)/(b.height/2),1);segment(ctx,cx+dx*t,cy+dy*t,g.x2,g.y2,a,true);}const lines=textLines(ctx,a);ctx.globalAlpha=s.backgroundOpacity;ctx.fillStyle=s.background;ctx.fillRect(b.x,b.y,b.width,b.height);ctx.globalAlpha=1;ctx.font=`${s.bold?'bold ':''}${s.fontSize}px "${s.font}"`;ctx.textBaseline='top';ctx.textAlign=s.align;const tx=s.align==='left'?b.x+8:s.align==='center'?b.x+b.width/2:b.x+b.width-8;lines.forEach((line,i)=>{const y=b.y+8+i*s.fontSize*1.4;if(s.textOutline){ctx.strokeStyle=s.color==='#ffffff'?'#111111':'#ffffff';ctx.lineWidth=3;ctx.strokeText(line,tx,y);}ctx.fillStyle=s.color;ctx.fillText(line,tx,y);});}else {const path=()=>{ctx.beginPath();if(a.type==='ellipse')ctx.ellipse(g.x+g.width/2,g.y+g.height/2,g.width/2,g.height/2,0,0,Math.PI*2);else ctx.rect(g.x,g.y,g.width,g.height);};path();ctx.globalAlpha=s.fillOpacity;ctx.fillStyle=s.fill;ctx.fill();ctx.globalAlpha=1;ctx.setLineDash(s.dash?[s.strokeWidth*3,s.strokeWidth*2]:[]);if(s.contrast){path();ctx.lineWidth=s.strokeWidth+4;ctx.strokeStyle=s.color==='#ffffff'?'#111111':'#ffffff';ctx.stroke();}path();ctx.lineWidth=s.strokeWidth;ctx.strokeStyle=s.color;ctx.stroke();}ctx.restore();}
export function renderProject(ctx:any,p:Project,img:any,scale=1){const size=outputSize(p,scale);ctx.save();ctx.scale(scale,scale);ctx.fillStyle=p.layout.background;ctx.fillRect(0,0,size.width/scale,size.height/scale);ctx.translate(p.layout.left,p.layout.top);ctx.drawImage(img,0,0,p.image.width,p.image.height);[...p.annotations].sort((a,b)=>a.zIndex-b.zIndex).forEach(a=>{if(a.visible)drawAnnotation(ctx,a);});ctx.restore();return size;}
