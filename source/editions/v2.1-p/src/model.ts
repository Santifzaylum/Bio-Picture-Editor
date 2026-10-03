import {z} from 'zod';
const num=z.number().finite().min(-100000).max(100000), positive=z.number().finite().positive().max(100000);
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const StyleSchema=z.object({color,strokeWidth:positive.max(500),headSize:positive.max(1000),dash:z.boolean(),contrast:z.boolean(),fontSize:positive.max(1000),font:z.enum(['BioSans','Microsoft YaHei','SimSun']),bold:z.boolean(),align:z.enum(['left','center','right']),textOutline:z.boolean(),background:color,backgroundOpacity:z.number().min(0).max(1),fill:color,fillOpacity:z.number().min(0).max(1)}).strict();
export const StrokeSchema=z.object({color,strokeWidth:positive.max(500),dash:z.boolean(),contrast:z.boolean()}).strict();
export type DetailPart='source'|'connector'|'inset';
export const DetailSchema=z.object({sourceX:num,sourceY:num,sourceRadius:positive.max(10000),magnification:z.number().finite().min(1.25).max(8),styles:z.object({source:StrokeSchema,connector:StrokeSchema,inset:StrokeSchema}).strict().optional()}).strict();
export const AnnotationSchema=z.object({id:z.string().uuid(),type:z.enum(['arrow','line','text','callout','rectangle','ellipse','magnifier']),imageId:z.string().uuid(),geometry:z.object({x:num,y:num,x2:num,y2:num,width:positive,height:positive,unit:z.literal('image-pixel')}).strict(),detail:DetailSchema.optional(),style:StyleSchema,label:z.string().max(5000),description:z.string().max(10000),visible:z.boolean(),locked:z.boolean(),zIndex:z.number().int().min(0),status:z.enum(['user','suggested','confirmed'])}).strict();
export const ProjectSchema=z.object({format:z.literal('bio-annotation'),version:z.union([z.literal(1),z.literal(2)]),id:z.string().uuid(),revision:z.number().int().nonnegative(),title:z.string().max(300),caption:z.string().max(10000),image:z.object({id:z.string().uuid(),name:z.string().max(300),mime:z.enum(['image/png','image/jpeg']),sha256:z.string().regex(/^[a-f0-9]{64}$/),width:positive.int(),height:positive.int(),originalWidth:positive.int(),originalHeight:positive.int(),exifOrientation:z.number().int().min(1).max(8),transform:z.literal('EXIF auto-oriented; display sRGB 8-bit'),original:z.string().max(160000000),display:z.string().max(160000000),warning:z.string()}).strict(),layout:z.object({left:z.number().int().min(0).max(10000),right:z.number().int().min(0).max(10000),top:z.number().int().min(0).max(10000),bottom:z.number().int().min(0).max(10000),background:color}).strict(),calibration:z.object({pixels:positive,realLength:positive,unit:z.enum(['μm','mm']),source:z.string(),isotropic:z.literal(true)}).nullable(),annotations:z.array(AnnotationSchema).max(2000),updatedAt:z.string()}).strict();
export type Project=z.infer<typeof ProjectSchema>; export type Annotation=z.infer<typeof AnnotationSchema>; export type Style=z.infer<typeof StyleSchema>; export type Tool='select'|Annotation['type'];
export const defaultStyle:Style={color:'#ef4444',strokeWidth:4,headSize:16,dash:false,contrast:true,fontSize:28,font:'BioSans',bold:false,align:'left',textOutline:false,background:'#ffffff',backgroundOpacity:0.85,fill:'#facc15',fillOpacity:0};
export const clone=<T>(v:T):T=>{if(v&&typeof v==='object'&&(v as any).format==='bio-annotation'){const {image,...mutable}=v as any;return {...structuredClone(mutable),image} as T;}return structuredClone(v);};
export function validate(v:unknown):Project{
 const p=ProjectSchema.parse(v);
 if(new Set(p.annotations.map(a=>a.id)).size!==p.annotations.length)throw Error('对象 ID 重复');
 if(p.annotations.some(a=>a.imageId!==p.image.id))throw Error('对象关联到未知图片');
 for(const a of p.annotations){
  if(a.type!=='magnifier'){if(a.detail)throw Error('只有局部放大标注可包含取样区域');continue;}
  if(p.version!==2||!a.detail)throw Error('局部放大标注需要 v2 项目和取样区域');
  const d=a.detail,r=d.sourceRadius;
  if(d.sourceX-r<0||d.sourceY-r<0||d.sourceX+r>p.image.width||d.sourceY+r>p.image.height)throw Error('放大取样圆须完整位于原图内');
  const diameter=r*d.magnification*2;
  if(Math.abs(a.geometry.width-diameter)>0.001||Math.abs(a.geometry.height-diameter)>0.001)throw Error('放大圆尺寸与取样半径、倍率不一致');
 }
 outputSize(p);return p;
}
export function outputSize(p:Project,scale=1){if(![1,2,4].includes(scale))throw Error('倍率仅支持 1、2、4');const width=(p.image.width+p.layout.left+p.layout.right)*scale,height=(p.image.height+p.layout.top+p.layout.bottom)*scale;if(width>16384||height>16384||width*height>64000000)throw Error('输出超过限制：最长边 16384 像素、总计 6400 万像素。请减少留白或倍率。');return {width,height};}
export function screenToImage(x:number,y:number,view:{x:number;y:number;scale:number},layout:Project['layout']){return {x:(x-view.x)/view.scale-layout.left,y:(y-view.y)/view.scale-layout.top};}
export function zoomAt(view:{x:number;y:number;scale:number},x:number,y:number,scale:number){return {scale,x:x-(x-view.x)*scale/view.scale,y:y-(y-view.y)*scale/view.scale};}
export function move(a:Annotation,dx:number,dy:number,whole=false){a.geometry.x+=dx;a.geometry.y+=dy;if(a.type==='arrow'||a.type==='line'||(a.type==='callout'&&whole)){a.geometry.x2+=dx;a.geometry.y2+=dy;}if(a.type==='magnifier'&&a.detail&&whole){a.detail.sourceX+=dx;a.detail.sourceY+=dy;}}
export function detailStroke(a:Annotation,part:DetailPart){const s=a.detail?.styles?.[part]||a.style;return {color:s.color,strokeWidth:s.strokeWidth,dash:s.dash,contrast:s.contrast};}
export function moveDetail(p:Project,a:Annotation,dx:number,dy:number,part:DetailPart){
 if(!a.detail)throw Error('对象不是局部放大标注');
 if(part==='inset'){move(a,dx,dy);return;}
 const d=a.detail,r=d.sourceRadius;
 dx=Math.max(r-d.sourceX,Math.min(p.image.width-r-d.sourceX,dx));
 dy=Math.max(r-d.sourceY,Math.min(p.image.height-r-d.sourceY,dy));
 if(part==='connector')move(a,dx,dy,true);else {d.sourceX+=dx;d.sourceY+=dy;}
}
export function resizeDetail(a:Annotation,sourceRadius:number,magnification:number){
 if(a.type!=='magnifier'||!a.detail)throw Error('对象不是局部放大标注');
 const d=DetailSchema.parse({...a.detail,sourceRadius,magnification});
 const cx=a.geometry.x+a.geometry.width/2,cy=a.geometry.y+a.geometry.height/2;
 a.detail=d;a.geometry.width=a.geometry.height=2*d.sourceRadius*d.magnification;
 a.geometry.x=cx-a.geometry.width/2;a.geometry.y=cy-a.geometry.height/2;
}
export function makeDetail(p:Project,a:Annotation,x:number,y:number,radius:number){
 const sourceRadius=Math.max(1,Math.min(Math.round(radius),x,y,p.image.width-x,p.image.height-y,10000));
 const diameter=sourceRadius*4;
 a.type='magnifier';a.detail={sourceX:x,sourceY:y,sourceRadius,magnification:2};
 // Place adjacent to the sample, choosing the direction with the least overflow.
 const r=diameter/2,distance=sourceRadius+r+32;
 const centers=[{x:x+distance,y},{x:x-distance,y},{x,y:y+distance},{x,y:y-distance}];
 const overflow=(c:{x:number;y:number})=>Math.max(0,r-c.x)+Math.max(0,r-c.y)+Math.max(0,c.x+r-p.image.width)+Math.max(0,c.y+r-p.image.height);
 const center=centers.reduce((best,c)=>overflow(c)<overflow(best)?c:best);
 a.geometry={...a.geometry,x:center.x-r,y:center.y-r,width:diameter,height:diameter};
 return a;
}
export function includeDetail(p:Project,a:Annotation){
 p.version=2;
 const g=a.geometry,d=a.detail!;
 const padding=Math.ceil(Math.max(...(['source','connector','inset'] as const).map(part=>{const s=detailStroke(a,part);return s.strokeWidth/2+(s.contrast?2:0);}))+16);
 p.layout.left=Math.max(p.layout.left,Math.ceil(padding-Math.min(g.x,d.sourceX-d.sourceRadius)));
 p.layout.top=Math.max(p.layout.top,Math.ceil(padding-Math.min(g.y,d.sourceY-d.sourceRadius)));
 p.layout.right=Math.max(p.layout.right,Math.ceil(Math.max(g.x+g.width,d.sourceX+d.sourceRadius)+padding-p.image.width));
 p.layout.bottom=Math.max(p.layout.bottom,Math.ceil(Math.max(g.y+g.height,d.sourceY+d.sourceRadius)+padding-p.image.height));
 validate(p);
}
export function patchAnnotation(p:Project,id:string,patch:unknown){
 const a=p.annotations.find(a=>a.id===id);if(!a)throw Error('对象 ID 不存在');
 const q=z.object({label:z.string().optional(),description:z.string().optional(),geometry:AnnotationSchema.shape.geometry.partial().optional(),detail:DetailSchema.partial().optional(),style:StyleSchema.partial().optional(),visible:z.boolean().optional(),locked:z.boolean().optional(),status:AnnotationSchema.shape.status.optional()}).strict().parse(patch);
 if(q.detail){if(a.type!=='magnifier'||!a.detail)throw Error('对象不是局部放大标注');const d=DetailSchema.parse({...a.detail,...q.detail});resizeDetail(a,d.sourceRadius,d.magnification);a.detail=d;}
 const {detail,...fields}=q;
 Object.assign(a,fields,{geometry:{...a.geometry,...q.geometry},style:{...a.style,...q.style}});
 if(a.type==='magnifier')includeDetail(p,a);
 return validate(p);
}
export function markdown(p:Project){return `# ${p.title}\n\n${p.caption}\n\n图像：${p.image.name}（${p.image.width} × ${p.image.height} px）；修订号 ${p.revision}。\n坐标：方向校正后的原图左上角为 (0,0)，x 向右、y 向下；单位 px。图旁留白可使用负坐标。\n\n标注文字由用户或模型提供，软件未验证医学正确性。\n\n`+p.annotations.map(a=>`- **${a.label.replace(/\n/g,' / ')||a.type}** [${a.status}]\n  ID: ${a.id}；位置 (${a.geometry.x}, ${a.geometry.y}) px；${a.visible?'显示':'隐藏'}\n  ${a.description}\n`).join('\n');}
