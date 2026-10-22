import {useState} from 'react';
import {type Annotation,type Project,type DetailPart,detailStroke,resizeDetail,includeDetail} from './model';

export const detailPartNames:Record<DetailPart,string>={source:'取样圆',connector:'连接线',inset:'放大圆'};

export default function DetailProperties({annotation,part,onPart,change}:{annotation:Annotation;part:DetailPart;onPart:(part:DetailPart)=>void;change:(fn:(p:Project)=>void)=>void}){
 const a=annotation,d=a.detail!,s=detailStroke(a,part);
 const [positionOpen,setPositionOpen]=useState(false);
 const update=(fn:(a:Annotation)=>void)=>change(p=>{const item=p.annotations.find(v=>v.id===a.id)!;fn(item);includeDetail(p,item);});
 const stroke=(key:keyof typeof s,value:string|number|boolean)=>update(item=>{
  // Materialize all three fallbacks together so changing one never affects another.
  item.detail!.styles={source:{...detailStroke(item,'source')},connector:{...detailStroke(item,'connector')},inset:{...detailStroke(item,'inset')}};
  (item.detail!.styles[part] as any)[key]=value;
 });
 return <div className="detailProperties">
  <div className="sectionTitle">局部放大设置</div>
  <div className="formGrid">
   <label>放大倍率<input type="number" aria-label="局部放大倍率" min={1.25} max={8} step={0.25} value={Number(d.magnification.toFixed(2))} onChange={e=>{if(e.target.value)update(item=>resizeDetail(item,item.detail!.sourceRadius,Number(e.target.value)));}}/></label>
   <label>取样半径 (px)<input type="number" aria-label="取样半径" min={1} max={10000} value={d.sourceRadius} onChange={e=>{if(e.target.value)update(item=>resizeDetail(item,Number(e.target.value),item.detail!.magnification));}}/></label>
  </div>
  <p className="detailHint">拖动取样圆内部移动取样；拖动放大圆移动展示；拖动连接线或按住 Alt 拖动整组。圆边控制点调整取样范围与倍率。</p>
  <details open={positionOpen} onToggle={e=>setPositionOpen(e.currentTarget.open)}><summary>精确设置取样中心</summary><div className="formGrid">{(['sourceX','sourceY'] as const).map((key,i)=><label key={key}>{i?'Y':'X'} (px)<input type="number" aria-label={'取样中心 '+(i?'Y':'X')} value={d[key]} onChange={e=>{if(e.target.value)update(item=>{item.detail![key]=Math.round(Number(e.target.value));});}}/></label>)}</div></details>
  <div className="sectionTitle">分别设置线条</div>
  <div className="detailParts" role="group" aria-label="局部放大线条部位">{(['source','connector','inset'] as const).map(key=><button type="button" key={key} aria-pressed={part===key} onClick={()=>onPart(key)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{key==='connector'?<path d="M4 17L20 7"/>:<circle cx="12" cy="12" r={key==='source'?5:8}/>}</svg>{detailPartNames[key]}</button>)}</div>
  <div className="detailStylePanel"><b>{detailPartNames[part]}样式</b>
   <div className="row colorRow"><span>颜色</span><input type="color" aria-label={detailPartNames[part]+'颜色'} title={'点击色块选择'+detailPartNames[part]+'颜色'} value={s.color} onChange={e=>stroke('color',e.target.value)}/></div>
   <label>线宽 (px)<input type="number" aria-label={detailPartNames[part]+'线宽'} min={1} max={500} value={s.strokeWidth} onChange={e=>{if(e.target.value)stroke('strokeWidth',Math.max(1,Math.min(500,Number(e.target.value))));}}/></label>
   <label className="check"><input type="checkbox" aria-label={detailPartNames[part]+'虚线'} checked={s.dash} onChange={e=>stroke('dash',e.target.checked)}/>虚线</label>
   <label className="check"><input type="checkbox" aria-label={detailPartNames[part]+'对比描边'} checked={s.contrast} onChange={e=>stroke('contrast',e.target.checked)}/>对比描边</label>
  </div>
  <p className="tip">三处线条各自保存颜色、线宽、虚线和对比描边。移出原图时自动补足四周留白；放大取自原图，不增加原始细节。</p>
 </div>;
}
