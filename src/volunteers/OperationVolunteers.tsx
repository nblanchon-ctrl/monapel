import React,{useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
type V={id:string;first_name:string;last_name:string;email:string};
export default function OperationVolunteers({db,projectId}:{db:SupabaseClient;projectId:string}){
 const [people,setPeople]=useState<V[]>([]),[assigned,setAssigned]=useState<string[]>([]),[chosen,setChosen]=useState(''),[message,setMessage]=useState('');
 async function load(){const [p,a]=await Promise.all([db.from('apel_volunteers').select('id,first_name,last_name,email').order('last_name'),db.from('apel_operation_volunteers').select('volunteer_id').eq('project_id',projectId)]);if(p.error)setMessage(p.error.message);else setPeople(p.data||[]);if(a.error)setMessage(a.error.message);else setAssigned((a.data||[]).map(x=>x.volunteer_id))}
 useEffect(()=>{void load()},[db,projectId]);
 async function add(){if(!chosen)return;const {error}=await db.from('apel_operation_volunteers').insert({project_id:projectId,volunteer_id:chosen});if(error)setMessage(error.message);else{setChosen('');await load()}}
 async function remove(id:string){const {error}=await db.from('apel_operation_volunteers').delete().eq('project_id',projectId).eq('volunteer_id',id);if(error)setMessage(error.message);else await load()}
 return <section><h3>Bénévoles de l'opération</h3><p>Ajoutez ou retirez des bénévoles de l'annuaire, sans leur donner d'accès à l'application.</p>{message&&<p role="status" className="alert">{message}</p>}<div className="quick"><select aria-label="Choisir un bénévole" value={chosen} onChange={e=>setChosen(e.target.value)}><option value="">Sélectionner un bénévole</option>{people.filter(p=>!assigned.includes(p.id)).map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}</select><button type="button" disabled={!chosen} onClick={()=>void add()}>Ajouter à l'opération</button></div>{assigned.length===0?<p>Aucun bénévole affecté.</p>:assigned.map(id=>{const p=people.find(v=>v.id===id);return <div className="op-task" key={id}><span>{p?`${p.first_name} ${p.last_name}`:'Bénévole'}</span><button type="button" onClick={()=>void remove(id)}>Retirer</button></div>})}</section>
}
