import {type Ratio,ratioSamples,sampleRatio} from './ratio';

export function ratioRows(r:Ratio){return ratioSamples(r).map((sample,index)=>({sample,index:index+1,R:sampleRatio(r,sample),weight:sample.molecularWeight,logWeight:sample.molecularWeight?Math.log10(sample.molecularWeight):undefined}));}
const cell=(value:string|number|undefined)=>{let s=value===undefined?'':String(value);if(typeof value==='string'&&/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
export function ratioCsv(r:Ratio){return '\uFEFF'+['样品,R,百分比,分子量_kDa,log10_分子量',...ratioRows(r).map(row=>[row.sample.name,row.R,row.R*100,row.weight,row.logWeight].map(cell).join(','))].join('\r\n');}
export function ratioTsv(r:Ratio){return ['样品\tR\t分子量(kDa)\tlog10(分子量)',...ratioRows(r).map(row=>[row.sample.name.replace(/[\t\r\n]/g,' '),row.R,row.weight??'',row.logWeight??''].join('\t'))].join('\n');}
