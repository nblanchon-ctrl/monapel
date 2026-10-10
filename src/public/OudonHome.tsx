import React from 'react';
import {ArrowRight,CalendarDays,Users,Newspaper,Megaphone,LockKeyhole,HeartHandshake,MapPin} from 'lucide-react';
import './oudon.css';

type Item=Record<string,unknown>;
type Props={onNavigate:(page:string)=>void;posts:Item[];events:Item[]};
const label=(v:unknown)=>typeof v==='string'?v:'';
const formatDate=(v:unknown)=>{const d=new Date(label(v));return Number.isNaN(d.getTime())?'':d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})};
export default function OudonHome({onNavigate,posts,events}:Props){
 const nav=(page:string)=>onNavigate(page);
 return <div className="oudon-site">
  <header className="oudon-header">
   <button className="oudon-brand" onClick={()=>nav('home')} aria-label="Accueil APEL Saint-Joseph Oudon"><span className="oudon-apel">apel</span><span>Mon APEL</span></button>
   <nav aria-label="Navigation publique"><button className="is-active" onClick={()=>nav('home')}>Accueil</button><button onClick={()=>nav('about')}>Notre APEL</button><button onClick={()=>nav('participate')}>Vie de l’école</button><button onClick={()=>nav('news')}>Actualités</button><button onClick={()=>nav('agenda')}>Agenda</button><button onClick={()=>nav('participate')}>Nous contacter</button></nav>
   <button className="oudon-office" onClick={()=>nav('login')}><LockKeyhole size={16}/> Mon espace bureau</button>
  </header>
  <main>
   <section className="oudon-hero">
    <div className="oudon-hero-inner">
     <div className="oudon-logo-wrap"><img src="/oudon/logo-ecole.jpg" alt="Logo de l'école Saint-Joseph Oudon" /></div>
     <div className="oudon-copy"><div className="oudon-kicker">APEL SAINT-JOSEPH OUDON</div><h1>Ensemble<br/><span>pour nos enfants</span></h1><p>L’APEL de l’école Saint-Joseph d’Oudon réunit les parents pour soutenir les projets éducatifs, animer la vie de l’école et créer du lien entre les familles.</p><div className="oudon-actions"><button className="oudon-primary" onClick={()=>nav('about')}>Découvrir notre APEL <ArrowRight size={18}/></button><button className="oudon-secondary" onClick={()=>nav('news')}>Les actualités</button></div></div>
     <div className="oudon-landscape" role="img" aria-label="Vue aérienne du château et du village d'Oudon" />
    </div><div className="oudon-wave" aria-hidden="true" />
   </section>
   <section className="oudon-tiles" aria-label="Accès rapides">
    <button className="oudon-tile pink" onClick={()=>nav('about')}><span className="oudon-icon"><Users/></span><span><strong>Le bureau</strong><small>Découvrez l’équipe de l’APEL Saint-Joseph Oudon</small></span><ArrowRight size={17}/></button>
    <button className="oudon-tile green" onClick={()=>nav('agenda')}><span className="oudon-icon"><CalendarDays/></span><span><strong>Agenda</strong><small>Tous les événements de l’école et de l’APEL</small></span><ArrowRight size={17}/></button>
    <button className="oudon-tile orange" onClick={()=>nav('participate')}><span className="oudon-icon"><Megaphone/></span><span><strong>Nos actions</strong><small>Soutenir les projets et la vie de l’école</small></span><ArrowRight size={17}/></button>
    <button className="oudon-tile blue" onClick={()=>nav('news')}><span className="oudon-icon"><Newspaper/></span><span><strong>Actualités</strong><small>Les dernières nouvelles de l’école et de l’APEL</small></span><ArrowRight size={17}/></button>
   </section>
   <section className="oudon-mission"><div className="oudon-kicker">NOTRE MISSION</div><h2>Une école vivante, <span>grâce à vous !</span></h2><p>L’APEL Saint-Joseph Oudon accompagne l’école au quotidien, en lien avec l’équipe éducative, pour offrir un environnement bienveillant, ouvert et stimulant à tous les enfants.</p><button className="oudon-text-link" onClick={()=>nav('participate')}><HeartHandshake size={20}/> Participer à la vie de l’école <ArrowRight size={17}/></button></section>
   {(posts.length>0||events.length>0)&&<section className="oudon-latest"><div className="oudon-kicker">LA VIE DE NOTRE ÉCOLE</div><h2>À la une</h2><div className="oudon-latest-grid">{posts.slice(0,2).map((p,i)=><button key={label(p.id)||i} onClick={()=>nav('news')}><Newspaper size={22}/><strong>{label(p.title)||'Actualité'}</strong><small>{label(p.summary)||label(p.description)||'Lire cette actualité'}</small></button>)}{events.slice(0,2).map((e,i)=><button key={label(e.id)||i} onClick={()=>nav('agenda')}><CalendarDays size={22}/><strong>{label(e.title)||'Événement'}</strong><small>{formatDate(e.event_date)} — Voir l’agenda</small></button>)}</div></section>}
  </main><footer className="oudon-footer"><span><MapPin size={16}/> APEL Saint-Joseph — Oudon</span><span>Ensemble pour nos enfants</span></footer>
 </div>
}
