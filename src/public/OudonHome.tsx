import React, {useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {ArrowRight,CalendarDays,Users,Newspaper,Megaphone,LockKeyhole,HeartHandshake,MapPin,Mail,Lightbulb,MessageCircle,Gift,X} from 'lucide-react';
import './oudon.css';

type Item=Record<string,unknown>;
type Props={page:string;onNavigate:(page:string)=>void;posts:Item[];events:Item[];bureau:{full_name:string;role:string;title:string;mission:string}[];db:SupabaseClient|null};
const label=(v:unknown)=>typeof v==='string'?v:'';
const formatDate=(v:unknown)=>{const d=new Date(label(v));return Number.isNaN(d.getTime())?'':d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})};
export default function OudonHome({page,onNavigate,posts,events,bureau,db}:Props){
 const nav=(page:string)=>onNavigate(page);
 const [formKind,setFormKind]=useState<'ideas'|'concerns'|'donation'|null>(null);
 const [form,setForm]=useState({title:'',description:'',name:'',email:'',phone:'',amount:''});
 const [sending,setSending]=useState(false);
 const [feedback,setFeedback]=useState('');
 const openForm=(kind:'ideas'|'concerns'|'donation')=>{setFormKind(kind);setForm({title:'',description:'',name:'',email:'',phone:'',amount:''});setFeedback('')};
 async function submitForm(e:React.FormEvent){
  e.preventDefault();if(!db||!formKind||sending)return;
  setSending(true);setFeedback('');
  try{
   const {error}=formKind==='donation'
    ?await db.rpc('submit_public_participation',{p_kind:'donation',p_name:form.name.trim(),p_email:form.email.trim(),p_phone:form.phone.trim(),p_message:form.description.trim(),p_amount:form.amount?Number(form.amount):null})
    :await db.rpc(formKind==='ideas'?'submit_public_idea':'submit_public_concern',{p_title:form.title.trim(),p_description:form.description.trim(),p_name:form.name.trim()||null,p_email:form.email.trim()||null});
   if(error)throw error;
   setFormKind(null);setFeedback(formKind==='donation'?'Votre proposition de don a été transmise au bureau. Aucun paiement n’a été effectué.':'Votre message a bien été transmis au bureau.');
  }catch(err){setFeedback('Envoi impossible. Veuillez réessayer ou écrire à apel@esjo.fr.');}
  finally{setSending(false)}
 }
 const emailLink='mailto:apel@esjo.fr';
 return <div className="oudon-site">
  <header className="oudon-header">
   <button className="oudon-brand" onClick={()=>nav('home')} aria-label="Accueil APEL Saint-Joseph Oudon"><span className="oudon-apel">apel</span><span>Mon APEL</span></button>
   <nav aria-label="Navigation publique"><button className={page==='home'?'is-active':''} onClick={()=>nav('home')}>Accueil</button><button className={page==='about'||page==='bureau-public'?'is-active':''} onClick={()=>nav('about')}>Notre APEL</button><button onClick={()=>nav('participate')}>Vie de l’école</button><button className={page==='news'?'is-active':''} onClick={()=>nav('news')}>Actualités</button><button className={page==='agenda'?'is-active':''} onClick={()=>nav('agenda')}>Agenda</button><button className={page==='contact'?'is-active':''} onClick={()=>nav('contact')}>Nous contacter</button></nav>
   {page!=='bureau-public'&&<button className="oudon-office" onClick={()=>nav('login')}><LockKeyhole size={16}/> Mon espace bureau</button>}
  </header>
  <main>
   {page==='home'?<><section className="oudon-hero">
    <div className="oudon-hero-inner">
     <div className="oudon-logo-wrap"><img src="/oudon/logo-ecole.jpg" alt="Logo de l'école Saint-Joseph Oudon" /></div>
     <div className="oudon-copy"><div className="oudon-kicker">APEL SAINT-JOSEPH OUDON</div><h1>Ensemble<br/><span>pour nos enfants</span></h1><p>L’APEL de l’école Saint-Joseph d’Oudon réunit les parents pour soutenir les projets éducatifs, animer la vie de l’école et créer du lien entre les familles.</p><div className="oudon-actions"><button className="oudon-primary" onClick={()=>nav('about')}>Découvrir notre APEL <ArrowRight size={18}/></button><button className="oudon-secondary" onClick={()=>nav('news')}>Les actualités</button></div></div>
     <div className="oudon-landscape" role="img" aria-label="Vue aérienne du château et du village d'Oudon" />
    </div><div className="oudon-wave" aria-hidden="true" />
   </section>
   <section className="oudon-tiles" aria-label="Accès rapides">
    <button className="oudon-tile pink" onClick={()=>nav('bureau-public')}><span className="oudon-icon"><Users/></span><span><strong>L’équipe de l’APEL</strong><small>Découvrez les parents engagés à Saint-Joseph Oudon</small></span><ArrowRight size={17}/></button>
    <button className="oudon-tile green" onClick={()=>nav('agenda')}><span className="oudon-icon"><CalendarDays/></span><span><strong>Agenda</strong><small>Tous les événements de l’école et de l’APEL</small></span><ArrowRight size={17}/></button>
    <button className="oudon-tile orange" onClick={()=>nav('participate')}><span className="oudon-icon"><Megaphone/></span><span><strong>Nos actions</strong><small>Soutenir les projets et la vie de l’école</small></span><ArrowRight size={17}/></button>
    <button className="oudon-tile blue" onClick={()=>nav('news')}><span className="oudon-icon"><Newspaper/></span><span><strong>Actualités</strong><small>Les dernières nouvelles de l’école et de l’APEL</small></span><ArrowRight size={17}/></button>
   </section>
   <section className="oudon-mission"><div className="oudon-kicker">NOTRE MISSION</div><h2>Une école vivante, <span>grâce à vous !</span></h2><p>L’APEL Saint-Joseph Oudon accompagne l’école au quotidien, en lien avec l’équipe éducative, pour offrir un environnement bienveillant, ouvert et stimulant à tous les enfants.</p><button className="oudon-text-link" onClick={()=>nav('participate')}><HeartHandshake size={20}/> Participer à la vie de l’école <ArrowRight size={17}/></button></section>
   {(posts.length>0||events.length>0)&&<section className="oudon-latest"><div className="oudon-kicker">LA VIE DE NOTRE ÉCOLE</div><h2>À la une</h2><div className="oudon-latest-grid">{posts.slice(0,2).map((p,i)=><button key={label(p.id)||i} onClick={()=>nav('news')}><Newspaper size={22}/><strong>{label(p.title)||'Actualité'}</strong><small>{label(p.summary)||label(p.description)||'Lire cette actualité'}</small></button>)}{events.slice(0,2).map((e,i)=><button key={label(e.id)||i} onClick={()=>nav('agenda')}><CalendarDays size={22}/><strong>{label(e.title)||'Événement'}</strong><small>{formatDate(e.event_date)} — Voir l’agenda</small></button>)}</div></section>}
  </>:<section className="oudon-inner-page"><button className="oudon-back" onClick={()=>nav('home')}>← Retour à l’accueil</button>{page==='news'?<><div className="oudon-kicker">LA VIE DE L’ASSOCIATION</div><h1>Les actualités</h1><p>Les nouvelles publiées par le bureau de l’APEL.</p><div className="oudon-content-grid">{posts.map((post,i)=><article className="oudon-content-card" key={label(post.id)||i}><Newspaper size={24}/><h2>{label(post.title)}</h2><p>{label(post.description)}</p><small>{formatDate(post.created_at)}</small></article>)}</div>{!posts.length&&<p>Aucune actualité publiée pour le moment.</p>}</>:page==='bureau-public'?<><div className="oudon-kicker">LES PARENTS ENGAGÉS</div><h1>L’équipe de l’APEL</h1><p>Découvrez les parents bénévoles et leurs missions au sein de l’APEL Saint-Joseph Oudon.</p><div className="oudon-content-grid">{bureau.map((member,i)=><article className="oudon-content-card" key={member.role+i}><Users size={26}/><h2>{member.full_name||member.title||member.role}</h2>{member.full_name&&<strong>{member.title||member.role}</strong>}{member.mission&&<p>{member.mission}</p>}</article>)}</div>{!bureau.length&&<p>La composition du bureau sera prochainement disponible.</p>}</>:page==='about'?<><div className="oudon-kicker">NOTRE ASSOCIATION</div><h1>Notre APEL</h1><p>Des parents bénévoles engagés pour les projets de l’école Saint-Joseph d’Oudon et la vie des familles.</p><button className="oudon-primary" onClick={()=>nav('bureau-public')}>Découvrir l’équipe de l’APEL <ArrowRight size={18}/></button></>:page==='contact'?<><div className="oudon-kicker">ÉCHANGEONS ENSEMBLE</div><h1>Nous contacter</h1><p>Une idée, une préoccupation, une question ou l’envie de soutenir l’école ? Nous sommes à votre écoute.</p><div className="oudon-contact-grid">
 <article className="oudon-contact-card"><Lightbulb size={29}/><h2>La boîte à idées des parents</h2><p>Partagez vos suggestions pour la vie de l’école et les projets de l’APEL.</p><button className="oudon-primary" onClick={()=>openForm('ideas')}>Proposer une idée <ArrowRight size={17}/></button></article>
 <article className="oudon-contact-card"><MessageCircle size={29}/><h2>Vos préoccupations</h2><p>Faites remonter une question ou une difficulté au bureau de l’APEL.</p><button className="oudon-primary" onClick={()=>openForm('concerns')}>Partager une préoccupation <ArrowRight size={17}/></button></article>
 <article className="oudon-contact-card"><Mail size={29}/><h2>Écrire à l’APEL</h2><p>Pour échanger directement avec notre équipe.</p><a className="oudon-primary" href={emailLink}>Écrire à apel@esjo.fr <ArrowRight size={17}/></a></article>
 <article className="oudon-contact-card"><Gift size={29}/><h2>Faire un don</h2><p>Proposez un don pour soutenir les projets de l’école. Le bureau vous recontactera.</p><button className="oudon-primary" onClick={()=>openForm('donation')}>Proposer un don <ArrowRight size={17}/></button><small>Aucun paiement n’est réalisé sur ce site.</small></article>
 </div></>:page==='participate'?<><div className="oudon-kicker">LA VIE DE L’ÉCOLE</div><h1>Participer à la vie de l’école</h1><p>Retrouvez les événements, suivez les actualités ou contactez directement l’APEL.</p><div className="oudon-contact-grid">
 <article className="oudon-contact-card"><Mail size={29}/><h2>Nous écrire</h2><p>Une question ou l’envie de participer à un projet ?</p><a className="oudon-primary" href={emailLink}>Contacter l’APEL <ArrowRight size={17}/></a></article>
 <article className="oudon-contact-card"><CalendarDays size={29}/><h2>Consulter l’agenda</h2><p>Découvrez les prochaines rencontres et les événements.</p><button className="oudon-primary" onClick={()=>nav('agenda')}>Voir l’agenda <ArrowRight size={17}/></button></article>
 <article className="oudon-contact-card"><Newspaper size={29}/><h2>Lire les actualités</h2><p>Suivez les nouvelles et les projets de l’association.</p><button className="oudon-primary" onClick={()=>nav('news')}>Voir les actualités <ArrowRight size={17}/></button></article>
 </div></>:page==='agenda'?<><div className="oudon-kicker">LES RENDEZ-VOUS</div><h1>Agenda</h1><div className="oudon-content-grid">{events.map((event,i)=><article className="oudon-content-card" key={label(event.id)||i}><CalendarDays/><h2>{label(event.title)}</h2><strong>{formatDate(event.event_date)}</strong><p>{label(event.description)}</p></article>)}</div>{!events.length&&<p>Aucun événement public à venir.</p>}</>:<><div className="oudon-kicker">AGIR ENSEMBLE</div><h1>Nos actions</h1><p>Des initiatives et des événements pour accompagner les enfants et les familles.</p><button className="oudon-primary" onClick={()=>nav('agenda')}>Consulter l’agenda <ArrowRight size={18}/></button></>}</section>}
  </main>
  {feedback&&<div className="oudon-feedback" role="status">{feedback}<button type="button" aria-label="Fermer le message" onClick={()=>setFeedback('')}><X size={18}/></button></div>}
  {formKind&&<div className="oudon-overlay" onClick={()=>!sending&&setFormKind(null)}><div className="oudon-dialog" role="dialog" aria-modal="true" aria-label="Formulaire APEL" onClick={e=>e.stopPropagation()}><button type="button" className="oudon-close" onClick={()=>setFormKind(null)} aria-label="Fermer"><X/></button><h2>{formKind==='donation'?'Proposer un don':formKind==='ideas'?'La boîte à idées':'Partager une préoccupation'}</h2><p>Votre demande sera transmise au bureau de l’APEL Saint-Joseph Oudon.</p><form onSubmit={submitForm} className="oudon-form">
   {formKind!=='donation'&&<label>Objet de votre message<input required minLength={2} maxLength={150} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>}
   <label>Votre nom{formKind!=='donation'?' (facultatif)':''}<input required={formKind==='donation'} maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Votre adresse e-mail{formKind!=='donation'?' (facultatif)':''}<input type="email" required={formKind==='donation'} maxLength={200} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
   {formKind==='donation'&&<><label>Téléphone (facultatif)<input type="tel" maxLength={40} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Montant envisagé en euros (facultatif)<input type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label></>}
   <label>{formKind==='donation'?'Votre message (facultatif)':'Votre message'}<textarea required={formKind!=='donation'} maxLength={3000} rows={5} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
   {formKind==='donation'&&<small>Il s’agit d’une proposition de don, sans paiement en ligne.</small>}
   <button className="oudon-primary" type="submit" disabled={sending||!db}>{sending?'Envoi en cours…':'Envoyer au bureau'} <ArrowRight size={17}/></button>
   {!db&&<p>Le formulaire est momentanément indisponible. Vous pouvez écrire à apel@esjo.fr.</p>}
  </form></div></div>}
  <footer className="oudon-footer"><span><MapPin size={16}/> APEL Saint-Joseph — Oudon</span><span>Ensemble pour nos enfants</span></footer>
 </div>
}
