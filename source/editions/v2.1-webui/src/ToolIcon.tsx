import type {Tool} from './model';

export default function ToolIcon({tool}:{tool:Tool}){
 const paths={
  select:<path d="M5 3l14 10-7 1-3 7z"/>,
  arrow:<><path d="M4 20L20 4M10 4h10v10"/></>,
  line:<><path d="M4 19L20 5"/><circle cx="4" cy="19" r="1.5"/><circle cx="20" cy="5" r="1.5"/></>,
  text:<><path d="M5 5h14M12 5v15M8 20h8M5 5v3M19 5v3"/></>,
  callout:<><rect x="10" y="4" width="10" height="7" rx="1.5"/><path d="M13 7.5h4M10 10l-5 8M5 14.5V18h3.5"/></>,
  rectangle:<rect x="3" y="5" width="18" height="14" rx="1"/>,
  ellipse:<ellipse cx="12" cy="12" rx="9" ry="7"/>,
  magnifier:<><circle cx="6" cy="17" r="3"/><circle cx="16" cy="8" r="5"/><path d="M8.3 15l4-3.8M16 6v4M14 8h4"/></>
 };
 return <svg className="toolIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[tool]}</svg>;
}
