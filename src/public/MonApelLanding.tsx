import React from 'react';
import {ArrowRight,CalendarDays,HeartHandshake,Lightbulb,ShieldCheck,Users,Wallet} from 'lucide-react';
import './MonApelLanding.css';

export default function MonApelLanding(){
 return <div className="ma-landing">
  <header className="ma-header"><a href="/" className="ma-logo">mon<span>APEL</span><small>Grandir ensemble</small></a><a className="ma-header-contact" href="mailto:contact@monapel.fr?subject=Découvrir%20Mon%20APEL">Nous contacter <ArrowRight size={16}/></a></header>
  <main><section className="ma-hero"><div className="ma-eyebrow">LA PLATEFORME DES ASSOCIATIONS DE PARENTS D’ÉLÈVES</div><h1>Votre APEL, <span>plus simple à organiser.</span></h1><p>Mon APEL rassemble dans un seul espace les outils utiles pour animer votre association, coordonner les bénévoles et suivre vos projets.</p><a className="ma-cta" href="mailto:contact@monapel.fr?subject=Demande%20d'information%20Mon%20APEL">Découvrir la solution <ArrowRight size={19}/></a></section>
  <section className="ma-features" aria-label="Fonctionnalités"><div className="ma-feature"><Lightbulb/><h2>Idées & préoccupations</h2><p>Recueillez les propositions et les messages des parents, puis traitez-les au sein du bureau.</p></div><div className="ma-feature"><CalendarDays/><h2>Projets & événements</h2><p>Préparez les actions de l’association et partagez les rendez-vous importants.</p></div><div className="ma-feature"><Wallet/><h2>Gestion financière</h2><p>Suivez les recettes, les dépenses et les demandes de remboursement.</p></div><div className="ma-feature"><Users/><h2>Vie du bureau</h2><p>Retrouvez les membres, leurs missions et les informations utiles à l’équipe.</p></div></section>
  <section className="ma-bottom"><HeartHandshake size={34}/><h2>Moins d’administratif, plus de temps pour les enfants.</h2><p>Une solution pensée pour faciliter l’engagement des parents bénévoles.</p><div className="ma-safe"><ShieldCheck size={18}/> Espace de gestion privé pour les membres habilités</div></section></main>
  <footer>© {new Date().getFullYear()} Mon APEL — La plateforme au service des parents d’élèves</footer>
 </div>
}
