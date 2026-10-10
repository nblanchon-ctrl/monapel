import {useEffect,useState} from 'react';
import type {Session,SupabaseClient} from '@supabase/supabase-js';
import CommissionsModule from './CommissionsModule';
import './commission-access.css';

type Props={db:SupabaseClient;commissionId:string};
export default function CommissionAccessPage({db,commissionId}:Props){
 const [session,setSession]=useState<Session|null>(null);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [code,setCode]=useState('');
 const [authorized,setAuthorized]=useState(false);
 const [commissionName,setCommissionName]=useState('');
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [sent,setSent]=useState(false);
 useEffect(()=>{let live=true;void db.auth.getSession().then(({data})=>{if(live)setSession(data.session)});const{data:{subscription}}=db.auth.onAuthStateChange((_event,s)=>{if(live)setSession(s)});return()=>{live=false;subscription.unsubscribe()}},[db]);
 useEffect(()=>{let live=true;setAuthorized(false);setLoading(true);if(!session){setLoading(false);return}void (async()=>{const r=await db.from('commission_members').select('commission_id').eq('commission_id',commissionId).eq('user_id',session.user.id).eq('status','active').maybeSingle();if(!live)return;setAuthorized(!!r.data&&!r.error);if(r.error)setMessage('Impossible de vérifier vos droits : '+r.error.message);setLoading(false)})();return()=>{live=false}},[db,commissionId,session?.user.id]);
 useEffect(()=>{if(!authorized)return;void db.from('commissions').select('name').eq('id',commissionId).maybeSingle().then(({data})=>{if(data?.name)setCommissionName(data.name)})},[db,commissionId,authorized]);
 async function sendMagic(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');const {error}=await db.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.href,shouldCreateUser:true}});setBusy(false);if(error)setMessage(error.message);else{setSent(true);setMessage('Un lien de connexion vous a été envoyé. Ouvrez-le depuis votre messagerie.')}}
 async function signInPassword(){setBusy(true);setMessage('');const{error}=await db.auth.signInWithPassword({email:email.trim(),password});setBusy(false);if(error)setMessage(error.message)}
 async function activate(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');const r=await db.rpc('commission_redeem_invitation',{p_code:code.trim()});if(r.error)setMessage(r.error.message);else{const m=await db.from('commission_members').select('commission_id').eq('commission_id',commissionId).eq('user_id',session!.user.id).eq('status','active').maybeSingle();if(m.data)setAuthorized(true);else setMessage('Le code a été utilisé, mais il ne correspond pas à cette commission. Contactez le responsable.')}setBusy(false)}
 if(authorized&&session)return <div className="ca-workspace"><header className="ca-workspace-top"><span>Mon APEL · {commissionName||'Espace commission'}</span><button onClick={()=>void db.auth.signOut()}>Déconnexion</button></header><CommissionsModule db={db} userId={session.user.id} isBureau={false} canManage={false}/></div>;
 return <main className="ca-page"><section className="ca-card"><div className="ca-mark">Mon<span>APEL</span></div><div className="ca-icon">🤝</div><p className="ca-kicker">ESPACE PRIVÉ · COMMISSION</p><h1>Rejoindre votre commission</h1><p className="ca-intro">Connectez-vous avec l'adresse e-mail à laquelle vous avez été invité(e). Votre code personnel permet d'activer l'accès à cette commission uniquement.</p>
 {message&&<div className="ca-message" role="status">{message}</div>}
 {loading?<p>Vérification des accès…</p>:!session?<><form onSubmit={sendMagic} className="ca-form"><label>Adresse e-mail<input type="email" required autoComplete="email" placeholder="prenom.nom@exemple.fr" value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="ca-primary" disabled={busy}>{busy?'Envoi…':sent?'Renvoyer un lien de connexion':'Recevoir un lien de connexion par e-mail'}</button></form><div className="ca-separator">ou, si vous avez déjà un mot de passe</div><div className="ca-form"><label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="button" className="ca-secondary" disabled={busy||!email||!password} onClick={()=>void signInPassword()}>Me connecter avec mon mot de passe</button></div></>:<form onSubmit={activate} className="ca-form"><p className="ca-connected">Connecté(e) : <strong>{session.user.email}</strong></p><label>Code d'invitation individuel<input required value={code} onChange={e=>setCode(e.target.value)} placeholder="Code reçu par e-mail" autoComplete="off"/></label><button className="ca-primary" disabled={busy}>{busy?'Activation…':'Activer mon accès à la commission'}</button><button type="button" className="ca-link" onClick={()=>void db.auth.signOut()}>Utiliser une autre adresse e-mail</button></form>}
 <p className="ca-footer">Accès réservé aux membres autorisés par l'APEL. Aucun accès au reste de l'espace bureau.</p></section></main>
}
