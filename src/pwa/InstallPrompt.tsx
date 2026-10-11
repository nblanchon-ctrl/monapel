import React, { useEffect, useState } from 'react';
import './InstallPrompt.css';

type Kind = 'public' | 'bureau';
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function InstallPrompt({ kind }: { kind: Kind }) {
  const [visible, setVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(isInstalled);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [instructions, setInstructions] = useState(false);
  const key = 'monapel-install-dismissed-' + kind;

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    setPlatform(ios ? 'ios' : android ? 'android' : 'other');
    if ((!ios && !android) || isInstalled()) return;
    const previous = Number(localStorage.getItem(key) || '0');
    if (previous && Date.now() - previous < 14 * 24 * 60 * 60 * 1000) return;
    const timer = window.setTimeout(() => setVisible(true), 1700);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => { e.preventDefault(); setInstallEvent(e as InstallEvent); };
    const onInstalled = () => { setInstalled(true); setVisible(false); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstall); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (!visible || installed) return null;
  const publicApp = kind === 'public';
  const name = publicApp ? 'APEL Saint-Joseph Oudon' : 'Mon APEL Bureau';
  const close = () => { localStorage.setItem(key, String(Date.now())); setVisible(false); };
  const install = async () => {
    if (installEvent) {
      try {
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        setInstallEvent(null);
        if (choice.outcome === 'accepted') { setVisible(false); return; }
      } catch { /* Instructions manuelles ci-dessous */ }
    }
    setInstructions(true);
  };

  return <div className="apel-install-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
    <section className="apel-install-dialog" role="dialog" aria-modal="true" aria-labelledby={'apel-install-title-' + kind}>
      <button className="apel-install-close" type="button" aria-label="Fermer" onClick={close}>×</button>
      <div className="apel-install-symbol" aria-hidden="true">{publicApp ? '🏫' : '📋'}</div>
      <h2 id={'apel-install-title-' + kind}>Installez {name} sur votre téléphone</h2>
      <p>Retrouvez {publicApp ? 'les actualités et les événements de l’école' : 'votre espace de gestion du bureau'} directement depuis votre écran d’accueil, comme une application.</p>
      {platform === 'ios' ? <div className="apel-install-steps"><strong>Sur iPhone / iPad</strong><ol><li>Ouvrez cette page dans <strong>Safari</strong>.</li><li>Touchez <strong>Partager</strong> (carré avec une flèche vers le haut).</li><li>Choisissez <strong>Sur l’écran d’accueil</strong>, puis <strong>Ajouter</strong>.</li></ol></div> :
        <div className="apel-install-steps"><strong>Sur Android</strong><ol><li>Ouvrez cette page dans <strong>Chrome</strong>.</li><li>Appuyez sur <strong>Installer l’application</strong> si le bouton est proposé, sinon sur le menu <strong>⋮</strong>.</li><li>Choisissez <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</li></ol></div>}
      {instructions && <p className="apel-install-hint">Si l’option n’apparaît pas, vérifiez que vous utilisez {platform === 'ios' ? 'Safari' : 'Chrome'} et que l’application n’est pas déjà installée.</p>}
      <button className="apel-install-primary" type="button" onClick={install}>{installEvent ? 'Installer maintenant' : 'Voir comment installer'}</button>
      <button className="apel-install-later" type="button" onClick={close}>Plus tard</button>
    </section>
  </div>;
}
