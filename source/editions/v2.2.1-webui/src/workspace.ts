import {z} from 'zod';
import {ProjectSchema,validate,type Project} from './model';

export type View={x:number;y:number;scale:number};
const ViewSchema=z.object({x:z.number().finite(),y:z.number().finite(),scale:z.number().finite().min(0.02).max(16)});
export const WorkspaceSchema=z.object({
 version:z.literal(1),activeId:z.string().uuid().nullable(),
 documents:z.array(z.object({project:ProjectSchema,dirty:z.boolean(),view:ViewSchema.optional(),hidden:z.boolean().default(false)}))
});
export type WorkspaceDraft=z.infer<typeof WorkspaceSchema>;
export function validateWorkspace(value:unknown):WorkspaceDraft{
 const workspace=WorkspaceSchema.parse(value);
 const ids=workspace.documents.map(d=>d.project.id);
 if(new Set(ids).size!==ids.length)throw Error('草稿中项目 ID 重复');
 if(workspace.activeId!==null&&!ids.includes(workspace.activeId))throw Error('草稿中的当前项目不存在');
 workspace.documents.forEach(d=>validate(d.project));
 return workspace;
}
export function legacyWorkspace(project:Project):WorkspaceDraft{
 return {version:1,activeId:project.id,documents:[{project:validate(project),dirty:true,hidden:false}]};
}
