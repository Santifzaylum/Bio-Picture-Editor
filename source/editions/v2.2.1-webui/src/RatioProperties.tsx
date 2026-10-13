import {type Annotation,type Project} from './model';
import {type Ratio,ratioText,ratioModeNames,editRatioPoint,setRatioMode,ratioLabelVisible} from './ratio';
import RatioSeriesProperties from './RatioSeriesProperties';

export default function RatioProperties({annotation:a,change,adding,onAdd,onFinish}:{annotation:Annotation;change:(fn:(p:Project)=>void)=>void;adding:boolean;onAdd:()=>void;onFinish:()=>void}){
 const r=a.ratio!;
 const update=(fn:(item:Annotation)=>void)=>change(p=>fn(p.annotations.find(v=>v.id===a.id)!));
 const points=r.mode==='shared'?(['start','sample','referenceEnd'] as const):(['start','sample','referenceStart','referenceEnd'] as const);
 const titles={start:r.mode==='shared'?'共同起点':'待测起点',sample:r.mode==='shared'?'待测位置':'待测终点',referenceStart:'参考起点',referenceEnd:r.mode==='shared'?'参考位置':'参考终点'};
 return <div className="ratioProperties">
  <div className="sectionTitle">比例测距设置</div>
  <label className="check"><input type="checkbox" aria-label="显示结果标签" checked={ratioLabelVisible(a)} onChange={e=>update(item=>item.ratio!.showLabel=e.target.checked)}/>显示结果标签</label>
  <label>结果标签<input aria-label="比例结果标签" maxLength={80} value={a.label} onChange={e=>update(item=>item.label=e.target.value)}/></label>
  <label>测量方式<select aria-label="测量方式" value={r.mode} disabled={!!r.series} onChange={e=>update(item=>setRatioMode(item,e.target.value as Ratio['mode']))}>{Object.entries(ratioModeNames).map(([key,title])=><option key={key} value={key}>{title}</option>)}</select></label>
  <div className="formGrid"><label>显示形式<select aria-label="比例显示形式" value={r.display} onChange={e=>update(item=>item.ratio!.display=e.target.value as Ratio['display'])}><option value="ratio">比值</option><option value="percent">百分比</option></select></label><label>小数位数<input type="number" aria-label="比例小数位数" min={0} max={6} value={r.precision} onChange={e=>{if(e.target.value)update(item=>item.ratio!.precision=Math.max(0,Math.min(6,Math.round(Number(e.target.value)))));}}/></label></div>
  <p className="detailHint" aria-label="当前比例">{ratioText(a)}</p>
  <RatioSeriesProperties key={a.id} annotation={a} change={change} adding={adding} onAdd={onAdd} onFinish={onFinish}/>
  {!ratioLabelVisible(a)&&<p className="tip">图中结果标签已隐藏，导出 PNG 时也会隐藏；测量线保留，右侧仍可查看比例。</p>}
  <p className="tip">{r.mode==='shared'?'待测位置沿共同起点到参考位置的方向投影，再除以参考长度；横向偏移不计入迁移。':'待测线段的直线长度 ÷ 参考线段的直线长度。两条线段可分别设置起点和方向。'}拖控制点修正位置；拖标签只移动文字，拖线条移动整组。</p>
  <details><summary>精确设置测量位置</summary>{points.map(key=><div key={key}><b>{titles[key]}</b><div className="formGrid">{(['x','y'] as const).map(axis=><label key={axis}>{axis.toUpperCase()} (px)<input type="number" aria-label={titles[key]+' '+axis.toUpperCase()} value={r[key][axis]} onChange={e=>{if(e.target.value)update(item=>editRatioPoint(item,key,{...item.ratio![key],[axis]:Number(e.target.value)}));}}/></label>)}</div></div>)}</details>
 </div>;
}
