import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {HitContext} from 'konva/lib/Context.js';
import {Shape} from 'konva/lib/Shape.js';
import {defaultStyle,clone,type Annotation,type Project} from '../src/model';
import {annotationHitWidth,drawAnnotationHit,drawAnnotation} from '../src/render';
import {legacyWorkspace,validateWorkspace} from '../src/workspace';

const project=JSON.parse(await fs.readFile('examples/example-inline.json','utf8')) as Project;
const makeLine=(type:Annotation['type']='line'):Annotation=>({id:randomUUID(),imageId:project.image.id,type,geometry:{x:40,y:100,x2:200,y2:100,width:1,height:1,unit:'image-pixel'},style:{...defaultStyle,strokeWidth:1,headSize:70,contrast:false,dash:true},visible:true,locked:false,zIndex:0,label:'',description:'',status:'user'});

// Exercise the real Konva HitContext, which overwrites manually set lineWidth.
function hitCanvas(a:Annotation,scale:number){
 const canvas=createCanvas(300,240),ctx=new HitContext({_canvas:canvas} as any);
 const shape=new Shape({stroke:'#000000',fill:'#000000',lineCap:'round',hitStrokeWidth:annotationHitWidth(a,scale)});
 ctx.scale(scale,scale);drawAnnotationHit(ctx,shape,a);
 return (x:number,y:number)=>canvas.getContext('2d').getImageData(x,y,1,1).data[3];
}
test('真实 Konva 命中画布：细线和虚线在 12%–400% 缩放下均有固定屏幕点击区域',()=>{
 for(const type of ['line','arrow'] as const)for(const scale of [.12,.17,1,4]){
  const a=makeLine(type);a.style.headSize=16/scale;a.geometry={...a.geometry,x:40/scale,y:100/scale,x2:200/scale,y2:100/scale};
  const alpha=hitCanvas(a,scale);
  assert.equal(alpha(110,106),255,`${type} at ${scale}: 6px away must hit`);
  assert.equal(alpha(110,110),0,`${type} at ${scale}: outside tolerance must miss`);
  assert.equal(alpha(35,100),255,'圆端点周围可选中');
 }
});
test('箭头头部和关联引线尖端也参与命中检测，隐藏编辑框不影响几何',()=>{
 const a=makeLine('arrow'),alpha=hitCanvas(a,1);
 assert.equal(alpha(150,115),255,'头部翼侧远离轴线仍可点击');
 a.type='callout';a.label='测试';a.geometry={...a.geometry,x:20,y:20,width:80,x2:200,y2:160};
 const callout=hitCanvas(a,1);assert.equal(callout(40,30),255);assert.ok(callout(199,159)>0);
});
test('多图片草稿包含独立图片、标注、视口和未保存状态，迁移旧草稿不会丢图',()=>{
 const first=clone(project),second=clone(project);second.id=randomUUID();second.image={...second.image,id:randomUUID()};second.annotations.forEach(a=>a.imageId=second.image.id);
 const workspace=validateWorkspace({version:1,activeId:second.id,documents:[{project:first,dirty:true,view:{x:30,y:45,scale:.17},hidden:false},{project:second,dirty:false,view:{x:-80,y:120,scale:2},hidden:true}]});
 const restored=validateWorkspace(JSON.parse(JSON.stringify(workspace)));
 assert.equal(restored.activeId,second.id);assert.equal(restored.documents[0].dirty,true);assert.equal(restored.documents[1].dirty,false);
 assert.deepEqual(restored.documents[0].view,{x:30,y:45,scale:.17});assert.equal(restored.documents[1].hidden,true);
 assert.equal(restored.documents[0].project.image.original,project.image.original);
 assert.equal(restored.documents[1].project.annotations[0].imageId,second.image.id);
 const legacy=legacyWorkspace(first);assert.equal(legacy.documents[0].project.image.original,first.image.original);assert.equal(legacy.documents[0].dirty,true);
 assert.throws(()=>validateWorkspace({...workspace,activeId:randomUUID()}));
 assert.throws(()=>validateWorkspace({...workspace,documents:[workspace.documents[0],workspace.documents[0]]}));
 assert.throws(()=>validateWorkspace({...workspace,documents:[{...workspace.documents[0],project:{...first,annotations:[{...first.annotations[0],imageId:randomUUID()}]}}]}));
 assert.deepEqual(validateWorkspace({version:1,activeId:null,documents:[]}).documents,[]);
});

test('箭头及关联引线：粗线、虚线、描边均不越过尖端，头部和线身连接',()=>{
 for(const type of ['arrow','callout'] as const)for(const contrast of [false,true])for(const dash of [false,true])for(const strokeWidth of [1,6,24,80])for(const headSize of [2,18,70]){
  const a=makeLine(type);a.geometry={...a.geometry,x:30,y:100,x2:240,y2:100,width:50};
  a.label='';a.style={...a.style,contrast,dash,strokeWidth,headSize,backgroundOpacity:0};
  if(type==='callout')a.geometry.y=100-(a.style.fontSize*1.4+16)/2;
  const canvas=createCanvas(340,220),ctx=canvas.getContext('2d');drawAnnotation(ctx,a);
  const beyond=ctx.getImageData(242,0,98,220).data;
  assert.equal(beyond.some((v,i)=>i%4===3&&v>0),false,JSON.stringify({type,contrast,dash,strokeWidth,headSize}));
  assert.ok(ctx.getImageData(238,99,2,2).data.some((v,i)=>i%4===3&&v>0),'箭头尖端仍可见');
  if(!dash&&headSize>=18){const baseX=Math.floor(240-headSize*Math.cos(.45));for(let x=baseX-2;x<238;x++)assert.ok(ctx.getImageData(x,100,1,1).data[3]>0,'线身与头部无断缝');}
 }
});

test('短箭头、各方向与缩放不产生越过尖端的线帽，绘制不污染后续上下文',()=>{
 for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.5])for(const scale of [.2,1,4])for(const length of [3,100]){
  const canvas=createCanvas(400,400),ctx=canvas.getContext('2d'),a=makeLine('arrow');
  a.style={...a.style,dash:false,contrast:true,strokeWidth:24,headSize:18};
  a.geometry={...a.geometry,x:0,y:0,x2:length,y2:0};
  ctx.translate(150,150);ctx.rotate(angle);ctx.scale(scale,scale);ctx.globalAlpha=.7;ctx.fillStyle='#123456';ctx.strokeStyle='#abcdef';ctx.setLineDash([7,3]);
  const transform=ctx.getTransform(),alpha=ctx.globalAlpha;drawAnnotation(ctx,a);
  assert.equal(ctx.globalAlpha,alpha);assert.deepEqual(ctx.getLineDash(),[7,3]);assert.deepEqual(ctx.getTransform(),transform);
  const distance=length*scale+Math.max(3,scale+2),x=Math.round(150+distance*Math.cos(angle)),y=Math.round(150+distance*Math.sin(angle));
  if(x>=0&&x<400&&y>=0&&y<400)assert.equal(ctx.getImageData(x,y,1,1).data[3],0,'尖端前方透明');
  // napi canvas caches style getters separately; verify restored paint pixels.
  ctx.resetTransform();ctx.globalAlpha=1;ctx.fillRect(0,0,2,2);
  assert.deepEqual([...ctx.getImageData(0,0,1,1).data],[18,52,86,255]);
 }
});

