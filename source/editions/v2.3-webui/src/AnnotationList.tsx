import {useState,useRef,useEffect} from 'react';
import type {Annotation,Project,Tool} from './model';
import {measurementText} from './measurement';
import {ratioText} from './ratio';
import ToolIcon from './ToolIcon';

const names:Record<Annotation['type'],string>={arrow:'箭头',line:'直线',text:'文字',callout:'关联引线',rectangle:'矩形',ellipse:'椭圆',magnifier:'局部放大',ratio:'长度测量'};
function StateIcon({kind,active}:{kind:'eye'|'lock';active:boolean}){
 return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==='eye'?<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{!active&&<path d="m3 3 18 18"/>}</>:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d={active?'M8 10V6a4 4 0 0 1 8 0v4':'M8 10V6a4 4 0 0 1 8 0'}/><path d="M12 14v3"/></>}</svg>;
}

export default function AnnotationList({project:p,selected,select,change,edit}:{project:Project;selected:string[];select:(a:Annotation,multi:boolean)=>void;change:(fn:(p:Project)=>void)=>void;edit:()=>void}){
 const [query,setQuery]=useState(''),[type,setType]=useState('all'),[scope,setScope]=useState('all'),[page,setPage]=useState(0);
 const caption=(a:Annotation)=>a.label||(a.measurement?measurementText(p,a):a.ratio?ratioText(a):a.description)||'未命名';
 const items=p.annotations.slice().sort((a,b)=>b.zIndex-a.zIndex).filter(a=>(type==='all'||a.type===type)&&(scope==='all'||(scope==='selected'?selected.includes(a.id):scope==='hidden'?!a.visible:a.locked))&&(!query.trim()||[names[a.type],a.label,a.description,a.id,a.measurement?.group,caption(a)].join(' ').toLowerCase().includes(query.trim().toLowerCase())));
 const pageSize=40,lastPage=Math.max(0,Math.ceil(items.length/pageSize)-1),current=Math.min(page,lastPage);
 const list=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(list.current)list.current.scrollTop=0;},[current,query,type,scope]);
 return <div className="annotationBrowser">
  <div className="listFilters"><input type="search" aria-label="搜索标注" placeholder="搜索名称、说明或分组" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/>
   <div className="formGrid"><select aria-label="标注类型筛选" value={type} onChange={e=>{setType(e.target.value);setPage(0);}}><option value="all">全部类型</option>{Object.entries(names).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select><select aria-label="标注状态筛选" value={scope} onChange={e=>{setScope(e.target.value);setPage(0);}}><option value="all">全部状态</option><option value="selected">已选择</option><option value="hidden">已隐藏</option><option value="locked">已锁定</option></select></div>
   <div className="listSummary"><span>{items.length} / {p.annotations.length} 个标注</span><button disabled={!selected.length} onClick={edit}>编辑所选属性</button></div>
  </div>
  <div ref={list} className="objectList" aria-label="标注列表">{items.slice(current*pageSize,(current+1)*pageSize).map(a=><div key={a.id} className={'objectRow '+(selected.includes(a.id)?'selected ':'')+(!a.visible?'isHidden':'')}>
   <span className="objectTypeIcon" style={{color:a.style.color}}><ToolIcon tool={a.type as Tool}/></span>
   <button className="objectName" title={caption(a)+' · '+a.id} aria-pressed={selected.includes(a.id)} onClick={e=>select(a,e.ctrlKey||e.metaKey)} onDoubleClick={edit}><b>{caption(a)}</b><span>{names[a.type]}{a.status==='suggested'?' · 待确认':''}{!a.visible?' · 已隐藏':''}</span></button>
   <button className="objectToggle" title={a.visible?'隐藏标注':'显示标注'} aria-label={(a.visible?'隐藏 ':'显示 ')+a.id} aria-pressed={!a.visible} onClick={()=>change(q=>{const v=q.annotations.find(b=>b.id===a.id)!;v.visible=!v.visible;})}><StateIcon kind="eye" active={a.visible}/></button>
   <button className="objectToggle" title={a.locked?'解锁标注':'锁定标注'} aria-label={(a.locked?'解锁 ':'锁定 ')+a.id} aria-pressed={a.locked} onClick={()=>change(q=>{const v=q.annotations.find(b=>b.id===a.id)!;v.locked=!v.locked;})}><StateIcon kind="lock" active={a.locked}/></button>
  </div>)}{!items.length&&<div className="panelEmpty">{p.annotations.length?'没有匹配的标注，请调整筛选条件。':'尚无标注。选择左侧工具，在画布上开始标注。'}</div>}</div>
  {lastPage>0&&<div className="listPagination"><button disabled={current===0} onClick={()=>setPage(current-1)}>上一页</button><span>{current+1} / {lastPage+1}</span><button disabled={current===lastPage} onClick={()=>setPage(current+1)}>下一页</button></div>}
  <p className="listHint">点击定位 · Ctrl / ⌘ 多选 · 双击编辑属性</p>
 </div>;
}
