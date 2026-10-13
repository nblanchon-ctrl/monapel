import React, {useCallback, useEffect, useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {Plus, Pencil, Trash2, Mail, X, Users, FileText, Send, ArrowLeft} from 'lucide-react';
import './board.css';

type BoardMember={id:string;first_name:string;last_name:string;email:string;created_at:string;civilite:string|null};
type Props={db:SupabaseClient};
const blank={first_name:'',last_name:'',email:'',civilite:'Madame'};
type MeetingInfo={date:string;time:string;place:string;mode:string};
const emptyMeeting:MeetingInfo={date:'',time:'',place:'',mode:'Présentiel'};
function formattedDate(value:string){if(!value)return '';const d=new Date(value+'T12:00:00');return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)}
function invitation(m:BoardMember,info:MeetingInfo){const civilite=m.civilite||'Madame';return `${civilite} ${m.first_name} ${m.last_name},\n\nNous avons le plaisir de vous convier à la prochaine réunion du conseil d’administration de notre APEL, qui se tiendra :\n\nDate : ${formattedDate(info.date)}\nHeure : ${info.time}\nLieu : ${info.place}\nModalités : ${info.mode}\n\nOrdre du jour :\n- Ouverture de la séance\n- Points d’information et suivi des actions\n- Questions diverses\n\nNous vous remercions par avance de votre présence.\n\nBien cordialement,\nLe bureau de l’APEL`;}
export default function BoardModule({db}:Props){
 const [members,setMembers]=useState<BoardMember[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [editing,setEditing]=useState<string|null>(null);
 const [open,setOpen]=useState(false);
 const [form,setForm]=useState(blank);
 const [tab,setTab]=useState<'members'|'documents'|'tracking'>('members');
 const [meeting,setMeeting]=useState<MeetingInfo>(emptyMeeting);
 const [docStep,setDocStep]=useState<'none'|'details'|'recipient'>('none');
 const [recipientId,setRecipientId]=useState('');
 const [meetingKey,setMeetingKey]=useState(()=>sessionStorage.getItem('monapel_ca_meeting_key')||crypto.randomUUID());
 const [attendance,setAttendance]=useState<Array<{member_id:string;first_name:string;last_name:string;email:string;status:string;responded_at:string|null;invited_at:string}>>([]);
 const [trackingLoading,setTrackingLoading]=useState(false);
 const [mailBusy,setMailBusy]=useState(false);
 async function loadAttendance(){setTrackingLoading(true);const {data,error}=await db.rpc('ca_attendance_report',{p_meeting_key:meetingKey});if(error)setError('Suivi indisponible : '+error.message);else {setAttendance(data||[]);setError('')}setTrackingLoading(false)}
 function newMeeting(){if(!window.confirm('Créer une nouvelle réunion ? Les convocations précédentes resteront enregistrées mais ne seront plus affichées dans ce suivi.'))return;const key=crypto.randomUUID();setMeetingKey(key);sessionStorage.setItem('monapel_ca_meeting_key',key);setMeeting(emptyMeeting);setAttendance([]);setSuccess('Nouvelle réunion prête.');}

 const load=useCallback(async()=>{
  setLoading(true);
  const {data,error}=await db.from('apel_board_members').select('id,first_name,last_name,email,created_at,civilite').order('last_name',{ascending:true}).order('first_name',{ascending:true});
  if(error)setError('Chargement impossible : '+error.message);
  else {setMembers(data||[]);setError('');}
  setLoading(false);
 },[db]);
 useEffect(()=>{void load()},[load]);
 function startAdd(){setEditing(null);setForm(blank);setError('');setSuccess('');setOpen(true)}
 function startEdit(m:BoardMember){setEditing(m.id);setForm({first_name:m.first_name,last_name:m.last_name,email:m.email,civilite:m.civilite||'Madame'});setError('');setSuccess('');setOpen(true)}
 async function save(e:React.FormEvent){
  e.preventDefault();if(busy)return;
  const first_name=form.first_name.trim(),last_name=form.last_name.trim(),email=form.email.trim().toLowerCase();
  if(!first_name||!last_name||!email){setError('Prénom, nom et adresse e-mail sont obligatoires.');return}
  setBusy(true);setError('');setSuccess('');
  const payload={first_name,last_name,email,civilite:form.civilite};
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
 async function sendInvitation(){
  const member=members.find(m=>m.id===recipientId);if(!member||mailBusy)return;
  setMailBusy(true);setError('');
  const {data,error}=await db.rpc('ca_prepare_invitation',{p_meeting_key:meetingKey,p_member_id:member.id,p_date:meeting.date,p_time:meeting.time,p_place:meeting.place,p_mode:meeting.mode});
  setMailBusy(false);
  if(error||!data){setError('Impossible de préparer le lien de réponse : '+(error?.message||'Réponse vide')+'. Vérifiez que le SQL a été exécuté.');return}
  sessionStorage.setItem('monapel_ca_meeting_key',meetingKey);
  const link=window.location.origin+'/confirmation-ca/'+encodeURIComponent(data);
  const subject='Convocation au conseil d’administration de l’APEL – '+formattedDate(meeting.date);
  const body=invitation(member,meeting)+'\n\nMerci de confirmer votre participation (présent ou absent) sur ce lien personnel :\n'+link+'\n\nVous pourrez modifier votre réponse en rouvrant ce lien.';
  window.location.href=`mailto:${encodeURIComponent(member.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  setRecipientId('');setDocStep('none');void loadAttendance();
 }
 return <section className="apel-ca">
  <div className="eyebrow">GOUVERNANCE</div>
  <div className="apel-ca-head"><div><h1>Conseil d’administration</h1><p className="lead">Membres du conseil et documents types.</p></div>{tab==='members'&&<button className="primary" type="button" onClick={startAdd}><Plus size={17}/> Ajouter un membre</button>}</div>
  <div className="apel-ca-tabs"><button type="button" className={tab==='members'?'selected':''} onClick={()=>setTab('members')}><Users size={17}/> Membres du CA</button><button type="button" className={tab==='documents'?'selected':''} onClick={()=>setTab('documents')}><FileText size={17}/> Documents du CA</button><button type="button" className={tab==='tracking'?'selected':''} onClick={()=>{setTab('tracking');void loadAttendance()}}><Users size={17}/> Suivi des présences</button></div>
  {tab==='documents'&&<div className="apel-ca-documents"><article className="apel-ca-document"><FileText size={28}/><div><h3>Convocation au conseil d’administration</h3><p>Préparez la réunion une seule fois, puis personnalisez l’envoi pour chaque membre du CA.</p>{meeting.date&&<small>Réunion du {formattedDate(meeting.date)} à {meeting.time} · {meeting.place} · {meeting.mode}</small>}</div><button className="primary" type="button" onClick={()=>setDocStep('details')}>Préparer la convocation</button></article></div>}
  {tab==='tracking'&&<div className="apel-ca-tracking"><div className="apel-ca-tracking-head"><h2>Suivi des confirmations</h2><div><button type="button" onClick={()=>void loadAttendance()}>Actualiser</button> <button type="button" onClick={newMeeting}>Nouvelle réunion</button></div></div><p>Les réponses sont enregistrées dès qu'un membre confirme sa participation. Les invitations sont préparées par e-mail : l'application ne peut pas vérifier leur envoi effectif.</p>{error&&<div className="apel-ca-alert">{error}</div>}{trackingLoading?<p>Chargement…</p>:<><div className="apel-ca-counters"><span>Présents : <b>{attendance.filter(x=>x.status==='present').length}</b></span><span>Absents : <b>{attendance.filter(x=>x.status==='absent').length}</b></span><span>Sans réponse : <b>{attendance.filter(x=>x.status==='pending').length}</b></span></div>{attendance.length===0?<p>Aucune invitation préparée pour cette réunion. Commencez dans « Documents du CA ».</p>:<div className="apel-ca-table-wrap"><table className="apel-ca-table"><thead><tr><th>Membre</th><th>Réponse</th><th>Dernière réponse</th><th>Action</th></tr></thead><tbody>{attendance.map(x=><tr key={x.member_id}><td>{x.first_name} {x.last_name}</td><td>{x.status==='present'?'Présent(e)':x.status==='absent'?'Absent(e)':'Sans réponse'}</td><td>{x.responded_at?new Date(x.responded_at).toLocaleString('fr-FR'):'—'}</td><td>{x.status==='pending'?<button type="button" onClick={()=>{setRecipientId(x.member_id);setDocStep('recipient');setTab('documents')}}>Relancer</button>:'—'}</td></tr>)}</tbody></table></div>}</>}</div>}
  {tab==='members'&&<>
  <div className="apel-ca-toolbar"><span><Users size={17}/> {members.length} membre{members.length>1?'s':''}</span><button className="textbutton" type="button" onClick={()=>void load()}>Actualiser</button></div>
  {error&&<div className="apel-ca-alert" role="alert">{error}</div>}
  {success&&<div className="apel-ca-success" role="status">{success}</div>}
  {loading?<p>Chargement des membres…</p>:members.length===0?<div className="apel-ca-empty">Aucun membre enregistré pour le moment. Cliquez sur « Ajouter un membre » pour commencer.</div>:<div className="apel-ca-list">{members.map(m=><article className="apel-ca-member" key={m.id}><div className="apel-ca-avatar" aria-hidden="true">{m.first_name.charAt(0)}{m.last_name.charAt(0)}</div><div className="apel-ca-person"><strong>{m.first_name} {m.last_name}</strong><a href={`mailto:${m.email}`} title={`Écrire à ${m.first_name} ${m.last_name}`}><Mail size={15}/>{m.email}</a></div><div className="apel-ca-actions"><button type="button" className="apel-ca-icon" onClick={()=>startEdit(m)} title="Modifier" aria-label={`Modifier ${m.first_name} ${m.last_name}`}><Pencil size={17}/></button><button type="button" className="apel-ca-icon danger" onClick={()=>void remove(m)} title="Supprimer" aria-label={`Supprimer ${m.first_name} ${m.last_name}`} disabled={busy}><Trash2 size={17}/></button></div></article>)}</div>}
  </>}
  {docStep!=='none'&&<div className="apel-ca-overlay" onClick={()=>setDocStep('none')}><div className="apel-ca-dialog apel-ca-doc-dialog" role="dialog" aria-modal="true" aria-label="Convocation au conseil d’administration" onClick={e=>e.stopPropagation()}><button type="button" className="apel-ca-close" onClick={()=>setDocStep('none')} aria-label="Fermer"><X size={21}/></button>{docStep==='details'?<><h2>Convocation — informations de réunion</h2><p>Ces informations sont conservées tant que cette page reste ouverte, pour préparer plusieurs envois.</p><form onSubmit={e=>{e.preventDefault();setDocStep('recipient')}}><label>Date de la réunion<input required type="date" value={meeting.date} onChange={e=>setMeeting({...meeting,date:e.target.value})}/></label><label>Heure de début<input required type="time" value={meeting.time} onChange={e=>setMeeting({...meeting,time:e.target.value})}/></label><label>Lieu / adresse<input required maxLength={300} value={meeting.place} onChange={e=>setMeeting({...meeting,place:e.target.value})} placeholder="Salle de réunion, adresse…"/></label><label>Modalités<select value={meeting.mode} onChange={e=>setMeeting({...meeting,mode:e.target.value})}><option>Présentiel</option><option>Visioconférence</option><option>Hybride</option></select></label><div className="apel-ca-dialog-actions"><button type="button" onClick={()=>setDocStep('none')}>Annuler</button><button type="submit" className="primary">Valider et choisir le destinataire</button></div></form></>:<><h2>Choisir un destinataire</h2><p>La convocation sera personnalisée avec la civilité, le prénom et le nom du membre sélectionné.</p><label>Destinataire<select value={recipientId} onChange={e=>setRecipientId(e.target.value)}><option value="">Sélectionner un membre du CA</option>{members.filter(m=>m.email).map(m=><option key={m.id} value={m.id}>{m.civilite||'Madame'} {m.first_name} {m.last_name} — {m.email}</option>)}</select></label>{recipientId&&<div className="apel-ca-preview"><strong>Aperçu du message</strong><pre>{invitation(members.find(m=>m.id===recipientId)!,meeting)}</pre></div>}<div className="apel-ca-dialog-actions"><button type="button" onClick={()=>setDocStep('details')}><ArrowLeft size={15}/> Modifier la réunion</button><button type="button" className="primary" disabled={!recipientId||mailBusy} onClick={()=>void sendInvitation()}><Send size={16}/> Ouvrir l’e-mail</button></div>{error&&<div className="apel-ca-alert" role="alert">{error}</div>}<p className="apel-ca-note">L’application ouvre votre messagerie avec le message prérempli. L’envoi reste à confirmer dans votre messagerie. Après cela, revenez ici pour choisir un autre destinataire.</p></>}</div></div>}
  {open&&<div className="apel-ca-overlay" onClick={()=>setOpen(false)}><div className="apel-ca-dialog" role="dialog" aria-modal="true" aria-label={editing?'Modifier un membre':'Ajouter un membre'} onClick={e=>e.stopPropagation()}><button type="button" className="apel-ca-close" onClick={()=>setOpen(false)} aria-label="Fermer"><X size={21}/></button><h2>{editing?'Modifier un membre':'Ajouter un membre'}</h2><p>Les trois champs sont obligatoires.</p><form onSubmit={e=>void save(e)}><label>Civilité<select value={form.civilite} onChange={e=>setForm({...form,civilite:e.target.value})}><option>Madame</option><option>Monsieur</option></select></label><label>Prénom<input autoFocus required maxLength={100} autoComplete="given-name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} placeholder="Prénom"/></label><label>Nom<input required maxLength={100} autoComplete="family-name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} placeholder="Nom"/></label><label>Adresse e-mail<input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="prenom.nom@exemple.fr"/></label>{error&&<div className="apel-ca-alert" role="alert">{error}</div>}<div className="apel-ca-dialog-actions"><button type="button" onClick={()=>setOpen(false)}>Annuler</button><button className="primary" disabled={busy} type="submit">{busy?'Enregistrement…':editing?'Enregistrer les modifications':'Ajouter le membre'}</button></div></form></div></div>}
 </section>
}
