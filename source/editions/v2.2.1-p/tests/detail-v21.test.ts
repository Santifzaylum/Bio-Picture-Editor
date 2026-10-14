import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createCanvas} from '@napi-rs/canvas';
import {HitContext} from 'konva/lib/Context.js';
import {Shape} from 'konva/lib/Shape.js';
import {clone,defaultStyle,makeDetail,includeDetail,moveDetail,resizeDetail,detailStroke,validate,patchAnnotation,type Annotation} from '../src/model';
import {drawDetailHit,detailHitWidth,detailConnector} from '../src/render';
process.env.BIO_DATA_DIR='tests/detail-v21-storage';
const {packageProject,unpackProject}=await import('../server/storage');
const {exportPng}=await import('../server/export');
const base=JSON.parse(await fs.readFile('examples/example-inline.json','utf8'));
function fixture(){
 const p=clone(base);p.id=randomUUID();p.annotations=[];p.layout={left:0,right:0,top:0,bottom:0,background:'#ffffff'};
 const a:Annotation={id:randomUUID(),type:'magnifier',imageId:p.image.id,geometry:{x:0,y:0,x2:0,y2:0,width:1,height:1,unit:'image-pixel'},style:{...defaultStyle,contrast:false,strokeWidth:2},label:'',description:'',visible:true,locked:false,zIndex:0,status:'user'};
 makeDetail(p,a,300,300,40);p.annotations.push(a);includeDetail(p,a);return {p,a};
}
test('初始放大圆邻近取样，连接线长度为 32 px；近边缘优先放在原图内',()=>{
 const {p,a}=fixture(),line=detailConnector(a)!;
 assert.equal(Math.hypot(line.x2-line.x,line.y2-line.y),32);
 assert.deepEqual(p.layout,{left:0,right:0,top:0,bottom:0,background:'#ffffff'});
 makeDetail(p,a,p.image.width-60,300,40);assert.ok(a.geometry.x>=0&&a.geometry.x+a.geometry.width<=p.image.width);
});
test('放大圆移出四个方向时留白均覆盖完整圆和描边，移动回来保留已有版面',()=>{
 for(const [x,y,key] of [[-120,200,'left'],[300,-120,'top'],[base.image.width,200,'right'],[300,base.image.height,'bottom']] as const){
  const {p,a}=fixture();a.geometry.x=x;a.geometry.y=y;includeDetail(p,a);assert.ok(p.layout[key]>0);
  assert.ok(a.geometry.x+p.layout.left>=17&&a.geometry.y+p.layout.top>=17);
  assert.ok(a.geometry.x+a.geometry.width+17<=p.image.width+p.layout.right);
  assert.ok(a.geometry.y+a.geometry.height+17<=p.image.height+p.layout.bottom);
  const before=clone(p.layout);a.geometry.x=400;a.geometry.y=300;includeDetail(p,a);assert.deepEqual(p.layout,before);
 }
});
test('取样区、展示圆及整组移动彼此明确，取样移动在边缘被约束而不旋转连线',()=>{
 const {p,a}=fixture(),g=clone(a.geometry),d=clone(a.detail!);
 moveDetail(p,a,20,10,'source');assert.deepEqual(a.geometry,g);assert.equal(a.detail!.sourceX,d.sourceX+20);
 const sample=clone(a.detail!);moveDetail(p,a,20,10,'inset');assert.deepEqual(a.detail,sample);
 const before=clone(a);moveDetail(p,a,-10000,0,'connector');assert.equal(a.detail!.sourceX,a.detail!.sourceRadius);
 assert.equal(a.geometry.x-before.geometry.x,a.detail!.sourceX-before.detail!.sourceX);
 assert.equal(a.geometry.y,before.geometry.y);validate(p);
});
test('取样圆内部任意位置命中，连接线只命中圆外可见部分',()=>{
 const {a}=fixture();
 const hit=(part:'source'|'connector'|'inset',x:number,y:number)=>{
  const canvas=createCanvas(1200,800),ctx=new HitContext({_canvas:canvas} as any),shape=new Shape({stroke:'#000',fill:'#000',hitStrokeWidth:detailHitWidth(a,part,1)});
  drawDetailHit(ctx,shape,a,part);return canvas.getContext('2d').getImageData(x,y,1,1).data[3];
 };
 assert.equal(hit('source',315,310),255);assert.equal(hit('connector',315,310),0);
 const line=detailConnector(a)!;assert.equal(hit('connector',(line.x+line.x2)/2,(line.y+line.y2)/2),255);
});
test('旧 v2 线条沿用统一样式；三个部位的新样式经便携包与倍率修改后独立保留',async()=>{
 const {p,a}=fixture();assert.deepEqual(detailStroke(a,'source'),detailStroke(a,'inset'));
 a.detail!.styles={source:{color:'#ff8800',strokeWidth:6,dash:false,contrast:false},connector:{color:'#00ff00',strokeWidth:4,dash:true,contrast:false},inset:{color:'#0000ff',strokeWidth:10,dash:false,contrast:true}};
 const styles=clone(a.detail!.styles);resizeDetail(a,40,3);assert.deepEqual(a.detail!.styles,styles);
 includeDetail(p,a);assert.deepEqual((await unpackProject(packageProject(p))).annotations[0].detail!.styles,styles);
 patchAnnotation(p,a.id,{detail:{magnification:2.5}});assert.deepEqual(a.detail!.styles,styles);
 const bad=clone(p);bad.annotations[0].detail!.styles!.source.strokeWidth=0;assert.throws(()=>validate(bad));
});
test('PNG 中取样圆、连接线、放大圆按各自颜色与线宽渲染',async()=>{
 const {p,a}=fixture();a.geometry.x=500;a.geometry.y=220;
 a.detail!.styles={source:{color:'#ff8800',strokeWidth:6,dash:false,contrast:false},connector:{color:'#00ff00',strokeWidth:4,dash:false,contrast:false},inset:{color:'#0000ff',strokeWidth:10,dash:false,contrast:false}};
 includeDetail(p,a);const png=await exportPng(p);
 const at=async(x:number,y:number)=>[...await sharp(png).removeAlpha().extract({left:x+p.layout.left,top:y+p.layout.top,width:1,height:1}).raw().toBuffer()];
 assert.deepEqual(await at(300,260),[255,136,0]);assert.deepEqual(await at(420,300),[0,255,0]);assert.deepEqual(await at(660,300),[0,0,255]);
});
