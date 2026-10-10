import React,{useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {Wallet,Plus,Download,RefreshCcw,Paperclip,ExternalLink} from 'lucide-react';
import './finance.css';

type Exercise={id:string;nom:string;debut:string;fin:string;statut:string};
type Account={id:string;nom:string;type:string;solde_initial_centimes:number};
type Category={id:string;nom:string;type:string};
type Operation={id:string;type:'recette'|'depense';libelle:string;montant_centimes:number;date_operation:string;date_reglement:string|null;statut:string;compte_id:string|null;categorie_id:string|null;tiers:string|null;mode_paiement:string|null;commentaire:string|null;evenement_id:string|null;project_id:string|null;affectation:string;justification_divers:string|null};
type EventItem={id:string;title:string;event_date:string|null};
type Proof={id:string;operation_id:string;nom_fichier:string;storage_path:string;created_at:string};
type Props={db:SupabaseClient;role:string;userId:string};
const euros=(c:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(c/100);
const cents=(s:string)=>{const n=Number(s.replace(',','.'));return Number.isFinite(n)&&n>0?Math.round(n*100):null};
const dateToday=()=>new Date().toLocaleDateString('en-CA');
const parseDate=(s:string)=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const fmtDate=(s:string|null)=>s?parseDate(s).toLocaleDateString('fr-FR'):'—';
const tabs=['Tableau de bord','Recettes','Dépenses','Événements et projets','Ventes et facturation','Budget prévisionnel','Banque et caisse','Justificatifs','Rapports et exports','Paramètres comptables'] as const;
type Tab=typeof tabs[number];

export default function FinanceModule({db,role,userId}:Props){
 const[tab,setTab]=useState<Tab>('Tableau de bord');
 const[exercises,setExercises]=useState<Exercise[]>([]);
 const[accounts,setAccounts]=useState<Account[]>([]);
 const[categories,setCategories]=useState<Category[]>([]);
 const[operations,setOperations]=useState<Operation[]>([]);
 const[events,setEvents]=useState<EventItem[]>([]);
 const[projects,setProjects]=useState<{id:string;title:string;status:string;budget:number|null}[]>([]);
 const[proofs,setProofs]=useState<Proof[]>([]);
 const[proofOperation,setProofOperation]=useState('');
 const[uploading,setUploading]=useState(false);
 const[eventFilter,setEventFilter]=useState('');
 const[exerciseId,setExerciseId]=useState('');
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState('');
 const[showForm,setShowForm]=useState(false);
 const[form,setForm]=useState({type:'recette',libelle:'',montant:'',date_operation:dateToday(),date_reglement:'',statut:'brouillon',compte_id:'',categorie_id:'',tiers:'',mode_paiement:'',commentaire:'',evenement_id:'',project_id:'',affectation:'',justification_divers:''});
 const[exerciseForm,setExerciseForm]=useState({nom:'2026-2027',debut:'2026-09-01',fin:'2027-08-31'});
 const[accountForm,setAccountForm]=useState({nom:'Compte bancaire principal',type:'banque',solde:'0'});
 const[categoryForm,setCategoryForm]=useState({nom:'',type:'recette'});
 const[search,setSearch]=useState('');
 const canWrite=['superadmin','tresorier','vice_tresorier'].includes(role);
 const canAdmin=['superadmin','tresorier'].includes(role);
 const selected=exercises.find(e=>e.id===exerciseId);
 const load=async()=>{
  const [e,a,c,ev,pr]=await Promise.all([
   db.from('finance_exercices').select('*').order('debut',{ascending:false}),
   db.from('finance_comptes').select('*').eq('actif',true).order('nom'),
   db.from('finance_categories').select('*').eq('actif',true).order('nom'),
   db.from('events').select('id,title,event_date').order('event_date',{ascending:false}),db.from('projects').select('id,title,status,budget').order('created_at',{ascending:false})]);
  const err=e.error||a.error||c.error;
  if(err){setMessage('Chargement impossible : '+err.message);return}
  setExercises(e.data||[]);setAccounts(a.data||[]);setCategories(c.data||[]);if(!ev.error)setEvents(ev.data||[]);if(!pr.error)setProjects(pr.data||[]);
  setExerciseId(prev=>prev&&(e.data||[]).some(x=>x.id===prev)?prev:e.data?.[0]?.id||'');
 };
 useEffect(()=>{void load()},[db]);
 useEffect(()=>{if(!exerciseId){setOperations([]);return}db.from('finance_operations').select('*').eq('exercice_id',exerciseId).order('date_operation',{ascending:false}).limit(5000).then(({data,error})=>{if(error)setMessage('Lecture des opérations impossible : '+error.message);else setOperations(data||[])})},[db,exerciseId]);
 useEffect(()=>{if(!exerciseId){setProofs([]);return}db.from('finance_justificatifs').select('id,operation_id,nom_fichier,storage_path,created_at').eq('exercice_id',exerciseId).order('created_at',{ascending:false}).then(({data,error})=>{if(!error)setProofs(data||[])})},[db,exerciseId]);
 const attach=async(file:File,operationId:string)=>{
  if(!operationId){setMessage('Choisis une opération avant de joindre un document.');return}
  if(!['application/pdf','image/jpeg','image/png'].includes(file.type)||file.size>10*1024*1024){setMessage('PDF, JPG ou PNG uniquement (10 Mo maximum).');return}
  setUploading(true);setMessage('');
  const path=`${exerciseId}/${operationId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const up=await db.storage.from('finance-justificatifs').upload(path,file,{contentType:file.type,upsert:false});
  if(up.error){setMessage('Téléversement impossible : '+up.error.message);setUploading(false);return}
  const {error}=await db.from('finance_justificatifs').insert({exercice_id:exerciseId,operation_id:operationId,nom_fichier:file.name,storage_path:path,taille_octets:file.size,created_by:userId});
  if(error){await db.storage.from('finance-justificatifs').remove([path]);setMessage('Association impossible : '+error.message);setUploading(false);return}
  const {data}=await db.from('finance_justificatifs').select('id,operation_id,nom_fichier,storage_path,created_at').eq('exercice_id',exerciseId).order('created_at',{ascending:false});
  setProofs(data||[]);setMessage('Justificatif ajouté.');setUploading(false);
 };
 const openProof=async(path:string)=>{
  const {data,error}=await db.storage.from('finance-justificatifs').createSignedUrl(path,60);
  if(error||!data){setMessage('Accès au document impossible : '+(error?.message||'Erreur'));return}
  window.open(data.signedUrl,'_blank','noopener,noreferrer');
 };
 const eventTotals=(id:string)=>{
  const ops=operations.filter(o=>o.evenement_id===id&&o.statut==='paye');
  const r=ops.filter(o=>o.type==='recette').reduce((n,o)=>n+o.montant_centimes,0);
  const d=ops.filter(o=>o.type==='depense').reduce((n,o)=>n+o.montant_centimes,0);
  return {r,d,balance:r-d,count:ops.length};
 };
 const paid=operations.filter(o=>o.statut==='paye');
 const months=Array.from({length:12},(_,i)=>{
  const date=new Date(parseDate(selected?.debut||dateToday()).getFullYear(),parseDate(selected?.debut||dateToday()).getMonth()+i,1);
  const ym=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const ops=paid.filter(o=>o.date_reglement?.startsWith(ym));
  return {label:date.toLocaleDateString('fr-FR',{month:'short'}),r:ops.filter(o=>o.type==='recette').reduce((n,o)=>n+o.montant_centimes,0),d:ops.filter(o=>o.type==='depense').reduce((n,o)=>n+o.montant_centimes,0)};
 });
 const maxMonth=Math.max(1,...months.map(m=>Math.max(m.r,m.d)));
 const received=paid.filter(o=>o.type==='recette').reduce((n,o)=>n+o.montant_centimes,0);
 const spent=paid.filter(o=>o.type==='depense').reduce((n,o)=>n+o.montant_centimes,0);
 const pendingIncome=operations.filter(o=>o.type==='recette'&&o.statut!=='paye'&&o.statut!=='annule').reduce((n,o)=>n+o.montant_centimes,0);
 const pendingExpenses=operations.filter(o=>o.type==='depense'&&o.statut!=='paye'&&o.statut!=='annule').reduce((n,o)=>n+o.montant_centimes,0);
 const opening=accounts.reduce((n,a)=>n+Number(a.solde_initial_centimes),0);
 const cash=accounts.filter(a=>a.type==='caisse').reduce((n,a)=>n+Number(a.solde_initial_centimes)+paid.filter(o=>o.compte_id===a.id).reduce((v,o)=>v+(o.type==='recette'?1:-1)*o.montant_centimes,0),0);
 const bank=accounts.filter(a=>a.type==='banque').reduce((n,a)=>n+Number(a.solde_initial_centimes)+paid.filter(o=>o.compte_id===a.id).reduce((v,o)=>v+(o.type==='recette'?1:-1)*o.montant_centimes,0),0);
 const filtered=operations.filter(o=>(tab==='Recettes'?o.type==='recette':tab==='Dépenses'?o.type==='depense':true)&&(eventFilter===''||o.evenement_id===eventFilter)&&[o.libelle,o.tiers||'',o.statut].join(' ').toLowerCase().includes(search.toLowerCase()));
 const refresh=async()=>{await load();if(exerciseId){const{data,error}=await db.from('finance_operations').select('*').eq('exercice_id',exerciseId).order('date_operation',{ascending:false}).limit(5000);if(!error)setOperations(data||[]);const proofsResult=await db.from('finance_justificatifs').select('id,operation_id,nom_fichier,storage_path,created_at').eq('exercice_id',exerciseId).order('created_at',{ascending:false});if(!proofsResult.error)setProofs(proofsResult.data||[])}};
 const create=async(e:React.FormEvent)=>{
  e.preventDefault();if(!selected||selected.statut!=='ouvert'||!canWrite)return;
  const amount=cents(form.montant);if(amount===null){setMessage('Saisissez un montant supérieur à zéro.');return}
  if(!form.affectation){setMessage('Choisis une affectation avant d’enregistrer.');return}
  if(form.affectation==='operation'&&!form.project_id){setMessage('Sélectionne une opération associative validée.');return}
  if(form.affectation==='divers'&&form.justification_divers.trim().length<10){setMessage('Précise la justification des dépenses ou recettes diverses (10 caractères minimum).');return}
  if(form.statut==='paye'&&(!form.date_reglement||!form.compte_id)){setMessage('Une opération payée doit avoir une date de règlement et un compte.');return}
  setBusy(true);setMessage('');
  const {error}=await db.from('finance_operations').insert({
   exercice_id:exerciseId,type:form.type,libelle:form.libelle.trim(),montant_centimes:amount,
   date_operation:form.date_operation,date_reglement:form.statut==='paye'?form.date_reglement:null,
   statut:form.statut,compte_id:form.compte_id||null,categorie_id:form.categorie_id||null,
   tiers:form.tiers||null,mode_paiement:form.mode_paiement||null,commentaire:form.commentaire||null,evenement_id:form.evenement_id||null,project_id:form.affectation==='operation'?form.project_id:null,affectation:form.affectation,justification_divers:form.affectation==='divers'?form.justification_divers:null,created_by:userId
  });
  setBusy(false);if(error){setMessage('Enregistrement impossible : '+error.message);return}
  setShowForm(false);setForm({type:form.type,libelle:'',montant:'',date_operation:dateToday(),date_reglement:'',statut:'brouillon',compte_id:'',categorie_id:'',tiers:'',mode_paiement:'',commentaire:'',evenement_id:'',project_id:'',affectation:'',justification_divers:''});
  setMessage('Opération enregistrée.');await refresh();
 };
 const createSetting=async(table:string,payload:Record<string,unknown>)=>{
  setBusy(true);const {error}=await db.from(table).insert(payload);setBusy(false);
  if(error){setMessage('Enregistrement impossible : '+error.message);return}
  setMessage('Paramètre créé.');await refresh();
 };
 const exportCsv=()=>{
  const rows=[['Date opération','Type','Libellé','Catégorie','Tiers','Statut','Date règlement','Compte','Montant EUR'],...filtered.map(o=>[o.date_operation,o.type,o.libelle,categories.find(c=>c.id===o.categorie_id)?.nom||'',o.tiers||'',o.statut,o.date_reglement||'',accounts.find(a=>a.id===o.compte_id)?.nom||'',(o.type==='recette'?1:-1)*o.montant_centimes/100])];
  const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.download=`apel-journal-${selected?.nom||'exercice'}.csv`;link.click();URL.revokeObjectURL(link.href);
 };
 const tiles=[['Solde bancaire',bank],['Espèces en caisse',cash],['Trésorerie totale',opening+received-spent],['Recettes encaissées',received],['Dépenses payées',spent],['Résultat de trésorerie',received-spent],['Recettes à encaisser',pendingIncome],['Dépenses à régler',pendingExpenses]];
 return <div className="finances"><div className="finance-head"><div><div className="eyebrow">ESPACE BUREAU</div><h1><Wallet size={25}/> Finances</h1><p className="lead">Gestion de trésorerie associative · données réelles</p></div><label>Exercice<select value={exerciseId} onChange={e=>setExerciseId(e.target.value)}><option value="">Sélectionner un exercice</option>{exercises.map(e=><option key={e.id} value={e.id}>{e.nom} · {e.statut}</option>)}</select></label></div>
 <div className="finance-tabs">{tabs.map(t=><button type="button" key={t} className={tab===t?'current':''} onClick={()=>{setTab(t);setMessage('')}}>{t}</button>)}</div>
 {message&&<p className="finance-message" role="status">{message}</p>}
 {!selected&&tab!=='Paramètres comptables'&&<div className="finance-empty">Aucun exercice sélectionné. Créez votre premier exercice dans « Paramètres comptables ».</div>}
 {tab==='Tableau de bord'&&selected&&<><div className="finance-metrics">{tiles.map(([name,value])=><div className="finance-metric" key={String(name)}><span>{name}</span><strong>{euros(Number(value))}</strong></div>)}</div><div className="finance-actions">{canWrite&&selected.statut==='ouvert'&&<><button onClick={()=>{setForm(f=>({...f,type:'recette'}));setShowForm(true)}}><Plus size={16}/> Ajouter une recette</button><button onClick={()=>{setForm(f=>({...f,type:'depense'}));setShowForm(true)}}><Plus size={16}/> Ajouter une dépense</button></>}<button onClick={()=>setTab('Rapports et exports')}><Download size={16}/> Exporter les opérations</button><button onClick={()=>void refresh()}><RefreshCcw size={16}/> Actualiser</button></div><section className="finance-panel"><h2>Recettes et dépenses par mois</h2><div className="finance-chart" role="img" aria-label="Graphique des recettes et dépenses mensuelles">{months.map((m,i)=><div className="finance-month" key={i}><div className="finance-bars"><div title={`Recettes : ${euros(m.r)}`} className="finance-bar income" style={{height:`${Math.max(2,m.r/maxMonth*100)}%`}}/><div title={`Dépenses : ${euros(m.d)}`} className="finance-bar expense" style={{height:`${Math.max(2,m.d/maxMonth*100)}%`}}/></div><small>{m.label}</small></div>)}</div><p className="finance-legend"><span>■ Recettes</span> <span>■ Dépenses</span></p></section><p className="finance-note">Les soldes tiennent compte des comptes configurés et des opérations marquées « payées » pour l'exercice sélectionné. Les soldes d'ouverture doivent être renseignés correctement.</p></>}
 {(tab==='Recettes'||tab==='Dépenses')&&selected&&<><div className="finance-actions"><select aria-label="Filtrer par événement" value={eventFilter} onChange={e=>setEventFilter(e.target.value)}><option value="">Tous les événements</option>{events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}</select><input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>{canWrite&&selected.statut==='ouvert'&&<button onClick={()=>{setForm(f=>({...f,type:tab==='Recettes'?'recette':'depense'}));setShowForm(true)}}><Plus size={16}/> Ajouter</button>}</div><div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Événement</th><th>Justificatifs</th><th>Statut</th><th>Montant</th></tr></thead><tbody>{filtered.map(o=><tr key={o.id}><td>{fmtDate(o.date_operation)}</td><td>{o.libelle}</td><td>{categories.find(c=>c.id===o.categorie_id)?.nom||'—'}</td><td>{events.find(e=>e.id===o.evenement_id)?.title||'—'}</td><td>{proofs.filter(p=>p.operation_id===o.id).length} {canWrite&&<label className="finance-upload"><Paperclip size={15}/><input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void attach(f,o.id);e.currentTarget.value=''}}/></label>}</td><td>{o.statut}</td><td>{euros(o.montant_centimes)}</td></tr>)}{filtered.length===0&&<tr><td colSpan={7}>Aucune opération enregistrée.</td></tr>}</tbody></table></div></>}
 {tab==='Événements et projets'&&<div className="finance-grid">{events.map(ev=>{const t=eventTotals(ev.id);return <article className="finance-panel" key={ev.id}><h3>{ev.title}</h3><p>{fmtDate(ev.event_date)}</p><p>Recettes encaissées : <strong>{euros(t.r)}</strong></p><p>Dépenses payées : <strong>{euros(t.d)}</strong></p><p>Résultat : <strong>{euros(t.balance)}</strong></p><p>{t.count} opération(s) réglée(s)</p><button onClick={()=>{setEventFilter(ev.id);setTab('Recettes')}}>Voir les recettes</button> <button onClick={()=>{setEventFilter(ev.id);setTab('Dépenses')}}>Voir les dépenses</button>{canWrite&&selected?.statut==='ouvert'&&<button onClick={()=>{setForm(f=>({...f,evenement_id:ev.id}));setShowForm(true)}}><Plus size={16}/> Ajouter une opération</button>}</article>})}{events.length===0&&<div className="finance-panel">Aucun événement créé. Ajoute-en un depuis la rubrique Événements de l'espace Bureau.</div>}</div>}
 {tab==='Justificatifs'&&<section className="finance-panel"><h2>Documents financiers</h2><p>Documents PDF, JPG ou PNG stockés dans un espace Supabase privé. Accès temporaire réservé aux personnes habilitées.</p>{canWrite&&<div className="finance-actions"><select value={proofOperation} onChange={e=>setProofOperation(e.target.value)}><option value="">Choisir une opération</option>{operations.map(o=><option key={o.id} value={o.id}>{fmtDate(o.date_operation)} · {o.libelle} · {euros(o.montant_centimes)}</option>)}</select><label className="finance-upload">Joindre un document <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={uploading||!proofOperation} onChange={e=>{const f=e.target.files?.[0];if(f)void attach(f,proofOperation);e.currentTarget.value=''}}/></label></div>}<div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Document</th><th>Opération associée</th><th>Date</th><th>Ouvrir</th></tr></thead><tbody>{proofs.map(p=><tr key={p.id}><td>{p.nom_fichier}</td><td>{operations.find(o=>o.id===p.operation_id)?.libelle||'—'}</td><td>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td><td><button onClick={()=>void openProof(p.storage_path)}><ExternalLink size={15}/> Consulter</button></td></tr>)}{proofs.length===0&&<tr><td colSpan={4}>Aucun justificatif pour cet exercice.</td></tr>}</tbody></table></div></section>}
 {tab==='Budget prévisionnel'&&<div className="finance-grid">{projects.map(p=>{const ops=operations.filter(o=>o.project_id===p.id&&o.statut==='paye');const dep=ops.filter(o=>o.type==='depense').reduce((n,o)=>n+o.montant_centimes,0);const rec=ops.filter(o=>o.type==='recette').reduce((n,o)=>n+o.montant_centimes,0);return <article key={p.id} className="finance-panel"><h3>{p.title}</h3><p>Budget prévisionnel : {euros(Math.round(Number(p.budget||0)*100))}</p><p>Dépenses payées : {euros(dep)}</p><p>Recettes encaissées : {euros(rec)}</p><strong>Solde : {euros(rec-dep)}</strong></article>})}{projects.length===0&&<p>Aucune opération associative créée.</p>}</div>}
 {tab==='Banque et caisse'&&<div className="finance-grid">{accounts.map(a=><article className="finance-panel" key={a.id}><h3>{a.nom}</h3><p>{a.type}</p><strong>{euros(Number(a.solde_initial_centimes)+paid.filter(o=>o.compte_id===a.id).reduce((v,o)=>v+(o.type==='recette'?1:-1)*o.montant_centimes,0))}</strong></article>)}{accounts.length===0&&<p>Aucun compte configuré.</p>}</div>}
 {tab==='Rapports et exports'&&<div className="finance-panel"><h2>Journal de trésorerie</h2><p>Export CSV compatible Excel du journal de l'exercice sélectionné. L'export XLSX multi-onglets sera livré dans le lot Rapports.</p><button onClick={exportCsv} disabled={!selected}><Download size={16}/> Exporter le journal CSV</button></div>}
 {tab==='Paramètres comptables'&&<div className="finance-grid"><section className="finance-panel"><h2>Exercices</h2>{exercises.map(e=><p key={e.id}>{e.nom} · {fmtDate(e.debut)} au {fmtDate(e.fin)} · {e.statut}</p>)}{canAdmin&&<form onSubmit={e=>{e.preventDefault();void createSetting('finance_exercices',exerciseForm)}}><input required value={exerciseForm.nom} onChange={e=>setExerciseForm({...exerciseForm,nom:e.target.value})} placeholder="Nom de l'exercice"/><label>Début<input required type="date" value={exerciseForm.debut} onChange={e=>setExerciseForm({...exerciseForm,debut:e.target.value})}/></label><label>Fin<input required type="date" value={exerciseForm.fin} onChange={e=>setExerciseForm({...exerciseForm,fin:e.target.value})}/></label><button disabled={busy}>Créer l'exercice</button></form>}</section><section className="finance-panel"><h2>Comptes</h2>{accounts.map(a=><p key={a.id}>{a.nom} · {a.type} · solde initial {euros(Number(a.solde_initial_centimes))}</p>)}{canAdmin&&<form onSubmit={e=>{e.preventDefault();void createSetting('finance_comptes',{nom:accountForm.nom,type:accountForm.type,solde_initial_centimes:Math.round(Number(accountForm.solde)*100)})}}><input required value={accountForm.nom} onChange={e=>setAccountForm({...accountForm,nom:e.target.value})}/><select value={accountForm.type} onChange={e=>setAccountForm({...accountForm,type:e.target.value})}><option value="banque">Banque</option><option value="caisse">Caisse espèces</option><option value="autre">Autre</option></select><label>Solde initial (€)<input required type="number" step="0.01" value={accountForm.solde} onChange={e=>setAccountForm({...accountForm,solde:e.target.value})}/></label><button disabled={busy}>Ajouter le compte</button></form>}</section><section className="finance-panel"><h2>Catégories</h2><p>{categories.length} catégories disponibles</p>{canAdmin&&<form onSubmit={e=>{e.preventDefault();void createSetting('finance_categories',categoryForm)}}><input required placeholder="Nouvelle catégorie" value={categoryForm.nom} onChange={e=>setCategoryForm({...categoryForm,nom:e.target.value})}/><select value={categoryForm.type} onChange={e=>setCategoryForm({...categoryForm,type:e.target.value})}><option value="recette">Recette</option><option value="depense">Dépense</option></select><button disabled={busy}>Ajouter</button></form>}</section></div>}
 {(['Ventes et facturation'] as Tab[]).includes(tab)&&<div className="finance-panel"><h2>{tab}</h2><p>Cette rubrique fait partie des prochains lots. Elle n'est pas encore opérationnelle : aucune donnée fictive n'est affichée.</p></div>}
 {showForm&&<div className="finance-overlay" onClick={()=>setShowForm(false)}><div className="finance-dialog" onClick={e=>e.stopPropagation()}><button type="button" className="finance-close" onClick={()=>setShowForm(false)}>Fermer ×</button><h2>Ajouter {form.type==='recette'?'une recette':'une dépense'}</h2><form onSubmit={create}><label>Libellé<input required minLength={2} value={form.libelle} onChange={e=>setForm({...form,libelle:e.target.value})}/></label><label>Montant (€)<input required type="number" min="0.01" step="0.01" value={form.montant} onChange={e=>setForm({...form,montant:e.target.value})}/></label><label>Date de l'opération<input required type="date" min={selected?.debut} max={selected?.fin} value={form.date_operation} onChange={e=>setForm({...form,date_operation:e.target.value})}/></label><label>Catégorie<select value={form.categorie_id} onChange={e=>setForm({...form,categorie_id:e.target.value})}><option value="">Non classée</option>{categories.filter(c=>c.type===form.type).map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></label><label>Affectation obligatoire<select required value={form.affectation} onChange={e=>setForm({...form,affectation:e.target.value,project_id:''})}><option value="">Choisir une affectation</option><option value="operation">Opération associative validée</option><option value="fonctionnement">Fonctionnement de l’APEL</option><option value="divers">Divers (justification obligatoire)</option></select></label>{form.affectation==='operation'&&<label>Opération associative<select required value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}><option value="">Choisir une opération</option>{projects.filter(p=>['Planifié','En cours','Terminé'].includes(p.status)).map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>}{form.affectation==='divers'&&<label>Justification détaillée<textarea required minLength={10} value={form.justification_divers} onChange={e=>setForm({...form,justification_divers:e.target.value})}/></label>}<label>Événement associé<select value={form.evenement_id} onChange={e=>setForm({...form,evenement_id:e.target.value})}><option value="">Aucun événement</option>{events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}</select></label><label>Statut<select value={form.statut} onChange={e=>setForm({...form,statut:e.target.value,date_reglement:e.target.value==='paye'?dateToday():''})}><option value="brouillon">Brouillon</option><option value="a_valider">À valider</option><option value="paye">Payé / encaissé</option></select></label>{form.statut==='paye'&&<><label>Date de règlement<input required type="date" value={form.date_reglement} onChange={e=>setForm({...form,date_reglement:e.target.value})}/></label><label>Compte<select required value={form.compte_id} onChange={e=>setForm({...form,compte_id:e.target.value})}><option value="">Choisir un compte</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.nom}</option>)}</select></label></>}<label>Payeur / bénéficiaire<input value={form.tiers} onChange={e=>setForm({...form,tiers:e.target.value})}/></label><label>Mode de paiement<input placeholder="Virement, espèces, chèque…" value={form.mode_paiement} onChange={e=>setForm({...form,mode_paiement:e.target.value})}/></label><label>Commentaire<textarea rows={3} value={form.commentaire} onChange={e=>setForm({...form,commentaire:e.target.value})}/></label><button disabled={busy}>{busy?'Enregistrement…':'Enregistrer'}</button></form></div></div>}
 </div>;
}
