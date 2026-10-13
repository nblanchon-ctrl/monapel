import React,{useCallback,useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
type Status='nouveau'|'en_cours'|'traite'|'archive';
type Message={id:string;school_slug:string;name:string;email:string;subject:string;body:string;status:Status;created_at:string;internal_note:string|null};
const statusLabels:Record<Status,string>={nouveau:'Nouveau',en_cours:'En cours',traite:'Traité',archive:'Archivé'};
export default function ParentMessages({db}:{db:SupabaseClient}){
 const [items,setItems]=useState<Message[]>([]);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState('');
 const [filter,setFilter]=useState<'all'|Status>('all');
 const load=useCallback(async()=>{
  const {data,error}=await db.from('apel_parent_contacts').select('id,school_slug,name,email,subject,body,status,created_at,internal_note').eq('school_slug','saint-joseph-oudon').order('created_at',{ascending:false}).limit(250);
  if(error)setError('Chargement impossible : '+error.message);else{setError('');setItems((data||[]) as Message[])}
 },[db]);
 useEffect(()=>{void load()},[load]);
 async function update(id:string,patch:{status?:Status;internal_note?:string}){
  setBusy(id);
  const {error}=await db.from('apel_parent_contacts').update(patch).eq('id',id).eq('school_slug','saint-joseph-oudon');
  setBusy('');
  if(error)setError('Modification impossible : '+error.message);
  else{await load();window.dispatchEvent(new Event('apel-parent-messages-updated'))}
 }
 async function remove(m:Message){
  if(!window.confirm(`Supprimer définitivement le message « ${m.subject} » de ${m.name} ? Cette action est irréversible.`))return;
  setBusy(m.id);
  const {error}=await db.from('apel_parent_contacts').delete().eq('id',m.id).eq('school_slug','saint-joseph-oudon');
  setBusy('');
  if(error)setError('Suppression impossible : '+error.message);
  else{await load();window.dispatchEvent(new Event('apel-parent-messages-updated'))}
 }
 const visible=items.filter(m=>filter==='all'||m.status===filter);
 const unread=items.filter(m=>m.status==='nouveau').length;
 return <section>
  <div className="eyebrow">COMMUNICATION AVEC LES FAMILLES</div>
  <h1>Messages des parents {unread>0&&<span style={{display:'inline-flex',verticalAlign:'middle',borderRadius:999,background:'#dc2626',color:'#fff',padding:'3px 10px',fontSize:14}}>{unread} nouveau{unread>1?'x':''}</span>}</h1>
  <p className="lead">Messages reçus depuis le formulaire du site public. Répondez au parent avec votre messagerie habituelle.</p>
  <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
   <label>Afficher <select value={filter} onChange={e=>setFilter(e.target.value as 'all'|Status)}>
    <option value="all">Tous ({items.length})</option><option value="nouveau">Nouveaux</option><option value="en_cours">En cours</option><option value="traite">Traités</option><option value="archive">Archivés</option>
   </select></label>
   <button className="outline" type="button" onClick={()=>void load()}>Actualiser</button>
  </div>
  {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}
  {visible.map(m=><article className="panel" key={m.id} style={{marginBottom:14}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
    <div style={{minWidth:0}}><span className="tag">{statusLabels[m.status]}</span><h2 style={{marginTop:8}}>{m.subject}</h2>
     <p><strong>{m.name}</strong> · <a href={`mailto:${m.email}?subject=${encodeURIComponent('RE : '+m.subject)}`} title="Répondre par e-mail">{m.email}</a></p>
     <small>{new Date(m.created_at).toLocaleString('fr-FR')}</small>
    </div>
    <label>Statut<select value={m.status} disabled={busy===m.id} onChange={e=>void update(m.id,{status:e.target.value as Status})}>
     {(['nouveau','en_cours','traite','archive'] as Status[]).map(s=><option value={s} key={s}>{statusLabels[s]}</option>)}
    </select></label>
   </div>
   <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',marginTop:15}}>{m.body}</p>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
    <a className="outline" style={{display:'inline-flex',alignItems:'center',textDecoration:'none',padding:'9px 12px',borderRadius:8}} href={`mailto:${m.email}?subject=${encodeURIComponent('RE : '+m.subject)}`}>✉ Répondre au parent</a>
    {m.status!=='traite'&&<button type="button" className="outline" disabled={busy===m.id} onClick={()=>void update(m.id,{status:'traite'})}>✓ Marquer comme traité</button>}
    {m.status!=='archive'&&<button type="button" className="outline" disabled={busy===m.id} onClick={()=>void update(m.id,{status:'archive'})}>Archiver</button>}
    {m.status==='archive'&&<button type="button" className="outline" disabled={busy===m.id} onClick={()=>void update(m.id,{status:'en_cours'})}>Restaurer</button>}
    <button type="button" className="outline" style={{color:'#b91c1c'}} disabled={busy===m.id} onClick={()=>void remove(m)}>Supprimer</button>
   </div>
   <label>Note interne<textarea rows={2} defaultValue={m.internal_note||''} key={m.id+'-'+m.internal_note} onBlur={e=>{if(e.target.value!==(m.internal_note||''))void update(m.id,{internal_note:e.target.value})}} placeholder="Note réservée au bureau"/></label>
  </article>)}
  {visible.length===0&&<div className="panel">Aucun message pour ce filtre.</div>}
 </section>
}
