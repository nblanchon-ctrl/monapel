import {useEffect,useState} from 'react';
import type {Session,SupabaseClient} from '@supabase/supabase-js';
import CommissionsModule from './CommissionsModule';
import './commission-access.css';

type Props={db:SupabaseClient;commissionId:string};
export default function CommissionAccessPage({db,commissionId}:Props){
 const [session,setSession]=useState<Session|null>(null);
 const [email,setEmail]=useState('');
 const [code,setCode]=useState('');
 const [authorized,setAuthorized]=useState(false);
 const [commissionName,setCommissionName]=useState('');
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{let live=true;void db.auth.getSession().then(({data})=>{if(live)setSession(data.session)});const{data:{subscription}}=db.auth.onAuthStateChange((_event,s)=>{if(live)setSession(s)});return()=>{live=false;subscription.unsubscribe()}},[db]);
 useEffect(()=>{let live=true;setAuthorized(false);setLoading(true);if(!session){setLoading(false);return}void(async()=>{const r=await db.from('commission_members').select('commission_id').eq('commission_id',commissionId).eq('user_id',session.user.id).eq('status','active').maybeSingle();if(!live)return;setAuthorized(!!r.data&&!r.error);if(r.error)setMessage('Impossible de vérifier vos droits : '+r.error.message);setLoading(false)})();return()=>{live=false}},[db,commissionId,session?.user.id]);
 useEffect(()=>{if(!authorized)return;void db.from('commissions').select('name').eq('id',commissionId).maybeSingle().then(({data})=>{if(data?.name)setCommissionName(data.name)})},[db,commissionId,authorized]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
  const {data,error}=await db.functions.invoke('commission-code-login',{body:{commissionId,email:email.trim().toLowerCase(),code:code.trim()}});
  if(error){let detail=error.message;try{const response=(error as any).context;if(response&&typeof response.json==='function'){const body=await response.json();detail=body.error||detail}}catch{}throw new Error(detail)}
  // Les réponses sans jetons ne doivent jamais être prises pour une connexion réussie.
  if(!data?.access_token||!data?.refresh_token){
   throw new Error(data?.error || 'La fonction de connexion ne renvoie pas de session. Redéployez commission-code-login depuis le correctif fourni.');
  }
  const r=await db.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});if(r.error)throw r.error;
  const check=await db.from('commission_members').select('id').eq('commission_id',commissionId).eq('user_id',r.data.user!.id).eq('status','active').maybeSingle();
  if(check.error||!check.data)throw new Error('Accès à cette commission non activé. Contactez le bureau.');
  setAuthorized(true);
 }catch(err){setMessage(err instanceof Error?err.message:'Connexion impossible. Réessayez.')}finally{setBusy(false)}}
 if(authorized&&session)return <div className="ca-workspace"><header className="ca-workspace-top"><span>Mon APEL · {commissionName||'Espace commission'}</span><button onClick={()=>void db.auth.signOut()}>Déconnexion</button></header><CommissionsModule db={db} userId={session.user.id} isBureau={false} canManage={false}/></div>;
 return <main className="ca-page"><section className="ca-card"><div className="ca-mark">Mon<span>APEL</span></div><div className="ca-icon">🤝</div><p className="ca-kicker">ESPACE PRIVÉ · COMMISSION</p><h1>Accéder à votre commission</h1><p className="ca-intro">Renseignez l'adresse e-mail de votre invitation et le code individuel communiqué par le responsable. Aucun mot de passe ni e-mail de connexion supplémentaire n'est nécessaire.</p>
 {message&&<div className="ca-message" role="alert">{message}</div>}
 {loading?<p>Vérification des accès…</p>:<form onSubmit={login} className="ca-form"><label>Adresse e-mail<input type="email" required autoComplete="email" placeholder="prenom.nom@exemple.fr" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Code d'accès individuel<input type="text" required autoComplete="off" spellCheck={false} placeholder="Code reçu dans votre invitation" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></label><button className="ca-primary" disabled={busy||!email||!code}>{busy?'Vérification…':'Accéder à ma commission'}</button></form>}
 <p className="ca-footer">Le code est personnel. Si votre accès a été révoqué, demandez un nouveau code au responsable.</p></section></main>
}
