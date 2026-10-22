import {useState} from 'react';
import type {Annotation,Project} from './model';
import {enableRatioSeries,removeRatioSample,sampleRatio} from './ratio';
import {ratioCsv,ratioTsv} from './ratioData';
import {download} from './api';

export default function RatioSeriesProperties({annotation:a,change,adding,onAdd,onFinish}:{annotation:Annotation;change:(fn:(p:Project)=>void)=>void;adding:boolean;onAdd:()=>void;onFinish:()=>void}){
 const r=a.ratio!,[weights,setWeights]=useState(''),[notice,setNotice]=useState('');
 const update=(fn:(item:Annotation)=>void)=>change(p=>fn(p.annotations.find(v=>v.id===a.id)!));
 if(r.mode!=='shared')return null;
 const applyWeights=()=>{
  const values=weights.trim().split(/[,，;；\s]+/).map(Number);
  if(values.length!==r.series?.length||values.some(v=>!Number.isFinite(v)||v<=0||v>1000000)){setNotice('请输入与样品数量一致的正数，按表格顺序对应，单位 kDa。');return;}
  update(item=>item.ratio!.series!.forEach((sample,i)=>sample.molecularWeight=values[i]));setNotice('分子量已按表格顺序录入，请核对条带对应关系。');
 };
 return <div className="ratioSeriesProperties">
  <div className="sectionTitle">同起点连续测量</div>
  {adding?<button type="button" onClick={onFinish}>完成连续测量</button>:<button type="button" onClick={onAdd}>连续添加样品 / 条带</button>}
  <p className="tip">{adding?'在原图上继续点击各条带中心，每次点击增加一个样品；完成按钮或 Esc 结束。':'只用一个共同起点和参考终点。每条带用短刻度标记，无需重复绘制长线。'}</p>
  {r.series&&<>
   <div className="ratioSeriesTable" role="table" aria-label="连续测量数据">
    <div className="ratioSeriesRow ratioSeriesHeader" role="row"><span>样品</span><span>R</span><span>kDa</span><span/></div>
    {r.series.map((sample,i)=><div key={sample.id} className="ratioSeriesRow" role="row" data-sample-id={sample.id}>
     <input aria-label={'样品 '+(i+1)+' 名称'} maxLength={80} value={sample.name} onChange={e=>update(item=>item.ratio!.series!.find(v=>v.id===sample.id)!.name=e.target.value)}/>
     <output aria-label={'样品 '+(i+1)+' R值'} title={String(sampleRatio(r,sample))}>{sampleRatio(r,sample).toFixed(r.precision)}</output>
     <input type="number" aria-label={'样品 '+(i+1)+' 分子量'} min={0.001} max={1000000} step="any" value={sample.molecularWeight??''} onChange={e=>update(item=>{const target=item.ratio!.series!.find(v=>v.id===sample.id)!;if(e.target.value)target.molecularWeight=Number(e.target.value);else delete target.molecularWeight;})}/>
     <button type="button" aria-label={'删除样品 '+(i+1)} title="移除这个测量点" disabled={r.series!.length<=1} onClick={()=>update(item=>removeRatioSample(item,sample.id))}>×</button>
    </div>)}
   </div>
   <div className="smallActions"><button type="button" onClick={()=>{navigator.clipboard.writeText(ratioTsv(r)).then(()=>setNotice('数据已复制，可直接粘贴到 Excel。')).catch(()=>setNotice('复制失败，请导出 CSV。'));}}>复制测量数据</button><button type="button" onClick={()=>download(new Blob([ratioCsv(r)],{type:'text/csv;charset=utf-8'}),'连续测量数据.csv')}>导出测量 CSV</button></div>
   <details><summary>录入 marker 分子量（可选）</summary><p className="tip">按照表格顺序输入 kDa 数值，用逗号或空格分隔。未知或不清楚的条带请留空；导出保留完整精度的 R 值和 log10(分子量)，不进行拟合。</p><textarea aria-label="批量分子量" rows={2} value={weights} placeholder="170, 130, 100, 70, …" onChange={e=>setWeights(e.target.value)}/><button type="button" onClick={applyWeights}>应用分子量</button></details>
   <p className="tip" role="status">{notice}</p>
  </>}
 </div>;
}
