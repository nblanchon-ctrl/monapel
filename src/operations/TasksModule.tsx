import React,{useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import './operations.css';
type Props={db:SupabaseClient;userId:string};
type Task={id:string;title:string;description:string|null;status:string;project_id:string|null;assignee_id:string|null;due_date:string|null};
type Member={id:string;full_name:string};
type Comment={id:string;task_id:string;author_id:string;body:string;created_at:string};
const statuses=['À faire','En cours','Terminé','Abandonné'];
export default function TasksModule({db,userId}:Props){
 const[tasks,setTasks]=useState<Task[]>([]);
 const[members,setMembers]=useState<Member[]>([]);
 const[projects,setProjects]=useState<{id:string;title:string}[]>([]);
 const[active,setActive]=useState<Task|null>(null);
 const[comments,setComments]=useState<Comment[]>([]);
 const[body,setBody]=useState('');
 const[title,setTitle]=useState('');
 const[assignee,setAssignee]=useState('');
 const[due,setDue]=useState('');
 const[description,setDescription]=useState('');
 const[message,setMessage]=useState('');
 const[busy,setBusy]=useState(false);
 const[editingTask,setEditingTask]=useState(false);
 const[taskDraft,setTaskDraft]=useState({title:'',description:'',assignee_id:'',due_date:'',status:'À faire'});
 const reload=async()=>{
  const [t,m,p]=await Promise.all([
   db.from('tasks').select('id,title,description,status,project_id,assignee_id,due_date').order('due_date',{ascending:true}),
   db.from('profiles').select('id,full_name').eq('active',true),
   db.from('projects').select('id,title')]);
  if(t.error){setMessage(t.error.message);return}
  setTasks(t.data||[]);setMembers(m.data||[]);setProjects(p.data||[]);
 };
 useEffect(()=>{void reload()},[db]);
 useEffect(()=>{if(!active){setComments([]);return}void db.from('task_comments').select('*').eq('task_id',active.id).order('created_at',{ascending:true}).then(({data,error})=>{if(error)setMessage(error.message);else setComments(data||[])})},[db,active?.id]);
 const create=async(e:React.FormEvent)=>{e.preventDefault();if(busy)return;setBusy(true);const {error}=await db.from('tasks').insert({title:title.trim(),description:description.trim()||null,assignee_id:assignee,due_date:due,project_id:null,status:'À faire'});setBusy(false);if(error){setMessage(error.message);return}setTitle('');setDescription('');setAssignee('');setDue('');setMessage('Tâche indépendante créée.');void reload()};
 const update=async(t:Task,patch:Partial<Task>)=>{const {error}=await db.from('tasks').update(patch).eq('id',t.id);if(error){setMessage(error.message);return}setTasks(old=>old.map(x=>x.id===t.id?{...x,...patch}:x));setActive(x=>x?.id===t.id?{...x,...patch}:x)};
 const startTaskEdit=(t:Task)=>{setTaskDraft({title:t.title,description:t.description||'',assignee_id:t.assignee_id||'',due_date:t.due_date||'',status:t.status});setEditingTask(true);setMessage('')};
 const saveTask=async(e:React.FormEvent)=>{e.preventDefault();if(!active||busy||!taskDraft.title.trim())return;setBusy(true);const patch={title:taskDraft.title.trim(),description:taskDraft.description.trim()||null,assignee_id:taskDraft.assignee_id||null,due_date:taskDraft.due_date||null,status:taskDraft.status};const {error}=await db.from('tasks').update(patch).eq('id',active.id);setBusy(false);if(error){setMessage(error.message);return}setTasks(old=>old.map(t=>t.id===active.id?{...t,...patch}:t));setActive({...active,...patch});setEditingTask(false);setMessage('Tâche modifiée.')};
 const deleteTask=async()=>{if(!active||active.project_id||busy)return;if(!window.confirm('Supprimer définitivement cette tâche indépendante et ses commentaires ?'))return;setBusy(true);const {error}=await db.from('tasks').delete().eq('id',active.id);setBusy(false);if(error){setMessage('Suppression impossible : '+error.message);return}setTasks(old=>old.filter(t=>t.id!==active.id));setActive(null);setEditingTask(false);setMessage('Tâche supprimée.')};
 const comment=async(e:React.FormEvent)=>{e.preventDefault();if(!active||!body.trim())return;const {error}=await db.from('task_comments').insert({task_id:active.id,author_id:userId,body:body.trim()});if(error){setMessage(error.message);return}setBody('');const {data}=await db.from('task_comments').select('*').eq('task_id',active.id).order('created_at',{ascending:true});setComments(data||[])};
 return <section className="op-module"><div className="op-heading"><div><div className="eyebrow">PILOTAGE ASSOCIATIF</div><h1>Tâches</h1><p className="lead">Les tâches des opérations apparaissent automatiquement ici. Vous pouvez aussi créer des tâches indépendantes.</p></div></div>
 {message&&<p className="op-notice" role="status">{message}</p>}
 <div className="op-section"><h2>Nouvelle tâche indépendante</h2><form className="op-task-form" onSubmit={create}><label>Intitulé<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Responsable<select required value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">Choisir une personne</option>{members.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label><label>Échéance<input required type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><label>Description (facultative)<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><button disabled={busy} className="primary">Ajouter la tâche</button></form></div>
 <div className="op-section"><h2>Toutes les tâches ({tasks.length})</h2><div className="op-grid">{tasks.map(t=><article className="op-card" key={t.id}><span className="tag">{t.status}</span><h3>{t.title}</h3><p>{t.project_id?`Opération : ${projects.find(p=>p.id===t.project_id)?.title||'Opération'}`:'Tâche indépendante'}</p><p>Responsable : {members.find(m=>m.id===t.assignee_id)?.full_name||'À attribuer'}</p><p>Échéance : {t.due_date||'À définir'}</p><button className="textbutton" onClick={()=>{setActive(t);setEditingTask(false)}}>Ouvrir / commenter</button></article>)}{tasks.length===0&&<p>Aucune tâche pour le moment.</p>}</div></div>
 {active&&<div className="op-overlay" onClick={()=>{setActive(null);setEditingTask(false)}}><div className="op-dialog" onClick={e=>e.stopPropagation()}><button className="op-close" onClick={()=>{setActive(null);setEditingTask(false)}}>Fermer ×</button><h2>{active.title}</h2><p>{active.description}</p>{!active.project_id&&<div className="quick"><button type="button" className="outline" onClick={()=>editingTask?setEditingTask(false):startTaskEdit(active)}>{editingTask?'Annuler la modification':'Modifier la tâche'}</button><button type="button" className="textbutton deletebutton" disabled={busy} onClick={()=>void deleteTask()}>Supprimer la tâche</button></div>}{editingTask&&<form className="op-task-form" onSubmit={saveTask}><label>Intitulé<input required value={taskDraft.title} onChange={e=>setTaskDraft({...taskDraft,title:e.target.value})}/></label><label>Description<textarea value={taskDraft.description} onChange={e=>setTaskDraft({...taskDraft,description:e.target.value})}/></label><label>Responsable<select value={taskDraft.assignee_id} onChange={e=>setTaskDraft({...taskDraft,assignee_id:e.target.value})}><option value="">À attribuer</option>{members.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label><label>Échéance<input type="date" value={taskDraft.due_date} onChange={e=>setTaskDraft({...taskDraft,due_date:e.target.value})}/></label><label>Statut<select value={taskDraft.status} onChange={e=>setTaskDraft({...taskDraft,status:e.target.value})}>{statuses.map(st=><option key={st}>{st}</option>)}</select></label><button className="primary" disabled={busy}>Enregistrer les modifications</button></form>}<p>{active.project_id?`Opération : ${projects.find(p=>p.id===active.project_id)?.title||'Opération'}`:'Tâche indépendante'}</p><label>Statut<select value={active.status} onChange={e=>void update(active,{status:e.target.value})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Personne responsable<select value={active.assignee_id||''} onChange={e=>void update(active,{assignee_id:e.target.value||null})}><option value="">À attribuer</option>{members.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label><label>Échéance<input type="date" value={active.due_date||''} onChange={e=>void update(active,{due_date:e.target.value||null})}/></label><h3>Commentaires</h3>{comments.map(c=><div className="op-comment" key={c.id}><strong>{members.find(m=>m.id===c.author_id)?.full_name||'Membre du bureau'}</strong><small>{new Date(c.created_at).toLocaleString('fr-FR')}</small><p>{c.body}</p></div>)}<form onSubmit={comment}><textarea required value={body} onChange={e=>setBody(e.target.value)} placeholder="Commentaire sur cette tâche"/><button className="primary">Publier</button></form></div></div>}
 </section>
}
