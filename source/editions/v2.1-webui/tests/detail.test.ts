import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
import {HitContext} from 'konva/lib/Context.js';
import {Shape} from 'konva/lib/Shape.js';
import {clone,validate,defaultStyle,makeDetail,includeDetail,resizeDetail,move,patchAnnotation,outputSize,type Annotation} from '../src/model';
import {drawAnnotationHit,annotationHitWidth} from '../src/render';
import {validateWorkspace} from '../src/workspace';
process.env.BIO_DATA_DIR='tests/detail-storage';
const {importImage,newProject,saveProject,readProject,packageProject,unpackProject}=await import('../server/storage');
const {exportPng}=await import('../server/export');
const sharp=(await import('sharp')).default;
const imageCanvas=createCanvas(300,200),c=imageCanvas.getContext('2d');
c.fillStyle='#223344';c.fillRect(0,0,300,200);
c.fillStyle='#ff0000';c.fillRect(70,70,40,40);
c.fillStyle='#00ff00';c.fillRect(85,85,10,10);
const base=newProject(await importImage(await imageCanvas.encode('png'),'人工像素测试.png'));
function fixture(){
 const p=clone(base);p.id=randomUUID();
 const a:Annotation={id:randomUUID(),type:'magnifier',imageId:p.image.id,geometry:{x:0,y:0,x2:0,y2:0,width:1,height:1,unit:'image-pixel'},style:{...defaultStyle,contrast:false,strokeWidth:2},label:'',description:'测试',visible:true,locked:false,zIndex:0,status:'user'};
 makeDetail(p,a,90,90,20);p.annotations.push(a);includeDetail(p,a);return {p,a};
}
test('旧 v1 项目及多图片草稿可读，新放大标注使用 v2 格式',()=>{
 assert.equal(validate(base).version,1);
 const {p}=fixture();assert.equal(validate(p).version,2);
 assert.equal(validateWorkspace({version:1,activeId:base.id,documents:[{project:base,dirty:false},{project:p,dirty:true}]}).documents.length,2);
 assert.throws(()=>validate({...p,version:1}),/需要 v2/);
});
test('放大取样范围、倍率与输出尺寸拒绝越界或不一致，边缘绘制会缩小半径',()=>{
 const {p,a}=fixture();const original=clone(p);
 a.detail!.sourceX=5;assert.throws(()=>validate(p),/原图内/);
 const restored=clone(original);restored.annotations[0].geometry.width++;assert.throws(()=>validate(restored),/不一致/);
 assert.throws(()=>resizeDetail(original.annotations[0],20,10));
 makeDetail(p,a,5,5,30);assert.equal(a.detail!.sourceRadius,5);
 const huge=clone(original);huge.image={...huge.image,width:16380};const outside=clone(a);outside.geometry.x=16380;assert.throws(()=>includeDetail(huge,outside),/输出超过限制/);
});
test('移动放大圆保留取样位置，整组移动及调整倍率具有明确几何',()=>{
 const {a}=fixture();const d={...a.detail!};move(a,10,15);assert.deepEqual(a.detail,d);
 move(a,5,5,true);assert.equal(a.detail!.sourceX,95);assert.equal(a.detail!.sourceY,95);
 const center=a.geometry.x+a.geometry.width/2;resizeDetail(a,20,3);assert.equal(a.geometry.width,120);assert.equal(a.geometry.height,120);assert.equal(a.geometry.x+a.geometry.width/2,center);
});
test('保存重开与便携包保留放大参数、原图和修订，CLI 可修改倍率',async()=>{
 const {p,a}=fixture(),saved=await saveProject(p,0),opened=await readProject(p.id);
 assert.deepEqual(opened,saved);
 assert.deepEqual(await unpackProject(packageProject(saved)),saved);
 const patched=patchAnnotation(opened,a.id,{detail:{magnification:3},style:{color:'#2563eb'}});
 assert.equal(patched.annotations[0].detail!.magnification,3);assert.equal(patched.annotations[0].geometry.width,120);
 await assert.rejects(()=>saveProject(patched,0),/修订冲突/);
});
test('PNG 从原图取样、圆外留白、尺寸与 2× 导出一致，隐藏后不导出放大图',async()=>{
 const {p,a}=fixture();a.geometry.x=332;includeDetail(p,a);const at=async(bytes:Buffer,x:number,y:number)=>[...await sharp(bytes).ensureAlpha().extract({left:x,top:y,width:1,height:1}).raw().toBuffer()];
 const png=await exportPng(p),x=a.geometry.x+40,y=a.geometry.y+40;
 assert.deepEqual(await at(png,x,y),[0,255,0,255]);
 assert.deepEqual(await at(png,a.geometry.x+2,a.geometry.y+2),[255,255,255,255]);
 assert.deepEqual({width:(await sharp(png).metadata()).width,height:(await sharp(png).metadata()).height},outputSize(p));
 const doubled=await exportPng(p,2);assert.deepEqual(await at(doubled,x*2+1,y*2+1),[0,255,0,255]);
 a.visible=false;assert.deepEqual(await at(await exportPng(p),x,y),[255,255,255,255]);
});
test('圆形命中检测识别放大图、取样圆边与连接线，圆角空白不拦截',()=>{
 const {a}=fixture();a.geometry.x=170;a.geometry.y=60;
 const canvas=createCanvas(300,200),ctx=new HitContext({_canvas:canvas} as any);
 const shape=new Shape({stroke:'#000',fill:'#000',hitStrokeWidth:annotationHitWidth(a,1)});
 drawAnnotationHit(ctx,shape,a);
 const alpha=(x:number,y:number)=>canvas.getContext('2d').getImageData(x,y,1,1).data[3];
 assert.equal(alpha(210,100),255);assert.equal(alpha(171,61),0);assert.equal(alpha(90,70),255);assert.equal(alpha(145,95),255);
});
