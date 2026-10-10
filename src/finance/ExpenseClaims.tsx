import React,{useCallback,useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';

type Claim={id:string;created_by:string;libelle:string;description:string;date_depense:string;montant_centimes:number;statut:'en_attente'|'validee'|'refusee';commentaire_decision:string|null;storage_path:string;nom_fichier:string;created_at:string};
type Notice={id:string;message:string;created_at:string;read_at:string|null};
const accepted=['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif'];
export default function ExpenseClaims({db,userId,role,onNotificationsChange}:{db:SupabaseClient;userId:string;role:string;onNotificationsChange?:()=>void}){
 const [claims,setClaims]=useState<Claim[]>([]),[notices,setNotices]=useState<Notice[]>([]),[names,setNames]=useState<Record<string,string>>({});
 const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[date,setDate]=useState(new Date().toLocaleDateString('en-CA')),[amount,setAmount]=useState(''),[file,setFile]=useState<File|null>(null);
 const [comments,setComments]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const canDecide=['tresorier','vice_tresorier','superadmin'].includes(role);
 const load=useCallback(async()=>{
  const [c,n,p]=await Promise.all([db.from('apel_notes_frais').select('*').order('created_at',{ascending:false}),db.from('apel_notes_frais_notifications').select('*').eq('user_id',userId).order('created_at',{ascending:false}),db.from('profiles').select('id,full_name')]);
  if(c.error)setMessage('Lecture des notes de frais : '+c.error.message);else setClaims(c.data||[]);
  if(n.error)setMessage('Lecture des notifications : '+n.error.message);else setNotices(n.data||[]);
  if(!p.error)setNames(Object.fromEntries((p.data||[]).map(x=>[x.id,x.full_name||'Membre du bureau'])));
 },[db,userId]);
 useEffect(()=>{void load()},[load]);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();const cents=Math.round(Number(amount.replace(',','.'))*100);
  if(!file){setMessage('Le justificatif est obligatoire.');return}
  if(!accepted.includes(file.type)||file.size>10*1024*1024){setMessage('Formats acceptés : PDF, JPG, PNG, WEBP ou HEIC (10 Mo maximum).');return}
  if(!Number.isSafeInteger(cents)||cents<=0){setMessage('Montant invalide.');return}
  setBusy(true);setMessage('');
  const path=`${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const up=await db.storage.from('apel-notes-frais').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
  if(up.error){setMessage('Envoi du justificatif impossible : '+up.error.message);setBusy(false);return}
  const result=await db.from('apel_notes_frais').insert({created_by:userId,libelle:title.trim(),description:description.trim(),date_depense:date,montant_centimes:cents,storage_path:path,nom_fichier:file.name});
  if(result.error){await db.storage.from('apel-notes-frais').remove([path]);setMessage('Création impossible : '+result.error.message)}
  else{setTitle('');setDescription('');setAmount('');setFile(null);setMessage('Note de frais enregistrée à votre nom et transmise à la trésorerie.');await load();window.dispatchEvent(new Event('apel-finance-updated'));onNotificationsChange?.()}
  setBusy(false);
 };
 const decide=async(id:string,approve:boolean)=>{
  const comment=(comments[id]||'').trim();if(!approve&&comment.length<5){setMessage('Indique un motif de refus (au moins 5 caractères).');return}
  setBusy(true);setMessage('');const {error}=await db.rpc('apel_decider_note_frais',{p_note_id:id,p_approve:approve,p_comment:comment});
  if(error)setMessage('Décision impossible : '+error.message);else{setMessage(approve?'Note de frais validée (remboursement restant à effectuer).':'Note refusée ; le demandeur a été notifié.');await load();window.dispatchEvent(new Event('apel-finance-updated'));onNotificationsChange?.()}
  setBusy(false);
 };
 const openProof=async(path:string)=>{const {data,error}=await db.storage.from('apel-notes-frais').createSignedUrl(path,60);if(error||!data){setMessage(error?.message||'Document inaccessible');return}window.open(data.signedUrl,'_blank','noopener,noreferrer')};
 const markRead=async(id:string)=>{const {error}=await db.from('apel_notes_frais_notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId);if(error)setMessage(error.message);else{await load();window.dispatchEvent(new Event('apel-finance-updated'));onNotificationsChange?.()}};
 return <div className="finance-claims">
  <section className="finance-panel"><h2>Déposer une note de frais</h2><p>Cette demande est automatiquement enregistrée au nom du compte avec lequel vous êtes connecté. Vous ne pouvez pas déposer une demande au nom d'un autre membre.</p><p>Tout membre du bureau peut demander le remboursement d'une dépense. Un justificatif photo ou document est obligatoire.</p>
   <form onSubmit={e=>void submit(e)}><label>Objet de la dépense<input required minLength={2} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex. : Fournitures pour le marché de Noël"/></label><label>Détail de la dépense<textarea required minLength={5} value={description} onChange={e=>setDescription(e.target.value)} rows={3}/></label><label>Date de la dépense<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><label>Montant (€)<input type="number" required min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Justificatif obligatoire (photo, PDF, image ; 10 Mo maximum)<input type="file" required accept="image/*,.pdf,.heic,.heif" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>{file&&<small>Fichier : {file.name}</small>}<button disabled={busy} type="submit">{busy?'Envoi en cours…':'Soumettre la note de frais'}</button></form>
  </section>
  {message&&<p role="status" className="finance-message">{message}</p>}
  <section className="finance-panel"><h2>Mes notifications {notices.some(n=>!n.read_at)?`(${notices.filter(n=>!n.read_at).length} nouvelles)`:''}</h2><button type="button" onClick={()=>void load()}>Actualiser</button>{notices.map(n=><article className="finance-claim-row" key={n.id}><p>{n.message}</p><small>{new Date(n.created_at).toLocaleString('fr-FR')}</small>{!n.read_at&&<button type="button" onClick={()=>void markRead(n.id)}>Marquer comme lue</button>}</article>)}{notices.length===0&&<p>Aucune notification.</p>}</section>
  <section className="finance-panel"><h2>{canDecide?'Notes de frais à traiter et historique':'Mes notes de frais'}</h2>{claims.map(c=><article key={c.id} className="finance-claim-row"><strong>{c.libelle} — {(c.montant_centimes/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</strong><p>{names[c.created_by]||'Membre du bureau'} · {new Date(c.date_depense+'T12:00:00').toLocaleDateString('fr-FR')} · <strong>{c.statut==='en_attente'?'En attente':c.statut==='validee'?'Validée':'Refusée'}</strong></p><p>{c.description}</p><button type="button" onClick={()=>void openProof(c.storage_path)}>Voir le justificatif : {c.nom_fichier}</button>{c.commentaire_decision&&<p><strong>Commentaire de la trésorerie :</strong> {c.commentaire_decision}</p>}{canDecide&&c.statut==='en_attente'&&<><label>Commentaire / motif de refus<textarea value={comments[c.id]||''} onChange={e=>setComments(v=>({...v,[c.id]:e.target.value}))}/></label><div className="finance-actions"><button type="button" disabled={busy} onClick={()=>void decide(c.id,true)}>Valider</button><button type="button" disabled={busy} onClick={()=>void decide(c.id,false)}>Refuser</button></div></>}</article>)}{claims.length===0&&<p>Aucune note de frais.</p>}</section>
 </div>
}
