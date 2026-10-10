import React, {useCallback, useEffect, useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {Plus, Pencil, Trash2, Mail, X, Users} from 'lucide-react';
import './board.css';

type BoardMember={id:string;first_name:string;last_name:string;email:string;created_at:string};
type Props={db:SupabaseClient};
const blank={first_name:'',last_name:'',email:''};
export default function BoardModule({db}:Props){
 const [members,setMembers]=useState<BoardMember[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [editing,setEditing]=useState<string|null>(null);
 const [open,setOpen]=useState(false);
 const [form,setForm]=useState(blank);
 const load=useCallback(async()=>{
  setLoading(true);
  const {data,error}=await db.from('apel_board_members').select('id,first_name,last_name,email,created_at').order('last_name',{ascending:true}).order('first_name',{ascending:true});
  if(error)setError('Chargement impossible : '+error.message);
  else {setMembers(data||[]);setError('');}
  setLoading(false);
 },[db]);
 useEffect(()=>{void load()},[load]);
 function startAdd(){setEditing(null);setForm(blank);setError('');setSuccess('');setOpen(true)}
 function startEdit(m:BoardMember){setEditing(m.id);setForm({first_name:m.first_name,last_name:m.last_name,email:m.email});setError('');setSuccess('');setOpen(true)}
 async function save(e:React.FormEvent){
  e.preventDefault();if(busy)return;
  const first_name=form.first_name.trim(),last_name=form.last_name.trim(),email=form.email.trim().toLowerCase();
  if(!first_name||!last_name||!email){setError('Prénom, nom et adresse e-mail sont obligatoires.');return}
  setBusy(true);setError('');setSuccess('');
  const payload={first_name,last_name,email};
  const result=editing?await db.from('apel_board_members').update(payload).eq('id',editing).select('id').single():await db.from('apel_board_members').insert(payload).select('id').single();
  setBusy(false);
  if(result.error){setError('Enregistrement impossible : '+result.error.message);return}
  setOpen(false);setEditing(null);setForm(blank);setSuccess(editing?'Membre modifié.':'Membre ajouté.');await load();
 }
 async function remove(m:BoardMember){
  if(busy||!window.confirm(`Supprimer ${m.first_name} ${m.last_name} du conseil d’administration ?`))return;
  setBusy(true);setError('');setSuccess('');
  const {error}=await db.from('apel_board_members').delete().eq('id',m.id);
  setBusy(false);
  if(error){setError('Suppression impossible : '+error.message);return}
  setSuccess('Membre supprimé.');await load();
 }
 return <section className="apel-ca">
  <div className="eyebrow">GOUVERNANCE</div>
  <div className="apel-ca-head"><div><h1>Conseil d’administration</h1><p className="lead">Annuaire des membres du conseil d’administration de l’APEL.</p></div><button className="primary" type="button" onClick={startAdd}><Plus size={17}/> Ajouter un membre</button></div>
  <div className="apel-ca-toolbar"><span><Users size={17}/> {members.length} membre{members.length>1?'s':''}</span><button className="textbutton" type="button" onClick={()=>void load()}>Actualiser</button></div>
  {error&&<div className="apel-ca-alert" role="alert">{error}</div>}
  {success&&<div className="apel-ca-success" role="status">{success}</div>}
  {loading?<p>Chargement des membres…</p>:members.length===0?<div className="apel-ca-empty">Aucun membre enregistré pour le moment. Cliquez sur « Ajouter un membre » pour commencer.</div>:<div className="apel-ca-list">{members.map(m=><article className="apel-ca-member" key={m.id}><div className="apel-ca-avatar" aria-hidden="true">{m.first_name.charAt(0)}{m.last_name.charAt(0)}</div><div className="apel-ca-person"><strong>{m.first_name} {m.last_name}</strong><a href={`mailto:${m.email}`} title={`Écrire à ${m.first_name} ${m.last_name}`}><Mail size={15}/>{m.email}</a></div><div className="apel-ca-actions"><button type="button" className="apel-ca-icon" onClick={()=>startEdit(m)} title="Modifier" aria-label={`Modifier ${m.first_name} ${m.last_name}`}><Pencil size={17}/></button><button type="button" className="apel-ca-icon danger" onClick={()=>void remove(m)} title="Supprimer" aria-label={`Supprimer ${m.first_name} ${m.last_name}`} disabled={busy}><Trash2 size={17}/></button></div></article>)}</div>}
  {open&&<div className="apel-ca-overlay" onClick={()=>setOpen(false)}><div className="apel-ca-dialog" role="dialog" aria-modal="true" aria-label={editing?'Modifier un membre':'Ajouter un membre'} onClick={e=>e.stopPropagation()}><button type="button" className="apel-ca-close" onClick={()=>setOpen(false)} aria-label="Fermer"><X size={21}/></button><h2>{editing?'Modifier un membre':'Ajouter un membre'}</h2><p>Les trois champs sont obligatoires.</p><form onSubmit={e=>void save(e)}><label>Prénom<input autoFocus required maxLength={100} autoComplete="given-name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} placeholder="Prénom"/></label><label>Nom<input required maxLength={100} autoComplete="family-name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} placeholder="Nom"/></label><label>Adresse e-mail<input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="prenom.nom@exemple.fr"/></label>{error&&<div className="apel-ca-alert" role="alert">{error}</div>}<div className="apel-ca-dialog-actions"><button type="button" onClick={()=>setOpen(false)}>Annuler</button><button className="primary" disabled={busy} type="submit">{busy?'Enregistrement…':editing?'Enregistrer les modifications':'Ajouter le membre'}</button></div></form></div></div>}
 </section>
}
