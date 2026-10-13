import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {HitContext} from 'konva/lib/Context.js';
import {Shape} from 'konva/lib/Shape.js';
import {type Annotation,clone,defaultStyle,validate,move,patchAnnotation,makeDetail,includeDetail,markdown} from '../src/model';
import {type Ratio,makeRatio,ratioValue,ratioText,ratioProjection,setRatioMode,ratioLabelVisible} from '../src/ratio';
import {includeRatio,ratioLabelBounds,ratioBounds} from '../src/ratioRender';
import {drawAnnotation,drawAnnotationHit,annotationHitWidth} from '../src/render';
process.env.BIO_DATA_DIR='tests/ratio-storage';
const {packageProject,unpackProject,saveProject,readProject}=await import('../server/storage');
const {exportPng}=await import('../server/export');
const base=JSON.parse(await fs.readFile('examples/example-inline.json','utf8'));
const ctx=createCanvas(1200,800).getContext('2d');
function fixture(mode:Ratio['mode']='shared'){
 const p=clone(base);p.id=randomUUID();p.annotations=[];p.revision=0;
 const a:Annotation={id:randomUUID(),imageId:p.image.id,type:'ratio',geometry:{x:0,y:0,x2:0,y2:0,width:1,height:1,unit:'image-pixel'},style:{...defaultStyle},label:'',description:'人工测试',visible:true,locked:false,zIndex:0,status:'user'};
 makeRatio(a,mode,mode==='shared'?[{x:100,y:100},{x:220,y:200},{x:100,y:300}]:[{x:100,y:100},{x:130,y:140},{x:300,y:100},{x:360,y:180}]);
 p.annotations.push(a);includeRatio(p,a,ctx);return {p,a};
}
test('同起点沿参考方向投影，横向错位不改变比例；旋转与缩放保持结果',()=>{
 const {a}=fixture();assert.equal(ratioValue(a.ratio!),0.5);assert.deepEqual(ratioProjection(a.ratio!),{x:100,y:200});
 const r=a.ratio!;for(const point of [r.start,r.sample,r.referenceStart,r.referenceEnd]){const x=point.x,y=point.y;point.x=-y*2+1000;point.y=x*2;}assert.equal(ratioValue(r),0.5);
 r.sample={x:r.start.x+(r.referenceEnd.x-r.start.x)*1.25,y:r.start.y+(r.referenceEnd.y-r.start.y)*1.25};assert.equal(ratioValue(r),1.25);
 r.sample={x:r.start.x-(r.referenceEnd.x-r.start.x)*0.5,y:r.start.y-(r.referenceEnd.y-r.start.y)*0.5};assert.equal(ratioValue(r),-0.5);
});
test('不同起点使用独立直线长度，无须平行或物理尺度校准',()=>{
 const {p,a}=fixture('independent');assert.equal(ratioValue(a.ratio!),0.5);
 a.ratio!.referenceStart={x:400,y:400};a.ratio!.referenceEnd={x:500,y:400};assert.equal(ratioValue(a.ratio!),0.5);
 p.calibration={pixels:20,realLength:100,unit:'mm',source:'fixture',isotropic:true};assert.equal(ratioValue(validate(p).annotations[0].ratio!),0.5);
});
test('比值、百分比、小数位、标签由实时几何生成，零位移为零',()=>{
 const {a,p}=fixture();assert.equal(ratioText(a),'R = 0.500');a.ratio!.display='percent';a.ratio!.precision=1;a.label='相对迁移';assert.equal(ratioText(a),'相对迁移 = 50.0%');
 a.ratio!.sample={...a.ratio!.start};assert.equal(ratioText(a),'相对迁移 = 0.0%');assert.match(markdown(p),/相对迁移 = 0.0%/);
});
test('拒绝零或亚像素参考长度、非法测量坐标、格式与错配元数据',()=>{
 const {p,a}=fixture();assert.throws(()=>validate({...p,version:2}));assert.throws(()=>validate({...p,annotations:[{...a,ratio:undefined}]}));
 for(const end of [{x:100,y:100},{x:100,y:100.5}])assert.throws(()=>validate({...p,annotations:[{...a,ratio:{...a.ratio!,referenceEnd:end}}]}));
 assert.throws(()=>validate({...p,annotations:[{...a,ratio:{...a.ratio!,sample:{x:-1,y:100}}}]}));
 assert.throws(()=>validate({...p,annotations:[{...a,ratio:{...a.ratio!,referenceStart:{x:101,y:100}}}]}));
 assert.throws(()=>validate({...p,annotations:[{...a,ratio:{...a.ratio!,precision:7}}]}));
 assert.throws(()=>validate({...p,annotations:[{...a,type:'line'}]}));
});
test('整组平移保持比例，标签移动不改变测量；切换模式与 CLI 补丁可编辑',()=>{
 const {p,a}=fixture();move(a,40,25);assert.equal(ratioValue(a.ratio!),0.5);assert.deepEqual(a.ratio!.start,a.ratio!.referenceStart);
 const saved=clone(a.ratio);a.geometry.x+=50;assert.deepEqual(a.ratio,saved);
 setRatioMode(a,'independent');assert.equal(ratioValue(a.ratio!),0.5);setRatioMode(a,'shared');assert.equal(ratioValue(a.ratio!),0.5);
 patchAnnotation(p,a.id,{ratio:{display:'percent',precision:2,sample:{x:140,y:175}}});assert.equal(ratioText(a),'R = 25.00%');
});
test('v1/v2 旧项目仍可读，混合放大对象保持 v3 格式',()=>{
 for(const version of [1,2])assert.equal(validate({...base,annotations:[],version}).version,version);
 const {p}=fixture(),a:Annotation={...clone(p.annotations[0]),id:randomUUID(),type:'magnifier',ratio:undefined,label:''};makeDetail(p,a,400,300,30);p.annotations.push(a);includeDetail(p,a);assert.equal(p.version,3);validate(p);
});
test('命中线段和标签，空白区域不吞点击；低缩放仍可选',()=>{
 const {a}=fixture('independent');a.style.strokeWidth=1;a.style.contrast=false;a.geometry.x=400;a.geometry.y=200;
 const canvas=createCanvas(650,400),hit=new HitContext({_canvas:canvas} as any),shape=new Shape({stroke:'#000',fill:'#000',hitStrokeWidth:annotationHitWidth(a,0.5)});
 drawAnnotationHit(hit,shape,a);const pixel=(x:number,y:number)=>canvas.getContext('2d').getImageData(x,y,1,1).data[3];
 assert.ok(pixel(115,120));assert.ok(pixel(410,210));assert.equal(pixel(220,220),0);
});
test('自动留白覆盖完整比例标签，保存、便携包与 1/2/4 倍导出保留测量',async()=>{
 const {p,a}=fixture('independent');a.geometry.x=p.image.width-5;includeRatio(p,a,ctx);assert.ok(p.layout.right>50);
 const b=ratioLabelBounds(ctx,a);assert.ok(b.x+b.width<=p.image.width+p.layout.right);
 const saved=await saveProject(p,0);assert.deepEqual((await readProject(p.id)).annotations,saved.annotations);assert.deepEqual((await unpackProject(packageProject(p))).annotations,p.annotations);
 const sharp=(await import('sharp')).default;
 for(const scale of [1,2,4]){const bytes=await exportPng(p,scale),meta=await sharp(bytes).metadata();assert.equal(meta.width,(p.image.width+p.layout.left+p.layout.right)*scale);assert.equal(meta.height,(p.image.height+p.layout.top+p.layout.bottom)*scale);}
 a.visible=false;const hidden=await exportPng(p);a.visible=true;assert.notDeepEqual(await exportPng(p),hidden);
});

test('隐藏结果标签同时移除文字、底板、命中和标签边界，保留测量线与比例',()=>{
 const {p,a}=fixture('independent');a.geometry.x=400;a.geometry.y=200;
 const shown=createCanvas(650,400);drawAnnotation(shown.getContext('2d'),a);assert.ok(shown.getContext('2d').getImageData(410,210,1,1).data[3]);
 a.ratio!.showLabel=false;const hidden=createCanvas(650,400);drawAnnotation(hidden.getContext('2d'),a);assert.equal(hidden.getContext('2d').getImageData(410,210,1,1).data[3],0);assert.ok(hidden.getContext('2d').getImageData(115,120,1,1).data[3]);assert.equal(ratioValue(a.ratio!),0.5);
 const hitCanvas=createCanvas(650,400),hit=new HitContext({_canvas:hitCanvas} as any),shape=new Shape({stroke:'#000',fill:'#000',hitStrokeWidth:annotationHitWidth(a,1)});drawAnnotationHit(hit,shape,a);assert.equal(hitCanvas.getContext('2d').getImageData(410,210,1,1).data[3],0);assert.ok(hitCanvas.getContext('2d').getImageData(115,120,1,1).data[3]);
 a.geometry.x=2000;assert.ok(ratioBounds(ctx,a).x+ratioBounds(ctx,a).width<400);p.layout={left:0,right:0,top:0,bottom:0,background:'#ffffff'};includeRatio(p,a,ctx);assert.equal(p.layout.right,0);
});

test('旧 v2.2 项目默认显示，开关经 patch、保存、便携包与 PNG 导出保留',async()=>{
 const {p,a}=fixture('independent');delete a.ratio!.showLabel;assert.equal(ratioLabelVisible(validate(p).annotations[0]),true);
 patchAnnotation(p,a.id,{ratio:{showLabel:false}});assert.equal(ratioLabelVisible(a),false);const geometry=clone(a.ratio);
 const saved=await saveProject(p,0);assert.equal((await readProject(p.id)).annotations[0].ratio!.showLabel,false);assert.equal((await unpackProject(packageProject(p))).annotations[0].ratio!.showLabel,false);
 const hidden=await exportPng(p),without=clone(p);without.annotations=[];const plain=await exportPng(without);const sharp=(await import('sharp')).default,b=ratioLabelBounds(ctx,a),area={left:Math.ceil(b.x+p.layout.left),top:Math.ceil(b.y+p.layout.top),width:Math.floor(b.width),height:Math.floor(b.height)};
 assert.deepEqual(await sharp(hidden).extract(area).raw().toBuffer(),await sharp(plain).extract(area).raw().toBuffer());assert.notDeepEqual(hidden,plain);
 patchAnnotation(p,a.id,{ratio:{showLabel:true}});assert.deepEqual({...a.ratio,showLabel:false},geometry);assert.notDeepEqual(await exportPng(p),hidden);
});
